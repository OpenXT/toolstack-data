define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Authentication",
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    "dojo/text!citrix/xenclient/templates/Authentication.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Contained",
    "dijit/_CssStateMixin",
    "citrix/common/_CitrixWidgetMixin",
    // Required in template
    "citrix/common/ValidationTextBox"
],
function(dojo, declare, authNls, alertsNls, template, _widget, _templated, _contained, _cssStateMixin, _citrixWidgetMixin) {
return declare("citrix.xenclient.Authentication", [_widget, _templated, _contained, _cssStateMixin, _citrixWidgetMixin], {

    templateString: template,
    widgetsInTemplate: true,
    errorCount: 0,
    errorTimeout: 15, // Seconds to keep the user waiting after 3 or more failed logins

    postMixInProperties: function() {
        dojo.mixin(this, authNls);
        this.INTERNAL_ERROR = alertsNls.INTERNAL_ERROR;
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this._setup();
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.input", this._messageHandler);
    },

    _setup: function() {
        // necessary to avoid full selecting text in field we tabbed into
        dojo.query("input").onfocus(function(event) {
            setTimeout(function() { event.target.value = event.target.value }, 1);
        });

        this._setDisplay(".hidden", false);
        this._resetValues();
    },

    _setContext: function() {
        // Get flags
        XUICache.Host.authGetContext(dojo.hitch(this, function(stuff, cruft, flags) {
            xc_debug.log("Auth received flags: {0}", flags.toString());
            this._setDisplay(this.passwordContainer, true);
            if (flags) {

                // we're changing local password
                if (flags & XenConstants.AuthFlags.CHANGE_LOCAL_PW) {
                    this._setDisplay(this.oldPasswordContainer, true);
                    this.passwordLabel.innerHTML = this.NEW_PASSWORD_LABEL;
                }

                // requires password confirm
                if (flags & XenConstants.AuthFlags.CONFIRM_PW) {
                    this._setDisplay(this.confirmContainer, true);
                }

                // NOT cannot escape/cancel
                if (~flags & XenConstants.AuthFlags.CANNOT_CANCEL) {
                    this._setDisplay(this.escapeNode, true);
                } else {
                    this._setDisplay(this.enterNode, true);
                }

                // NOT remote user
                if (~flags & XenConstants.AuthFlags.REMOTE_USER) {
                    this._setDisplay(this.usernameNode, false);
                    this._setDisplay(this.localUsernameNode, true);
                }

                // NOT setting root password
                if (~flags & XenConstants.AuthFlags.SET_ROOT_PW) {
                    this._setDisplay(this.usernameContainer, true);
                }
            }
        }));
    },
    
    _resetValues: function() {
        this.oldPasswordNode.set("value", "");
        this.passwordNode.set("value", "");
        this.confirmNode.set("value", "");
    },

    _handleStatus: function(params) {
        var status = params[0];
        if (status == "ok") {
            this.errorCount = 0;
        } else if (status == "in_progress") {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
        } else {

            // We have a problem, houston
            var flags = params[1];
            xc_debug.log("Auth received {0}", status);
            
            var handleStatus = dojo.hitch(this, function() {
                switch(status) {
                    case "need_credentials": {
                        if (flags & XenConstants.AuthFlags.REMOTE_PASSWORD_EXPIRED) {
                            this._handleError(this.AUTH_PASSWORD_EXPIRED, this.AUTH_CONTACT_ADMIN);
                        }
                        else if (flags & XenConstants.AuthFlags.REMOTE_ACCOUNT_LOCKED) {
                            this._handleError(this.AUTH_ACCOUNT_LOCKED, this.AUTH_CONTACT_ADMIN);
                        }
                        else if (flags & XenConstants.AuthFlags.REMOTE_ACCOUNT_DISABLED) {
                            this._handleError(this.AUTH_ACCOUNT_DISABLED, this.AUTH_CONTACT_ADMIN);
                        }
                        else {
                            this._handleError(this.AUTH_CREDENTIALS_WRONG);
                        }                
                        break;
                    }
                    case "confirm_failed": {
                        this._handleError(this.AUTH_CONFIRM_FAILED);
                        break;
                    }
                    case "internal_error": {
                        this._handleError(this.INTERNAL_ERROR);
                        break;
                    }
                    case "need_password": {
                        this._handleError(this.AUTH_PASSWORD_REQUIRED);
                        break;
                    }
                    case "not_exist": {
                        this._handleError(this.AUTH_NOT_EXIST);
                        break;
                    }
                    case "recovery_key_invalid": {
                        this._handleError(this.AUTH_RECOVERY_KEY_INVALID);
                        break;
                    }
                    case "no_userid":
                    case "invalid_activation_id":
                    case "invalid_registration_pin": {
                        this._handleError(this.AUTH_CREDENTIALS_WRONG);
                        break;
                    }
                    case "not_device_owner": {
                        this._handleError(this.AUTH_NOT_DEVICE_OWNER);
                        break;
                    }
                    case "no_recovery_key": {
                        this._handleError(this.AUTH_NO_RECOVERY_KEY);
                        break;
                    }
                    case "ssl_cacert_error": {
                        this._handleError(this.AUTH_SSL_CACERT_ERROR);
                        break;
                    }
                    case "user_cancel": {
                        break;
                    }
                    default: {
                        this._handleError(this.INTERNAL_ERROR);
                        break;
                    }
                }
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
                this._resetValues();
            });

            this.errorCount ++;
            if (this.errorCount >= 3) {
                // Delay the user for 3rd attempt or more (NXT-15767)
                setTimeout(handleStatus, this.errorTimeout*1000);
            } else {
                handleStatus();
            }
        }
    },

    _handleError: function(message1, message2) {
        message2 = message2 || this.AUTH_PLEASE_TRY_AGAIN;
        var html = "<strong>{0}</strong> {1}".format(message1, message2);
        this.errorNode.innerHTML = html;
        this._setDisplay(this.errorBox, true);
    },
    
    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.UI_READY: {
                this._setContext();
                break;
            }
            case "sync_auth_username": {
                var username = message.data[0];
                this.usernameNode.set("value", username);
                this.localUsernameNode.innerHTML = username;
                break;
            }
            case "focus_auth_field": {
                var fieldId = message.data[0];
                switch (fieldId) {
                    case 0:
                        this.usernameNode.focus();
                        break;
                    case 1:
                        this.passwordNode.focus();
                        break;
                    case 2:
                        this.confirmNode.focus();
                        break;
                    case 3:
                        this.oldPasswordNode.focus();
                }
                break;
            }
            case "auth_status": {
                this._handleStatus(message.data);
                break;
            }
        }
    }
});
});