define([
    "dojo",
    "dojo/_base/declare",
    "dijit",
    // Resources
    "dojo/text!citrix/common/templates/ImageItem.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Contained",
    "dijit/_CssStateMixin"
],
function(dojo, declare, dijit, template, _widget, _templated, _contained, _cssStateMixin) {
return declare("citrix.common.ImageItem", [_widget, _templated, _contained, _cssStateMixin], {

	templateString: template,
    image: "",

    postCreate: function() {
		this.containerNode.setAttribute("role", "button");
        this.inherited(arguments);
    },

    _setImageAttr: function(value) {
        this.imageNode.src = value;
    },

    focus: function() {
        dijit.focus(this.focusNode);
    }
});
});