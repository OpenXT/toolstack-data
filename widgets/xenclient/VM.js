define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/VM",
    "dojo/text!citrix/xenclient/templates/VM.html",
    // Mixins
    "citrix/xenclient/_VMButton",
    "dijit/form/_FormMixin",
    "citrix/common/_CitrixWidgetMixin",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    // Required in code
    "citrix/xenclient/VMDetails",
    "citrix/xenclient/ReceiverDetails",
    "citrix/common/Tooltip",
    // Required in template
    "citrix/common/BoundWidget",
    "citrix/common/ImageButton",
    "citrix/common/ProgressBar"
],
function(dojo, declare, vmNls, template, _vmButton, _formMixin, _citrixWidgetMixin, _boundContainerMixin, _citrixTooltipMixin, vmDetails, receiverDetails, tooltip) {
return declare("citrix.xenclient.VM", [_vmButton, _formMixin, _citrixWidgetMixin, _boundContainerMixin, _citrixTooltipMixin], {

	templateString: template,
    tooltip: null,

    constructor: function(args) {
        this.vm = XUICache.VMs[args.path];
    },

    postMixInProperties: function() {
        dojo.mixin(this, vmNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.tooltip = new tooltip({ connectId: this.warningNode, position: ["above"], showDelay: 200 });
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this._bindDijit();
        this.inherited(arguments);
    },

    activate: function(event) {
        if (this.vm.getState() == XenConstants.VMStates.VM_STOPPED || this.vm.getState() == XenConstants.VMStates.VM_SUSPENDED) {
            if (!this.vm.powerClicked && this.vm.isReady()) {
                var action = (event.shiftKey) ? "background_start" : "start";
                this._startVM(action);
            }
        } else {
            this._vmAction("switchTo");
        }
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

    onStop: function() {
        this._vmAction("shutdown");
    },

    onForceStop: function() {
        this._vmAction("force_shutdown");
    },

    onLogin: function() {
        this._vmAction("local_login");
    },

    onDetails: function() {
        var popup = new vmDetails({ path: this.vm.vm_path });
        popup.show();
    },
       
    onICADetails: function() {
        var popup = new receiverDetails({ path: this.vm.vm_path });
        popup.show();
    },

    _bindDijit: function() {
        this.bind(this.vm);
        if (this.vm.isReady()) {
            this.imageNode.src = this.vm.get_image_path();
        } else {
            this.imageNode.greyScale(this.vm.get_image_path());
        }
        this._updateActions();
        this._updateWarning();
        this._updateProgress();
        this._updateState();
        dojo.attr(this.warningNode, "tabindex", 0);
        this.inherited(arguments);
    },

    _updateActions: function(shiftDown) {
        this._setDisplay(".vmActions", false);

        var actions = ["start", "background", "wake", "shutdown", "force_shutdown", "local_login"];
        var allowedActions = this.vm.simpleVMActions();
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
            this._setDisplay("." + action + "Action", allowedActions.contains(action));
            this._setEnabled("." + action + "Action", !this.vm.powerClicked);
        }, this);

        // VM Type
        this._setDisplay("." + this.vm.hosting_type + "Buttons", true);
    },

    _updateWarning: function() {
        if (XenConstants.Defaults.TOOLS_WARNING === false) {
            this._setDisplay(this.warningNode, false);
            return;
        }
        if (this.vm.hosting_type != XenConstants.VMTypes.NORMAL) {
            this._setDisplay(this.warningNode, false);
            return;
        }
        if(!this.vm.isReady()) {
            this._setDisplay(this.warningNode, false);
            return;
        }
        var showWarning = false;
        // No tools
        if (!this.vm.tools_installed) {
            showWarning = true;
            this.tooltip.label = this.XC_TOOLS_NOT_INSTALLED;
        }
        // Out of date
        else if (this.vm.toolsOutOfDate()) {
            showWarning = true;
            this.tooltip.label = this.XC_TOOLS_OLD_VERSION;
        }
        this._setDisplay(this.warningNode, showWarning);
    },

    _updateProgress: function() {
        this._fishEyeOn = !this.vm.isDownloading();
        this._setVisible(this.transferNode, this.vm.isDownloading());
        this._setClass(this.containerNode, "transferring", this.vm.isDownloading());
        this._setVisible(this.imageNode, !this.vm.isDownloading());
        this._setVisible(this.stateIcon, !this.vm.isDownloading());
    },

    _updateState: function() {
        var stateClass = "stateIconOn";
        switch(this.vm.getState()) {
            case XenConstants.VMStates.VM_STOPPED:
            case XenConstants.VMStates.VM_LOCKED: {
                stateClass = "stateIconOff";
                break;
            }
            case XenConstants.VMStates.VM_ASLEEP:
            case XenConstants.VMStates.VM_SUSPENDED: {
                stateClass = "stateIconPaused";
                break;
            }
        }
        dojo.replaceClass(this.stateIcon.domNode, stateClass, "stateIconOn stateIconOff stateIconPaused");
    },

    _vmAction: function(action) {
        if (this.vm[action] && typeof(this.vm[action] === "function")) {
            this.vm[action]();
        }
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_TRANSFER_CHANGED: {
                this._updateProgress();
                break;
            }
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
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