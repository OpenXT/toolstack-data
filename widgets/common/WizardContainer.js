define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/WizardContainer.html",
    // Mixins
    "dijit/_Templated",
    "dijit/layout/StackContainer",
    "citrix/common/_CitrixWidgetMixin",
    // Required in code
    "citrix/common/WizardSteps"
],
function(dojo, declare, template, _templated, stackContainer, _citrixWidgetMixin, wizardSteps) {
return declare("citrix.common.WizardContainer", [stackContainer, _templated, _citrixWidgetMixin], {

    templateString: template,
    widgetsInTemplate: true,
    doLayout: false,

    controllerWidget: wizardSteps,
    ready: true,

    _makeSteps: function(/*DomNode*/ srcNode) {
        return new this.controllerWidget({
            id: this.id + "_steplist",
            dir: this.dir,
            lang: this.lang,
            doLayout: this.doLayout,
            containerId: this.id,
            nested: this.nested
        }, srcNode);
    },

    buildRendering: function() {
        this.inherited(arguments);

        this.stepList = this._makeSteps(this.stepsNode);
    },

    startup: function() {
        if(this._started) {return;}
        this.stepList.startup();
        this.inherited(arguments);

        if(this.selectedChildWidget) {
            dojo.publish(this.id + "-stateChange", [(this.selectedChildWidget.get("state") == "")]);
        }
    },

    resize: function() {
        if(!this.ready) {
            this.selectedChildWidget = null;
        }
        this.inherited(arguments);
    },

    selectChild: function(/*dijit._Widget|String*/ page, /*Boolean*/ animate){
        // summary:
        //		Show the given widget (which must be one of my children)
        //      OVERRIDES selectChild in base class
        // page:
        //		Reference to child widget or id of child widget

        page = dijit.byId(page);

        if(this.selectedChildWidget != page){
            // Deselect old page and select new one
            var d = this._transition(page, this.selectedChildWidget, animate);
            this._set("selectedChildWidget", page);
            var prevSibling = page.getPreviousSibling();
            var returnable = prevSibling != null && prevSibling.get("isReturnable");
            dojo.publish(this.id + "-selectChild", [page, returnable]);

            dojo.publish(this.id + "-stateChange", [(page.get("state") == "")]);

            if(this.persist){
                dojo.cookie(this.id + "_selectedChild", this.selectedChildWidget.id);
            }
        }

        var children = this.getChildren();
        this._setDisplay(this.spacerNode, children.length > 1);
        this._setDisplay(this.stepList, children.length > 1);

        this.getParent()._position();

        return d;		// If child has an href, promise that fires when the child's href finishes loading
    },

    progress: function() {
        if(this.selectedChildWidget.validate()) {
            var nextFunction = this.selectedChildWidget.isLastChild ? this.finish : this.forward;
            if(this.selectedChildWidget.onNextFunction) {
                this.selectedChildWidget.onNextFunction(dojo.hitch(this, nextFunction));
            }
            else {
                nextFunction();
            }
        }
    },

    destroy: function() {
		if(this.stepList){
			this.stepList.destroy();
		}
		this.inherited(arguments);
	},

    cancel: function() {
        dojo.publish(this.id + "-cancel");
    },

    finish: function() {
        dojo.publish(this.id + "-finish");
    }
});
});