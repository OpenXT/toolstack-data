define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/form/CheckBox"
],
function(dojo, declare, checkBox) {
return declare("citrix.common.CheckBox", [checkBox], {

    value: true,

    _clicked: function(/*Event*/ e) {
        this.inherited(arguments);
        this.focusNode.focus();
    }
});
});