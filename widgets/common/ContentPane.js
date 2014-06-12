define([
    "dojo",
    "dojo/_base/declare",
    // Mixins
    "dijit/layout/ContentPane",
    "dijit/_Contained"
],
function(dojo, declare, contentPane, _contained) {
return declare("citrix.common.ContentPane", [contentPane, _contained], {

    splitter: false,
    saveable: true
});
});