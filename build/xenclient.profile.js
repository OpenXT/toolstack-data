cwd = (new java.io.File(".")).getAbsolutePath();

for(var dojohome = ".", arg, rhinoArgs = this.arguments, i = 0; i < rhinoArgs.length;){
	arg = (rhinoArgs[i++] + "").split("=");
	if(arg[0] == "baseUrl"){
		dojohome = arg[1];
		break;
	}
}


if (dojohome.indexOf(".")==0) {
    realBuildScriptsPath=cwd+"/";
} else {
    realBuildScriptsPath=dojohome;
}



var profile = {
    basePath: "../dojo-sdk/util/buildscripts/",
    layerOptimize: "shrinksafe",
    cssOptimize: "comments",
    releaseDir: "../../../dist/lib",

    packages: [
        {
            name: "dojo",
            location: realBuildScriptsPath + "../../dojo"
        },
        {
            name: "dijit",
            location: realBuildScriptsPath + "../../dijit"
        },
        {
            name: "citrix",
            location: cwd+ "/../../../widgets"
        }
    ],
    layers: {
        "dojo": {
            include: [
                "dojo/_base/url",
                "dojo/cache",
                "dojo/cookie",
                "dojo/data/ItemFileReadStore",
                "dojo/data/util/filter",
                "dojo/data/util/simpleFetch",
                "dojo/data/util/sorter",
                "dojo/date/locale",
                "dojo/date/stamp",
                "dojo/DeferredList",
                "dojo/dnd/autoscroll",
                "dojo/dnd/Avatar",
                "dojo/dnd/common",
                "dojo/dnd/Container",
                "dojo/dnd/Manager",
                "dojo/dnd/Moveable",
                "dojo/dnd/Mover",
                "dojo/dnd/Selector",
                "dojo/dnd/Source",
                "dojo/dnd/TimedMoveable",
                "dojo/html",
                "dojo/NodeList-manipulate",
                "dojo/NodeList-traverse",
                "dojo/number",
                "dojo/parser",
                "dojo/require",
                "dojo/selector/acme",
                "dojo/Stateful",
                "dojo/text",
                "dojo/touch",
                "dojo/uacss",
                "dojo/window"
            ]
        },
        "citrix/xenclient": {
            exclude: [
                "dojo"
            ],
            include: [
                "citrix/common/ContentPane",
                "citrix/xenclient/AlertDialog",
                "citrix/xenclient/AlertPopup",
                "citrix/xenclient/Footer",
                "citrix/xenclient/Frame",
                "citrix/xenclient/HostPower",
                "citrix/xenclient/Keyboard",
                "citrix/xenclient/Menus",
                "citrix/xenclient/NotificationBar",
                "citrix/xenclient/StartupWizard",
                "citrix/xenclient/VMContainer",
                "citrix/xenclient/ZeroVMContainer"
            ]
        },
        "citrix/xenauth": {
            exclude: [
                "dojo"
            ],
            include: [
                "citrix/common/ContentPane",
                "citrix/xenclient/Authentication",
                "citrix/xenclient/Frame"
            ]
        },
        "citrix/xenreport": {
            exclude: [
                "dojo"
            ],
            include: [
                "citrix/common/ContentPane",
                "citrix/xenclient/Footer",
                "citrix/xenclient/Frame",
                "citrix/xenclient/ReportWizard"
            ]
        }
    }
 };
