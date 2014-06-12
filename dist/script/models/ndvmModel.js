// NDVM model
Namespace("XenClient.UI");

XenClient.UI.NDVMModel = function(ndvm_path) {

    // Private stuffs
    var self = this;
    var truncateLength = 15;

    // Properties & Defaults
    this.publish_topic = ndvm_path;
    this.ndvm_path = ndvm_path;
    this.uuid = "";
    this.name = "";
    this.include_networks = false;
    this.networks = {};
    this.chosen_network_path = "";

    // Services
    var services = {
        domain: new XenClient.DBus.NetworkDomainClient("com.citrix.xenclient.networkdaemon", ndvm_path)
    };

    // Interfaces
    var interfaces = {
        domain: services.domain.com.citrix.xenclient.networkdomain,
        config: services.domain.com.citrix.xenclient.networkdomain.config
    };

    // Mappings
    var readOnlyMap = [
        ["uuid",        interfaces.config],
        ["name",        interfaces.config]
    ];

    // Repository
    var repository = new XenClient.UI.Repository(this, readOnlyMap);

    function fail(error) {
        self.publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
    }

    // Public stuffs
    this.publish = function(type, data) {
        dojo.publish(self.publish_topic, [{ type: type, data: data }]);
    };

    this.load = function(finish) {
        repository.load(false, function() {
            var wait = new XUtils.AsyncWait(
                function() {
                    self.publish(XenConstants.TopicTypes.MODEL_CHANGED);
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            if (self.include_networks) {
                self.refreshNetworks(undefined, wait.addCallback(), wait.error);
            }
            wait.finish();
        });
    };

    this.refresh = function(finish) {
        repository.refresh(false, function() {
            var wait = new XUtils.AsyncWait(
                function() {
                    self.publish(XenConstants.TopicTypes.MODEL_CHANGED);
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            if (self.include_networks) {
                self.refreshNetworks(undefined, wait.addCallback(), wait.error);
            }
            wait.finish();
        });
    };

    this.popupNetworkMenu = interfaces.domain.popup_network_menu;
    this.closeNetworkMenu = interfaces.domain.close_network_menu;

    var chooseNetwork = function() {
        self.chosen_network_path = "";
        dojo.some(Object.keys(self.networks), function(key) {
            var network = self.networks[key];
            switch(network.device_state) {
                case XenConstants.NetworkDeviceStates.UNKNOWN:
                case XenConstants.NetworkDeviceStates.UNMANAGED:
                case XenConstants.NetworkDeviceStates.UNAVAILABLE:
                case XenConstants.NetworkDeviceStates.DISCONNECTED:
                case XenConstants.NetworkDeviceStates.DEACTIVATING:
                case XenConstants.NetworkDeviceStates.FAILED: {
                    // Ignore inactive networks
                    return false;
                    break;                    
                }
            }
            // Only interested in wired, wifi and modem
            switch(network.type) {
                case XenConstants.Network.NETWORK_TYPE.WIRED: {
                    // Choose first wired
                    self.chosen_network_path = network.network_path;
                    return true;
                    break;
                }
                case XenConstants.Network.NETWORK_TYPE.WIFI:
                case XenConstants.Network.NETWORK_TYPE.MODEM: {
                    // Choose network, but continue in case there's a wired one
                    self.chosen_network_path = network.network_path;
                    break;
                }
            }
            return false;
        }, this);
    };

    this.refreshNetworks = function(network_path, success, failure) {
        function refreshNetwork(path, finish) {
            if(self.networks[path]) {
                self.networks[path].refresh(finish);
            } else {
                self.networks[path] = new XenClient.UI.NetworkModel(path);
                self.networks[path].load(finish);
            }
        }
        var wait = new XUtils.AsyncWait(function() {
            chooseNetwork();
            if (success) {
                success();
            }
        }, failure);
        if(network_path) {
            refreshNetwork(network_path, wait.addCallback());
            wait.finish();
        } else {
            var onSuccess = function(networks) {
                // remove networks no longer there
                for(var network in self.networks) {
                    if(self.networks.hasOwnProperty(network) && !networks.contains(network)) {
                        delete self.networks[network];
                    }
                }
                // refresh or add networks
                dojo.forEach(networks, function(path) {
                    refreshNetwork(path, wait.addCallback());
                });
                wait.finish();
            };
            interfaces.domain.list_networks(onSuccess, wait.error);
        }
    };

    this.fullNameWhenTruncated = function (length) {
        length = isNaN(Number(length)) ? truncateLength : Number(length);
        if (self.name.length > length) {
            return self.name;
        }
        return "";
    };

    this.refreshState = function(network_path) {
        self.refreshNetworks(network_path, function() {
            self.publish(XenConstants.TopicTypes.MODEL_STATE_CHANGED);
        });
    };

    this.getIcon = function() {
        var icon = "None";
        if (self.chosen_network_path) {
            var network = self.networks[self.chosen_network_path];
            if (network) {
                switch (network.device_state) {
                    case XenConstants.NetworkDeviceStates.PREPARE: {
                        icon = "Connecting0";
                        break;
                    }
                    case XenConstants.NetworkDeviceStates.CONFIG:
                    case XenConstants.NetworkDeviceStates.NEED_AUTH: {
                        icon = "Connecting1";
                        break;
                    }
                    case XenConstants.NetworkDeviceStates.IP_CONFIG:
                    case XenConstants.NetworkDeviceStates.IP_CHECK:
                    case XenConstants.NetworkDeviceStates.SECONDARIES: {
                        icon = "Connecting2";
                        break;
                    }
                    case XenConstants.NetworkDeviceStates.ACTIVATED: {
                        switch (network.type) {
                            case XenConstants.Network.NETWORK_TYPE.WIFI: {
                                if (network.device_mode == XenConstants.NetworkDeviceModes.ADHOC) {
                                    icon = "Adhoc";
                                } else if (network.device_strength > 80 ) {
                                    icon = "Wireless100";
                                } else if (network.device_strength > 55 ) {
                                    icon = "Wireless75";
                                } else if (network.device_strength > 30 ) {
                                    icon = "Wireless50";
                                } else if (network.device_strength > 5 ) {
                                    icon = "Wireless25";
                                } else {
                                    icon = "Wireless00";
                                }
                                break;
                            }
                            case XenConstants.Network.NETWORK_TYPE.MODEM: {
                                icon = "WWan";
                                break;
                            }
                            default: {
                                icon = "Wired";
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        }
        return icon;
    };
};