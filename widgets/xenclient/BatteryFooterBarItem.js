define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Menus",
    // Mixins
    "citrix/common/FooterBarItem"
],
function(dojo, declare, nls, footerBarItem) {
return declare("citrix.xenclient.BatteryFooterBarItem", [footerBarItem], {

    constructor: function(args) {
        this.battery = XUICache.Batteries[args.num];
 
    },

    postMixInProperties: function() {
        dojo.mixin(this, nls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        dojo.toggleClass(this.focusNode, "citrixFooterBarItemRight");
        this._setDisplay(this.focusNode, false);
        if(this.battery!=undefined)
        {
           this.subscribe(this.battery.publish_topic, this._messageHandler);
           this._bindDijit();
        }
    },

    _padstring: function(value){
        var padded = value.toString();
        if(padded.length==1)
        {
            padded = "0" + padded;
        }
        return padded;
    },

    _bindDijit: function() {
        var iconClass = "batteryIcon";
        var percentClass = iconClass;
        var tooltip = "";
        this.battery = XUICache.Batteries[this.battery.bat_index];
        var charging = this.battery.isCharging();
        var present = this.battery.present;
        var plugged = this.battery.isPlugged();

        this.totalpercent = 0;
        this.totalhours = 0;
        this.totalminutes=0;
        this.batterytip = "";
        var battery_count = 0;
        var percent = 0;
        var batteryline = "";
        var full = true;
        var calibrating = false;
        for(var index in XUICache.Batteries)
        {
            if(XUICache.Batteries.hasOwnProperty(index))
            {
               var device = XUICache.Batteries[index];
               if (device && device.present) {
                       this.totalpercent = this.totalpercent + device.percent;
                       if(!charging & device.isCharging())
                       {
                        charging = device.isCharging();
                       }
                       battery_count++;
                       var stateline = "<span style='font-size: x-small'>";
                       stateline ="Battery #"+ battery_count +" - "+device.percent+"% - ";
                       switch(device.state) {
                          case 0: {
                              stateline ="Battery #"+ battery_count +" - Calibrating.... ";
                              calibrating = true;
                              break;
                          }
                          case 1: {
                              var times = device.getTimeToFull();
                              this.totalhours = this.totalhours + times[0];
                              this.totalminutes = this.totalminutes + times[1];

                              stateline =stateline +"<span style='color:green' >"+ this._padstring(times[0]) + ":" + this._padstring(times[1]) +"</span>";
                              full = false;
                              break;
                          }
                          case 4: {
                               stateline = stateline +"<span style='color:blue' >"+ "Full"+"</span>";
                              break;
                          }
                          default: {
                              var times = device.getTimeToEmpty();
                              this.totalhours = this.totalhours + times[0];
                              this.totalminutes = this.totalminutes + times[1];
 
                              stateline =stateline +"<span style='color:red' >"+ this._padstring(times[0]) + ":" + this._padstring(times[1]) +"</span>";
                              full = false;

                          }

                      }
               }
               batteryline = batteryline + stateline + "<BR>";
             }
       }

       percent = this.totalpercent / battery_count;
       var summary = "";
       if(charging)
       {
           var msg = this["BATTERY_MSG1"];//"% available (charging) ";
           if(plugged)
           {
                msg+= this["BATTERY_MSG2"];//" (plugged in) ";
           }
           summary= "<div>"+percent+msg+ this._padstring(this.totalhours) + " hr "+this._padstring(this.totalminutes) + " min</div>";
       }
       else
       {
           if(full)
           {
              summary= "<div>"+percent+this["BATTERY_PCT_CHARGED"]+"</div>"; 
           }
           else
           {
              summary= "<div>"+percent+this["BATTERY_PCT_REMAINING"]+ this._padstring(this.totalhours) + " hr "+this._padstring(this.totalminutes) + " min</div>"; 
           }
       }
       if(calibrating)
       {
           summary= "<div>Calibrating.....</div>";
       }
 
       this.batterytip = summary
       if(battery_count>0)
       {
           this.batterytip = this.batterytip + "<hr><div align='center'>" +  batteryline + "</div>";
       }

        if (percent > 87) {
            percentClass += 100;
        } else if (percent > 62) {
            percentClass += 75;
        } else if (percent > 37) {
            percentClass += 50;
        } else if (percent > 10) {
            percentClass += 25;
        } else {
            percentClass += 0;
        }

        if(calibrating && percent==0)
        {// default to a non-alarming setting
            percentClass = iconClass;
            percentClass += 75;
            percent = 75;
        }

        var chargingClass = iconClass + (charging ? "Charging" : "Normal");
        iconClass += " " + chargingClass + " " + percentClass;
        
        this.set("iconClass", iconClass);
        this.set("label", percent + "%");
        this._setDisplay(this.focusNode, present);
  
        this._tooltip.label = this.batterytip;// tooltip;


        if (!charging && (percent == 10 || percent == 5)) {
            XenClient.Utils.publish(XenConstants.TopicTypes.BATTERY_CRITICAL, percent);
        }
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.UI_BATTERIES_LOADED: {
                this._bindDijit();
                break;
            }
           case XenConstants.TopicTypes.UI_BATTERIES_CHANGED: {
                this._bindDijit();
                break;
            }
                                                               //UI_BATTERIES_CHANGED

        }
    }
});
});
