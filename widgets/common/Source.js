define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dojo/dnd/Source"
],
function(dojo, declare, source) {
return declare("citrix.common.Source", [source], {

    moveOnly: false,

    copyState: function() {
        if (this.moveOnly) {
            return false;
        }

        this.inherited(arguments);
	},

    deleteSelectedNodes: function() {
   		// summary:
   		//		deletes all selected items
        //      overridden to also destroy the dijit if the node is actually a dijit
   		var e = dojo.dnd._empty;
   		for(var i in this.selection) {
            if(i in e){ continue; }
            var n = dijit.byId(i);
            if(n) {
                n.destroyRecursive(false);
            } else {
                n = dojo.byId(i);
                dojo.destroy(n);
            }
            this.delItem(i);
   		}
   		this.anchor = null;
   		this.selection = {};
   		return this;	// self
   	}
});
});