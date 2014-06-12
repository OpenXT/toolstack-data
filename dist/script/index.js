require([
    "dojo",
    "dojo/dom",
    "dojo/parser",
    "dojo/aspect",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    // Required in code
    "citrix/xenclient/Keyboard",
    "citrix/xenclient/AlertDialog",
    "citrix/xenclient/AlertPopup",
    "citrix/xenclient/HostPower",
    "citrix/xenclient/StartupWizard",
    // Required from index.html
    "citrix/common/ContentPane",
    "citrix/xenclient/Footer",
    "citrix/xenclient/Frame",
    "citrix/xenclient/Menus",
    "citrix/xenclient/NotificationBar",
    "citrix/xenclient/VMContainer",
    "citrix/xenclient/ZeroVMContainer",
    // DOM Ready
    "dojo/domReady!"
],
function(dojo, dom, parser, aspect, alerts, keyboard, alertDialog, alertPopup, hostPower, startupWizard) {

    // Prevent right-click context menu from appearing
    XUtils.disableContextMenu(dojo.doc);
    XUtils.preventScrolling(window);
    XUtils.preloadImages();

    // Extend VM icon array with ICA
    if (XUICache.Host.policy_create_ica_vm) {
        XenConstants.VMImages.push("images/vms/Receiver_VM.png");
    }

    // Dijits
    XUtils.loadRequires(function() {
        parser.parse();
        XUICache.messageBox = new alertDialog();
        XUICache.alerts = alerts;
        new alertPopup();
        new hostPower();
    });

    function modelFailure(event) {
        switch(event.type) {
            case XenConstants.TopicTypes.MODEL_FAILURE:
                XUICache.messageBox.showError(event.data, XenConstants.ToolstackCodes);
                break;
        }
    }
    dojo.subscribe(XUICache.Update.publish_topic, modelFailure);
    dojo.subscribe(XUICache.Host.publish_topic, modelFailure);

    // Communications
    var socket = new XenClient.UI.WebSocket(window.location.hostname, 8080);

    XUIDBus.connect(socket, function() {
        XUICache.Host.uiReady();
        XUICache.init(function() {
            function measurement() {
                // placeholder for functionality needed either on UI load or after startup wizard completed
                if(XUICache.Host.measured_boot_enabled && !XUICache.Host.measured_boot_successful) {
                    XUICache.messageBox.showSecurity(alerts.MEASURED_BOOT_FAILED);
                } else if(!XUICache.Host.measured_boot_enabled && XUICache.Host.show_msg_measured_boot) {
                    XUICache.messageBox.showSecurity(alerts.MEASURED_BOOT_DISABLED, undefined, {showAgainProperty: "show_msg_measured_boot"});
                }
            }
            if(XUICache.Host.isDeferred()) {
                var wiz = new startupWizard();
                aspect.after(wiz, "onHide", measurement);
                wiz.show();
            } else {
                measurement();
            }
            if(XenConstants.Defaults.KEYBOARD) {
                XUICache.Host.keyboard = new keyboard();
            }
            // load plugins
            dojo.forEach(XUICache.Host.plugins, function(plugin) {
                if(new RegExp(".js$").test(plugin)) {
                    var name = plugin.substr(0, plugin.length - 3);
                    try {
                        require(["plugins/" + name]);
                        xc_debug.log("plugin {0} loaded successfully".format(name));
                    } catch(e) {
                        xc_debug.log("error loading plugin {0}".format(name));
                    }
                }
            }, this);
        });
    });
});

// Event Registration
XUICache.onAddVM(function(vm) {
    var uuid = vm.vm_path;

    // Extensions
    if(vm.isUserVM()) {
        vm.startNotifyAction = function(success) {
            XUICache.messageBox.showTip(XUICache.alerts.CTRL_SWITCH, success, { showAgainProperty: "show_msg_on_vm_start" });
        };
        vm.startMultipleAction = function(success) {
            XUICache.messageBox.showWarning(XUICache.alerts.SEVERAL_VMS, success, { showAgainProperty: "show_msg_on_vm_start_tools_warning" });
        };
    }

    // Events
    dojo.subscribe(vm.publish_topic, function(event) {
        switch(event.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
                XUtils.publish(XenConstants.TopicTypes.UI_VMSTATE_CHANGED, vm);
                break;
            case XenConstants.TopicTypes.MODEL_PROPERTY_CHANGED:
                if (event.data === "slot") {
                    // slot has changed
                    XUtils.publish(XenConstants.TopicTypes.UI_VMSLOT_CHANGED, vm);
                } else if (event.data === "name") {
                    XUtils.publish(XenConstants.TopicTypes.UI_VMNAME_CHANGED, vm);
                }
                break;
            case XenConstants.TopicTypes.MODEL_FAILURE:
                if (event.data.code == XenConstants.ToolstackCodes.VM_UNEXPECTED_SHUTDOWN_REASON) {
                    // stealth hijack
                    return;
                }
                XUICache.messageBox.showError(event.data, XenConstants.ToolstackCodes);
                break;
        }
    });
});

XUICache.onAddNDVM(function(vm) {
    // Events
    dojo.subscribe(vm.publish_topic, function(event) {
        switch(event.type) {
            case XenConstants.TopicTypes.MODEL_PROPERTY_CHANGED:
                if (event.data === "name") {
                    // slot has changed
                    XUtils.publish(XenConstants.TopicTypes.UI_NDVMNAME_CHANGED, vm);
                }
                break;
            case XenConstants.TopicTypes.MODEL_FAILURE:
                if (event.data.code == XenConstants.ToolstackCodes.VM_UNEXPECTED_SHUTDOWN_REASON) {
                    // stealth hijack
                    return;
                }
                XUICache.messageBox.showError(event.data, XenConstants.ToolstackCodes);
                break;
        }
    });
});
