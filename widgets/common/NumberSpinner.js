define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/form/NumberSpinner",
    "citrix/common/_KeyboardAttachMixin"
],
function(dojo, declare, numberSpinner, _keyboardAttachMixin) {
return declare("citrix.common.NumberSpinner", [numberSpinner, _keyboardAttachMixin], {

    defaultTimeout: 250,
    required: true,

    postCreate: function() {
        this.inherited(arguments);
        // This ensures that composition managers (IME toolbar) don't put crap into the input box (XC-7429)
        dojo.connect(this.focusNode, "onchange", dojo.hitch(this, function() {
            var val = this.textbox.value;
            if (isNaN(parseInt(val))) {
                this.set("value", this.constraints.min.toString());
            }
        }));
    },

    filter: function(/*Number | String*/ val){
        val = this.inherited(arguments);

        if(this._keyboardOpen == true) {
            return this.format(val, {});
        }

        // because this takes in formatted strings and numbers, need to do the following with numbers,
        // then convert it back to a formatted string that is locale appropriate
        val = this.parse(val, this.constraints);

        if (val < this.constraints.min) {
            val = this.constraints.min;
        }
        if (val > this.constraints.max) {
            val = this.constraints.max;
        }

        val = this.format(val, this.constraints);

        return val;
    },

    _onKeyPress: function(e){
		this.inherited(arguments);
        // suppress char keys
        if (e.charOrCode != dojo.keys.ENTER &&
            e.charOrCode != dojo.keys.TAB &&
            e.charOrCode != dojo.keys.CTRL &&
            e.charOrCode != dojo.keys.SHIFT &&
            e.charOrCode != dojo.keys.ESCAPE &&
            e.charOrCode != dojo.keys.DELETE &&
            e.charOrCode != dojo.keys.BACKSPACE &&
            e.charOrCode != dojo.keys.LEFT_ARROW &&
            e.charOrCode != dojo.keys.RIGHT_ARROW &&
            e.charOrCode != dojo.keys.NUMPAD_PERIOD &&
            e.charOrCode != "." && e.charOrCode != "," &&
            (e.keyCode < 48 || e.keyCode > 57)) {
            dojo.stopEvent(e);
        }
	}
});
});