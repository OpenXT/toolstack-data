// VM NIC model
Namespace("XenClient.UI");

XenClient.UI.VMNicModel = function(nic_path) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.nic_path = nic_path;
    this.publish_topic = nic_path;
    this.network_path = "";
    this.wireless = false;
    this.mac = "";
    this.network = null;

    // Services
    var services = {
        nic:     new XenClient.DBus.VmNicClient("com.citrix.xenclient.xenmgr", nic_path)
    };

    // Interfaces
    var interfaces = {
        nic:     services.nic.com.citrix.xenclient.vmnic
    };

    // Mappings
    var readOnlyMap = [
        ["mac",         interfaces.nic, "mac-actual"]
    ];

    var readWriteMap = [
        ["network_path",    interfaces.nic, "network"],
        ["wireless",        interfaces.nic, "wireless-driver"]
    ];

    // Repository
    var repository = new XenClient.UI.Repository(this, readOnlyMap, readWriteMap);

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
            self.refreshNetwork(wait.addCallback(), wait.error);
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
            self.refreshNetwork(wait.addCallback(), wait.error);
            wait.finish();
        });
    };

    this.save = repository.save;
    this.delete_ = interfaces.nic.delete_;

    this.refreshNetwork = function(success, failure) {
        if (self.network_path) {
            if (self.network && self.network.network_path != self.network_path) {
                // Network has changed, delete it
                delete self.network;
            }
            if (self.network) {
                self.network.refresh(success, failure);
            } else {
                self.network = new XenClient.UI.NetworkModel(self.network_path);
                self.network.include_ndvm = true;
                self.network.load(success, failure);
            }
        } else if (success) {
            success();
        }
    };

    this.getId = function() {
        return self.nic_path.split("/").pop();
    };
};