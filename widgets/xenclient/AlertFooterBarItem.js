define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    // Mixins
    "citrix/common/FooterBarItem"
],
function(dojo, declare, alertsNls, footerBarItem) {
return declare("citrix.xenclient.AlertFooterBarItem", [footerBarItem], {

    messages: {},
    _messageCount: 0,
    _defaultTimeout: 60000, // 1 minute
    _defaultSeverity: 0, // 0=Information, 1=Warning, 2=Error
    _iconClass: "alertIcon alertIconSmall citrixMenuBarAlert alertIcon",

    postMixInProperties: function() {
        dojo.mixin(this, alertsNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this._setDisplay(this.focusNode, false);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(XUICache.Update.publish_topic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.xenmgr.host", this._messageHandler);
        this.subscribe("com.citrix.xenclient.xenmgr.guestreq", this._messageHandler);
        this.subscribe("com.citrix.xenclient.bed.notify.vm", this._messageHandler);
    },

    showKnownMessage: function(type, args, timeout, severity, id) {
        // Only show messages we have an entry for
        if (this[type]) {
            this.showMessage(this[type].format(args), timeout, severity, id);
        }
    },

    showMessage: function(message, timeout, severity, id) {
        timeout = timeout || this._defaultTimeout;
        severity = severity || this._defaultSeverity;
        id = id || "message_" + this._messageCount;

        this._messageCount++;

        if (this.messages[id]) {
            // Message already exists
            if (this.messages[id].handle != null) {
                clearTimeout(this.messages[id].handle);
            }
        }

        var handle = setTimeout(dojo.hitch(this, function() {
            if (this.messages[id].handle != null) {
                clearTimeout(this.messages[id].handle);
            }
            delete this.messages[id];
            this.showMessages();
        }), timeout);

        this.messages[id] = {message: message, severity: severity, handle: handle};
        this.showMessages(true);
    },

    showMessages: function(newMessage) {
        var messageCount = Object.keys(this.messages).length;

        if (messageCount > 0) {

            var html = "";
            var severity = 0;

            for (var i = 0; i < messageCount; i++) {
                if (i > 0) {
                    html += "<hr class='horizontalSeparator'>";
                }

                var key = Object.keys(this.messages)[i];
                html += this.messages[key].message;

                if (this.messages[key].severity > severity) {
                    severity = this.messages[key].severity;
                }
            }

            switch(severity) {
                case 0: {
                    this.set("iconClass", this._iconClass + "Information");
                    break;
                }
                case 1: {
                    this.set("iconClass", this._iconClass + "Warning");
                    break;
                }
                case 2: {
                    this.set("iconClass", this._iconClass + "Error");
                    break;
                }
            }

            this._tooltip.label = html;
            this._setDisplay(this.focusNode, true);

            if (newMessage || this._tooltip.isOpen) {
                this._tooltip.close();
                this._tooltip.open(this.iconNode);
            }
        } else {
            this._tooltip.close();
            this._setDisplay(this.focusNode, false);
        }
    },

    _uuidToName: function(uuid) {
        var name = null;
        var path = XUtils.uuidToPath(uuid);
        var vm = XUICache.getVM(path);

        if (vm) {
            name = vm.name;
        }

        return name;
    },

    _messageHandler: function(message) {
        switch(message.type) {
            // Known messages
            case XenConstants.TopicTypes.BATTERY_CRITICAL: {
                this.showKnownMessage(message.type, message.data, this._defaultTimeout, 1, -101);
                break;
            }            
            case "requested_attention": {
                var path = message.data[1];
                var vm = XUICache.ServiceVMs[path];
                if (vm) {
                    this.showKnownMessage("servicevm_requested_attention", [vm.name, vm.slot], this._defaultTimeout, 0, -200 - (vm.slot));
                    break;
                }
                vm = XUICache.VMs[path];
                if (vm) {
                    this.showKnownMessage("uservm_requested_attention", [vm.name, vm.slot], this._defaultTimeout, 0, -200 - (vm.slot));
                }
                break;
            }
            case "storage_space_low": {
                this.showKnownMessage(message.type, message.data, this._defaultTimeout, 1, -103);
                break;
            }
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED: {
                if (XUICache.Update.state == XenConstants.UpdateStates.DOWNLOADED_FILES) {
                    this.showKnownMessage("platform_update_ready");
                }
                break;
            }
            case "vm_updated_reboot_required":
            case "vm_updated_clean_reboot_required": {
                var args = message.data;
                args[0] = this._uuidToName(args[0]);
                this.showKnownMessage(message.type, args);
                break;
            }
            case "vm_lease_near_expiry": {
                var args = message.data;
                args[0] = this._uuidToName(args[0]);
                this.showKnownMessage(message.type, args, this._defaultTimeout, 1);
                break;
            }
            // Unknown messages
            case "generic_message": {
                // Of the form:
                // string: "heading"
                // string: "body"
                // int32: timeout (optional)
                // int16: severity (optional)
                // string: "id" (optional)
                // int16: percent (optional)
                var args = message.data;

                if (typeof(args[5]) === "number") {
                    var percent = args[5];
                    percent = Math.max(percent, 0);
                    percent = Math.min(percent, 100);
                    var msg = this.GENERIC_PROGRESS_MESSAGE.format(args[0], args[1], percent);
                } else {
                    var msg = this.GENERIC_MESSAGE.format(args[0], args[1]);
                }

                this.showMessage(msg, args[2], args[3], args[4]);
                break;
            }
        }
    }
});
});
