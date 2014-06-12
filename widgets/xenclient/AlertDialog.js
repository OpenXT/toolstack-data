define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    "dojo/i18n!citrix/xenclient/nls/AlertDialog",
    "dojo/text!citrix/xenclient/templates/AlertDialog.html",
    // Mixins
    "citrix/common/Dialog",
    // Required in template
    "citrix/common/CheckBox",
    "citrix/common/Button"
],
function(dojo, declare, alertsNls, alertDialogNls, template, dialog) {
return declare("citrix.xenclient.AlertDialog", [dialog], {

    templateString: template,
    widgetsInTemplate: true,
    _alertSource: null,
    _onContinue: null,
    _onClose: null,
    _showAgainProperty: "",
    _msgQueue: [],
    _getPrefix: "get_",
    _setPrefix: "set_",

    _defaultArguments: {
        headerText: "",
        continueText: "",
        closeText: "",
        iconClass: "",
        showAgainProperty: ""
    },

    _errorArguments: {
        headerText: "ERROR",
        continueText: "CLOSE_ACTION",
        iconClass: "alertIcon alertIconLarge alertIconError"
    },

    _warningArguments: {
        headerText: "WARNING",
        continueText: "CONTINUE_ACTION",
        iconClass: "alertIcon alertIconLarge alertIconWarning"
    },

    _tipArguments: {
        headerText: "TIP",
        continueText: "CONTINUE_ACTION",
        iconClass: "alertIcon alertIconLarge alertIconInformation"
    },

    _informationArguments: {
        headerText: "INFORMATION",
        continueText: "CONTINUE_ACTION",
        iconClass: "alertIcon alertIconLarge alertIconInformation"
    },

    _securityArguments: {
        headerText: "SECURITY",
        continueText: "CONTINUE_ACTION",
        iconClass: "shieldIcon shieldIconLarge shieldIconRed"
    },
    
    _confirmationArguments: {
        headerText: "WARNING",
        continueText: "OK_ACTION",
        closeText: "CANCEL_ACTION",
        iconClass: "alertIcon alertIconLarge alertIconWarning"
    },

    postMixInProperties: function() {
        this._alertSource = alertsNls;
        dojo.mixin(this, alertDialogNls);
        this.inherited(arguments);
    },

    showError: function(error, sourceHint, overrideArguments, onContinue) {
        var args = this._mergeArguments(this._errorArguments, overrideArguments);
        var message = error;
        if (typeof(message) == "object") {
            // Assume it's an rpc error object, go get the error
            message = this._getErrorMessage(error, sourceHint);
        }
        xc_debug.log(message);
        this._showDialog(message, args, onContinue);
    },

    showWarning: function(message, onContinue, overrideArguments) {
        var args = this._mergeArguments(this._warningArguments, overrideArguments);
        this._showDialog(message, args, onContinue);
    },

    showTip: function(message, onContinue, overrideArguments) {
        var args = this._mergeArguments(this._tipArguments, overrideArguments);
        this._showDialog(message, args, onContinue);
    },

    showInformation: function(message, onContinue, overrideArguments) {
        var args = this._mergeArguments(this._informationArguments, overrideArguments);
        this._showDialog(message, args, onContinue);
    },

    showSecurity: function(message, onContinue, overrideArguments) {
        var args = this._mergeArguments(this._securityArguments, overrideArguments);
        this._showDialog(message, args, onContinue);
    },

    showConfirmation: function(message, onContinue, overrideArguments, onClose) {
        var args = this._mergeArguments(this._confirmationArguments, overrideArguments);
        this._showDialog(message, args, onContinue, onClose);
    },

    onExecute: function() {
        this.inherited(arguments);
        if (typeof(this._onContinue) == "function") {
            this._onContinue();
        }
    },

    onCancel: function() {
        this.inherited(arguments);
        if (typeof(this._onClose) == "function") {
            this._onClose();
        }
    },

    afterHide: function() {
        this.inherited(arguments);
        if (this._showAgainProperty != "") {
            var _showAgainProp = this._showAgainProperty;
            if(XUICache.Host[this._setPrefix + this._showAgainProperty]) {
                _showAgainProp = this._setPrefix + this._showAgainProperty;
            }
            if(typeof(XUICache.Host[_showAgainProp]) === "function") {
                XUICache.Host.save(this._showAgainProperty, XUICache.Host[_showAgainProp](!this.notAgainNode.get("checked")));
            } else {
                XUICache.Host.save(this._showAgainProperty, !this.notAgainNode.get("checked"));
            }
        }
        if (this._msgQueue.length > 0) {
            var args = this._msgQueue.shift();
            this._showDialog(args.message, args.args, args.onContinue, args.onClose, true);
        }
    },

    _showDialog: function(message, args, onContinue, onClose, fromQueue) {
        if (!fromQueue && this.open) {
            // Queue up the message
            this._msgQueue.push({ message: message, args: args, onContinue: onContinue, onClose: onClose });
            return;
        }
        var _showAgain;
        var _showAgainProp = args.showAgainProperty;
        if(XUICache.Host[this._getPrefix + args.showAgainProperty]) {
            _showAgainProp = this._getPrefix + args.showAgainProperty;
        }
        if(typeof(XUICache.Host[_showAgainProp]) === "function") {
            _showAgain = XUICache.Host[_showAgainProp]();
        } else {
            _showAgain = XUICache.Host[_showAgainProp];
        }
        if (_showAgainProp != "" && !_showAgain) {
            // Dialog has been previously hidden
            if (typeof(onContinue) == "function") {
                onContinue();
            }
            return;
        }
        this._onContinue = onContinue || null;
        this._onClose = onClose || null;
        this._showAgainProperty = args.showAgainProperty || "";
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

    _getErrorMessage: function(error, sourceHint) {
        var message = "";
        if (error.code && sourceHint) {
            dojo.some(Object.keys(sourceHint), function(key) {
                if (sourceHint[key] == error.code) {
                    message = this._alertSource[key];
                    return true;
                }
                return false;
            }, this);
            if (message != "") {
                return message;
            }
        }
        // Set a default message and code
        message = error.message || this._alertSource.UNKNOWN;
        var code = error.code || this._alertSource.UNKNOWN;
        return this.UNKNOWN_ERROR_MASK.format(this._alertSource.UNKNOWN_ERROR, code, message);
    },

    _getText: function(text, source) {
        source = source || this;
        if (text != "" && source[text]) {
            return source[text];
        }
        return text;
    },

    _bindDijit: function(message, args) {
        this.messageNode.innerHTML = message;
        this.set("title", this._getText(args.headerText));
        this.continueButton.set("label", this._getText(args.continueText));
        this.closeButton.set("label", this._getText(args.closeText));
        this.notAgainNode.set("checked", false);
        this.iconNode.className = "left " + args.iconClass;
        this._setDisplay(".notAgain", args.showAgainProperty != "");
        this._setDisplay(this.continueButton, args.continueText != "");
        this._setDisplay(this.closeButton, args.closeText != "");
        this.set("canExecute", args.continueText != "");
        this.set("canCancel", args.closeText != "");
    }
});
});