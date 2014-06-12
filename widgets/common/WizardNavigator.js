define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/WizardNavigator.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "citrix/common/_CitrixWidgetMixin",
    // Required in template
    "citrix/common/Button"
],
function(dojo, declare, template, _widget, _templated, _citrixWidgetMixin) {
return declare("citrix.common.WizardNavigator", [_widget, _templated, _citrixWidgetMixin], {

    templateString: template,
    widgetsInTemplate: true,

    wizardId: "", /* citrix.common.WizardContainer instance this navigator controls */

    valid: true, // assume valid unless told otherwise
    canGoBack: true, // assume can go back to previous page unless told otherwise

    backLabel: "back",
    nextLabel: "next",
    cancelLabel: "cancel",
    finishLabel: "finish",

    _setBackLabelAttr: function(value) {
        this.backButton.set("label", value);
    },

    _setNextLabelAttr: function(value) {
        this.nextButton.set("label", value);
    },

    _setCancelLabelAttr: function(value) {
        this.cancelButton.set("label", value);
    },

    _setFinishLabelAttr: function(value) {
        this.finishButton.set("label", value);
    },

    postCreate: function() {
        this.inherited(arguments);

        this.subscribe(this.wizardId + "-startup", "_onStartup");
        this.subscribe(this.wizardId + "-selectChild", "_onSelectChild");
        this.subscribe(this.wizardId + "-removeChild", "_onRemoveChild");
        this.subscribe(this.wizardId + "-addChild", "_onAddChild");
        this.subscribe(this.wizardId + "-stateChange", "_onStateChange");
        this.subscribe(this.wizardId + "-finish", "_onFinish");
    },

    _onStartup: function(/*Object*/ info) {
        this.wizardContainer = dijit.byId(this.wizardId);

        this._numberPages = info.children.length;
        this._currentPage = info.selected;

        this._refreshButtonState();
    },

    _onSelectChild: function(/*dijit._Widget*/ page, /*Boolean*/ returnable) {
        this._currentPage = page;
        this.canGoBack = returnable;
        this._refreshButtonState();
    },

    _onRemoveChild: function(/*dijit._Widget*/ page) {
        if(this._currentPage == page) {
            this._currentPage = null;
        }
        this._numberPages--;
        this._refreshButtonState();
    },

    _onAddChild: function(/*dijit._Widget*/ page, /*Integer?*/ insertIndex) {
        this._numberPages++;
        this._refreshButtonState();
    },

    _onStateChange: function(/*Boolean*/ valid) {
        this.valid = valid;
        this._refreshButtonState();
    },

    _onFinish: function() {
        // make sure the finish button gets disabled, since it's possible to cause a wizard to finish
        // without clicking the finish button (e.g. by hitting enter)
        this._setEnabled(this.finishButton, false);
    },

    _refreshButtonState: function() {
        var index = this._currentPage ? this._currentPage.getIndexInParent() : 0;
        this._setDisplay(this.backButton, (index > 0 && this.canGoBack));
        this._setEnabled(this.backButton, (index > 0 && this.canGoBack));
        this._setDisplay(this.nextButton, (index < this._numberPages - 1));
        this._setEnabled(this.nextButton, (index < this._numberPages - 1) && this.valid);
        this._setDisplay(this.finishButton, (index == this._numberPages - 1));
        this._setEnabled(this.finishButton, (index == this._numberPages - 1) && this.valid);
    },

    _onBackClick: function() {
        if(this.wizardContainer) {
            this.wizardContainer.back();
        }
    },

    _onNextClick: function() {
        if(this.wizardContainer) {
            this.wizardContainer.progress();
        }
    },

    _onCancelClick: function() {
        if(this.wizardContainer) {
            this.wizardContainer.cancel();
        }
    },

    _onFinishClick: function() {
        if(this.wizardContainer) {
            this._setEnabled(this.finishButton, false);
            this.wizardContainer.progress();
        }
    }
});
});