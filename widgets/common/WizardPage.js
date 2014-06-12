define([
    "dojo",
    "dojo/_base/declare",
    "dijit",
    // Mixins
    "dijit/form/_FormMixin",
    "citrix/common/ContentPane"
],
function(dojo, declare, dijit, _formMixin, contentPane) {
return declare("citrix.common.WizardPage", [contentPane, _formMixin], {

    isReturnable: true,

    onStartFunction: function() {},
    onNextFunction: function(success) { success(); },

    postCreate: function() {
        this.inherited(arguments);

        this.watch("selected", function(prop, oldVal, newVal) {
            if(newVal && !this._wasShown && this.onStartFunction) {
                this.onStartFunction();
            }
        });
    },

    _setStateAttr: function(value) {
        this.state = value;
        dojo.publish(this.getParent().id + "-stateChange", [(value == "")]);
    },

    onShow: function() {
        if(!this._haveFocused) {
            this._haveFocused = true;
            var node = dijit.getFirstInTabbingOrder(this.domNode);
            if(node) {
                node.focus();
            }
        }
    }
});
});