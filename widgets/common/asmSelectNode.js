define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/asmSelectNode.html",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_CssStateMixin"
],
function(dojo, declare, template, _widget, _templated, _cssStateMixin) {
return declare("citrix.common.asmSelectNode", [_widget, _templated, _cssStateMixin], {

    item: {},
    hint: "",
    templateString: template,
    tabIndex: 0,
    baseClass: "dndItem",

    postCreate: function() {
        this.inherited(arguments);
        if(this.hint == "avatar") {
            this.focusNode.style.display = "none";
        }
    },

    _onClick: function(event) {
        this.deleteNode(this.id);
    },

    _onKeyPress: function(event) {
        if(event.keyCode == dojo.keys.SPACE) {
            this.deleteNode(this.id);
        }
    },

    deleteNode: function(id) {
        // Function for parent to connect to.
    }
});
});