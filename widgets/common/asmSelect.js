define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/asmSelect.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_CssStateMixin",
    "citrix/common/_CitrixWidgetMixin",
    // Required in code
    "citrix/common/asmSelectNode",
    "citrix/common/Manager",
    "citrix/common/Source",
    "citrix/common/Select"
],
function(dojo, declare, template, _widget, _templated, _cssStateMixin, _citrixWidgetMixin, asmSelectNode) {
return declare("citrix.common.asmSelect", [_widget, _templated, _cssStateMixin, _citrixWidgetMixin], {

    templateString: template,
    value: "",
    options: null,
    label: "",
    _nodeHandles: {},
    _nodeRefs: {},

    constructor: function() {
        this._nodeHandles = {};
        this._nodeRefs = {};
    },

    postCreate: function() {
        this.inherited(arguments);
        if (!dojo.dnd._manager) {
            dojo.dnd._manager = new citrix.common.Manager();
            dojo.dnd._manager.verticalOnly = true;
        }
        this._dndWidget = new citrix.common.Source(this.dndNode, {singular: true, moveOnly: true});
        this._dndWidget.creator = dojo.hitch(this, "_deletableNodeCreator");
        this._selectWidget = new citrix.common.Select({options: this.options, emptyLabel: this.label}, this.selectNode);
        this._selectWidget._loadChildren(true);
        this._selectWidget.set("value", "");
        this._selectWidget._isLoaded = true;
        this.connect(this._selectWidget, "onChange", "_onSelectChange");
        this.connect(this._dndWidget, "onDrop", "_onDrop");
    },

    _getValueAttr: function() {
        var options = [];
        dojo.forEach(this._dndWidget.getAllNodes(), function(node) {
            this._dndWidget.forInItems(function(data, id) {
                if (node.id == id) {
                    options.push(data.data.value);
                }
            });
        }, this);
        return options;
    },

    _setValueAttr: function(newValue) {
        this.value = newValue;
        this._setup();
    },

    _onSelectChange: function() {
        var value = this._selectWidget.get("value");
        this._selectToDnd(value);
    },

    _selectToDnd: function(value) {
        if (value != "") {
            var option = this._optionFromValue(value);
            var node = this._getSelectOption(value);
            this._dndWidget.insertNodes(false, [option]);
            this._setEnabled(node, false);
            this._selectWidget.set("value", "");
            this._handleOnChange(this.get("value"));
        }
    },

    _handleOnChange: function(newValue, priorityChange) {
        // stub for _BoundContainerMixin to connect to
    },

    _onDrop: function(source, nodes, copy) {
        this._handleOnChange(this.get("value"));
    },

    _deleteNodes: function(all, nodeIds) {
        if(all) {
            this._dndWidget.selectAll();
            for(var handle in this._nodeHandles) {
                if(this._nodeHandles.hasOwnProperty(handle)) {
                    dojo.disconnect(this._nodeHandles[handle]);
                    delete this._nodeHandles[handle];
                }
            }
            for(var ref in this._nodeRefs) {
                if(this._nodeRefs.hasOwnProperty(ref)) {
                    this._nodeRefs[ref].destroyRecursive();
                    delete this._nodeRefs[ref];
                }
            }
            this._dndWidget.deleteSelectedNodes();
        } else if(nodeIds) {
            dojo.forEach(nodeIds, function(nodeId) {
                this._dndWidget.selection[nodeId] = {};
                dojo.disconnect(this._nodeHandles[nodeId]);
                delete this._nodeHandles[nodeId];
                this._nodeRefs[nodeId].destroyRecursive();
                delete this._nodeRefs[nodeId];
            }, this);
            this._dndWidget.deleteSelectedNodes();
        }
    },

    _dndToSelect: function(id) {
        var value = this._dndWidget.map[id].data.value;
        var node = this._getSelectOption(value);
        this._deleteNodes(false, [id]);
        this._setEnabled(node, true);
        this._selectWidget.set("value", "");
        this._selectWidget.focus();
        this._handleOnChange(this.get("value"));
    },

    _getSelectOption: function(value) {
        var result = null;
        dojo.some(this._selectWidget._getChildren(), function(child) {
            if (child.option.value == value) {
                result = child;
                return true;
            }
        });
        return result;
    },

    _optionFromValue: function(value) {
        var result = null;
        dojo.some(this.options, function(option) {
            if (option.value == value) {
                result = option;
                return true;
            }
        });
        return result;
    },

    _setup: function() {
        this._deleteNodes(true);
        dojo.forEach(this.options, function(option) {
            var node = this._getSelectOption(option.value);
            this._setEnabled(node, true);
        }, this);
        dojo.forEach(this.value, this._selectToDnd, this);
    },

    _deletableNodeCreator: function(item, hint) {
        var node = new asmSelectNode({item: item, hint: hint});
        this._nodeRefs[node.id] = node;
        if(hint != "avatar") {
            this._nodeHandles[node.id] = dojo.connect(node, "deleteNode", this, "_dndToSelect");
        }
        return { node: node.domNode, data: item };
    },

    uninitialize: function() {
        for(var handle in this._nodeHandles) {
            if(this._nodeHandles.hasOwnProperty(handle)) {
                dojo.disconnect(this._nodeHandles[handle]);
                delete this._nodeHandles[handle];
            }
        }
        for(var ref in this._nodeRefs) {
            if(this._nodeRefs.hasOwnProperty(ref)) {
                this._nodeRefs[ref].destroyRecursive();
                delete this._nodeRefs[ref];
            }
        }
        this._dndWidget.destroy();
        if(!this._selectWidget._beingDestroyed) {
            this._selectWidget.destroyRecursive();
        }
        this.inherited(arguments);
    }
});
});