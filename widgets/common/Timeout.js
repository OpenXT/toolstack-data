define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/Timeout.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin"
],
function(dojo, declare, template, _widget, _templated, _citrixWidgetMixin) {
return declare("citrix.common.Timeout", [_widget, _templated, _citrixWidgetMixin], {

    templateString: template,
    widgetsInTemplate: true,
    onLabel: "",
    offLabel: "",
    unitLabelSingular: "",
    unitLabelPlural: "",
    smallDelta: "",
    largeDelta: "",
    max: "",
    value: 0,
    name: "",
    disabled: false,

    postCreate: function() {
        dojo.attr(this.onLabelNode, "for", this.onRadioNode.id);
        dojo.attr(this.offLabelNode, "for", this.offRadioNode.id);

        this._setEnabled(this.spinnerNode, this.value > 0);
    },

    _setValueAttr: function(newValue) {
        var val = parseInt(newValue);
        if(!isNaN(val)) {
            this.value = val;
            this.spinnerNode.set("value", val);
            this._setEnabled(this.spinnerNode, val > 0);
            if(val == 0) {
                this.offRadioNode.set("checked", true);
            } else {
                this.onRadioNode.set("checked", true);
            }
            this.unitNode.set("value", val > 1 ? 'n' : val);
        }
    },

    _getValueAttr: function() {
        var on = this.onRadioNode.get("checked");
        return on ? this.spinnerNode.get("value") : 0;
    },

    _setDisabledAttr: function(newValue) {
        this._setEnabled(this.onRadioNode, !newValue);
        this._setEnabled(this.offRadioNode, !newValue);
        if(newValue) {
            this._setEnabled(this.spinnerNode, false);
        } else {
            var on = this.onRadioNode.get("checked");
            this._setEnabled(this.spinnerNode, on);
        }
        this.disabled = newValue;
    },

    _onChildChange: function(/*value | event*/value) {
        var on = this.onRadioNode.get("checked");
        this._setEnabled(this.spinnerNode, on);
        this._handleOnChange(this.get("value"));
    },

    _handleOnChange: function(newValue, priorityChange) {
        // stub for _BoundContainerMixin to connect to
        this.value = newValue;
    }
});
});