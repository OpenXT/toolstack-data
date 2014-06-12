define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/TabButton.html",
    // Mixins
    "dijit/layout/TabController"
],
function(dojo, declare, template, tabController) {
return declare("citrix.common.TabButton", [tabController.TabButton], {

    templateString: template,
    baseClass: "citrixTab"
});
});