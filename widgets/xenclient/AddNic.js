define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/AddNic",
    "dojo/text!citrix/xenclient/templates/AddNic.html",
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
function(dojo, declare, AddNicNls, template, dialog, _boundContainerMixin) {
return declare("citrix.xenclient.AddNic", [dialog, _boundContainerMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,
    _network_path: "",

    constructor: function(args) {
        this.vm = XUICache.getVM(args.path);
    },

    postMixInProperties: function() {
        dojo.mixin(this, AddNicNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this._bindDijit();
    },

    onNicSelect: function(event) {
        if (dojo.hasClass(event.currentTarget, "disabled")) {
            return;
        }
        var path = this._getNetworkPath(event.currentTarget);
        if (path == this._network_path) {
            return;
        }
        this._network_path = path;
        this._setClass(".device", "selected", false);
        this._setClass(event.currentTarget, "selected", true);
        this._setEnabled(this.addButton, true);
    },

    onExecute: function() {
        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
        var wireless = false;       
        dojo.some(XUICache.Host.available_networks, function(network){
            if (network.object == this._network_path) {
                switch(network.type) {
                    case XenConstants.Network.NETWORK_TYPE.WIFI:
                    case XenConstants.Network.NETWORK_TYPE.MODEM: {
                        wireless = true;
                        break;
                    }
                }
                return true;
            }
            return false;
        }, this);
        this.vm.addNetwork(this._network_path, wireless, function() {
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
        }, function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        });
        this.inherited(arguments);
    },

    _bindDijit: function() {
        this.bind(XUICache.Host);
        this.set("title", this.ADD_NETWORK);
        this._setEnabled(this.addButton, false);
    },

    _getNetworkPath: function(node) {
        return new dojo.NodeList(node).parents("li").first()[0].getAttribute("networkPath");
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