define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/WizardSteps.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Container",
    // Required in code
    "citrix/common/WizardStepItem"
],
function(dojo, declare, template, _widget, _templated, _container, wizardStepItem) {
return declare("citrix.common.WizardSteps", [_widget, _templated, _container], {

    templateString: template,
    widgetsInTemplate: true,

    stepItemWidget: wizardStepItem,
    containerId: "",

    // markers have been put in PURELY because Midori will not let me have a css table-cell with position:relative
    // and elements in it that are aboslute relative to the table-cell. Chrome lets me.
    constructor: function(){
        this.pane2steps = {};		// mapping from pane id to steps
        this.pane2markers = {};     // mapping from pane id to markers
    },

    postCreate: function() {
        this.inherited(arguments);

        // Listen to notifications from StackContainer
        this.subscribe(this.containerId + "-startup", "onStartup");
        this.subscribe(this.containerId + "-selectChild", "onSelectChild");
        this.subscribe(this.containerId + "-removeChild", "onRemoveChild");
        this.subscribe(this.containerId + "-addChild", "onAddChild");
    },

    onStartup: function(/*Object*/ info){
        dojo.forEach(info.children, this.onAddChild, this);
        if(info.selected){
            // Show button corresponding to selected pane (unless selected
            // is null because there are no panes)
            this.onSelectChild(info.selected);
        }
    },

    onAddChild: function(/*dijit._Widget*/ page, /*Integer?*/ insertIndex){
        var element = new this.stepItemWidget({
            id: this.id + "_" + page.id,
            label: page.title,
            dir: page.dir,
            lang: page.lang
        });
        var marker = new this.stepItemWidget({
            id: this.id + "_" + page.id + "_marker",
            label: "",
            baseClass: "citrixWizardStepMarker",
            dir: page.dir,
            lang: page.lang
        });

        this.addChild(element, insertIndex);
        dojo.place(marker.domNode, this.markerNode, insertIndex);
        this.pane2steps[page.id] = element;
        this.pane2markers[page.id] = marker;

        if(!this._currentChild){
            this._currentChild = page;
        }
    },

    onSelectChild: function(/*dijit._Widget*/ page){
        if(!page){ return; }

        if(this._currentChild){
            this.pane2steps[this._currentChild.id].set("selected", false);
            this.pane2markers[this._currentChild.id].set("selected", false);
        }

        this.pane2steps[page.id].set("selected", true);
        this.pane2markers[page.id].set("selected", true);
        this._currentChild = page;
    },

    onRemoveChild: function(/*dijit._Widget*/ page) {
        if(this._currentChild === page) {
            this._currentChild = null;
        }
        var step = this.pane2steps[page.id];
        if(step) {
            this.removeChild(step);
            delete this.pane2steps[page.id];
            step.destroy();
        }
        var marker = this.pane2markers[page.id];
        if(marker) {
            delete this.pane2markers[page.id];
            marker.destroy();
        }
    }
});
});