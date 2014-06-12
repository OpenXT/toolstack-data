define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/common/templates/ProgressBar.html",
    // Mixins
    "dijit/ProgressBar"
],
function(dojo, declare, template, progressBar) {
return declare("citrix.common.ProgressBar", [progressBar], {

    templateString: template,

	_setValueAttr: function(v){
		this._set("value", v);
		if(v < 0 || v == Infinity){
			this.update({indeterminate:true});
		}else{
			this.update({indeterminate:false, progress:v});
		}
	}
});
});