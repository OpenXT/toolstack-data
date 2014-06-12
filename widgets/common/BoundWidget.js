define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/_Widget"
],
function(dojo, declare, _widget) {
return declare("citrix.common.BoundWidget", [_widget], {

    name: "",
    binding: "innerHTML",
    map: null,
    mask: "",

	postMixInProperties: function() {
		// save pointer to original source node, since Widget nulls-out srcNodeRef
		this.displayNode = this.srcNodeRef;
        this.inherited(arguments);
	},

    _getValueAttr: function() {
        // Bound widgets cannot change their values
        return null;
	},

    _setValueAttr: function(value) {
        var newValue = (typeof(value) === "function") ? value() : value;
        if (newValue != this.value) {
            this.value = newValue;
            this._render();
        }
	},

    _setMapAttr: function(value) {
        if (dojo.isArray(value)) {
            this.map = dojo.map(value, function(item, index) {
                if (typeof(item) === "string") {
                    return {value: index, display: item};
                }
                return item;
            }, this);
        } else if (dojo.isObject(value)) {
            this.map = dojo.map(Object.keys(value), function(item) {
                return {value: value[item], display: item};
            }, this);
        }
        this._render();
    },

    _getTranslatedValue: function() {
        var newValue = this.value;
        var formatMask = this.mask;

        if (this.map !== null) {
            if (dojo.isArray(newValue)) {
                newValue = dojo.map(newValue, function(value) {
                    for (var item in this.map) {
                        if (this.map.hasOwnProperty(item) && this.map[item].value === value) {
                            return this.map[item].display;
                        }
                    }
                    return value;
                }, this);
            } else {
                for (var item in this.map) {
                    if (this.map.hasOwnProperty(item) && this.map[item].value == newValue) {
                        // Important, this will skip masking (on purpose!)
                        return this.map[item].display;
                    }
                }
            }
        }

        if (formatMask == "value" && dojo.isArray(newValue)) {
            formatMask = newValue.shift();
        }
        if (formatMask != "") {
            newValue = formatMask.format(newValue);
        } else if (dojo.isArray(newValue)) {
            newValue = newValue.join(", ");
        }
        return newValue;
    },

    _render: function() {
        var value = this._getTranslatedValue();
        switch(this.binding) {
            case "display": {
                this.displayNode.style.display = (value) ? "" : "none";
                break;
            }
            case "visibility": {
                this.displayNode.style.visibility = (value) ? "visible" : "hidden";
                break;
            }
            case "disabled": {
                dojo.toggleClass(this.displayNode, "disabled", value);
                break;
            }
            default: {
                this.displayNode[this.binding] = value;
                break;
            }
        }
    }
});
});