// Power device model
Namespace("XenClient.UI");

XenClient.UI.BatteryModel = function(bat_num) {

    var self = this;

    // Properties & Defaults
    this.bat_num = bat_num;
    this.bat_index = XUICache.Host.available_batteries.indexOf(this.bat_num);
    //publish topic has to be a string
    this.publish_topic =XenConstants.TopicTypes.UI_BATTERIES_LOADED;//
    this.present = true;
    this.state = 0; // 0: Unknown, 1: Charging, 2: Discharging, 3: Empty, 4: Fully charged, 5: Pending charge, 6: Pending discharge
    this.timetoempty = 0; // Seconds, 0: Unknown
    this.timetofull = 0; // Seconds, 0: Unknown
    this.percent = 0;
    this.aggregatestate = 0; // 0: Unknown, 1: Charging, 2: Discharging, 3: Empty, 4: Fully charged, 5: Pending charge, 6: Pending discharge
    this.aggregatetimetoempty = 0; // Seconds, 0: Unknown
    this.aggregatetimetofull = 0; // Seconds, 0: Unknown
    this.aggregatepercent = 0; // the total percentage of all batteries in the system
    this.adapter_state = 0;
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

      this._updatePresent= function(interfaces, error) {
      interfaces.xcpmd.battery_is_present(this.bat_num,
       dojo.hitch(this, function(present){
        if (present == 0 || !!present) {
          this.present = present;
          if(this.bat_index>-1)
          {
              XUICache.Batteries[this.bat_index].present=present;
          }

        }

      }), error);
    }

    this._updatePercent= function(interfaces, error) {
      interfaces.xcpmd.battery_percentage(this.bat_num,
      dojo.hitch(this, function(percent){
        if (percent == 0 || !!percent) {
          this.percent = percent;
           if(this.bat_index>-1)
           {
             XUICache.Batteries[this.bat_index].percent=percent;
             self.publish(XenConstants.TopicTypes.UI_BATTERIES_CHANGED);
           }

        }

      }), error);
    }

    this._updateAggregatePercent= function(interfaces, error) {
      interfaces.xcpmd.aggregate_battery_percentage(
      dojo.hitch(this, function(percent){
        if (percent == 0 || !!percent) {
          this.aggregatepercent = percent;
           if(this.bat_index>-1)
           {
             XUICache.Batteries[this.bat_index].aggregatepercent=percent;
           }

        }

      }), error);
    }


   this._updateState= function(interfaces, error) {
      interfaces.xcpmd.battery_state(this.bat_num,
       dojo.hitch(this, function(newState){
        if (newState == 0 || !!newState) {
          this.state = newState;
          if(this.bat_index>-1)
          {
             XUICache.Batteries[this.bat_index].state=newState;
          }

        }
      }), error);
    }

    this._updateTimeToEmpty= function(interfaces, error) {
      interfaces.xcpmd.battery_time_to_empty(this.bat_num,
       dojo.hitch(this, function(tToEmpty){
        if (tToEmpty == 0 || !!tToEmpty) {
          this.timetoempty = tToEmpty;
          if(this.bat_index>-1)
          {
            XUICache.Batteries[this.bat_index].timetoempty=tToEmpty;
          }

        }
      }), error);
    }

    this._updateTimeToFull= function(interfaces, error) {
      interfaces.xcpmd.battery_time_to_full(this.bat_num,
       dojo.hitch(this, function(tToFull){
        if (tToFull == 0 || !!tToFull) {
          this.timetofull = tToFull;
          if(this.bat_index>-1)
          {
              XUICache.Batteries[this.bat_index].timetofull=tToFull;
          }

        }
      }), error);
    }

    this._updateAggregateState= function(interfaces, error) {
      interfaces.xcpmd.aggregate_battery_state(
       dojo.hitch(this, function(newState){
        if (newState == 0 || !!newState) {
          this.aggregatestate = newState;
          if(this.bat_index>-1)
          {
             XUICache.Batteries[this.bat_index].aggregatestate=newState;
          }

        }
      }), error);
    }

    this._updateAggregateTimeToEmpty= function(interfaces, error) {
      interfaces.xcpmd.aggregate_battery_time_to_empty(
       dojo.hitch(this, function(tToEmpty){
        if (tToEmpty == 0 || !!tToEmpty) {
          this.aggregatetimetoempty = tToEmpty;
          if(this.bat_index>-1)
          {
            XUICache.Batteries[this.bat_index].aggregatetimetoempty=tToEmpty;
            self.publish(XenConstants.TopicTypes.UI_BATTERIES_CHANGED);
          }

        }
      }), error);
    }

    this._updateAggregateTimeToFull= function(interfaces, error) {
      interfaces.xcpmd.aggregate_battery_time_to_full(
       dojo.hitch(this, function(tToFull){
        if (tToFull == 0 || !!tToFull) {
          this.aggregatetimetofull = tToFull;
          if(this.bat_index>-1)
          {
              XUICache.Batteries[this.bat_index].aggregatetimetofull=tToFull;
          }

        }
      }), error);
    }


   this._updateAdapterStatus= function(interfaces, error) {
      interfaces.xcpmd.get_ac_adapter_state(
       dojo.hitch(this, function(acState){
        if (acState == 0 || !!acState) {
          this.adapter_state = acState;
          if(this.bat_index>-1)
          {
                XUICache.Batteries[this.bat_index].adapter_state=acState;
                self.publish(XenConstants.TopicTypes.UI_BATTERIES_CHANGED);
          }

        }
      }), error);
    }


   this._updateBattery= function() {
      this.bat_index = XUICache.Host.available_batteries.indexOf(this.bat_num);

      var error = function(error) {
        if(this.bat_num!=undefined)
        {// suppress errors if the batteries are in the midst of being refreshed
           XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        }
      };
      var self=this;

      this._updatePresent(interfaces, error);
      this._updateState(interfaces, error);
      this._updatePercent(interfaces,error);
      this._updateTimeToFull(interfaces, error);
      this._updateTimeToEmpty(interfaces, error);
      this._updateAdapterStatus(interfaces, error);
      this._updateAggregatePercent(interfaces,error);
      this._updateAggregateTimeToFull(interfaces, error);
      this._updateAggregateTimeToEmpty(interfaces, error);
  
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

    this.isPlugged = function() {
        return (this.adapter_state == 1);
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

    this.getAggregatePercent = function() {
        return Math.round(this.aggregatepercent);
    };

    this.getAggregateTimeToEmpty = function() {
        return this._getTime(this.aggregatetimetoempty);
    };

    this.getAggregateTimeToFull = function() {
        return this._getTime(this.aggregatetimetofull);
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
