define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/FooterBarItem.html",
    // Mixins
    "dijit/MenuItem",
    "citrix/common/_MenuBarItemMixin",
    // Required in code
    "citrix/common/Tooltip"
],
function(dojo, declare, template, menuItem, _menuBarItemMixin, tooltip) {
return declare("citrix.common.FooterBarItem", [menuItem, _menuBarItemMixin], {

    templateString: template,
    baseClass: "",
    title: "",
    tooltip: "",
    _tooltip: null,

    postCreate: function() {
        this.inherited(arguments);
        this._tooltip = new tooltip({label: this.tooltip, connectId: this.iconNode, position: ["above"], showDelay: 200 });
    }
});
});