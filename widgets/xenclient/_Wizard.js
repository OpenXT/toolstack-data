define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Wizard",
    // Mixins
    "citrix/common/_WizardDialog"
],
function(dojo, declare, wizardNls, _wizard) {
return declare("citrix.xenclient._Wizard", [_wizard], {

    postMixInProperties: function() {
        dojo.mixin(this, wizardNls);

        this.inherited(arguments);
    },

    startup: function() {
        this.inherited(arguments);

        this.navigationNode.set("cancelLabel", this.CANCEL_ACTION);
        this.navigationNode.set("nextLabel", this.NEXT_ACTION);
        this.navigationNode.set("backLabel", this.PREVIOUS_ACTION);
        this.navigationNode.set("finishLabel", this.FINISH_ACTION);
    },

    show: function() {
        // Position dialog before it is shown so that any focussed inputs are not scrolled into view
        this._position();
        this.inherited(arguments);
    }
});
});