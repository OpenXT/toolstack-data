// Power device model
Namespace("XenClient.UI");

XenClient.UI.BatteryModel = function(device_path) {

    // Private stuffs
    var self = this;

    // Properties & Defaults
    this.device_path = device_path;
    this.publish_topic = device_path;
    this.present = false;
    this.state = 0; // 0: Unknown, 1: Charging, 2: Discharging, 3: Empty, 4: Fully charged, 5: Pending charge, 6: Pending discharge
    this.percent = 0;
    this.timetoempty = 0; // Seconds, 0: Unknown
    this.timetofull = 0; // Seconds, 0: Unknown

    // Services
    var services = {
        upower:     new XenClient.DBus.OrgFreedesktopUpowerDeviceClient("org.freedesktop.UPower", device_path)
    };

    // Interfaces
    var interfaces = {
        upower:     services.upower.org.freedesktop.UPower.Device
    };

    // Mappings
    var readOnlyMap = [
        ["present",     interfaces.upower, "IsPresent"],
        ["state",       interfaces.upower, "State"],
        ["percent",     interfaces.upower, "Percentage"],
        ["timetoempty", interfaces.upower, "TimeToEmpty"],
        ["timetofull",  interfaces.upower, "TimeToFull"]
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

    this.load = repository.load;
    this.refresh = repository.refresh;

    this.isCharging = function() {
        return (this.state == 1);
    };

    this.getPercent = function() {
        return Math.round(this.percent);
    };

    this.getTimeToEmpty = function() {
        return this._getTime(this.timetoempty);
    };

    this.getTimeToFull = function() {
        return this._getTime(this.timetofull);
    };

    this._getTime = function(seconds) {
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);

        return [hours, minutes];
    };
};

// Used to encapsulate code for checking if it's a power source the UI should be interested in
// to prevent unnecessary loading in the full model
XenClient.UI.PowerModel = function(device_path) {

   // Private stuffs
    var self = this;

    // Properties & Defaults
    this.device_path = device_path;
    this.publish_topic = device_path;
    this.type = 0; // 0: Unknown, 1: Line Power, 2: Battery, 3: Ups, 4: Monitor, 5: Mouse, 6: Keyboard, 7: Pda, 8: Phone

    // Services
    var services = {
        upower:     new XenClient.DBus.OrgFreedesktopUpowerDeviceClient("org.freedesktop.UPower", device_path)
    };

    // Interfaces
    var interfaces = {
        upower:     services.upower.org.freedesktop.UPower.Device
    };

    // Mappings
    var readOnlyMap = [
        ["type",    interfaces.upower, "Type"]
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

    this.load = repository.load;

    this.isBattery = function() {
        return (this.type == 2);
    };
};