// Network model
Namespace("XenClient.UI");

XenClient.UI.NetworkModel = function(network_path) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.network_path = network_path;
    this.publish_topic = network_path;
    this.label = "";
    this.type = XenConstants.Network.NETWORK_TYPE.UNKNOWN;
    this.mode = XenConstants.Network.CONNECTION_TYPE.UNKNOWN;
    this.ndvm_uuid = "";
    this.mac = "";
    this.device_state = XenConstants.NetworkDeviceStates.UNKNOWN;
    this.device_mode =  XenConstants.NetworkDeviceModes.UNKNOWN;
    this.device_strength = 0;
    this.include_ndvm = false;
    this.ndvm = null;

    // Services
    var services = {
        network:     new XenClient.DBus.NetworkClient("com.citrix.xenclient.networkdaemon", network_path)
    };

    // Interfaces
    var interfaces = {
        config:     services.network.com.citrix.xenclient.network.config
    };

    // Mappings
    var readOnlyMap = [
        ["label",           interfaces.config],
        ["type",            interfaces.config],
        ["mode",            interfaces.config,      "connection"],
        ["ndvm_uuid",       interfaces.config,      "backend-uuid"],
        ["mac",             interfaces.config,      "mac-address"],
        ["device_state",    interfaces.config,      "nm-state"],
        ["device_mode",     interfaces.config,      "extra-info",   XenConstants.Network.ACTIVE_AP.MODE],
        ["device_strength", interfaces.config,      "extra-info",   XenConstants.Network.ACTIVE_AP.STRENGTH]
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
        repository.load(function() {
            var wait = new XUtils.AsyncWait(
                function() {
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            if (self.include_ndvm) {
                self.refreshNdvm(wait.addCallback(), wait.error);
            }
            wait.finish();
        });
    };

    this.refresh = function(finish) {
        repository.refresh(function() {
            var wait = new XUtils.AsyncWait(
                function() {
                    if(finish) {
                        finish(self);
                    }
                },
                finish
            );
            if (self.include_ndvm) {
                self.refreshNdvm(wait.addCallback(), wait.error);
            }
            wait.finish();
        });
    };

    this.save = repository.save;

    this.refreshNdvm = function(success, failure) {
        if (self.ndvm_uuid) {
            if (self.ndvm) {
                self.ndvm.refresh(success, failure);
            } else {
                var ndvm_path = XUtils.uuidToPath(self.ndvm_uuid, "/ndvm/");
                self.ndvm = new XenClient.UI.NDVMModel(ndvm_path);
                self.ndvm.load(success, failure);
            }
        } else if (success) {
            success();
        }
    };

    this.getName = function() {
        if (self.label) {
            return self.label;
        }
        return self.network_path;
    };

    this.getType = function() {
        if (self.type == XenConstants.Network.NETWORK_TYPE.WIRED) {
            return self.mode;
        }
        return self.type;
    };
};