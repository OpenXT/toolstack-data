define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Menus",
    "dojo/text!citrix/xenclient/templates/Menus.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    //Required in code
    "citrix/xenclient/Information",
    "citrix/xenclient/MediaWizard",
    "citrix/xenclient/Receiver",
    "citrix/xenclient/ServiceVMs",
    "citrix/xenclient/Settings",
    "citrix/xenclient/Devices",
    "citrix/common/ItemFileReadStore",
    "citrix/xenclient/NetworkMenuBarItem",
    // Required in template
    "citrix/common/Menu",
    "citrix/common/MenuBar",
    "citrix/common/MenuBarItem",
    "citrix/common/MenuItem",
    "citrix/common/MenuSeparator",
    "citrix/common/PopupMenuBarItem"
],
function(dojo, declare, menusNls, template, _widget, _templated, _citrixWidgetMixin, information, mediaWizard, receiver, serviceVMs, settings, devices, itemFileReadStore, networkMenuBarItem) {
return declare("citrix.xenclient.Menus", [_widget, _templated, _citrixWidgetMixin], {

	templateString: template,
    widgetsInTemplate: true,
    _settingsPopup: null,
    _infoPopup: null,
    _servicesPopup: null,
    _receiverPopup: null,
    _devicesPopup: null,
    ndvmStore: null,

    constructor: function() {
        this.ndvms = {};
    },

    postMixInProperties: function() {
        dojo.mixin(this, menusNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this._settingsPopup = new settings();
        this._infoPopup = new information();
        this._servicesPopup = new serviceVMs();
        this._receiverPopup = new receiver();
        this._devicesPopup = new devices();
        this.subscribe(XUtils.publishTopic, this._messageHandler);
        this.subscribe(XUICache.Host.publish_topic, this._messageHandler);
        this.subscribe(XUICache.Update.publish_topic, this._messageHandler);
        this._bindDijit();
        this._createNDVMStore();
        this._sortNDVMs();
    },

    onRestartClick: function() {
        if (XUICache.Update.state == XenConstants.UpdateStates.DOWNLOADED_FILES) {
            this._applyUpdate("applyUpdateReboot");
        } else {
            XUICache.Host.reboot();
        }
    },

    onRestartNoUpdateClick: function() {
        XUICache.Host.reboot();
    },

    onSleepClick: function() {
        XUICache.Host.sleep();
    },

    onHibernateClick: function() {
        XUICache.Host.hibernate();
    },

    onLockClick: function() {
        XUICache.Host.lock(false);
    },

    onShutdownClick: function() {
        if (XUICache.Update.state == XenConstants.UpdateStates.DOWNLOADED_FILES) {
            this._applyUpdate("applyUpdateShutdown");
        } else {
            XUICache.Host.shutdown();
        }
    },

    onShutdownNoUpdateClick: function() {
        XUICache.Host.shutdown();
    },

    onMediaClick: function() {
        if (Object.keys(XUICache.VMs).length >= XenConstants.Defaults.MAX_VMS) {
            XUICache.messageBox.showError(this.MAX_VMS);
            return;
        }

        new mediaWizard().show();
    },

    onICAClick: function() {
        if (Object.keys(XUICache.VMs).length >= XenConstants.Defaults.MAX_VMS) {
            XUICache.messageBox.showError(this.MAX_VMS);
            return;
        }

        this._receiverPopup.show();
    },

    onSystemClick: function() {
        this._settingsPopup.show();
    },

    onServicesClick: function() {
        this._servicesPopup.show();
    },

    onInformationClick: function() {
        this._infoPopup.show();
    },

    onDevicesClick: function() {
        this._devicesPopup.show();
    },

    _bindDijit: function() {
        this._setDisplay(this.restartNoUpdateNode, XUICache.Update.state == XenConstants.UpdateStates.DOWNLOADED_FILES);
        this._setDisplay(this.shutdownNoUpdateNode, XUICache.Update.state == XenConstants.UpdateStates.DOWNLOADED_FILES);
        this._setDisplay(this.lockNode, XUICache.Host.platform_user != "");
        this._setDisplay(this.powerNode, XUICache.Host.canPowerCycle());
        this._setDisplay(this.mediaNode, XUICache.Host.canAddVM());
        this._setDisplay(this.icaNode, XUICache.Host.canAddICAVM());
        this._setDisplay(this.servicesNode, XUICache.Host.canModifyServices());
        this._setDisplay(this.settingsNode, XUICache.Host.canModifySettings());
        this._setDisplay(this.devicesNode, XUICache.Host.canModifyDevices());
    },

    _applyUpdate: function(fn) {
        XUICache.Update[fn](function() {}, function(error) {
            XUICache.messageBox.showError(error, XenConstants.UpdateCodes);
        });
    },

    _deleteNDVMs: function() {
        dojo.forEach(Object.keys(this.ndvms), function(key) {
            if (typeof(XUICache.NDVMs[key]) === "undefined") {
                this.menuNode.removeChild(this.ndvms[key]);
                this.ndvms[key].destroyRecursive();
                delete this.ndvms[key];
            }
        }, this);
    },

    _createNDVMStore: function() {
        var values = [];
        dojo.forEach(Object.keys(XUICache.NDVMs), function(key) {
            var ndvm = XUICache.NDVMs[key];
            var value = {ndvm_path: ndvm.ndvm_path, name: ndvm.name};
            values.push(value);
        }, this);
        var data = {identifier: 'ndvm_path', items: values};
        this.ndvmStore = new itemFileReadStore({data: data});
    },

    _sortNDVMs: function() {
        this.ndvmStore.fetch({
            onComplete: dojo.hitch(this, this._gotNDVMs),
            sort: [{
                attribute: "name"
            }]
        }, this);
    },

    _gotNDVMs: function(items, request) {
        dojo.forEach(items, function(item, i) {
            var ndvm_path = this.ndvmStore.getValue(item, "ndvm_path");
            if (typeof(this.ndvms[ndvm_path]) === "undefined") {
                this.ndvms[ndvm_path] = new networkMenuBarItem({ path: ndvm_path, defaultLabel: this.NETWORK });
            }
            this.menuNode.addChild(this.ndvms[ndvm_path]);
        }, this);
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED:
            case XenConstants.TopicTypes.UI_VM_CREATED:
            case XenConstants.TopicTypes.UI_VM_DELETED: {
                this._bindDijit();
                break;
            }
            case XenConstants.TopicTypes.UI_NDVM_CREATED:
            case XenConstants.TopicTypes.UI_NDVM_DELETED:
            case XenConstants.TopicTypes.UI_NDVMNAME_CHANGED: {
                this._deleteNDVMs();
                this._createNDVMStore();
                this._sortNDVMs();
                break;
            }
        }
    }
});
});