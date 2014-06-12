define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/xenclient/templates/AlertPopup.html",
    // Mixins
    "citrix/common/AlertPopup"
],
function(dojo, declare, template, alertPopup) {
return declare("citrix.xenclient.AlertPopup", [alertPopup], {

    templateString: template,

    _defaultArguments: {
        headerText: "",
        iconClass: ""
    },

    _errorArguments: {
        iconClass: "alertIcon alertIconLarge alertIconError"
    },

    _warningArguments: {
        iconClass: "alertIcon alertIconLarge alertIconWarning"
    },

    _informationArguments: {
        iconClass: "alertIcon alertIconLarge alertIconInformation"
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
    },

    showPopup: function(data) {
        if (typeof(data) === "string") {
            data = [data];
        }

        var overrideArguments = {};
        var extra = data[1];
        if (extra) {
            if (this[extra]) {
                // Specifiying specific argument object above
                overrideArguments = this[extra];
            } else {
                overrideArguments.headerText = extra;
            }
        }

        var args = this._mergeArguments(this._warningArguments, overrideArguments);
        this._showDialog(data[0], args);
    },

    _bindDijit: function(message, args) {
        this.set("title", args.headerText);
        this.messageNode.innerHTML = message;
        this.iconNode.className = "left " + args.iconClass;
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.UI_SHOW_POPUP: {
                this.showPopup(message.data);
                break;
            }
            case XenConstants.TopicTypes.UI_HIDE_POPUP: {
                this.hide();
                break;
            }
        }
    }
});
});