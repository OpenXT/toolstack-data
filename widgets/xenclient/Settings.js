define([
    "dojo",
    "dojo/_base/declare",
    "dojo/dom-construct",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Settings",
    "dojo/text!citrix/xenclient/templates/Settings.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    // Required in code
    "citrix/common/ItemFileReadStore",
    "citrix/common/BoundWidget",
    "citrix/common/Select",
    "citrix/xenclient/AudioSelect",
    "citrix/xenclient/AudioNumberSpinner",
    // Required in template
    "citrix/common/TabContainer",
    "citrix/common/ContentPane",
    "citrix/common/ImageSelect",
    "citrix/common/RadioButton",
    "citrix/common/Button",
    "citrix/common/NumberSpinner",
    "citrix/common/OrderableList",
    "citrix/common/ValidationTextBox",
    "citrix/common/ProgressBar",
    "citrix/common/Label",
    "citrix/common/Timeout"
],
function(dojo, declare, domConstruct, settingsNls, template, dialog, _boundContainerMixin, _citrixTooltipMixin, itemFileReadStore, boundWidget, select, audioSelect, audioSpinner) {
return declare("citrix.xenclient.Settings", [dialog, _boundContainerMixin, _citrixTooltipMixin], {

	templateString: template,
    widgetsInTemplate: true,
    audioWidgets: [],

    constructor: function(args) {
        this.host = XUICache.Host;
    },

    postMixInProperties: function() {
        dojo.mixin(this, settingsNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.startup();
        this.tabContainer.closeChild(this.vmModeContainer); // XC-8538 temporarily hide native experience
        this.connect(this.tabContainer.tablist, "onSelectChild", "_onTabChange");
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe(XUICache.Update.publish_topic, this._messageHandler);
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.xenmgr", this._messageHandler);
        this._createAudioFields();
        this._bindDijit();
    },

    show: function() {
        this.inherited(arguments);
        // Refresh when opening dialog
        this.host.refresh();
    },

    save: function() {
        var values = this.unbind();

        this.saveValues(this.host, values, dojo.hitch(this, function() {

            this.host.refresh();
            
            var anyGuestOn = dojo.some(Object.keys(XUICache.VMs), function(key) {
                var vm = XUICache.VMs[key];
                return vm.isActive();
            }, this);

            if (anyGuestOn && ((typeof(values.capture_device) !== "undefined" && values.capture_device) || (typeof(values.playback_device) !== "undefined" && values.playback_device))) {
                // A guest VM is running and we have changed an audio setting
                XUICache.messageBox.showWarning(this.AUDIO_CHANGED);
            }

            if (typeof(values.drm_enabled) !== "undefined") {
                XUICache.messageBox.showInformation(this.DRM_CHANGED);
            }
        }));
	},

    increaseBrightness: function() {
        this.host.increaseBrightness();
    },

    decreaseBrightness: function() {
        this.host.decreaseBrightness();
    },

    changePassword: function() {
        var flags;
        if (this.host.platform_user != "") {
            // changing local password
            flags = XenConstants.AuthFlags.CHANGE_LOCAL_PW | XenConstants.AuthFlags.CONFIRM_PW;
        } else {
            // adding local password
            flags = XenConstants.AuthFlags.SET_LOCAL_PW | XenConstants.AuthFlags.CONFIRM_PW;
        }
        this.host.authSetContextFlags("local", "local", flags, function() {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_POPUP, [XUICache.alerts.AUTH_START, XUICache.alerts.AUTH_START_HEADING]);
        }, function(error){
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        });
    },

    checkUpdate: function() {
        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
        var url = this.updateURLNode.value;
        XUICache.Update.update_url = url;
        var error = function(error) {
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            XUICache.messageBox.showError(error, XenConstants.UpdateCodes);
        };
        var download = function() {
            XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);
            XUICache.Update.downloadUpdate(url, function() {
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            }, error)
        };
        XUICache.Update.checkUpdate(url, dojo.hitch(this, function(version, release, state) {
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            switch(state) {
                case XenConstants.UpdateVersionStates.CANNOT_UPGRADE: {
                    XUICache.messageBox.showError(this.CANNOT_UPGRADE.format(XUICache.Host.build_version, version), null, { headerText: this.UPDATE_HEADER });
                    break;
                }
                case XenConstants.UpdateVersionStates.CAN_UPGRADE: {
                    XUICache.messageBox.showConfirmation(this.CAN_UPGRADE.format(XUICache.Host.build_version, version), download,
                        {
                            headerText: this.UPDATE_HEADER,
                            continueText: this.START_DOWNLOAD_ACTION
                        }
                    );
                    break;
                }
                case XenConstants.UpdateVersionStates.UP_TO_DATE: {
                    XUICache.messageBox.showConfirmation(this.UP_TO_DATE.format(XUICache.Host.build_version, version), download,
                        {
                            headerText: this.UPDATE_HEADER,
                            continueText: this.START_DOWNLOAD_ACTION
                        }
                    );
                    break;
                }
            }
        }), error);
    },

    cancelUpdate: function() {
        XUICache.Update.cancelUpdate();
    },

    _onTabChange: function(tab) {
        this._setDisplay(this.saveButton, tab.saveable);
    },

    _onUpdateURLChange: function(newValue) {
        this._setEnabled(this.checkUpdateButton, newValue != "");
    },

    _onSwitcherChange: function(newValue) {
        this._setEnabled(this.switcherKeyboardNode, newValue);
        this._setEnabled(this.switcherResistanceNode, newValue);
        this._setEnabled(this.gpuPlacementNode, newValue);
    },

    _updateMaps: function() {
        var keyboardMap = dojo.map(this.host.keyboard_layouts, function(layout) {
            var opt = {};
            opt["value"] = layout;
            opt["label"] = this["KEYBOARD_LAYOUT_" + layout.toUpperCase().replace(/-/g, "_")];
            return opt;
        }, this);

        this.keyboardNode.set("options", keyboardMap);

        var captureMap = dojo.map(this.host.available_capture_devices, function(device) {
            var opt = {};
            opt["value"] = device.id;
            opt["label"] = device.name;
            return opt;
        }, this);

        this.captureNode.set("options", captureMap);

        var playbackMap = dojo.map(this.host.available_playback_devices, function(device) {
            var opt = {};
            opt["value"] = device.id;
            opt["label"] = device.name;
            return opt;
        }, this);

        this.playbackNode.set("options", playbackMap);
    },

    _bindNativeDijits: function() {
        return true; // remove native experience for now XC-8538
        //var vmMap = [{label: this.NATIVE_SELECT_VM_HINT, value: "", disabled: true}];
        var vmMap = [];
        for(var vm in XUICache.VMs) {
            if(XUICache.VMs.hasOwnProperty(vm)) {
                if(XUICache.VMs[vm].hosting_type == XenConstants.VMTypes.ICA) {
                    continue;
                }
                var opt = {};
                opt["value"] = vm;
                opt["label"] = XUICache.VMs[vm].name;
                vmMap.push(opt);
            }
        }

        this._binding = true;
        this.nativeVMNode.set("options", vmMap);
        this.nativeVMNode.loadDropDown(function(){});

        this.bind(this.host, this.vmModeContainer.domNode);

        this._onNativeRadioChange();
    },

    _onNativeRadioChange: function() {
        var singleRadio = dijit.byId("singleVMMode");
        this._setEnabled(this.nativeVMNode, singleRadio.checked);
    },

    _bindDijit: function() {
        this.wallpaperSelect.set("source", this.host.available_wallpapers);
        this._updateMaps();
        this._updateDisplay();
        this._updateAuth();
        this._updateUpdate();
        this._updateLanguages();
        this.bind(this.host);
        this._bindNativeDijits();
        this.inherited(arguments);
    },

    _updateDisplay: function() {
        this._setDisplay(".screenlock", this.host.policy_screen_lock);
        this._setDisplay(".laptop", this.host.laptop);
        this._setDisplay(".multipleGPU", this.host.hasMultipleGPUs());
    },

    _updateAuth: function() {
        this._setDisplay(".auth", false);
        if (true) { // TODO left auth stuff like this for now as managed auth may still be required
            if (XUICache.Host.platform_user != "") {
                // Local
                this._setDisplay(".auth.local", true);
            } else {
                // None
                this._setDisplay(".auth.none", true);
            }
        } else {
            // Managed
            this._setDisplay(".auth.managed", true);
        }
    },

    _updateUpdate: function() {
        this._setDisplay(this.updateTab.controlButton, this.host.policy_update);
        if (this.host.policy_update) {
            this._setDisplay(".update", false);
            switch (XUICache.Update.state) {
                case XenConstants.UpdateStates.NONE:
                case XenConstants.UpdateStates.DOWNLOADING_META:
                case XenConstants.UpdateStates.DOWNLOADED_META:
                case XenConstants.UpdateStates.APPLYING:
                case XenConstants.UpdateStates.COMPLETE: {
                    this._setDisplay(".update.ready", true);
                    this.updateURLNode.set("value", XUICache.Update.getUpdateURL());
                    break;
                }
                case XenConstants.UpdateStates.DOWNLOADING_FILES: {
                    this._setDisplay(".update.downloading", true);
                    this.progressNode.set("value", XUICache.Update.xfer_percent*100);
                    break;
                }
                case XenConstants.UpdateStates.DOWNLOADED_FILES: {
                    this._setDisplay(".update.downloaded", true);
                    break;
                }
                case XenConstants.UpdateStates.FAILED: {
                    this._setDisplay(".update.failed", true);
                    this.updateErrorNode.set("value", XUICache.Update.getError());
                    break;
                }
            }
        }
    },

    _updateLanguages: function() {
        this._setDisplay(this.languageTab.controlButton, this.host.supported_languages.length > 1);

        var languageMap = dojo.map(this.host.supported_languages, function(language) {
            var opt = {};
            opt["value"] = language;
            opt["label"] = this["LANGUAGE_" + language.substring(3).toUpperCase()];
            return opt;
        }, this);

        this.languageNode.set("options", languageMap);
    },

    _createAudioFields: function() {

        var createFields = function(items, request) {

            dojo.forEach(this.audioWidgets, function(widget) {
                widget.destroyRecursive();
            });

            this.audioWidgets = [];
            dojo.empty(this.audioFieldsWrap);

            dojo.forEach(items, function(item, i) {
                var typeString = store.getValue(item, "type").toUpperCase();
                var labelMask = this["AUDIO_MASK_" + typeString];
                var wrap = domConstruct.create("div", { className: "citrixTabPaneField" }, this.audioFieldsWrap);
                var labelNode = domConstruct.create("label", { innerHTML: labelMask.format(store.getValue(item, "name")) }, wrap);
                var span = domConstruct.create("span", null, wrap);
                var bindingName = "audioControls.{0}.value".format(store.getValue(item, "id"));
                switch(typeString) {
                    // Volume
                    case "VO":
                    case "VS": {
                        this.audioWidgets.push(new audioSpinner({ "class": "citrix", includeSwitch: (typeString == "VS"), name: bindingName }, span));
                        break;
                    }
                    // Switch
                    case "SW": {
                        this.audioWidgets.push(new select({ "class": "citrix", name: bindingName, options: [{ label: this.ON, value: "on"}, { label: this.OFF, value: "off" }] }, span));
                        break;
                    }
                    // Enum
                    case "EN": {
                        this.audioWidgets.push(new audioSelect({ "class": "citrix", name: bindingName }, span));
                        break;
                    }
                }
            }, this);

            // Setup the Save button activation on these fields
            this._setupSave(this.audioWidgets);
        };

        var items = Object.values(dojo.clone(this.host.audioControls));

        var store = new itemFileReadStore({ data: { identifier: "id", items: items }, clearOnClose: true });

        store.fetch({
            onComplete: dojo.hitch(this, createFields),
            sort: [{ attribute: "name" }]
        });

        store.close();
    },    

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_TRANSFER_CHANGED: {
                this._updateUpdate();
                break;
            }
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._createAudioFields();
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED:
            case "vm_config_changed": {
                this._bindNativeDijits();
                break;
            }
        }
    }
});
});