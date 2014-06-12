define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    "dojo/i18n!citrix/xenclient/nls/StartupWizard",
    "dojo/text!citrix/xenclient/templates/StartupWizard.html",
    // Mixins
    "citrix/xenclient/_Wizard",
    // Required in template
    "citrix/common/WizardContainer",
    "citrix/common/WizardPage",
    "citrix/common/Select",
    "citrix/common/Repeater",
    "citrix/common/RadioButton",
    "citrix/common/WizardNavigator"
],
function(dojo, declare, alertsNls, startupWizardNls, template, _wizard) {
return declare("citrix.xenclient.StartupWizard", [_wizard], {

    templateString: template,

    wizardId: "StartupWizard",
    canCancel: false,

    postMixInProperties: function() {
        dojo.mixin(this, startupWizardNls);

        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);

        this.languagePage.onNextFunction = dojo.hitch(this, this._onLanguagePageNext);
        this.eulaPage.onStartFunction = dojo.hitch(this, this._onEulaPageStart);
        this.eulaPage.onNextFunction = dojo.hitch(this, this._onEulaPageNext);
        this.keyboardPage.onNextFunction = dojo.hitch(this, this._onKeyboardPageNext);
        this.passwordPage.onStartFunction = dojo.hitch(this, this._onPasswordPageStart);
    },

    _toolstackError: function(error) {
        XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
    },

    startup: function() {
        this.inherited(arguments);

        // only display this for EULA
        this._setDisplay(this.navigationNode.cancelButton, false);

        if(!XUICache.Host.deferred_language.bool()) {
            this.wizard.closeChild(this.languagePage);
        } else {
            if(XUICache.Host.supported_languages.length <= 1) {
                XUICache.Host.setInstallState("language-set", dojo.hitch(this, function() {
                    this.wizard.closeChild(this.languagePage);
                }), this._toolstackError);
            } else {
                var languageMap = dojo.map(XUICache.Host.supported_languages, function(language) {
                    var opt = {};
                    opt["value"] = language;
                    opt["label"] = this["LANGUAGE_" + language.substring(3).toUpperCase()];
                    return opt;
                }, this);

                this.languageSelect.set("options", languageMap);
                this.languageSelect.set("value", XUICache.Host.language == "" ? languageMap[0].value : XUICache.Host.language);
            }
        }
        if(!XUICache.Host.deferred_eula.bool()) {
            this.wizard.closeChild(this.eulaPage);
            this._setButtonsForEula(false);
        } else {
            XUICache.Host.getEULA(
                dojo.hitch(this, function(result) {
                    this.eulaContent.innerHTML = result;
                }),
                this._toolstackError
            );
        }
        if (!XUICache.Host.deferred_keyboard.bool()) {
            this.wizard.closeChild(this.keyboardPage);
        } else {
            this.kbRepeater.set(
                "value",
                dojo.map(XUICache.Host.keyboard_layouts, dojo.hitch(this, function(item) {
                    return {"id": item, "label": this["KEYBOARD_LAYOUT_" + item.toUpperCase().replace(/-/g, "_")]};
                }))
            );
            var children = this.kbRepeater.getChildren();
            if(children && children.length > 0) {
                children[0].set("checked", true);
                if(this.keyboardPage.selected) {
                    children[0].focus();
                }
            }
        }
        if (!XUICache.Host.deferred_password.bool()) {
            this.wizard.closeChild(this.passwordPage);
        }
    },

    onCancel: function() {
        this.inherited(arguments);

        // Can only cancel on EULA page, and if you do this is the result.
        XUICache.Host.shutdown();
    },

    onExecute: function() {
        this.inherited(arguments);

        // refresh the Host so that the deferred properties are cleared
        XUICache.Host.refresh();
    },

    _setButtonsForEula: function(/*boolean*/ value) {
        this.navigationNode.set("nextLabel", value ? this.ACCEPT_ACTION : this.NEXT_ACTION);
        this.navigationNode.set("finishLabel", value ? this.ACCEPT_ACTION : this.FINISH_ACTION);
        this._setDisplay(this.navigationNode.cancelButton, value);
    },

    _onEulaPageStart: function() {
        this._setButtonsForEula(true);
    },

    _onEulaPageNext: function(finish) {
        XUICache.Host.setInstallState(
            "eula-accepted",
            dojo.hitch(this, function() {
                this._setButtonsForEula(false);
                finish();
            }),
            this._toolstackError
        );
    },

    _onKeyboardPageNext: function(finish) {
        var result = this.unbind();
        XUICache.Host.save(
            "keyboard_layout",
            result.keyboard,
            dojo.hitch(this, function() {
                XUICache.Host.setInstallState(
                    "kb-layout-set",
                    finish,
                    this._toolstackError
                );
            }),
            this._toolstackError
        );
    },

    _onLanguagePageNext: function(finish) {
        var result = this.unbind();
        XUICache.Host.setInstallState("language-set", dojo.hitch(this, function() {
            if(XUICache.Host.language != result.language) {
                XUICache.Host.save("language", result.language, finish, this._toolstackError);
            } else {
                finish();
            }
        }), this._toolstackError);
    },

    _onPasswordPageStart: function() {
        var flags = XenConstants.AuthFlags.SET_ROOT_PW | XenConstants.AuthFlags.CONFIRM_PW | XenConstants.AuthFlags.CANNOT_CANCEL;
        XUICache.Host.authSetContextFlags("", "", flags,
            dojo.hitch(this, function() {
                XUtils.publish(XenConstants.TopicTypes.UI_SHOW_POPUP, [this.SET_SYSTEM_PASSWORD + "<br/>" + alertsNls.AUTH_START, alertsNls.AUTH_START_HEADING]);
                // login returns straight away
                this.subscribe("com.citrix.xenclient.input", dojo.hitch(this, function(obj) {
                    switch(obj.type) {
                        case "auth_status":
                            this.onExecute();
                            break;
                    }
                }));
            }),
            this._toolstackError
        );
    }
});
});