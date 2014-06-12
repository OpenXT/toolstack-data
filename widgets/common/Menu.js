define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/Menu"
],
function(dojo, declare, menu) {
return declare("citrix.common.Menu", [menu], {

    baseClass: "citrixMenu"
});
});