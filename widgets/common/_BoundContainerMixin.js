define([
    "dojo",
    "dojo/_base/declare",
    "dijit"
],
function(dojo, declare, dijit) {
return declare("citrix.common._BoundContainerMixin", null, {

    _getPrefix: "get_",
    _setPrefix: "set_",
    _handles: [],

    constructor: function() {
        this._handles = [];
    },

    postCreate: function() {
        this.inherited(arguments);
        this._setupSave();
    },

    bind: function(source, rootNode, includeTemplates, attribute) {
        this._binding = true;
        var ignoreAttr = (includeTemplates) ? "" : "templateType";
        attribute = attribute || "name";
        var map = {};
        dojo.forEach(this.getDescendants(rootNode, ignoreAttr), function(widget) {
            if (!widget[attribute] || widget["bindIgnore"]) {
                return;
            }
            var entry = map[widget[attribute]] || (map[widget[attribute]] = []);
            entry.push(widget);
        });

        for(var name in map){
            if (!map.hasOwnProperty(name)) {
                continue;
            }
            var widgets = map[name];
            if (source[this._getPrefix + name]) {
                name = this._getPrefix + name;
            }
            var values = dojo.getObject(name, false, source);
            if (values === undefined){
                continue;
            }
            if (typeof(values) === "function") {
                values = values(this);
            }
            if (typeof widgets[0].checked == 'boolean') {
                // for checkbox/radio, values is a list of which widgets should be checked
                var value = (!dojo.isArray(values)) ? [values] : values;
                dojo.forEach(widgets, function(widget){
                    widget.set('value', dojo.indexOf(value, widget.value) != -1);
                    widget.set("lastBoundValue", dojo.indexOf(value, widget.value) != -1);
                });
                continue;
            }
            dojo.forEach(widgets, function(widget) {
                var value = (widget.multiple && !dojo.isArray(values)) ? [values] : values;
                widget.set('value', value);
                widget.set("lastBoundValue", value);
            });
        }
        this._binding = false;
    },

    unbind: function(rootNode, unbindDisabled, includeTemplates, attribute) {
        unbindDisabled = unbindDisabled || false;
        var ignoreAttr = (includeTemplates) ? "" : "templateType";
        attribute = attribute || "name";
        var obj = {};
        dojo.forEach(this.getDescendants(rootNode, ignoreAttr), function(widget) {
            if ((!unbindDisabled && widget.disabled) || !widget[attribute] || widget["bindIgnore"]) {
                return;
            }
            var name = widget[attribute];
            // Single value widget (checkbox, radio, or plain <input> type widget)
            var value = widget.get('value');

            // Store widget's value(s) as a scalar, except for checkboxes which are automatically arrays
            if (typeof widget.checked == 'boolean') {
                if (/Radio/.test(widget.declaredClass)) {
                    // radio button
                    if (value !== false) {
                        dojo.setObject(name, value, obj);
                    } else {
                        // give radio widgets a default of null
                        value = dojo.getObject(name, false, obj);
                        if (value === undefined) {
                            dojo.setObject(name, null, obj);
                        }
                    }
                } else {
                    // checkbox/toggle button
                    var ary=dojo.getObject(name, false, obj);
                    if(!ary) {
                        ary=[];
                        dojo.setObject(name, ary, obj);
                    }
                    if(value !== false) {
                        ary.push(value);
                    }
                }
            } else {
                var previous = dojo.getObject(name, false, obj);
                if (typeof previous != "undefined") {
                    if (dojo.isArray(previous)) {
                        previous.push(value);
                    } else {
                        dojo.setObject(name, [previous, value], obj);
                    }
                } else {
                    dojo.setObject(name, value, obj);
                }
            }
        });
        return obj;
    },

    saveValues: function(model, values, fn) {

        var setterUsed = false;

        for (var key in values) {

            // Remove null values or values bound to a function (not a setter)
            if (values[key] == null || typeof(model[key]) === "function") {
                delete values[key];
                continue;
            }

            var getter = model[this._getPrefix + key];
            var setter = model[this._setPrefix + key];

            // Deal with individual setters
            if (setter) {
                setterUsed = true;
                var result = setter(values[key]);
                if (typeof(result) == "undefined") {
                    delete values[key];
                    continue;
                } else {
                    values[key] = result;
                }
            }

            var oldValue = getter ? getter() : model[key];

            // Remove unchanged values
            if (oldValue == values[key]) {
                delete values[key];
                continue;
            }
        }

		if (Object.keys(values).length > 0) {
            if (fn) {
			    model.save(values, fn);
            } else {
                model.save(values);
            }
		} else if (setterUsed) {
            model.publish(XenConstants.TopicTypes.MODEL_SAVED);
            model.publish(XenConstants.TopicTypes.MODEL_CHANGED);
            if (fn) fn();
        }

        if(this.saveButton) {
            this.saveButton.set("disabled", true);
        }
    },

    getDescendants: function(rootNode, ignoreAttr) {
        rootNode = rootNode || this.containerNode;
        ignoreAttr = ignoreAttr || "";
        var selector = "[widgetId]";
        if (ignoreAttr != "") {
            selector += ":not([" + ignoreAttr + "])";
        }
		return rootNode ? dojo.query(selector, rootNode).map(dijit.byNode) : []; // dijit._Widget[]
	},

    _setupSave: function(/*Array | undefined*/ widgets) {
        if(this.saveButton) {
            var self = this;
            var onChange = function(newValue) {
                // 'this' is the widget context
                // self._binding == false because we don't want undefined to equate to false
                if(this._created && self._created && self._binding == false && newValue !== undefined
                    && ((this.wrapperWidget && this.wrapperWidget.isLoaded) ? this.wrapperWidget.isLoaded() : true) // for editablewidgets with selects as editors
                    && this.lastBoundValue !== undefined && this.get("lastBoundValue").toString() != newValue.toString()) {
                    self.saveButton.set("disabled", false);
                }
            };
            var onKeyUp = function(e) {
                var value;
                var context = this;
                switch(this.declaredClass) {
                    case "citrix.common.Repeater":
                        context = dijit.byNode(e.currentTarget);
                        value = context.get("value");
                        dojo.stopEvent(e);
                        break;
                    case "citrix.common.EditableWidget":
                        value = this.wrapperWidget ? this.get("editingValue") : this.get("value");
                        break;
                    default:
                        value = this.get("value");
                        break;
                };
                onChange.call(context, value);
            };
            dojo.forEach(widgets || this.getDescendants(), function(widget) {
                if(widget.name) {
                    if(widget._handleOnChange) {
                        // context needs to be null/not specified so it carries through whatever context the function already has
                        // this is important for getting this to work correctly for bound widgets within a Repeater
                        this._handles.push(dojo.connect(widget, "_handleOnChange", onChange));
                    }
                    if(widget.onKeyUp) {
                        this._handles.push(dojo.connect(widget, "onKeyUp", widget, onKeyUp));
                    }
                }
            }, this);
            this.saveButton.set("disabled", true);
        }
    },

    _attachTemplateNodes: function(rootNode, getAttrFunc) {
        this.inherited(arguments);
        if (getAttrFunc) {
            var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
            var x = dojo.isArray(rootNode) ? 0 : -1;
            for(; x<nodes.length; x++){
                var baseNode = (x == -1) ? rootNode : nodes[x];
                // Process dojoEventHandler
                var dojoEventHandler = getAttrFunc(baseNode, "dojoEventHandler") || getAttrFunc(baseNode, "data-dojo-event-handler");
                if(dojoEventHandler){
                    baseNode.dojoEventHandler = dojo.fromJson.call(this, dojoEventHandler);
                }
            }
        }
    },

    show: function() {
        if(this.saveButton) {
            this.saveButton.set("disabled", true);
        }
        this.inherited(arguments);
    },

    uninitialize: function() {
        dojo.forEach(this._handles, dojo.disconnect);
    }
});
});