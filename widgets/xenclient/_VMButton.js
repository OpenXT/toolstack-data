define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/_Widget",
    "dijit/_Templated",
    "dijit/_Contained",
    "dijit/_CssStateMixin"
],
function(dojo, declare, _widget, _templated, _contained, _cssStateMixin) {
return declare("citrix.xenclient._VMButton", [_widget, _templated, _contained, _cssStateMixin], {

    widgetsInTemplate: true,
    _focusCounter: 0,
    _focusThreshold: 3,
    _keyDown: false,

    postCreate: function() {
        this.containerNode.setAttribute("role", "button");
		if(!this.containerNode.getAttribute("tabIndex")){
			this.containerNode.setAttribute("tabIndex", 0);
		}
        this.on("keydown", this._onKeyPress);
        this.inherited(arguments);
    },

    activate: function(event) {
    },

    _onMouseMove: function() {
        if (this._focusCounter == 0) {
            this.containerNode.focus();
        }
        this._focusCounter ++;
    },

    _onMouseOut: function() {
        if (this._focusCounter != 0) {
            this.containerNode.blur();
            this._focusCounter = 0;
        }
    },

    _onClick: function(event) {
        if (this._focusCounter < this._focusThreshold) {
            this.containerNode.focus();
            this._focusCounter ++;
            return;
        }
        this.activate(event);
    },

    _onKeyPress: function(event){
        //only start listening for keyup after key down
        if (!this.keyDown){
            var signal = this.on("keyup", function() {
                if (event.keyCode == dojo.keys.SPACE || event.keyCode == dojo.keys.ENTER) {
                    this.activate(event);
                }

                this.keyDown = false;
                //remove the listener so we need to get another
                //keydown first
                signal.remove();
            });
        }
        this.keyDown = true;
    }
});
});
