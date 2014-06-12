define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/layout/TabController",
    // Required in code
    "citrix/common/TabButton"
],
function(dojo, declare, tabController, tabButton) {
return declare("citrix.common.TabController", [tabController], {

    buttonWidget: tabButton,

    adjacent: function(/*Boolean*/ forward) {
        if(!this.isLeftToRight() && (!this.tabPosition || /top|bottom/.test(this.tabPosition))){ forward = !forward; }
        // find currently focused button in children array
        var children = this.getChildren();
        var current = dojo.indexOf(children, this.pane2button[this._currentChild.id]);
        // pick next button to focus on
        var nextChild;
        for (var i = 0; i < children.length; i++) {
            var offset = forward ? i+1 : children.length - i - 1;
            nextChild = children[ (current + offset) % children.length ]; // dijit._Widget
            if (nextChild.domNode.style.display != "none") {
                break;
            }
        }
        return nextChild;
    }
});
});