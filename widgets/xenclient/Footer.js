define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Frame",
    "dojo/text!citrix/xenclient/templates/Footer.html",
    // Mixins
    "dijit/layout/_LayoutWidget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    // Required in code
    "citrix/xenclient/BatteryFooterBarItem",
    // Required in template
    "citrix/common/FooterBar",
    "citrix/common/FooterBarItem",
    "citrix/xenclient/AlertFooterBarItem"
],
function(dojo, declare, frameNls, template, _layoutWidget, _templated, _citrixWidget, battery) {
return declare("citrix.xenclient.Footer", [_layoutWidget, _templated, _citrixWidget], {
  	templateString: template,
    widgetsInTemplate: true,
    created: false,
    postMixInProperties: function() {
        dojo.mixin(this, frameNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        var path = XenConstants.Plugins.PLUGIN_PATH + XenConstants.Plugins.BRANDING_DIR + "/" + XenConstants.Plugins.BRANDING_LOGO;
        XUtils.pathExists(path, dojo.hitch(this, function(exists) {
            if (exists) {
                this.brandingLogo.src = path;
                this._setDisplay(this.brandingLogo, true);
            }
        }));
        this._bindDijit();
    },

    _bindDijit: function() {
        this._setDisplay(this.measuredDisabled, !XUICache.Host.measured_boot_enabled);
        this._setDisplay(this.measuredSuccess, XUICache.Host.measured_boot_enabled && XUICache.Host.measured_boot_successful);
        this._setDisplay(this.measuredFailed, XUICache.Host.measured_boot_enabled && !XUICache.Host.measured_boot_successful);
        this.inherited(arguments);
    },

    _addBatteries: function() {
        var self = this;
        var batteries = XUICache.Host.available_batteries; //[0, 1];

        var error = function(error) {
          XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };
        var wait = new XenClient.Utils.AsyncWait(function(){});
        dojo.forEach(batteries,function(bat_num){
           XUICache.Host.listPowerDevices(parseInt(bat_num),
              wait.addCallback(function(exists){
                if (exists) {
                    if(!this.created)
                    {
                        var bat_index =XUICache.Host.available_batteries.indexOf(bat_num);
                        self.addChild(new battery({num: bat_index}));
                        this.created = true;// don't add another battery icon to the bar
                    }
                }
               }), error);
         });
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.UI_BATTERIES_LOADED: {
                if(!this.created)
                {
                    this._addBatteries();
                }
                break;
            }
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
        }
    }
});
});
