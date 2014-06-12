define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/OrderableHorizItem.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Contained",
    "dijit/_CssStateMixin",
    "citrix/common/_CitrixTooltipMixin"
],
function(dojo, declare, template, _widget, _templated, _contained, _cssStateMixin, _citrixTooltipMixin) {
return declare("citrix.common.OrderableHorizItem", [_widget, _templated, _contained, _cssStateMixin, _citrixTooltipMixin], {

	templateString: template,
    uid: "",
    info: "",
    _truncateLength: 14,
    baseClass: "citrixOrderableHorizItem",
    cssStateNodes: {
        "increaseButton": "citrixArrowIcon",
        "decreaseButton": "citrixArrowIcon"
    },

    postCreate: function() {
        this.inherited(arguments);
        this.infoNode.innerHTML = this._truncatedInfo();
        dojo.attr(this.infoNode, "title", this._fullInfoWhenTruncated());
        this._bindDijit();
    },

    _onDecreaseClick: function(event) {
        if(event.type == "click" || (event.type == "keypress" && event.keyCode == dojo.keys.SPACE)) {
            this.getParent()._moveChildren(this, -1, this.decreaseButton);
        }
    },

    _onIncreaseClick: function(event) {
        if(event.type == "click" || (event.type == "keypress" && event.keyCode == dojo.keys.SPACE)) {
            this.getParent()._moveChildren(this, +1, this.increaseButton);
        }
    },

    _truncatedInfo: function(){
        return this.info.shorten(this._truncateLength);
    },

    _fullInfoWhenTruncated: function(){
        return (this.info.length > this._truncateLength ? this.info : "");
    }
});
});