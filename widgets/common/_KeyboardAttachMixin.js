define([
    "dojo",
    "dojo/_base/declare",
    "dijit/popup",
    "dijit/focus"
],
function(dojo, declare, dPopup, focus) {
return declare("citrix.common._KeyboardAttachMixin", null, {

    _showKeyboard: false,

    constructor: function() {
        if(XenConstants.Defaults.KEYBOARD) {
            this._showKeyboard = true;
        }
    },

    openKeyboard: function() {
        if(!this._showKeyboard) {
            return;
        }

        this.setNodes();

        var self = this;
        dPopup.open({
            popup: XUICache.Host.keyboard,
            x: 0,
            y: 0,
            onCancel: function() {
                dPopup.close(XUICache.Host.keyboard);
            },
            onClose: function() {
                self._keyboardOpen = false;
                if(self.declaredClass == "citrix.common.NumberSpinner") {
                    self.set("value", self.get("value")); // forces the constraints to be enforced.
                }
            },
            onExecute: function() {
            }
        });
    },

    setNodes: function() {
        XUICache.Host.keyboard.set("targetNode", this.focusNode);
        XUICache.Host.keyboard.set("targetWidget", this);
    },

    onFocus: function() {
        this.inherited(arguments);
        if(this._keyboardOpen !== true) {
            this.openKeyboard();
        }
    },

    onBlur: function() {
        this.inherited(arguments);
        var handle = focus.watch("curNode", dojo.hitch(this, function(prop, oldVal, newVal) {
            if(newVal != null) {
                handle.unwatch();
                var widget = dijit.byNode(newVal);
                if(this._keyboardOpen == true && (!widget || widget.declaredClass != "citrix.xenclient.Keyboard")) {
                    dPopup.close(XUICache.Host.keyboard);
                }
            }
        }));
    }
});
});