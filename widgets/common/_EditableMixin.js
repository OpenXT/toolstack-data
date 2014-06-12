define([
    "dojo",
    "dojo/_base/declare"
],
function(dojo, declare) {
return declare("citrix.common._EditableMixin", null, {

    editing: false,

    edit: function() {
		if(this.editing) {
            return;
        }
		this.editing = true;
	},

	save: function() {
		if(!this.editing) {
            return;
        }
		//this.editing = false;
	},

	cancel: function() {
		if(!this.editing) {
            return;
        }
		this.editing = false;
	},

    _setEditingAttr: function(value) {
        if (value) {
            this.edit();
        } else {
            this.editing = value;
        }
    }
});
});