define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/Label.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    "dijit/_CssStateMixin"
],
function(dojo, declare, template, _widget, _templated, _citrixWidgetMixin, _cssStateMixin) {
return declare("citrix.common.Label", [_widget, _templated, _citrixWidgetMixin, _cssStateMixin], {

    templateString: template,
    title: "",
    "for": "",
    canFocusTooltip: true,

    postCreate: function() {
        dojo.attr(this.containerNode, "for", this["for"]);
        dojo.attr(this.focusNode, "tabindex", this.canFocusTooltip ? 0 : -1);
        this.inherited(arguments);
    },

    _setTitleAttr: function(value) {
        dojo.attr(this.focusNode, "title", value);
        this._setClass(this.domNode, "citrixTooltipAnchor", value != "");
        this.title = "";
    }
});
});