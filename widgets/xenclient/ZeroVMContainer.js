define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/ZeroVM",
    "dojo/text!citrix/xenclient/templates/VMContainer.html",
    // Mixins
    "dijit/layout/_LayoutWidget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    // Required in code
    "citrix/xenclient/ZeroVM",
    "citrix/xenclient/ZeroVMFish",
    "citrix/xenclient/MediaWizard"
],
function(dojo, declare, zeroVmNls, template, _layoutWidget, _templated, _citrixWidgetMixin, zeroVm, zeroVmFish, mediaWizard) {
return declare("citrix.xenclient.ZeroVMContainer", [_layoutWidget, _templated, _citrixWidgetMixin], {

	templateString: template,

    postMixInProperties: function() {
        dojo.mixin(this, zeroVmNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);

        var mediaOptions = {
            mouseContainer: this.containerNode,
            text: this.CREATE_FROM_MEDIA,
            activate: function(event) {
                dojo.stopEvent(event);
                new mediaWizard().show();
            },
            imagePath: "images/buttons/001_InstallFromDisc_h32bit_256.png"
        };

        if (XenConstants.Defaults.FISH) {
            this.media = new zeroVmFish(mediaOptions);
        } else {
            this.media = new zeroVm(mediaOptions);
        }

        this.addChild(this.media);

        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this._displayButtons();
    },

    _displayButtons: function() {
        this._setDisplay(this.media, XUICache.Host.policy_create_vm);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._displayButtons();
                break;
            }
        }
    }
});
});