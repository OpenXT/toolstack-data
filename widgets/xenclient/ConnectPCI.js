define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/ConnectPCI",
    "dojo/text!citrix/xenclient/templates/ConnectPCI.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    // Required in code
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/Repeater",
    "citrix/common/BoundWidget",
    "citrix/common/Button"
],
function(dojo, declare, connectPCINls, template, dialog, _boundContainerMixin) {
return declare("citrix.xenclient.ConnectPCI", [dialog, _boundContainerMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,
    _deviceId: -1,

    constructor: function(args) {
        this.vm = XUICache.getVM(args.path);
    },

    postMixInProperties: function() {
        dojo.mixin(this, connectPCINls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this._bindDijit();
    },

    onDeviceSelect: function(event) {
        if (dojo.hasClass(event.currentTarget, "disabled")) {
            return;
        }
        var id = this._getDeviceID(event.currentTarget);
        if (id == this._deviceId) {
            return;
        }
        this._deviceId = id;
        this._setClass(".device", "selected", false);
        this._setClass(event.currentTarget, "selected", true);
        this._setEnabled(this.connectButton, true);
    },

    onExecute: function() {
        this.vm.addPciDevice(this._deviceId, undefined, function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        });

        this.inherited(arguments);
    },

    _bindDijit: function() {
        this.bind(this.vm);
        this.set("title", this.CONNECT_DEVICE);
        this._setEnabled(this.connectButton, false);
    },

    _getDeviceID: function(node) {
        return new dojo.NodeList(node).parents("li").first()[0].getAttribute("deviceId");
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