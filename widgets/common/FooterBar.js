define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/MenuBar"
],
function(dojo, declare, menuBar) {
return declare("citrix.common.FooterBar", [menuBar], {

    baseClass: "citrixFooterBar"
});
});