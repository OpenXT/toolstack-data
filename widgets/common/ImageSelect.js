define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/ImageSelect.html",
    // Mixins
    "dijit/layout/_LayoutWidget",
    "dijit/_Templated",
    "citrix/common/_KeyNavContainerMixin",
    "citrix/common/_EditableMixin",
    // Required in code
    "citrix/common/ImageItem"
],
function(dojo, declare, template, _layoutWidget, _templated, _keyNavContainerMixin, _editableMixin, imageItem) {
return declare("citrix.common.ImageSelect", [_layoutWidget, _templated, _keyNavContainerMixin, _editableMixin], {

    templateString: template,
    imageWidget: imageItem,
    name: "",
    source: null,
    itemClass: "",
    itemClassSmall: "",
    classThreshold: 10,
    _originalValue: "",
    selectOnNav: true,
    findChildOnFocus: true,

    postCreate: function() {
        this.inherited(arguments);
        this._updateChildren();
    },

    edit: function() {
		this.inherited(arguments);
        this._originalValue = this.value;
        this._updateChildren();
	},

	save: function() {
        this.inherited(arguments);
        this._originalValue = this.value;
        this._updateChildren();
	},

	cancel: function() {
        this.inherited(arguments);
        this.value = this._originalValue;
        this._updateChildren();
	},

    _onChildSelected: function(child) {
        this.inherited(arguments);
        if (!child.disabled) {
            this.setSelected(child.image);
        }
    },

    _setEditingAttr: function(value) {
        this.inherited(arguments);
        this.set("tabIndex", value ? 0 : -1);
    },

    setSelected: function(value) {
        this._handleOnChange(value);
        this.value = value;
        this._updateChildren();
    },

    _handleOnChange: function(newValue) {
        // stub for _BoundContainerMixin to connect to (exists in dijit.form._FormWidget)
    },

    _setValueAttr: function(value) {
        var newValue = (typeof(value) === "function") ? value() : value;
        if (newValue != this.value) {
            this.value = newValue;
            this._originalValue = this.value;
            this._updateChildren();
        }
	},

    _setSourceAttr: function(value) {
        this.source = value;
        this._updateChildren();
    },

    _updateChildren: function() {
        if (this.source != null) {
            var baseClass = (this.itemClassSmall != "" && this.source.length > this.classThreshold) ? this.itemClassSmall : this.itemClass;
            dojo.forEach(this.source, function(srcItem) {
                if (!dojo.some(this.getChildren(), function(item) { return srcItem == item.image; })) {
                    // image doesn't exist in the children already, so add
                    var imageItem = new this.imageWidget({image: srcItem, baseClass: baseClass});
                    this.addChild(imageItem);
                }
            }, this);
        }
        dojo.forEach(this.getChildren(), function(item) {
            item.set("selected", (item.image == this.value));
            item.set("disabled", !this.editing);
        }, this);
    },

    findChild: function() {
        // want to return the child matching the current value
        var result = null;
        dojo.some(this.getChildren(), function(child){
            if(child.image == this.value) {
                result = child;
                return true;
            }
        }, this);
        return result;
    }
});
});