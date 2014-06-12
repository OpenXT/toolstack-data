define([
    "dojo",
    "dojo/_base/declare",
    // Resources
    "dojo/text!citrix/xenclient/templates/ZeroVM.html",
    // Mixins
    "citrix/xenclient/_VMButton"
],
function(dojo, declare, template, _vmButton) {
return declare("citrix.xenclient.ZeroVM", [_vmButton], {

	templateString: template,
    text: "",
    imagePath: "",

    attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
        text: [{ node: "textNode", type: "innerHTML" }],
        imagePath: [{ node: "imageNode", attribute : 'src'}]
    })
});
});