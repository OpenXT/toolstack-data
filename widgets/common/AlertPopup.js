define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/AlertPopup.html",
    // Mixins
    "citrix/common/Dialog"
],
function(dojo, declare, template, dialog) {
return declare("citrix.common.AlertPopup", [dialog], {

    templateString: template,
    canCancel: false,
    _msgQueue: [],

    _defaultArguments: {
        boxClass: "",
        iconClass: ""
    },

    _errorArguments: {
        boxClass: "alertBox redBox",
        iconClass: "alertIcon alertIconSmall alertIconError"
    },

    _warningArguments: {
        boxClass: "alertBox orangeBox",
        iconClass: "alertIcon alertIconSmall alertIconWarning"
    },

    _informationArguments: {
        boxClass: "alertBox blueBox",
        iconClass: "alertIcon alertIconSmall alertIconInformation"
    },

    showError: function(message, overrideArguments) {
        var args = this._mergeArguments(this._errorArguments, overrideArguments);
        this._showDialog(message, args);
    },

    showWarning: function(message, overrideArguments) {
        var args = this._mergeArguments(this._warningArguments, overrideArguments);
        this._showDialog(message, args);
    },

    showInformation: function(message, overrideArguments) {
        var args = this._mergeArguments(this._informationArguments, overrideArguments);
        this._showDialog(message, args);
    },

    afterHide: function() {
        this.inherited(arguments);
        if (this._msgQueue.length > 0) {
            var args = this._msgQueue.shift();
            this._showDialog(args.message, args.args, true);
        }
    },

    _showDialog: function(message, args, fromQueue) {
        if (!fromQueue && this.open) {
            // Queue up the message
            this._msgQueue.push({ message: message, args: args });
            return;
        }
        this._bindDijit(message, args);
        this.show();
    },

    _mergeArguments: function() {
        var mergedArgs = {};
        var argArrays = [].slice.call(arguments);
        argArrays.unshift(this._defaultArguments);
        for (var i = 0; i < argArrays.length; i++) {
            var mergeIn = argArrays[i];
            for (var key in mergeIn) {
                mergedArgs[key] = mergeIn[key];
            }
        }
        return mergedArgs;
    },

    _bindDijit: function(message, args) {
        this.messageNode.innerHTML = message;
        this.boxNode.className = args.boxClass;
        this.iconNode.className = "left " + args.iconClass;
    }
});
});