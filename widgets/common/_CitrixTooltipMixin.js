define([
    "dojo",
    "dojo/_base/declare",
    // Required in code
    "citrix/common/Tooltip"
],
function(dojo, declare, tooltip) {
/*
    When mixed in with a widget that contains nodes, setting "title" attribute on child nodes and
     calling "_bindDijit" will result in a tooltip.
 */
return declare("citrix.common._CitrixTooltipMixin", null, {

    _citrixTooltips: null,
    _idCounter: 0,

    constructor: function() {
        this._citrixTooltips = {};
    },

    _bindDijit: function() {
        this.bindTooltips();
    },

    bindTooltips: function() {
        dojo.forEach(dojo.query("[title]", this.containerNode), function(item) {
            var id = dojo.attr(item, "id");
            var title = dojo.attr(item, "title");
            var preserve = dojo.attr(item, "pre") || false;
            if(this._citrixTooltips[id]) {
                this._citrixTooltips[id].setTooltip(id);
            } else if (title != "") {
                if (preserve) {
                    dojo.attr(item, "title", "<span style='white-space:pre'>" + title + "</span>");
                }
                var position = [dojo.attr(item, "position") || "below"];
                if (!id && title != "") {
                    id = this.id + "_tooltipNode_" + (this._idCounter++).toString();
                    dojo.attr(item, "id", id);
                }
                this._citrixTooltips[id] = new tooltip({ connectId: id, position: position, showDelay: 200, baseClass: "citrixTooltip" });
                if(this._started) {
                    this._citrixTooltips[id].startup();
                }
            }
            // don't bother creating tooltip if title exists but is empty
        }, this);
    },

    startup: function() {
        if(!this._started) {
            for (var tooltip in this._citrixTooltips) {
                if(this._citrixTooltips.hasOwnProperty(tooltip)) {
                    this._citrixTooltips[tooltip].startup();
                }
            }
        }
        this.inherited(arguments);
    },

    destroy: function() {
        for(var tooltip in this._citrixTooltips) {
            if(this._citrixTooltips.hasOwnProperty(tooltip)) {
                this._citrixTooltips[tooltip].destroy();
                delete this._citrixTooltips[tooltip];
            }
        }
        this._citrixTooltips = {};
        this.inherited(arguments);
    }
});
});