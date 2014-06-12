define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/TabContainer.html",
    // Mixins
    "dijit/layout/TabContainer",
    // Required in code
    "citrix/common/TabController"
],
function(dojo, declare, template, tabContainer) {
return declare("citrix.common.TabContainer", [tabContainer], {

    templateString: template,
    controllerWidget: "citrix.common.TabController",
    baseClass: "citrixTabContainer",
    tabPosition: "left-h",

    startup: function(){
        if(this._started){ return; }

        this.inherited(arguments);

        this.tablist.watch("focused", dojo.hitch(this, function(prop, oldVal, newVal) {
            dojo.toggleClass(this.wrapperNode, "dijitFocused", newVal);
        }));
    }
});
});