define([
    "dojo",
    "dojo/_base/declare",
    "dojo/dom-attr",
    "dojo/aspect",
    // Mixins
    "dijit/_KeyNavContainer"
],
function(dojo, declare, domAttr, aspect, _keyNavContainer) {
return declare("citrix.common._KeyNavContainerMixin", [_keyNavContainer], {
// fixes some issues in dijit._KeyNavContainer and adds in support for selecting a child with enter and space.

    selectOnNav: false, // should navigating to a child cause it to be selected. If false, use space to select
    findChildOnFocus: false, // on container focus, should it run findChild to choose a child to focus on (true), or just focus the first child (false)

    postCreate: function() {
        this.inherited(arguments);
        this.connectKeyNavHandlers([dojo.keys.UP_ARROW, dojo.keys.LEFT_ARROW], [dojo.keys.DOWN_ARROW, dojo.keys.RIGHT_ARROW]);
    },

    startup: function() {
        this.inherited(arguments);
        dojo.attr(this.domNode, "tabIndex", this.tabIndex);
        aspect.after(this, "resize", function() {
            this._focusChild();
        });
    },

    _onBlur: function(evt) {
        // overridden because the base function has forgotten that 0 is a valid tabIndex
        // but also equates to false in an if statement :/
        if(this.tabIndex == 0) {
            dojo.attr(this.domNode, "tabIndex", this.tabIndex);
        }
        this.inherited(arguments);
    },

    _startupChild: function(/*dijit._Widget*/ widget) {
        this.inherited(arguments);
        this.connect(widget, "onMouseDown", function(event) {
            this.focusChild(widget);
            dojo.attr(this.domNode, "tabIndex", "-1");
            this._onChildSelected(widget);
            dojo.stopEvent(event);
        });
    },

    _onContainerKeypress: function(evt){
        if(evt.ctrlKey || evt.altKey){ return; }
        var func = this._keyNavCodes[evt.charOrCode];
        if(func){
            func();
            dojo.stopEvent(evt);
            if(this.selectOnNav) {
                this._onChildSelected(this.focusedChild);
            }
        } else if(evt.keyCode == dojo.keys.SPACE) {
            this._onChildSelected(this.focusedChild);
            dojo.stopEvent(evt);
        }
    },

    _onContainerFocus: function(evt) {
        // Ignore spurious focus events:
        //	1. focus on a child widget bubbles on FF
        //	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
        if(evt.target !== this.domNode || this.focusedChild){ return; }

        // don't want to do focusing here because it messes with scrolling by the mouse if that's how focusing occurred

        // set the container's tabIndex to -1,
        // (don't remove as that breaks Safari 4)
        // so that tab or shift-tab will go to the fields after/before
        // the container, rather than the container itself
        domAttr.set(this.domNode, "tabIndex", "-1");
    },

    _focusChild: function() {

        // Determine if the widget is off screen XC-10099
        var pos = dojo.position (this.domNode);
        var viewport = dojo.window.getBox();
        if (pos.y > viewport.h) {
            return;
        }

        if(this.findChildOnFocus) {
            var widget = this.findChild();
            if(widget) {
                this.focusChild(widget);
            } else {
                this.focusFirstChild();
            }
        } else {
            this.focusFirstChild();
        }
    },

    _onChildSelected: function(widget) {
        // connect to or override this function if you want to know when a child is selected
    },

    // returns child widget or null. Override to provide specific functionality when this.findChildOnFocus == true
    findChild: function() {
        var children = this.getChildren();
        return children.length == 0 ? null : children[0];
    }
});
});