// Power device model
Namespace("XenClient.UI");

XenClient.UI.BatteryModel = function(bat_num) {

    var self = this;

    // Properties & Defaults
    this.bat_num = bat_num;
    //publish topic has to be a string
    this.publish_topic = bat_num.toString();
    this.present = true;
    this.state = 0; // 0: Unknown, 1: Charging, 2: Discharging, 3: Empty, 4: Fully charged, 5: Pending charge, 6: Pending discharge
    this.timetoempty = 0; // Seconds, 0: Unknown
    this.timetofull = 0; // Seconds, 0: Unknown
    this.percent = 0;

    // Services
    var services = {
        xcpmd:      new XenClient.DBus.XcpmdClient("com.citrix.xenclient.xcpmd", "/")
    };

    // Interfaces
    var interfaces = {
        xcpmd:      services.xcpmd.com.citrix.xenclient.xcpmd
    };

    //private stuffs
    function fail(error) {
        self.publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
    }

    // Mappings
    var readOnlyMap = [
        ["present",     interfaces.xcpmd, "battery_is_present"],
        ["state",       interfaces.xcpmd, "battery_state"],
        ["percent",     interfaces.xcpmd, "battery_percentage"],
        ["timetoempty", interfaces.xcpmd, "battery_time_to_empty"],
        ["timetofull",  interfaces.xcpmd, "battery_time_to_full"]
    ];

      this._updatePresent= function(interfaces, success, error) {
      interfaces.xcpmd.battery_is_present(this.bat_num,
       dojo.hitch(this, function(present){
        if (present == 0 || !!present) {
          this.present = present;
          XUICache.Batteries[this.bat_num].present=present;
          success();
        }

      }), error);
    }

    this._updatePercent= function(interfaces, success, error) {
      interfaces.xcpmd.battery_percentage(this.bat_num,
      dojo.hitch(this, function(percent){
        if (percent == 0 || !!percent) {
          this.percent = percent;
          XUICache.Batteries[this.bat_num].percent=percent;
          success();
        }

      }), error);
    }

   this._updateState= function(interfaces, success, error) {
      interfaces.xcpmd.battery_state(this.bat_num,
       dojo.hitch(this, function(newState){
        if (newState == 0 || !!newState) {
          this.state = newState;
          XUICache.Batteries[this.bat_num].state=newState;
          success();
        }
      }), error);
    }

    this._updateTimeToEmpty= function(interfaces, success, error) {
      interfaces.xcpmd.battery_time_to_empty(this.bat_num,
       dojo.hitch(this, function(tToEmpty){
        if (tToEmpty == 0 || !!tToEmpty) {
          this.timetoempty = tToEmpty;
          XUICache.Batteries[this.bat_num].timetoempty=tToEmpty;
          success();
        }
      }), error);
    }

    this._updateTimeToFull= function(interfaces, success, error) {
      interfaces.xcpmd.battery_time_to_full(this.bat_num,
       dojo.hitch(this, function(tToFull){
        if (tToFull == 0 || !!tToFull) {
          this.timetofull = tToFull;
          XUICache.Batteries[this.bat_num].timetofull=tToFull;
          success();
        }
      }), error);
    }

   this._updateBattery= function() {

      var error = function(error) {
          XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
      };
      var self=this;

     var wait = new XUtils.AsyncWait( function(){
         // and publish for any subscribers (i.e., footer battery bar
          self.publish(XenConstants.TopicTypes.MODEL_CHANGED);
      }, error);
         
      this._updatePresent(interfaces,  wait.addCallback(), error);
      this._updateState(interfaces,  wait.addCallback(), error);
      this._updatePercent(interfaces, wait.addCallback(),error);
      this._updateTimeToFull(interfaces,  wait.addCallback(), error);
      this._updateTimeToEmpty(interfaces,  wait.addCallback(), error);
      wait.finish();

    }


 // Repository
 //   var repository = new XenClient.UI.Repository(this, readOnlyMap);

    // Public stuffs
    this.publish = function(type, data) {
        dojo.publish(self.publish_topic, [{ type: type, data: data }]);
    };

    this.load =this._updateBattery;
    this.refresh = this._updateBattery;
 

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

    this.getState = function() {
      return this.state;
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
        xcpmd:      new XenClient.DBus.XcpmdClient("com.citrix.xenclient.xcpmd", "/")
    };

    // Interfaces
    var interfaces = {
        xcpmd:      services.xcpmd.com.citrix.xenclient.xcpmd
    };

    // Mappings
    var readOnlyMap = [
        ["type",    interfaces.xcpmd, "battery_type"]
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

    this.load = function(){};// null function to act as placeholder // repository.load;

    this.isBattery = function() {
        return (this.type == 2);
    };
};
