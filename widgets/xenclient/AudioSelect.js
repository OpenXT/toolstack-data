define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "citrix/common/Select"
],
function(dojo, declare, select) {
return declare("citrix.xenclient.AudioSelect", [select], {

    _setValueAttr: function(newValue) {
        if (Object.toType(newValue) == "string" && newValue.startsWith('current:')) {
            // Set via audio control list
            var values = newValue.split("' '");
            var value = values.shift().substr(9);

            this.options = dojo.map(values, function(option) {
                if (option.endsWith("'")) {
                    option = option.substring(0, option.length-1);
                }

                return { label: option, value: option };
            });

            this.set("value", value);

        } else {
            this.inherited(arguments);
        }
    }
    
});
});