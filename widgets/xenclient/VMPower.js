define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/VM",
    "dojo/text!citrix/xenclient/templates/VMPower.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Contained",
    "dijit/_CssStateMixin",
    "dijit/form/_FormMixin",
    "citrix/common/_CitrixWidgetMixin",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    // Required in template
    "citrix/common/BoundWidget",
    "citrix/common/ImageButton"
],
function(dojo, declare, vmNls, template, _widget, _templated, _contained, _cssStateMixin, _formMixin, _citrixWidgetMixin, _BoundContainerMixin, _citrixTooltipMixin) {
return declare("citrix.xenclient.VMPower", [_widget, _templated, _contained, _cssStateMixin, _formMixin, _citrixWidgetMixin, _BoundContainerMixin, _citrixTooltipMixin], {

	templateString: template,
    widgetsInTemplate: true,

    constructor: function(args) {
        this.vm = XUICache.VMs[args.path];
    },

    postMixInProperties: function() {
        dojo.mixin(this, vmNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this._bindDijit();
        this.inherited(arguments);
    },

    onForceStop: function() {
        this.vm.force_shutdown();
    },

    _bindDijit: function() {
        this.bind(this.vm);
        this._setDisplay(this.containerNode, this.vm.isRunning());

        this._setDisplay(".force_shutdownAction", false);
        if (XUICache.Host.state == XenConstants.HostStates.HOST_REBOOTING || XUICache.Host.state == XenConstants.HostStates.HOST_SHUTTING_DOWN) {
            // VM Type
            this._setDisplay("." + this.vm.hosting_type + "Buttons", true);
        }

        this.inherited(arguments);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
        }
    }
});
});