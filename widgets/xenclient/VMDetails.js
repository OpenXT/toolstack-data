define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/VMDetails",
    "dojo/i18n!citrix/xenclient/nls/VM",
    "dojo/text!citrix/xenclient/templates/VMDetails.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_EditableMixin",
    "citrix/common/_CitrixTooltipMixin",
    //Required in code
    "citrix/xenclient/AddNic",
    "citrix/xenclient/AddDisk",
    "citrix/xenclient/ConnectDevice",
    "citrix/xenclient/ConnectPCI",
    "citrix/xenclient/RestoreSnapshot",
    "citrix/common/ItemFileReadStore",
    "citrix/common/EditableWidget",
    "citrix/common/Label",
    "citrix/common/BoundWidget",
    "dojo/dom-construct",
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/ImageButton",
    "citrix/common/TabContainer",
    "citrix/common/ContentPane",
    "citrix/common/ValidationTextBox",
    "citrix/common/Select",
    "citrix/common/ValidationTextarea",
    "citrix/common/Repeater",
    "citrix/common/NumberSpinner",
    "citrix/common/asmSelect",
    "citrix/common/ImageSelect",
    "citrix/common/Button",
    "citrix/common/ProgressBar",
    "citrix/common/CheckBox"
],
function(dojo, declare, vmDetailsNls, vmNls, template, dialog, _boundContainerMixin, _editableMixin, _citrixTooltipMixin, addNic, addDisk, connectDevice, connectPCI, restoreSnapshot, itemFileReadStore, editableWidget, label, boundWidget, domConstruct) {
return declare("citrix.xenclient.VMDetails", [dialog, _boundContainerMixin, _editableMixin, _citrixTooltipMixin], {

	templateString: template,
    widgetsInTemplate: true,
    destroyOnHide: true,

    constructor: function(args) {
        this.path = args.path;
        this.vm = XUICache.getVM(this.path);
        this.host = XUICache.Host;
        // Refresh when opening dialog
        this.vm.refresh();
    },

    postMixInProperties: function() {
        dojo.mixin(this, vmDetailsNls);
        dojo.mixin(this, XenConstants);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.xenmgr", this._messageHandler);
        this._createCustomFields();
        this._bindDijit();
        if (this.vm.policy_modify_vm) {
            this.edit();
        }
        if(this.vm.isServiceVM()) {
            this.tabContainer.closeChild(this.iconPage);
        } else {
            this.image_path.set("source", this.host.available_vmimages);
        }
        this.connect(dojo.doc, "onblur", this._onBlur);
    },

    edit: function() {
        this.inherited(arguments);
        this._descendantAction("edit");
        this._updateButtons();
        this.refreshResources();
	},

    save: function() {
        this.inherited(arguments);
        this._updateButtons();
        this._descendantAction("save");

        var values = this.unbind();
        if (values.policy_audio_access === false) {
            values.policy_audio_recording = false;
        }
        this.saveValues(this.vm, values, dojo.hitch(this, function() {
            if (typeof(values.gpu) !== "undefined" && values.gpu) {
                XUICache.messageBox.showWarning(this.THREED_ENABLED);
            }
            if (typeof(values.amt_pt) !== "undefined" && values.amt_pt) {
                XUICache.messageBox.showInformation(this.INTEL_AMT);
            }

            var state = this.vm.getState();

            if (!(state == XenConstants.VMStates.VM_STOPPED || state == XenConstants.VMStates.VM_SUSPENDED)) {
                if (typeof(values.memory) !== "undefined") {
                    XUICache.messageBox.showInformation(this.MEMORY_CHANGE);
                }
                if (typeof(values.vcpus) !== "undefined") {
                    XUICache.messageBox.showInformation(this.VCPU_CHANGE);
                }
            }
        }));
	},

	cancel: function() {
        this.inherited(arguments);
        this._updateButtons();
        this._descendantAction("cancel");
	},

    refreshResources: function() {
        this.host.refreshResources(dojo.hitch(this, function() {
            this.systemMemoryNode.set("value", [this.host.total_mem, this.host.free_mem]);
        }));
    },

    _startVM: function(action) {
        if(this.vm.get_virtualDisks().length > 0) {
            this._vmAction(action);
        } else {
            XUICache.messageBox.showConfirmation(this.START_VM_NO_DISKS.format(this.vm.name), dojo.hitch(this, function() {
                this._vmAction(action);
            }), {
                headerText: this.START_VM_NO_DISKS_HEADER,
                continueText: this.ACCEPT_START,
                closeText: "NO_ACTION",
                showAgainProperty: "show_msg_on_no_disk"
            });
        }
    },

    onStart: function() {
        this._startVM("start");
    },

    onBackground: function() {
        this._startVM("background_start");
    },

    onWake: function() {
        this._vmAction("switchTo");
    },

    onSwitch: function() {
        this._vmAction("switchTo");
    },

    onStop: function() {
        this._vmAction("shutdown");
    },

    onForceStop: function() {
        this._vmAction("force_shutdown");
    },

    onReboot: function() {
        this._vmAction("reboot");
    },

    onSleep: function() {
        this._vmAction("sleep");
    },

    onHibernate: function() {
        this._vmAction("suspend");
    },

    onLogin: function() {
        this._vmAction("local_login");
    },

    onAddDevice: function() {
        var popup = new connectDevice({ path: this.vm.vm_path });
        popup.show();
    },

    onDelete: function() {
        var vm = this.vm;
        var popup = this;
        XUICache.messageBox.showConfirmation(this.DELETE_VM.format(vm.name), function() {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
            popup.onCancel();
            vm.deleteVM(function() {
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            }, function(error) {
                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            });
        },
            {
                headerText: this.DELETE_VM_HEADER,
                continueText: this.ACCEPT_DELETE,
                closeText: "NO_ACTION"
            }
        );
    },

    onPauseTransfer: function() {
        this._transferAction("pause_transfer");
    },

    onResumeTransfer: function() {
        this._transferAction("resume_transfer");
    },

    onRetryTransfer: function() {
        //not functional yet
        // this._transferAction("retry_transfer");
    },

    onCancelTransfer: function() {
        this._transferAction("cancel_transfer");
    },

    onUsbDetach: function(event) {
        var id = this._getDeviceID(event.target);
        var usb = this.vm.usbDevices[id];
        var disconnect = function() {
            this.vm.unassignUsbDevice(id, undefined, function(error) {
                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
            });
        };
        if ([4, 5].contains(usb.state)) {
            XUICache.messageBox.showConfirmation(this.USB_UNASSIGN, dojo.hitch(this, disconnect));
        } else if (usb.state == 6) {
            // Device in use and VM is NOT running
            disconnect.call(this);
        }
    },

    onNicAdd: function() {
        var popup = new addNic({ path: this.vm.vm_path });
        popup.show();
    },

    onNicDelete: function(event) {
        var path = this._getDeviceID(event.target);
        var nic = this.vm.nics[path];
        var vm = this.vm;
        var deleteNic = function() {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
            var finish = function() {
                vm.refresh();
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            };
            var errorFn = function(error) {
                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
            };
            if (nic) {
                nic.delete_(finish, errorFn);
            }
        };
        XUICache.messageBox.showConfirmation(this.NIC_DELETE_CONFIRM, deleteNic);
    },

    onDiskAdd: function() {
        var popup = new addDisk({ vm_path: this.vm.vm_path });
        popup.show();
    },

    onDiskDelete: function(event) {
        var path = this._getDeviceID(event.target);
        var disk = this.vm.disks[path];
        var vm = this.vm;
        var deleteDisk = function() {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
            var finish = function() {
                vm.refresh();
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            };
            var errorFn = function(error) {
                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
            };
            disk.delete_(finish, errorFn);
        };
        XUICache.messageBox.showConfirmation(vmDetailsNls.DISK_DELETE_CONFIRM, deleteDisk, {});
    },

    onTakeSnapshot: function(event) {
        var path = this._getDeviceID(event.target);
        var disk = this.vm.disks[path];

        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
        var finish = function() {
            XUICache.messageBox.showInformation(vmDetailsNls.CONFIRM_SNAPSHOT);
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
        };
        var errorFn = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };
        disk.takeSnapshot(finish, errorFn);
    },

    onRestoreSnapshot: function(event) {
        var path = this._getDeviceID(event.target);
        var popup = new restoreSnapshot({ vm_path: this.vm.vm_path, disk_path: path });
        popup.show();        
    },

    onAudioChange: function(value) {
        this._setEnabled(this.audioRecordingNode, value);
        if(!value) {
            this.audioRecordingNode.set("value", value);
        }
    },

    onPciAdd: function() {
        var popup = new connectPCI({ path: this.vm.vm_path });
        popup.show();
    },

    onPciDelete: function(event) {
        var id = this._getDeviceID(event.target);
        var remove = function() {
            this.vm.removePciDevice(id, undefined, function(error) {
                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
            });
        };
        XUICache.messageBox.showConfirmation(this.PCI_UNASSIGN, dojo.hitch(this, remove));
    },

    onHardwareTabShow: function() {
        //this.vm.refreshDiskUsage();
    },

    onDisksTabShow: function() {
        this.vm.refreshDisks();
    },

    _setStateAttr: function(value) {
        this._setEnabled(this.saveButton, !value);
    },

    _descendantAction: function(action) {
        dojo.forEach(this.getDescendants(), function(widget){
            if(widget[action] && typeof(widget[action]) == "function") {
                widget[action]();
            }
        });
    },

    _bindDijit: function() {
        // Comments depict memory leftover after VM download when dialog open (O) and closed (C)
        this.bind(this.vm); // O: 1.4, C: 1.9
        this._binding = true;
        this.set("title", dojo.replace("{0} ({1})", [this.vm.truncatedName(45), this.vm.getTranslatedState(vmNls)]));
        this._updateActions();
        this._updateMoreActions();
        this._updateButtons(); // O: 0.1, C: 0.4
        this._updateMaps(); // O: 0.0, C: 0.3
        this._updateProgress(); // O: 0.1, C: 0.5
        this._updateTooltips();
        this._updateRest(); // O: 0.0, c: 0.5
        this._updateSlotSelect(); // O: 5.6, C: 0.0
        this._updateNativeMode();
        this.onAudioChange(this.vm.policy_audio_access);
        this._binding = false;
        this.inherited(arguments);
    },

    _updateActions: function(shiftDown) {
        var actions = ["start", "background", "wake", "switch", "shutdown", "force_shutdown", "reboot", "suspend", "sleep", "local_login"];
        var allowedActions = this.vm.detailedVMActions();
        if (shiftDown) {
            for (var i = 0; i < allowedActions.length; i++) {
                if (allowedActions[i] == "start") {
                    allowedActions[i] = "background";
                }
                if (allowedActions[i] == "shutdown") {
                    allowedActions[i] = "force_shutdown";
                }
            }
        }
        dojo.forEach(actions, function(action) {
            this._setDisplay(this[action + "Action"], allowedActions.contains(action));
            this._setEnabled(this[action + "Action"], !this.vm.powerClicked);
        }, this);
        
        if(!this.vm.isUserVM()) {
            this._setDisplay(".userVmOnly", false);
            this._setEnabled(".userVmOnlyDisable", false);
        }
    },

    _updateMoreActions: function() {
        this._setEnabled(this.addAction, this.vm.canAddDevice());
        this._setEnabled(this.deleteAction, this.vm.canDelete());
        this._setDisplay(this.deleteAction, this.vm.deleteVisible());
        this._setEnabled(".nicButton", this.vm.canEditNics());
        this._setEnabled(".diskButton", this.vm.canEditDisk());
        this._setEnabled(".pci", this.vm.canModifyPCI());
    },

    _updateButtons: function() {
        //this._setDisplay(this.editButton, !this.editing);
        //this._setDisplay(this.saveButton, this.editing);
        //this._setDisplay(this.cancelButton, this.editing);
        //this._setDisplay(this.versionButton, this.editing);
        //this._setDisplay(".editTip", this.editing);
        this._setDisplay(this.editButton, false);
        this._setDisplay(this.cancelButton, false);
        this._setDisplay(this.editButtons, this.vm.policy_modify_vm);
        //this._setDisplay(this.closeButton, !this.editing);
    },

    _updateNativeMode: function() {
        this._setEnabled(this.showSwitcher, !this.vm.native_experience);
        this.showSwitcherLabel.set("title", this.vm.native_experience ? this.NATIVE_DISABLED_TOOLTIP : "");
        this._setEnabled(this.wirelessControl, !this.vm.native_experience);
        this.wirelessControlLabel.set("title", this.WIRELESS_CONTROL_TOOLTIP + (this.vm.native_experience ? "<br/>" + this.NATIVE_DISABLED_TOOLTIP : ""));
        this._setEnabled(this.startOnBoot, !this.vm.native_experience);
        this.startOnBootLabel.set("title", this.AUTOBOOT_TOOLTIP + (this.vm.native_experience ? "<br/>" + this.NATIVE_DISABLED_TOOLTIP : ""));
        this._setEnabled(this.platformPower, !this.vm.native_experience);
        this.platformPowerLabel.set("title", this.POWER_BEHAVIOUR_TOOLTIP + (this.vm.native_experience ? "<br/>" + this.NATIVE_DISABLED_TOOLTIP : ""));
        // this.threed is set enabled elsewhere, but native_experience has been taken into account
        this.threedLabel.set("title", this.HDX_TOOLTIP + (this.vm.native_experience ? "<br/>" + this.NATIVE_DISABLED_TOOLTIP : ""));
    },

    _updateMaps: function() {
        var isoMap = {};
        isoMap[this.NONE] = "";
        dojo.forEach(XUICache.Host.available_isos, function(iso) {
            isoMap[(XUICache.Host.available_isos.length == 1) ? this.TOOLS_CD : iso] = iso;
        }, this);

        this.isos.set("map", isoMap);

        var gpuMap = {};
        gpuMap[this.DISABLED] = "";
        dojo.forEach(XUICache.Host.available_gpus, function(gpu) {
            gpuMap[(XUICache.Host.available_gpus.length == 1) ? this.ENABLED : gpu.name] = gpu.addr;
        }, this);

        this.threed.set("map", gpuMap);
    },

    _createCustomFields: function() {
        var data = {identifier: "id", items: this.vm.list_product_properties};
        var store = new itemFileReadStore({data: data});

        var createFields = function(items, request) {

            if (items.length == 0) {
                this._setDisplay(this.customTab.controlButton, false);
                return;
            }
            this._setDisplay(this.customTab.controlButton, true);

            var fieldClass = "";
            var widgets = [];
            dojo.forEach(items, function(item, i) {
                var itemClass = store.getValue(item, "class");
                if(itemClass != fieldClass) {
                    domConstruct.create("h1", {innerHTML: itemClass}, this.customFieldsWrap);
                    fieldClass = itemClass;
                }
                var wrap = domConstruct.create("div", {className: "citrixTabPaneField"}, this.customFieldsWrap);
                var labelNode = domConstruct.create("label", {innerHTML: store.getValue(item, "key")}, wrap);
                if(store.getValue(item, "description")) {
                    new label({title: store.getValue(item, "description")}, labelNode);
                }
                var bindingName = "ovf_" + store.getIdentity(item).replace(/\./g, "_");
                var span = domConstruct.create("span", null, wrap);
                if(store.getValue(item, "user-configurable").bool()) {
                    var typeString = store.getValue(item, "type").toLowerCase();
                    // TODO value map when Tomasz has implemented it - to make into common.citrix.Select if present.
                    switch(typeString) { // lowercase because most recent ovf spec has changed the casing so less confusion this way
                        case "string": {
                            var minLen = store.getValue(item, "min"); // TODO not implemented in toolstack yet so may need changing
                            var maxLen = store.getValue(item, "max");
                            var regExp = ".*";
                            if(minLen || maxLen) {
                                regExp = ".{^" + minLen ? minLen : 0 + "," + maxLen ? maxLen : "" + "$}";
                            }
                            widgets.push(new editableWidget({"class": "value", editor: "citrix.common.ValidationTextBox", name: bindingName, editorParams: "{regExp: '" + regExp + "'}"}, span));
                            break;
                        }
                        case "boolean": {
                            var map = {};
                            map[this.ENABLED] = "true";
                            map[this.DISABLED] = "false";
                            widgets.push(new editableWidget({"class": "value", returnValueAsString: true, editor: "citrix.common.Select", map: map, name: bindingName}, span));
                            break;
                        }
                        case "uint8":
                        case "sint8":
                        case "uint16":
                        case "sint16":
                        case "uint32":
                        case "sint32":
                        case "uint64":
                        case "sint64":
                        case "real32":
                        case "real64": {
                            var number = parseInt(typeString.substr(4, typeString.length - 4));
                            var constraints = "{}";
                            if(typeString.startsWith("real")) {
                                constraints = "{places: '0," + (number == 32 ? "9" : "17") + "'}";
                            } else if(typeString.startsWith("u")) {
                                constraints = "{places: 0, min: 0, max: " + (Math.pow(2, number) - 1) + "}";
                            } else if(typeString.startsWith("s")) {
                                constraints = "{places: 0, min: " + (-Math.pow(2, number-1)) + ", max: " + (Math.pow(2, number-1) - 1) + "}";
                            }
                            var classString = "''";
                            if(number > 16) {
                                classString = "'longNumber'";
                            }
                            widgets.push(new editableWidget({"class": "value", name: bindingName, returnValueAsString: true, editor: "citrix.common.NumberSpinner", editorParams: "{'class': " + classString + ", smallDelta: 1, largeDelta: 100, constraints: " + constraints + "}"}, span));
                            break;
                        }
                        default:
                            // still show value but uneditable if we don't recognise the type.
                            widgets.push(new boundWidget({"class": "value", name: bindingName}, span));
                            break;
                    }
                } else {
                    widgets.push(new boundWidget({"class": "value", name: bindingName}, span));
                }
            }, this);

            this._setupSave(widgets); // this sets up the Save button activation on these fields
        };

        store.fetch({
            onComplete: dojo.hitch(this, createFields),
            sort: [{attribute: "class"}]
        });
    },

    _updateProgress: function() {
        this._setDisplay(this.transferNode, this.vm.isDownloading());

        this._setDisplay(this.pauseAction, this.vm.canPauseTransfer());
        this._setDisplay(this.resumeAction, this.vm.canResumeTransfer());
        this._setDisplay(this.retryAction, this.vm.canRetryTransfer());
        this._setDisplay(this.cancelAction, this.vm.canCancelTransfer());

        this._setEnabled(this.pauseAction, !this.vm.hasPendingTransferAction());
        this._setEnabled(this.resumeAction, !this.vm.hasPendingTransferAction());
        this._setEnabled(this.retryAction, !this.vm.hasPendingTransferAction());
        this._setEnabled(this.cancelAction, !this.vm.hasPendingTransferAction());
    },

    _updateTooltips: function() {
        this.addAction.domNode.title = !this.vm.usb_enabled ? this.USB_DISABLED : (this.vm.canAddDevice()) ? "" : this.ADD_DEVICE_STATUS;
        this.deleteAction.domNode.title = (this.vm.canDelete()) ? "" : this.DELETE_VM_STATUS;
    },

    _updateRest: function() {
        this._setEnabled(this.threed, this.vm.canEnableThreed());
        this._setDisplay(this.wiredDisabledNode, !this.vm.policy_wired_networking);
        this._setDisplay(this.wirelessDisabledNode, !this.vm.policy_wireless_networking);
        this._setDisplay(this.networkDisabledNode, !this.vm.policy_wired_networking || !this.vm.policy_wireless_networking);
        this._setDisplay(this.pciTab.controlButton, XUICache.Host.policy_modify_vm_advanced);
        this._setDisplay(this.advancedTab.controlButton, XUICache.Host.policy_modify_vm_advanced);
    },

    _updateSlotSelect: function() {
        var slotMap = {};
        dojo.forEach(XUICache.getVmPaths(), function(path) {
            var vm = XUICache.getVM(path);
            var name = (vm == this.vm) ? this.THIS_VM : vm.name.shorten(20);
            slotMap[vm.slot] = name;
        }, this);

        var options = dojo.map(new Array(9), function(key, index) {
            index += 1;
            var label = this.SWITCHER_KEY_MASK.format(index);
            if (slotMap[index]) {
                label += this.SWITCHER_DROPDWON_MASK.format(slotMap[index]);
            }
            return {label: label, value: index};
        }, this);
        this.slotSelect.set("options", options);
    },

    _onBlur: function(event) {
        XUtils.publish(XenConstants.TopicTypes.UI_SHIFTKEY_UP);
    },

    _transferAction: function(action) {
        this._setEnabled(this.pauseAction, false);
        this._setEnabled(this.resumeAction, false);
        this._setEnabled(this.retryAction, false);
        this._setEnabled(this.cancelAction, false);
        this._vmAction(action);
    },

    _vmAction: function(action) {
        if (this.vm[action] && typeof(this.vm[action] === "function")) {
            this.vm[action]();
        }
    },

    _getDeviceID: function(node) {
        return new dojo.NodeList(node).parents("tr").first()[0].getAttribute("deviceId");
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED:
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED: {
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.MODEL_DISK_CHANGED:
            case XenConstants.TopicTypes.MODEL_DISK_USAGE_CHANGED: {
                this.bind(this.vm, this.diskTab.domNode);
                this.bindTooltips();
                break;
            }
            case XenConstants.TopicTypes.MODEL_NIC_CHANGED: {
                this.bind(this.vm, this.nicTab.domNode);
                this.bindTooltips();
                break;
            }
            case XenConstants.TopicTypes.MODEL_USB_CHANGED: {
                this.bind(this.vm, this.usbTab.domNode);
                this.bindTooltips();
                break;
            }
            case XenConstants.TopicTypes.MODEL_TRANSFER_CHANGED: {
                this._updateProgress();
                break;
            }
            case XenConstants.TopicTypes.UI_VMSLOT_CHANGED: {
                this._updateSlotSelect();
                break;
            }
            case XenConstants.TopicTypes.UI_SHIFTKEY_DOWN: {
                this._updateActions(true);
                break;
            }
            case XenConstants.TopicTypes.UI_SHIFTKEY_UP: {
                this._updateActions();
                break;
            }
            case "vm_state_changed": {
                if (this.editing) {
                    this.refreshResources();
                }
                break;
            }
        }
    }
});
});
