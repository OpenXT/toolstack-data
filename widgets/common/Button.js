define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/Button.html",
    // Mixins
    "dijit/form/Button"
],
function(dojo, declare, template, button) {
return declare("citrix.common.Button", [button], {

    templateString: template,

    postCreate: function() {
        this.inherited(arguments);
        this.on("keypress", this._onKey);
    },

    _onKey: function(evt) {
        // this is to make sure the button captures the key press before the container - using ondijitclick
        // doesn't seem to accomplish this since dojo 1.7.2, so cancel the keypress event and let the ondijitclick do its thing
        // also sometimes evt.charOrCode doesn't return keyCode for SPACE here (but does elsewhere) hence using evt.keyCode
        if(evt.keyCode == dojo.keys.ENTER || evt.keyCode == dojo.keys.SPACE) {
            dojo.stopEvent(evt);
        }
    },

    _onClick: function(evt) {
        this.inherited(arguments);
    }
});
});