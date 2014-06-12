define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/MenuBarItem.html",
    // Mixins
    "citrix/common/_CitrixWidgetMixin"
],
function(dojo, declare, template, _citrixWidgetMixin) {
return declare("citrix.common._MenuBarItemMixin", [_citrixWidgetMixin], {

    templateString: template,
    baseClass: "citrixMenuBarItem",
    splitter: "",
    visible: true,

    postCreate: function() {
        this.inherited(arguments);
        var left = false;
        var right = false;

        switch(this.splitter) {
            case "left" : {
                left = true;
                break;
            }
            case "right" : {
                right = true;
                break;
            }
            case "both" : {
                left = true;
                right = true;
                break;
            }
        }

        this._setDisplay(this.leftSplitterNode, left);
        this._setDisplay(this.rightSplitterNode, right);

        if (!this.visible) {
            this._setDisplay(this.domNode, false);
        }
    },

    isFocusable: function() {
        return this.inherited(arguments);
    },

    _setSelected: function(){
        // Override base implementation which has hardcoded class in it
    }
});
});