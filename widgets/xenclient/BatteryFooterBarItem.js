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
        this.battery = XUICache.Batteries[args.path];
    },

    postMixInProperties: function() {
        dojo.mixin(this, nls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        dojo.toggleClass(this.focusNode, "citrixFooterBarItemRight");
        this._setDisplay(this.focusNode, false);
        this.subscribe(this.battery.publish_topic, this._messageHandler);
        this._bindDijit();
    },

    _bindDijit: function() {
        var iconClass = "batteryIcon";
        var percentClass = iconClass;
        var tooltip = "";

        var percent = this.battery.getPercent();
        var charging = this.battery.isCharging();
        var present = this.battery.present;

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

        var chargingClass = iconClass + (charging ? "Charging" : "Normal");
        iconClass += " " + chargingClass + " " + percentClass;
        
        this.set("iconClass", iconClass);
        this.set("label", percent + "%");
        this._setDisplay(this.focusNode, present);

        switch(this.battery.state) {
            case 0: {
                break;
            }
            case 1: {
                tooltip = this["BATTERY_CHARGING"].format(this.battery.getTimeToFull());
                break;
            }
            case 4: {
                tooltip = this["BATTERY_CHARGED"];
                break;
            }
            default: {
                tooltip = this["BATTERY_DISCHARGING"].format(this.battery.getTimeToEmpty());
            }
        }

        this._tooltip.label = tooltip;


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
        }
    }
});
});
