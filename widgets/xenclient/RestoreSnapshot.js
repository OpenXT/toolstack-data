define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/RestoreSnapshot",
    "dojo/text!citrix/xenclient/templates/RestoreSnapshot.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    // Required in code
    "dojo/NodeList-traverse",
    // Required in template
    "citrix/common/Repeater",
    "citrix/common/BoundWidget",
    "citrix/common/Button"
],
function(dojo, declare, restoreSnapshotNls, template, dialog, _boundContainerMixin) {
return declare("citrix.xenclient.RestoreSnapshot", [dialog, _boundContainerMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,
    _deviceId: -1,

    constructor: function(args) {
        this.vm = XUICache.getVM(args.vm_path);
        this.disk = this.vm.disks[args.disk_path];
    },

    postMixInProperties: function() {
        dojo.mixin(this, restoreSnapshotNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.subscribe(this.vm.publish_topic, this._messageHandler);
        this._bindDijit();
    },

    onDeviceSelect: function(event) {
        var id = this._getDeviceID(event.currentTarget);
        if (id == this._deviceId) {
            return;
        }
        this._deviceId = id;
        this._setClass(".device", "selected", false);
        this._setClass(event.currentTarget, "selected", true);
        this._setEnabled(this.restoreButton, true);
    },

    onExecute: function() {
        XUtils.publish(XenConstants.TopicTypes.UI_SHOW_WAIT);

        this.disk.restoreSnapshot(this._deviceId, function() {
            XUICache.messageBox.showInformation(restoreSnapshotNls.CONFIRM_SNAPSHOT);
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
        }, function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        });

        this.inherited(arguments);
    },

    _bindDijit: function() {
        this.bind(this.disk);
        this.set("title", this.RESTORE_SNAPSHOT);
        this._setEnabled(this.restoreButton, false);
    },

    _getDeviceID: function(node) {
        return new dojo.NodeList(node).parents("li").first()[0].getAttribute("deviceId");
    },

    _messageHandler: function(message) {
        switch(message.type) {
            case XenConstants.TopicTypes.MODEL_STATE_CHANGED:
            case XenConstants.TopicTypes.MODEL_CHANGED: {
                this._bindDijit();
                break;
            }
        }
    }
});
});