define([
    "dojo",
    "dojo/_base/declare",
    "dijit",
    // Mixins
    "dijit/Tooltip"
],
function(dojo, declare, dijit, tooltip) {
return declare("citrix.common.Tooltip", [tooltip], {

    baseClass: "",
    isOpen: false,

    startup: function() {
        this.inherited(arguments);

        dojo.forEach(this._connectIds, function(item) {
            this.setTooltip(item);
        }, this);
    },

    setTooltip: function(id) {
        var node = dojo.byId(id);
        if(!node) {
            return;
        }
        if(dojo.hasAttr(node, "title")) {
            this.label = dojo.attr(node, "title");
            dojo.removeAttr(node, "title");
        }
    },

    open: function(/*DomNode*/ target){
        if(this.label == "") { return; }

        this.inherited(arguments);
        if(this.baseClass != "") {
            dojo.addClass(dijit._masterTT.domNode, this.baseClass);
        }
    },

    close: function() {
        this.inherited(arguments);
        if(this.baseClass != "" && dijit._masterTT) {
            dojo.removeClass(dijit._masterTT.domNode, this.baseClass);
        }
    },

    addTarget: function(/*DOMNODE || String*/ node){
        var id = node.id || node;
        if(dojo.indexOf(this._connectIds, id) == -1 || this._connections.length == 0 || this._connections[0].length == 0) {
            this.set("connectId", this._connectIds.concat(id));
        }
    },

    onShow: function() {
        this.inherited(arguments);
        this.isOpen = true;
    },

    onHide: function() {
        this.inherited(arguments);
        this.isOpen = false;
    }
});
});