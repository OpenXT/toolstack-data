define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/MediaWizard",
    "dojo/text!citrix/xenclient/templates/MediaWizard.html",
    // Mixins
    "citrix/xenclient/_Wizard",
    // Required in template
    "citrix/common/WizardContainer",
    "citrix/common/WizardPage",
    "citrix/common/ValidationTextBox",
    "citrix/common/Select",
    "citrix/common/ValidationTextarea",
    "citrix/common/ImageSelect",
    "citrix/common/NumberSpinner",
    "citrix/common/BoundWidget",
    "citrix/common/RadioButton",
    "citrix/common/WizardNavigator",
    "citrix/common/ProgressBar"
],
function(dojo, declare, mediaWizardNls, template, _wizard) {
return declare("citrix.xenclient.MediaWizard", [_wizard], {

    templateString: template,

    wizardId: "MediaWizard",

    _hasWired: false,
    _hasWireless: false,

    constructor: function() {
        this.host = XUICache.Host;
    },

    postMixInProperties: function() {
        dojo.mixin(this, mediaWizardNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);

        this.subscribe(this.host.publish_topic, this._messageHandler);
        this.subscribe("com.citrix.xenclient.networkdaemon", this._messageHandler);
        this._bindDijit();
        this._setupBoot();

        // set up finish page function (to run before onExecute)
        this.finishPage.onNextFunction = dojo.hitch(this, this._onFinishPageNext);
    },

    startup: function() {
        this.inherited(arguments);

        this.host.refresh();

        if(true/*XUICache.getVMCount(false) > 0*/) { // hide native experience for now XC-8538
            this.wizard.closeChild(this.vmModePage);
        }
    },

    _onFinishPageNext: function(finish) {
        this._setDisplay(".finishFields", false);
        this._setDisplay(this.creatingVM, true);
        this._setVisible(this.navigationNode, false);
        this.set("canCancel", false);
        this.set("canExecute", false);

        var result = this.unbind();
        var args = arguments;
        var callback = dojo.hitch(this, function(value) {
            finish();
            return value;
        });
        var errback = dojo.hitch(this, function(error) {
            XUICache.messageBox.showError(this.VM_ERRORS);
            callback();
            return error;
        });

        var self = this;
        var createVM = function() {
            var deferred = new dojo.Deferred();
            XUICache.createVM(result.template, result.name, result.description, result.imagePath, result.storage * 1000, result.encrypt, mediaWizardNls.ENCRYPT_MESSAGE, function(vm) {
                // Initial properties for created VM
                vm.vcpus = result.vcpus;
                vm.memory = result.memory;
                vm.cd = (result.autoStart == "iso") ? result.iso : XenConstants.Defaults.TOOLS_ISO;
                vm.boot = (result.autoStart == "network") ? "cn" : "cd";

                var save = function() {
                    var saveDeferred = new dojo.Deferred();
                    vm.save(function() {
                        // Set wired network
                        if(self._hasWired && result.wiredNetwork != "") {
                            vm.addNetwork(result.wiredNetwork, false, function() {}, function(error) {
                                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                            });
                        }
                        // Set wireless network
                        if(self._hasWireless && result.wirelessNetwork != "") {
                            vm.addNetwork(result.wirelessNetwork, true, function() {}, function(error) {
                                XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
                            });
                        }
                        if(result.vmMode == "single") {
                            XUICache.Host.set_native_vm(vm.vm_path);
                        }
                        if (result.autoStart != "off") {
                            vm.start();
                        }
                        saveDeferred.callback(true);
                    }, saveDeferred.errback);
                    return saveDeferred;
                };
                save().then(deferred.callback, deferred.errback);
            }, deferred.errback);
            return deferred;
        };

        createVM().then(callback, errback);
    },

    _bindDijit: function() {
        this.total_mem.set("value", this.host.total_mem);
        this.free_mem.set("value", this.host.free_mem);

        // VM templates
        var templateMap = dojo.map(this.host.getVMTemplates(), function(key) {
            return {"label": key.description, "value": key.template};
        }, this);

        this.template.set("options", templateMap);

        // set up default values
        this.template.set("value", this.host.getVMTemplates()[0].template);
        this.imagePath.set("source", this.host.available_vmimages);
        this.imagePath.set("value", "images/vms/001_ComputerXP_h32bit_120.png");

        // networks
        var networks = this.host.getNetworks();
        var wiredSelectList = [];
        var wirelessSelectList = [];
        var typeHasMany = {};
        var defaultWired = "";
        var defaultWireless = "";

        dojo.forEach(networks, function(network) {
            typeHasMany[network.type] = (typeof typeHasMany[network.type] !== "undefined");
        });

        dojo.forEach(networks, function(network) {
            if (network.wireless) {
                this._hasWireless = true;
                var list = wirelessSelectList;
                // Make any wireless found the default.
                defaultWireless = network.path;
            } else {
                this._hasWired = true;
                var list = wiredSelectList;
                if(defaultWired == "" && network.type == "BRIDGED") {
                    // Make first bridged found the wired default.
                    defaultWired = network.path;
                }
            }
            var mask = "TYPE_{0}{1}".format(network.type, typeHasMany[network.type] ? "_MANY" : "");
            list.push({
                "label": this[mask].format(network.backend, network.name),
                "value": network.path
            });           
        }, this);

        this._setDisplay(".wired", false);
        if(this._hasWired) {
            wiredSelectList.unshift({
                "label": this.NETWORK_NONE,
                "value": ""
            }); 
            this._setDisplay(".wired.some", true);
            this.wiredNetwork.set("options", wiredSelectList);
            this.wiredNetwork.set("value", defaultWired != "" ? defaultWired : wiredSelectList[0].value);
        } else {
            this._setDisplay(".wired.none", true);
            this._setEnabled(this.wiredNetwork, false);
        }
        this._setDisplay(".wireless", false);
        if(this._hasWireless) {
            wirelessSelectList.unshift({
                "label": this.NETWORK_NONE,
                "value": ""
            }); 
            this._setDisplay(".wireless.some", true);
            this.wirelessNetwork.set("options", wirelessSelectList);
            this.wirelessNetwork.set("value", defaultWireless != "" ? defaultWireless : wirelessSelectList[0].value);
        } else {
            this._setDisplay(".wireless.none", true);
            this._setEnabled(this.wirelessNetwork, false);
        }

        this.inherited(arguments);
    },

    _setupBoot: function() {

        // ISOs
        var selectedIso = "";
        var assignableISOs = (XUICache.Host.available_isos.length > 1);
        var isoMap = dojo.map(this.host.available_isos, function(iso) {
            var toolsIso = (iso == XenConstants.Defaults.TOOLS_ISO);
            if (selectedIso == "" && !toolsIso) {
                // Select first ISO which isn't the tools
                selectedIso = iso;
            }
            return { "label": iso, "value": iso, "disabled": toolsIso };
        }, this);
        
        this.isos.set("options", isoMap);
        if (assignableISOs) this.isos.set("value", selectedIso);
        // Show ISO selection if we have found more than just the tools ISO
        this._setDisplay(this.isoControl, assignableISOs);

        // CDs
        var availableCD = (XUICache.Host.available_cds.length > 0);
        var assignableCD = false;
        dojo.some(this.host.available_cds, function(cd) {
            if (cd.vm == "" && cd["vm-sticky"] == "0") {
                assignableCD = true;
                return true;
            }
        }, this);
          
        // Hide dropdown
        this._setDisplay(this.cds, false);
        // Show the CD control if we can assign a CD
        this._setDisplay(this.cdControl, availableCD);
        this._setEnabled(this.autoStart_cd, assignableCD);
        this._setDisplay(this.cdWarning, (availableCD && !assignableCD));

        var defaultBoot = assignableISOs ? "autoStart_iso" : assignableCD ? "autoStart_cd": "autoStart_network";
        this[defaultBoot].set("checked", true);
        this._onBootChange();
    },

    _onBootChange: function() {
        var bootValue;

        dojo.some(["autoStart_iso", "autoStart_cd", "autoStart_network", "autoStart_off"], function(radio) {
            if (this[radio].checked) {
                bootValue = this[radio].value;
                return true;
            }
            return false;
        }, this);

        var info = bootValue.toUpperCase() + "_BOOT_INFO";
        var warning = bootValue.toUpperCase() + "_BOOT_WARNING";

        if (this[info]) {
            this.bootInfo.innerHTML = this[info];
            this._setDisplay(this.bootInfoNode, true);
        } else {
            this._setDisplay(this.bootInfoNode, false);
        }

        if (this[warning]) {
            this.bootWarning.innerHTML = this[warning];
            this._setDisplay(this.bootWarningNode, true);
        } else {
            this._setDisplay(this.bootWarningNode, false);
        }
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                this._setupBoot();
                break;
            }
        }
    }
});
});