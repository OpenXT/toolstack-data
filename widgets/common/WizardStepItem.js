define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/WizardStepItem.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated"
],
function(dojo, declare, template, _widget, _templated) {
return declare("citrix.common.WizardStepItem", [_widget, _templated], {

    templateString: template,
    selected: false,
    baseClass: "citrixWizardStepItem",

    _setSelectedAttr: function(/*boolean*/ value){
        value ? dojo.addClass(this.domNode, "citrixWizardStepSelected") : dojo.removeClass(this.domNode, "citrixWizardStepSelected");
    }
});
});