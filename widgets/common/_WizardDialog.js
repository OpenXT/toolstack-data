define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "citrix/common/Dialog",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_CitrixTooltipMixin"
],
function(dojo, declare, dialog, _boundContainerMixin, _citrixTooltipMixin) {
return declare("citrix.common._WizardDialog", [dialog, _boundContainerMixin, _citrixTooltipMixin], {

    //templateString: should be set in any children
    widgetsInTemplate: true,
    destroyOnHide: true,
    canExecute: true,

    wizardId: "wizard", // needs to be set in any children to be unique amongst wizards

    postCreate: function() {
        this.inherited(arguments);

        this.subscribe(this.wizardId + "-cancel", "onCancel");
        this.subscribe(this.wizardId + "-finish", "onExecute");
    },

    afterHide: function() {
        XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
        this.inherited(arguments);
    },

    onProgress: function() {
        var widget = dijit.byId(this.wizardId);
        if(widget && widget.progress) {
            widget.progress();
        }
    },

    _onKey: function(evt) {
        if(evt.charOrCode == dojo.keys.ENTER && this.canExecute
            && evt.srcElement && evt.srcElement.type != "textarea") {
            this.onProgress();
            dojo.stopEvent(evt);
            return;
        } else if(evt.charOrCode == dojo.keys.ESCAPE && !this.canCancel) {
            dojo.stopEvent(evt);
            return;
        }
        this.inherited(arguments);
    }
});
});