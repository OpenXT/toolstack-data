define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/VMDetails",
    "dojo/i18n!citrix/xenclient/nls/VM",
    "dojo/text!citrix/xenclient/templates/ReceiverDetails.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_EditableMixin",
    "citrix/common/_CitrixTooltipMixin",
    //Required in code
    "citrix/xenclient/ConnectDevice",
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/BoundWidget",
    "citrix/common/ImageButton",
    "citrix/common/TabContainer",
    "citrix/common/ContentPane",
    "citrix/common/EditableWidget",
    "citrix/common/ValidationTextBox",
    "citrix/common/Select",
    "citrix/common/ValidationTextarea",
    "citrix/common/Repeater",
    "citrix/common/Button",
    "citrix/common/CheckBox"
],
function(dojo, declare, vmDetailsNls, vmNls, template, dialog, _boundContainerMixin, _editableMixin, _citrixTooltipMixin, connectDevice) {
return declare("citrix.xenclient.ReceiverDetails", [dialog, _boundContainerMixin, _editableMixin, _citrixTooltipMixin], {

	templateString: template,
    widgetsInTemplate: true,
    destroyOnHide: true,

    constructor: function(args) {
        this.vm = XUICache.VMs[args.path];
        this.host = XUICache.Host;
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
        this._bindDijit();
        if (this.vm.policy_modify_vm) {
            this.edit();
        }
    },

    edit: function() {
        this.inherited(arguments);
        this._descendantAction("edit");
        this._updateButtons();
	},

    save: function() {
        this.inherited(arguments);
        this._updateButtons();
        this._descendantAction("save");

        var values = this.unbind();
        this.saveValues(this.vm, values);
	},

	cancel: function() {
        this.inherited(arguments);
        this._updateButtons();
        this._descendantAction("cancel");
	},

    onStart: function() {
        this._vmAction("start");
    },

    onBackground: function() {
        this._vmAction("background_start");
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

    onUsbDetach: function(event) {
        var id = this._getUsbID(event.target);
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
        this.bind(this.vm);
        this.set("title", dojo.replace("{0} ({1})", [this.vm.truncatedName(45), this.vm.getTranslatedState(vmNls)]));
        this._updateActions();
        this._updateMoreActions();
        this._updateButtons();
        this._updateTooltips();
        this._updateSlotSelect();
        this.inherited(arguments);
    },

    _updateActions: function(shiftDown) {
        var actions = ["start", "background", "switch", "shutdown", "force_shutdown", "local_login"];
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
    },

    _updateMoreActions: function() {
        this._setEnabled(this.addAction, this.vm.canAddDevice());
        this._setEnabled(this.deleteAction, this.vm.canDelete());
    },

    _updateButtons: function() {
        //this._setDisplay(this.editButton, !this.editing);
        //this._setDisplay(this.saveButton, this.editing);
        //this._setDisplay(this.cancelButton, this.editing);
        //this._setDisplay(".editTip", this.editing);
        this._setDisplay(this.editButton, false);
        this._setDisplay(this.cancelButton, false);
        this._setDisplay(this.editButtons, this.vm.policy_modify_vm);
        //this._setDisplay(this.closeButton, !this.editing);
    },

    _updateTooltips: function() {
        this.addAction.domNode.title = !this.vm.usb_enabled ? this.USB_DISABLED : (this.vm.canAddDevice()) ? "" : this.ADD_DEVICE_STATUS;
        this.deleteAction.domNode.title = (this.vm.canDelete()) ? "" : this.DELETE_VM_STATUS;
    },

    _updateSlotSelect: function() {
        var slotMap = {};
        dojo.forEach(Object.keys(XUICache.VMs), function(key) {
            var vm = XUICache.VMs[key];
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

    _vmAction: function(action) {
        if (this.vm[action] && typeof(this.vm[action] === "function")) {
            this.vm[action]();
        }
    },

    _getUsbID: function(node) {
        return new dojo.NodeList(node).parents("tr").first()[0].getAttribute("deviceId");
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_USB_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
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
        }
    }
});
});