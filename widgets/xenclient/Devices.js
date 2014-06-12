define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Devices",
    "dojo/text!citrix/xenclient/templates/Devices.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    // Required in template
    "citrix/common/Button",
    "citrix/common/Repeater",
    "citrix/common/BoundWidget",
    "citrix/common/BoundContainer",
    "citrix/common/Select"
],
function(dojo, declare, nls, template, dialog, _boundContainerMixin, _citrixTooltipMixin) {
return declare("citrix.xenclient.Devices", [dialog, _boundContainerMixin, _citrixTooltipMixin], {

    templateString: template,
    widgetsInTemplate: true,

    constructor: function(args) {
        this.host = XUICache.Host;
    },

    postMixInProperties: function() {
        dojo.mixin(this, nls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this._bindDijit();
    },

    show: function() {
        this.inherited(arguments);
        // Refresh when opening dialog
        this.host.refresh();
    },

    save: function() {
        var forcedDevices = [];
        var usbCDAssigned = false;
        var values = this.unbind();

        dojo.forEach(XUICache.Host.available_cds, function(cdrom) {
            dojo.some(values.cdromDevices, function(device) {
                // Find the matching device
                if (cdrom.id == device.id) {

                    // Has the assignment changed?
                    if (cdrom.vm != device.vm) {
                        var path, vm;

                        // Check for devices being unassigned from running VMs
                        if (cdrom.vm != "") {
                            path = XUtils.uuidToPath(cdrom.vm);
                            vm = XUICache.VMs[path];
                            if (vm.isRunning()) {
                                forcedDevices.push(this.ASSIGNED_CDROM.format(cdrom.name, vm.name));
                            }
                        }

                        // Check for USB CD-ROMs being assigned to running VMs
                        if (!usbCDAssigned && cdrom["usb-id"] != "" && device.vm != "") {
                            path = XUtils.uuidToPath(device.vm);
                            vm = XUICache.VMs[path];
                            if (vm.isRunning()) {
                                usbCDAssigned = true;
                            }                            
                        }
                    }

                    return true;
                }
            }, this);
        }, this);

        dojo.forEach(values.usbDevices, function(device) {
            var usb = XUICache.Host.usbDevices[device.dev_id];
            // Only interested in assigned devices on running VMs
            if (usb.assigned_uuid != "") {
                var path = XUtils.uuidToPath(usb.assigned_uuid);
                var vm = XUICache.VMs[path];
                // Has user changed the assignment?
                if (vm.isRunning() && device.assigned_uuid != usb.assigned_uuid) {
                    forcedDevices.push(this.ASSIGNED_USB.format(device.name, vm.name));
                }
            }
        }, this);

        var complete = dojo.hitch(this, function complete() {
            this.saveValues(this.host, values, dojo.hitch(this, function() {
                XUICache.Host.publish(XenConstants.TopicTypes.MODEL_USB_CHANGED);

                if (usbCDAssigned) {
                    XUICache.messageBox.showInformation(this.ASSIGNED_USB_CD);
                }

            }));
        });
        
        if (forcedDevices.length > 0) {
            // Confirm stealing device from another VM
            var message = this.DEVICE_FORCE_REASSIGN.format(forcedDevices.join("<br/>"));
            XUICache.messageBox.showConfirmation(message, complete);
        } else {
            complete();
        }
    },

    onEject: function(event) {
        var deviceID = this._getDeviceID(event.target);
        XUICache.Host.ejectCD(deviceID);
    },

    _getDeviceID: function(node) {
        return new dojo.NodeList(node).parents("tr").first()[0].getAttribute("deviceId");
    },

    _bindDijit: function() {
        this._setupMaps();        
        this.bind(this.host);
        this._onCDChange();
        this._onUSBChange();
        var node = dijit.getFirstInTabbingOrder(this.domNode);

        if(node) {
            node.focus();
        }
        this.inherited(arguments);
    },

    _setupMaps: function() {
        // VMs
        var cdMap = [];
        var usbMap = [];

        dojo.forEach(Object.keys(XUICache.VMs), function(key) {
            var vm = XUICache.VMs[key];
            cdMap.push({ "label": vm.name, "value": vm.uuid });
            usbMap.push({ "label": vm.name, "value": vm.uuid, "disabled": !vm.canAddDevice() });
        }, this);

        cdMap.unshift({ "label": this.NONE, "value": "" });
        usbMap.unshift({ "label": this.NONE, "value": "" });

        this.cdromDevices.setOptions("cdVMList", cdMap);
        this.usbDevices.setOptions("usbVMList", usbMap);
    },

    _onCDChange: function() {
        dojo.forEach(XUICache.Host.available_cds, function(cdrom) {
            this._setControls(cdrom.id, "cd");
        }, this);
    },

    _onUSBChange: function() {
        dojo.forEach(XUICache.Host.get_usbDevices(), function(usb) {
            this._setControls(usb.dev_id, "usb");
        }, this);        
    },

    _setControls: function(deviceID, prefix) {
        var check = dijit.byId(prefix + "_check_" + deviceID);
        var select = dijit.byId(prefix + "_select_" + deviceID);

        if (check && select) {
            if (select.value == "") {
                this._setEnabled(check, false);
                check.set("checked", false);
            } else {
                this._setEnabled(check, true);
                this._setEnabled(select, !check.checked);
            }
        }
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_USB_CHANGED: {
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.UI_VMS_LOADED:
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED:
            case XenConstants.TopicTypes.UI_VMSTATE_CHANGED:
            case XenConstants.TopicTypes.UI_VMNAME_CHANGED: {
                this._setupMaps();
                break;
            }            
        }
    }
});
});