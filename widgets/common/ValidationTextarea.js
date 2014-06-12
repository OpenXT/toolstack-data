define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "citrix/common/ValidationTextBox"
],
function(dojo, declare, validationTextBox) {
return declare("citrix.common.ValidationTextarea", [validationTextBox], {
// We don't want to inherit from SimpleTextarea as it hides the maxLength attribute which works in Webkit
// and has an _onInput function which fails for double-byte characters

    regExp: "([^\\s<>&][^<>&]*)", // default for textarea to allow returns
    baseClass: "dijitTextBox dijitTextArea",

    // rows: Number
    //		The number of rows of text.
    rows: "3",

    // rows: Number
    //		The number of characters per line.
    cols: "20",

    attributeMap: dojo.delegate(dijit.form.TextBox.prototype.attributeMap, {
        rows: "textbox", cols: "textbox"
    }),

    templateString: "<textarea ${!nameAttrSetting} dojoAttachPoint='focusNode,containerNode,textbox' autocomplete='off'></textarea>",

    postMixInProperties: function(){
        // Copy value from srcNodeRef, unless user specified a value explicitly (or there is no srcNodeRef)
        // TODO: parser will handle this in 2.0
        if(!this.value && this.srcNodeRef){
            this.value = this.srcNodeRef.value;
        }
        this.inherited(arguments);
    },

    buildRendering: function(){
        this.inherited(arguments);
        if(dojo.isIE && this.cols){ // attribute selectors is not supported in IE6
            dojo.addClass(this.textbox, "dijitTextAreaCols");
        }
    },

    filter: function(/*String*/ value){
        // Override TextBox.filter to deal with newlines... specifically (IIRC) this is for IE which writes newlines
        // as \r\n instead of just \n
        if(value){
            value = value.replace(/\r/g,"");
        }
        return this.inherited(arguments);
    },

    validate: function() {
        if (arguments.length == 0) {
            return this.validate(true);
        }
        else {
            return this.inherited(arguments);
        }
    },

    onFocus: function() {
        if (!this.isValid()) {
            this.displayMessage(this.getErrorMessage());
        }
        this.inherited(arguments);
    },

    onBlur: function() {
        this.validate(false);
        this.inherited(arguments);
    }
});
});