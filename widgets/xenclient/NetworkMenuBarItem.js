define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/xenclient/templates/NetworkMenuBarItem.html",
    // Mixins
    "citrix/common/MenuBarItem",
    // Required in code
    "citrix/common/Tooltip"
],
function(dojo, declare, template, menuBarItem, tooltip) {
return declare("citrix.xenclient.NetworkMenuBarItem", [menuBarItem], {

    templateString: template,
    iconClass: "networkIcon networkIconNone",
    splitter: "left",
    tooltip: null,
    defaultLabel: "",

    constructor: function(args) {
        this.ndvm = XUICache.NDVMs[args.path];
    },

    postCreate: function() {
        this.tooltip = new tooltip({ connectId: this.focusNode, position: ["below"], showDelay: 200, baseClass: "citrixTooltip" });
        this.subscribe(this.ndvm.publish_topic, this._messageHandler);
        this.inherited(arguments);
        this.startup();
        this._bindDijit();
    },

    onClick: function() {
        var position = dojo.position(this.focusNode);
        this.ndvm.popupNetworkMenu(position.x, position.y + position.h);
    },

    setIcon: function() {
        var icon = this.ndvm.getIcon();
        var preloader = icon.startsWith("Connecting");
        this.set("iconClass", "networkIcon networkIcon" + icon);
        this._setDisplay(this.preloaderNode, preloader);
    },

    _bindDijit: function() {
        this.set("label", this.ndvm.name || this.defaultLabel);
        this.tooltip.label = this.ndvm.fullNameWhenTruncated();
        this.setIcon();
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