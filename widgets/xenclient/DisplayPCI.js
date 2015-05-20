define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/DisplayPCI",
    "dojo/text!citrix/xenclient/templates/DisplayPCI.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    // Required in template
    "citrix/common/Repeater",
    "citrix/common/BoundWidget",
    "citrix/common/Button"
],
function(dojo, declare, displayPCINls, template, dialog, _boundContainerMixin) {
return declare("citrix.xenclient.DisplayPCI", [dialog, _boundContainerMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,

    constructor: function(args) {
        this.vm = XUICache.getVM(args.path);
        this.devicesOnGPUBus = args.devicesOnGPUBus;
        this.cancelCallback = args.cancelCallback;
    },

    postMixInProperties: function() {
        dojo.mixin(this, displayPCINls);
        this.inherited(arguments);
    },
    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this._bindDijit();
    },
    
    _bindDijit: function() {
        this.bind(this);
        this.set("title", this.DISPLAY_DEVICE);
    },

    onExecute: function(){
        this.inherited(arguments);
    },

    onCancel: function(){
        this.inherited(arguments);        
        this.cancelCallback();
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
