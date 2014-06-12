define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/AddDisk",
    "dojo/text!citrix/xenclient/templates/AddDisk.html",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin",
    // Required in template
    "citrix/common/Select",
    "citrix/common/NumberSpinner",
    "citrix/common/Button",
    "citrix/common/Label"
],
function(dojo, declare, addDiskNls, template, dialog, _boundContainerMixin, _citrixTooltipMixin) {
return declare("citrix.xenclient.AddDisk", [dialog, _boundContainerMixin, _citrixTooltipMixin], {

    templateString: template,
    widgetsInTemplate: true,
    canExecute: true,
    destroyOnHide: true,

    constructor: function(args) {
        this.vm = XUICache.getVM(args.vm_path);
    },

    postMixInProperties: function() {
        dojo.mixin(this, addDiskNls);
        this.inherited(arguments);
    },

    postCreate: function() {
        this.set("title", this.ADD_DISK);
        this.inherited(arguments);
    },

    onShow: function() {
        this._bindDijit();
        this.inherited(arguments);
    },

    onSave: function() {
        this._setDisplay(".citrixTabPaneField", false);
        this._setDisplay(".progressBar", true);
        this._setVisible(".citrixDialogFooter", false);
        this.set("canCancel", false);
        this.set("canExecute", false);

        var vm = this.vm;
        var result = this.unbind();

        var onError = function(error) {
            XUICache.messageBox.showError(error, XenConstants.ToolstackCodes);
        };
        var self = this;
        var onFinish = function() {
            vm.refresh(self.onExecute);
        };

        XUICache.Host.createVhd(result.size * 1000, function(vhd_path) {
            vm.createDisk(vhd_path, result.encrypt, addDiskNls.ENCRYPT_MESSAGE, true, onFinish, onError);
        }, onError);
    }
});
});