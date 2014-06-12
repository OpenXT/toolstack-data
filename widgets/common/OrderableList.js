define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/OrderableList.html",
    // Mixins
    "dijit/layout/_LayoutWidget",
    "dijit/_Templated",
    // Required in code
    "citrix/common/OrderableHorizItem"
],
function(dojo, declare, template, _layoutWidget, _templated, orderableHorizItem) {
return declare("citrix.common.OrderableList", [_layoutWidget, _templated], {

    templateString: template,
    name: "",
    value: [], /* Array containing objects with the following properties {"uuid": "", "info": "", "position": 0} */

    postCreate: function() {
        this.inherited(arguments);
        this._addChildren();
    },

    childMoved: function(){
        var newData = [];
        dojo.forEach(this.getChildren(), function(item, i){
            newData[i] = {"uid": item.uid, "info": item.info, "position": i};
        });
        this.value = newData;
        this._handleOnChange(this._valueToSensibleString(newData));
    },

    _handleOnChange: function(newValue, priorityChange) {
        // stub for _BoundContainerMixin to connect to
    },

    _setValueAttr: function(value) {
        var newData = (typeof(value) === "function") ? value() : value;
        if (newData != this.value) {
            this.value = newData;
            this._removeChildren();
            this._addChildren();
        }
	},

    _getLastBoundValueAttr: function() {
        // used for seeing if a value has actually changed, and will be compared to newValue passed into _handleOnChange
        return this._valueToSensibleString(this.lastBoundValue);
    },

    _removeChildren: function(){
        dojo.forEach(this.getChildren(), function(item){
            this.removeChild(item);
            item.destroyRecursive();
        }, this);
    },

    _addChildren: function() {
        if(this.value != null){
            var children = this.value;
            children.sort(function(a,b){
                return a.position - b.position;
            });
            dojo.forEach(children, function(item, i){
                var listItem = new orderableHorizItem({uid: item.uid, info: item.info});
                this.addChild(listItem);
            }, this);
        }
    },

    _moveChildren: function(child, moveAmount, targetNode) {
        var newIndex = child.getIndexInParent() + moveAmount;
        var children = this.getChildren();
        if(newIndex >= 0 && newIndex <= children.length - 1) {
            this.removeChild(child);
            this.addChild(child, newIndex);
            if(newIndex == 0) {
                child.increaseButton.focus();
            } else if(newIndex == children.length - 1) {
                child.decreaseButton.focus();
            } else {
                targetNode.focus();
            }
            this.childMoved();
        }
    },

    _valueToSensibleString: function(value) {
        var returnString = "";
        dojo.forEach(value, function(item, i) {
            if(returnString !== "") {
                returnString += ", ";
            }
            returnString += item.uid.toString();
        });
        return returnString;
    }
});
});