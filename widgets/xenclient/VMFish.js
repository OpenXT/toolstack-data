define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "citrix/xenclient/VM",
    "citrix/common/_FishEyeMixin"
],
function(dojo, declare, vm, _fishEyeMixin) {
return declare("citrix.xenclient.VMFish", [vm, _fishEyeMixin], {
});
});