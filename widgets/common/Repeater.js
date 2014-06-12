define([
    "dojo",
    "dojo/_base/declare",
    "dijit",
    // Mixins
    "dijit/_Widget",
    "citrix/common/_BoundContainerMixin",
    "citrix/common/_EditableMixin",
    "citrix/common/_CitrixWidgetMixin"
],
function(dojo, declare, dijit, _widget, _boundContainerMixin, _editableMixin, _citrixWidgetMixin) {
return declare("citrix.common.Repeater", [_widget, _boundContainerMixin, _editableMixin, _citrixWidgetMixin], {

    dojoEventHandler: "", // this is often a reference to the parent widget, set in the markup
    name: "",
    unbindDisabled: false,
    uniqueId: "id",
    templateAttr: "template",
    bindAttr: "bind",
    emptyAttr: "empty",
    templateHtml: "",
    emptyHtml: "",
    options: {},
    _connectHandles: [],
    _proxyEvents: ["_handleOnChange", "onKeyUp"],

    constructor: function() {
        this._connectHandles = [];
        function proxyEvent(/*Event*/ event){}
        dojo.forEach(this._proxyEvents, function(event) {
            this[event] = proxyEvent;
        }, this);
    },

    buildRendering: function() {
        this.inherited(arguments);
        this._getNodes();
        this._bindDijit();
    },

    destroy: function() {
        dojo.forEach(this.getChildren(), function(widget) {
            widget.destroyRecursive();
        });
        dojo.forEach(this._connectHandles, function(handle) {
            dojo.disconnect(handle);
        });
        this.inherited(arguments);
    },

    setOptions: function(key, value) {
        this.options[key] = value;
        this._bindDijit();
    },

    _getValueAttr: function() {
        if (!this.value || this.value.length == 0) {
            return null;
        }
        var results = [];
        dojo.forEach(this._getChildNodeList(), function(node, i) {
            var obj = this.unbind(node, this.unbindDisabled, true, this.bindAttr);
            obj[this.uniqueId] = this.value[i][this.uniqueId];
            results.push(obj);
        }, this);
        return results;
	},

    _setValueAttr: function(newValue) {
        this.value = newValue;
        this._bindDijit();
	},

    _getNodes: function() {
        var templateNode = dojo.query('[' + this.templateAttr + ']', this.srcNodeRef)[0] || null;
        var emptyNode = dojo.query('[' + this.emptyAttr + ']', this.srcNodeRef)[0] || null;

        if (templateNode) {
            this.containerNode = templateNode.parentNode;
            this.containerNode.removeChild(templateNode);
            dojo.removeAttr(templateNode, this.templateAttr);
            this.templateHtml = templateNode.outerHTML;
        }

        if (emptyNode) {
            this.containerNode = emptyNode.parentNode;
            this.containerNode.removeChild(emptyNode);
            dojo.removeAttr(emptyNode, this.emptyAttr);
            this.emptyHtml = emptyNode.outerHTML;
        }
    },

    _bindDijit: function() {
        this._clearItems();
        this._addItems();
    },

    _clearItems: function() {
        dojo.forEach(this.getChildren(), function(widget) {
            widget.destroyRecursive();
        });
        dojo.forEach(this._connectHandles, function(handle) {
            dojo.disconnect(handle);
        });
        this.containerNode.innerHTML = "";
        this.optionWidgets = {};
    },

    _addItems: function() {
        if ((this.templateHtml || this.emptyHtml) && this.containerNode && this.value) {
            if (this.value.length == 0) {
                this._addItem(this.emptyHtml);
                return;
            }
            dojo.forEach(this.value, function(item) {
                this._addItem(this.templateHtml, item);
            }, this);
        }

        dojo.forEach(this.getChildren(), function(widget) {
            if (typeof widget.editing !== "undefined") {
                widget.set("editing", this.editing);
            }
            dojo.forEach(this._proxyEvents, function(event) {
                if(widget[event]) {
                    if(event == "_handleOnChange") {
                        // in this case we want the context to be that of the widget initiating the event
                        this._connectHandles.push(dojo.connect(widget, event, widget, this[event]));
                    } else {
                        this._connectHandles.push(dojo.connect(widget, event, this, event));
                    }
                }
            }, this);
        }, this);
    },

    _addItem: function(html, item) {
        if (item) {
            if (typeof(item) != "object") {
                item = [item];
            }
            html = dojo.replace(html, item, /%([^%]+)%/g);
        }
        var node = dojo._toDom(html);
        var widgets = dojo.parser.parse(node, {
            scope: "template"
        });

        this._attachTemplateNodes(widgets);
        this._setupOptions(widgets);
        this.bind(item, node, true, this.bindAttr);
        this.containerNode.appendChild(node);
    },

    _setupOptions: function(widgets) {
        dojo.forEach(widgets, function(widget) {
            if (widget.optionskey) {
                if (this.options[widget.optionskey]) {

                    function getSelectOption(value) {
                        var result = null;
                        dojo.some(widget._getChildren(), function(child) {
                            if (child.option.value == value) {
                                result = child;
                                return true;
                            }
                        });
                        return result;
                    }

                    var opts = dojo.clone(this.options[widget.optionskey]);
                    widget.set("options", opts);

                    dojo.forEach(opts, function(option) {
                        if (option.disabled) {
                            var node = getSelectOption(option.value);
                            if (node) {
                                this._setEnabled(node, false);
                            }
                        }
                    }, this);
                }
            }
        }, this);
    },

    _attachTemplateNodes: function(rootNode){
        if (this.dojoEventHandler) {
            var getAttrFunc = function(n,p) {
                return n[p];
            };
            var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
            var x = dojo.isArray(rootNode) ? 0 : -1;
            for(; x<nodes.length; x++){
                var baseNode = (x == -1) ? rootNode : nodes[x];
                // Process dojoAttachEvent
                var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
                if(attachEvent) {
                    // NOTE: we want to support attributes that have the form
                    // "domEvent: nativeEvent; ..."
                    var event, events = attachEvent.split(/\s*,\s*/);
                    var trim = dojo.trim;
                    while((event = events.shift())){
                        if(event){
                            var thisFunc = null;
                            if(event.indexOf(":") != -1){
                                // oh, if only JS had tuple assignment
                                var funcNameArr = event.split(":");
                                event = trim(funcNameArr[0]);
                                thisFunc = trim(funcNameArr[1]);
                            }else{
                                event = trim(event);
                            }
                            if(!thisFunc){
                                thisFunc = event;
                            }
                            this._connectHandles.push(dojo.connect(baseNode, event, this.dojoEventHandler, thisFunc));
                        }
                    }
                }
            }
        }
    },

    _getChildNodeList: function(node) {
        node = node || this.containerNode;
        return new dojo.NodeList(node).children();
    }
});
});