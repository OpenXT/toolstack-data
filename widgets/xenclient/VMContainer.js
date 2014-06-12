define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/xenclient/templates/VMContainer.html",
    // Mixins
    "citrix/xenclient/_VMContainer",
    "dijit/_Templated",
    // Required in code
    "citrix/xenclient/VM",
    "citrix/xenclient/VMFish"
],
function(dojo, declare, template, _vmContainer, _templated, vm, vmFish) {
return declare("citrix.xenclient.VMContainer", [_vmContainer, _templated], {

	templateString: template,

    _gotVMs: function(items, request) {
        dojo.forEach(items, function(item, i) {
            var vm_path = this.vmStore.getValue(item, "vm_path");
            if (typeof(this.vms[vm_path]) === "undefined") {
                if (XenConstants.Defaults.FISH) {
                    this.vms[vm_path] = new vmFish({ path: vm_path, mouseContainer: this.containerNode });
                } else {
                    this.vms[vm_path] = new vm({ path: vm_path });
                }
            }
            this.addChild(this.vms[vm_path], i);
        }, this);
    }
});
});