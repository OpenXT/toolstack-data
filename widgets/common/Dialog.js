define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/Dialog.html",
    // Mixins
    "dijit/Dialog",
    "dijit/_WidgetsInTemplateMixin",
    "citrix/common/_CitrixWidgetMixin",
    "dijit/form/_FormMixin"
],
function(dojo, declare, template, dialog, _widgetsInTemplate, _citrixWidgetMixin, _formMixin) {
return declare("citrix.common.Dialog", [dialog, _widgetsInTemplate, _citrixWidgetMixin], {

    templateString: template,
    baseClass: "citrixDialog",
    draggable: false,
    canExecute: false,
    canCancel: true,
    destroyOnHide: false,
    needsValidation: false,

    attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
        title: [{ node: "titleNode", type: "innerHTML" }],
        "aria-describedby":""
    }),

    postMixInProperties: function() {
        if (this.needsValidation) {
            dojo.mixin(this, _formMixin);
        }
        this.inherited(arguments);
    },

    postCreate: function() {
        this.inherited(arguments);
        this.watch("canCancel", function(propName, oldVal, newVal) {
            this._setDisplay(this.closeButtonNode, newVal);
        });
        this._setDisplay(this.closeButtonNode, this.canCancel);
    },

    show: function() {
        if(this.open) {
            dialog._DialogLevelManager.hide(this);
            dialog._DialogLevelManager.show(this, this.underlayAttrs);
        }
        this.inherited(arguments);
    },

    hide: function() {
        // possible dojo bug, occasionally this.inherited(arguments) returns undefined
        // so need to check this since once this happens the dialog cannot be created again
        // e.g. found this would happen with MediaWizard on cancelling, about 1 in 30 times
        var deferred = this.inherited(arguments);
        if(deferred) {
            return deferred.then(dojo.hitch(this, this.afterHide));
        }
        this.afterHide();
    },

    afterHide: function() {
        if(this.destroyOnHide) {
            this.destroyRecursive();
        }
    },

    onFinish: function() {
        if (!this.needsValidation || this.validate()) {
            this.onExecute();
        }
    },

    // Suppress base functionality as it resizes dialogs to fit the viewport and we don't want that
    _size: function() {

    },

    _onKey: function(evt) {
        if(evt.charOrCode == dojo.keys.ENTER && this.canExecute
            && evt.srcElement && evt.srcElement.type != "textarea") {
            this.onFinish();
            dojo.stopEvent(evt);
            return;
        } else if(evt.charOrCode == dojo.keys.ESCAPE && !this.canCancel) {
            dojo.stopEvent(evt);
            return;
        }
        this.inherited(arguments);
    },

    _stringRepl: function(tmpl){
        // summary:
        //		Does substitution of ${foo} type properties in template string
        // tags:
        //		private
        var className = this.declaredClass, _this = this;
        // Cache contains a string because we need to do property replacement
        // do the property replacement
        return dojo.string.substitute(tmpl, this, function(value, key){
            if(key.charAt(0) == '!'){ value = dojo.getObject(key.substr(1), false, _this); }
            if(typeof value == "undefined"){ throw new Error(className+" template:"+key); } // a debugging aide
            if(value == null){ return ""; }

            // Substitution keys beginning with ! will skip the transform step,
            // in case a user wishes to insert unescaped markup, e.g. ${!foo}
            return key.charAt(0) == "!" ? value :
                // Safer substitution, see heading "Attribute values" in
                // http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
                value.toString().replace(/"/g,"&quot;").replace(/'/g,"&rsquo;"); //TODO: add &amp? use encodeXML method?
        }, this);
    }
});
});