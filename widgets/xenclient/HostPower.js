define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/HostPower",
    "dojo/text!citrix/xenclient/templates/HostPower.html",
    // Mixins
    "citrix/xenclient/_VMContainer",
    "citrix/common/Dialog",
    // Required in code
    "citrix/xenclient/VMPower"
],
function(dojo, declare, hostPowerNls, template, _vmContainer, dialog, vmPower) {
return declare("citrix.xenclient.HostPower", [_vmContainer, dialog], {

	templateString: template,

    postMixInProperties: function() {
        dojo.mixin(this, hostPowerNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
    },

    showDialog: function() {
        this.show();
        this._bindDijit();
    },

    hideDialog: function() {
        this.hide();
    },

    _bindDijit: function() {
        // If sleeping, need to determine when to hide dialog
        if (XUICache.Host.state == XenConstants.HostStates.HOST_SLEEPING) {
            var anyGuestOn = dojo.some(Object.keys(XUICache.VMs), function(key) {
                var vm = XUICache.VMs[key];
                return vm.isActive();
            }, this);

            if (!anyGuestOn) {
                this.hideDialog();
                XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
            }
        }
        this.set("title", (XUICache.Host.state == "idle") ? "" : XUICache.Host.getTranslatedState(this));
        this._setDisplay(this.containerNode, (XUICache.Host.state != "idle"));
        this._position();
    },

    _gotVMs: function(items, request) {
        dojo.forEach(items, function(item, i) {
            var vm_path = this.vmStore.getValue(item, "vm_path");
            if (typeof(this.vms[vm_path]) === "undefined") {
                this.vms[vm_path] = new vmPower({ path: vm_path });
            }
            this.addChild(this.vms[vm_path], i);
        }, this);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            // From inherited
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED: {
                // Host state has changed
                switch(XUICache.Host.state) {
                    case XenConstants.HostStates.HOST_SHUTTING_DOWN:
                    case XenConstants.HostStates.HOST_REBOOTING:
                    case XenConstants.HostStates.HOST_SLEEPING:
                    case XenConstants.HostStates.HOST_HIBERNATING: {
                        this.showDialog();
                        break;
                    }
                    case XenConstants.HostStates.HOST_IDLE: {
                        this.hideDialog();
                        XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
                        break;
                    }
                }
                break;
            }
            case XenConstants.TopicTypes.UI_VMSTATE_CHANGED: {
                // a VM state changed
                this._bindDijit();
                break;
            }
        }
        this.inherited(arguments);
    }
});
});