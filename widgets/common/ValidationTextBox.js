define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/form/ValidationTextBox",
    "citrix/common/_KeyboardAttachMixin"
],
function(dojo, declare, validationTextBox, _keyboardAttachMixin) {
return declare("citrix.common.ValidationTextBox", [validationTextBox, _keyboardAttachMixin], {

    missingMessage: "",
    regExpObject: "",
    
    regExpGen: function(/*dijit.form.ValidationTextBox.__Constraints*/ constraints) {
        if(this.regExpObject) {
            var exp = dojo.getObject(this.regExpObject);
            if(exp) {return exp;}
        }
        return this.regExp;
    }
});
});