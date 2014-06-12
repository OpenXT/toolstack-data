define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "citrix/common/BoundWidget",
    "citrix/common/_CitrixWidgetMixin",
    "citrix/common/_EditableMixin"
],
function(dojo, declare, boundWidget, _citrixWidgetMixin, _editableMixin) {
return declare("citrix.common.EditableWidget", [boundWidget, _citrixWidgetMixin, _editableMixin], {

    editor: "",
	editorParams: "",
    readOnlyEditor: false,
    canSave: true,
    disabled: false,
    tabIndex: -1,
    _wrapperTabIndex: 0,
    returnValueAsString: false,
    _proxyEvents: ["onChange", "_handleOnChange", "onKeyUp"],
    // onChange is no good for some things because it occurs after  a timeout so you don't know
    // when it will happen, _handleOnChange is what sets that timeout up.

    constructor: function(args) {
        this._editorParams = args.editorParams ? dojo.fromJson(args.editorParams) : {};
        function proxyEvent(/*Event*/ event){}
        dojo.forEach(this._proxyEvents, function(event) {
            this[event] = proxyEvent;
        }, this);
    },

    buildRendering: function() {
        this.inherited(arguments);
        if (this.tabIndex != -1) {
            this._wrapperTabIndex = this.tabIndex;
            this.tabIndex = -1;
            this.displayNode.setAttribute('tabIndex', this.tabIndex);
        }
    },

    edit: function() {
        this.inherited(arguments);
        this._createWrapper();
        this._setWrapperValue(this.value);
        this._render();
	},

	save: function() {
        this.inherited(arguments);
        if(this.wrapperWidget && this.canSave) {
            var valid = true;
            if (this.wrapperWidget.isValid && typeof(this.wrapperWidget.isValid) == "function") {
                valid = this.wrapperWidget.isValid();
            }
            if (valid) {
                this.set('value', this.wrapperWidget.get("value"));
            }
        }
        this._render();
	},

	cancel: function() {
        this.inherited(arguments);
        this._setWrapperValue(this.value);
        this._render();
	},

    destroy: function() {
	    if(this.wrapperWidget) {
		    this.wrapperWidget.destroyRecursive();
			delete this.wrapperWidget;
		}
		this.inherited(arguments);
	},

    _getEditingValueAttr: function() {
        if (this.editing) {
            return this.wrapperWidget.get("value");
        }
        return this.value;
	},

    _getValueAttr: function() {
        if(this.returnValueAsString && this.value !== undefined) {
            return this.value.toString();
        }
        return this.value;
	},

    _setValueAttr: function(newValue) {
        this.inherited(arguments);
        this._setWrapperValue(this.value);
	},

    _setDisabledAttr: function(value) {
        this.disabled = value;
        this._render();
    },

    _setOptionsAttr: function(value) {
        this._options = value;
        if(this.wrapperWidget) {
            var editorMap = this._getEditorMap();
            this.wrapperWidget[editorMap.param] = this._options;
            switch(this.editor) {
                case "citrix.common.Select": {
                    this.wrapperWidget._loadChildren(true);
                    break;
                }
            }
            this._setWrapperValue(this.value);
        }
    },

    _createWrapper: function() {
        if(!this.wrapperWidget) {
            var placeholder = dojo.create("span", null, this.domNode, "before");
            var editor = dojo.getObject(this.editor);
            var editorMap = this._getEditorMap();
            if (this._options) {
                this._editorParams[editorMap.param] = this._options;
            } else if (this.map !== null) {
                if (editorMap.param) {
                    this._editorParams[editorMap.param] = dojo.map(this.map, function(item) {
                        var opt = {};
                        opt[editorMap.value] = item.value;
                        opt[editorMap.display] = item.display;
                        return opt;
                    }, this);
                }
            }
            this._editorParams["class"] = this._editorParams["class"] ? this._editorParams["class"] + " citrix" : "citrix";
            this._editorParams.tabIndex = this._wrapperTabIndex;
            this.wrapperWidget = new editor(this._editorParams, placeholder);
            // hookup any events
            dojo.forEach(this._proxyEvents, function(event) {
                if (this.wrapperWidget[event]) {
                    this.connect(this.wrapperWidget, event, event);
                }
            }, this);
            this.wrapperWidget.set("lastBoundValue", this.lastBoundValue);
        }
    },

    _setWrapperValue: function(value) {
        if(this.wrapperWidget) {
            this.wrapperWidget.set("displayedValue" in this.wrapperWidget ? "displayedValue" : "value", value);
        }
    },

    _render: function() {
        if (!this.readOnlyEditor) {
            this.inherited(arguments);
        } else {
            this._createWrapper();
        }
        if(this.wrapperWidget) {
            this._setDisplay(this.displayNode, !this.editing && !this.readOnlyEditor);
            this._setDisplay(this.wrapperWidget, this.editing || this.readOnlyEditor);
            this.wrapperWidget.set("disabled", this.disabled || (this.readOnlyEditor && !this.editing));
        }
    },

    _getEditorMap: function() {
        var editorMap = {};
        switch(this.editor) {
            case "citrix.common.Select":
            case "citrix.common.asmSelect": {
                editorMap = {param: 'options', display: 'label', value: 'value'};
                break;
            }
        }
        return editorMap;
    },

    _setLastBoundValueAttr: function(value) {
        if(this.wrapperWidget) {
            this.wrapperWidget.set("lastBoundValue", value);
        }
        this.lastBoundValue = value;
    }
});
});