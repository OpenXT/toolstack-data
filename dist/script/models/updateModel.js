// Update model
Namespace("XenClient.UI");

XenClient.UI.UpdateModel = function() {
    
    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.publish_topic = "/ui/update";
    this.update_url = ""
    this.state = "";
    this.xfer_percent = 0;
    this.xfer_speed = 0;
    this.error = "";

    // Services
    var services = {
        update:     new XenClient.DBus.UpdatemgrClient("com.citrix.xenclient.updatemgr", "/")
    };

    // Interfaces
    var interfaces = {
        update:     services.update.com.citrix.xenclient.updatemgr
    };

    // Mappings
    var readOnlyMap = [
        ["update_url",          interfaces.update],
        ["state",               interfaces.update, "update-state"],
        ["xfer_percent",        interfaces.update, "update-download-percent"],
        ["xfer_speed",          interfaces.update, "update-download-speed"],
        ["error",               interfaces.update, "update-fail-reason"]
    ];

    var refreshIgnoreMap = [
        // Don't refresh update_url
        "update_url"
    ];

    // Repository
    var repository = new XenClient.UI.Repository(this, readOnlyMap, [], refreshIgnoreMap);
    
    function fail(error) {
        self.publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
    }

    // Public stuffs
    this.publish = function(type, data) {
        dojo.publish(self.publish_topic, [{ type: type, data: data }]);
    };

    this.load = repository.load;
    this.refresh = repository.refresh;
    this.checkUpdate = interfaces.update.check_update;
    this.downloadUpdate = interfaces.update.download_update;
    this.applyUpdateReboot = interfaces.update.apply_update_and_reboot;
    this.applyUpdateShutdown = interfaces.update.apply_update_and_shutdown;
    this.cancelUpdate = interfaces.update.cancel_update;

    this.setState = function(state) {
        self.state = state;
        self.xfer_percent = 0;
        self.publish(XenConstants.TopicTypes.MODEL_STATE_CHANGED);
    };

    this.setTransferState = function(percent, speed) {
        self.xfer_percent = percent;
        self.xfer_speed = speed;
        self.publish(XenConstants.TopicTypes.MODEL_TRANSFER_CHANGED);
    };

    // Returns last error
    this.getError = function() {
        var error = "";
        var code = self.error.split(':')[0];
        dojo.some(Object.keys(XenConstants.UpdateCodes), function(key) {
            if (XenConstants.UpdateCodes[key] == code) {
                error = XUICache.alerts[key];
                return true;
            }
            return false;
        }, this);
        return error;
    };

    this.getUpdateURL = function() {
        return (self.update_url == "") ? "http://" : self.update_url;
    };
};