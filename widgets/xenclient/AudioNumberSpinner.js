define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Settings",
    "dojo/text!citrix/xenclient/templates/AudioNumberSpinner.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    // Required in template
    "citrix/common/NumberSpinner",
    "citrix/common/CheckBox"
],
function(dojo, declare, settingsNls, template, _widget, _templated, _citrixWidget) {
return declare("citrix.xenclient.AudioNumberSpinner", [_widget, _templated, _citrixWidget], {

    templateString: template,
    widgetsInTemplate: true,
    includeSwitch: false,

    postMixInProperties: function() {
        dojo.mixin(this, settingsNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this._setDisplay(this.switchNode, this.includeSwitch);
        this._setupControls();
    },

    _handleOnChange: function() {
        this._setupControls();
    },

    _setupControls: function() {
        this._setEnabled(this.spinnerNode, (!this.includeSwitch || this.switchNode.checked));
    },

    _setValueAttr: function(newValue) {
        var values = newValue.split(this.includeSwitch ? "% " : "%");

        var spinnerValue = values.shift();
        this.spinnerNode.set("value", spinnerValue);

        if (this.includeSwitch) {
            var switchValue = values.shift() == "on";
            this.switchNode.set("value", switchValue);
            this._setupControls();
        }
    },

    _getValueAttr: function() {
        var spinnerVal = this.spinnerNode.get("value");
        value = "{0}%".format(spinnerVal);

        if (this.includeSwitch) {
            var switchVal = this.switchNode.checked ? "on" : "off";
            value = "{0} {1}".format(value, switchVal);
        }

        return value;
    }
});
});