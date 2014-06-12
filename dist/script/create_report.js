require([
    "dojo",
    "dojo/dom",
    "dojo/parser",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    // Required in code
    "citrix/xenclient/ReportWizard",
    // Required from index.html
    "citrix/common/ContentPane",
    "citrix/xenclient/Frame",
    // DOM Ready
    "dojo/domReady!"
],
function(dojo, dom, parser, alerts, reportWizard) {
    // Prevent right-click context menu from appearing
    XUtils.disableContextMenu(dojo.doc);

    // Dijits
    parser.parse();
    XUICache.messageBox = null;
    XUICache.alerts = alerts;

    // Communications
    var socket = new XenClient.UI.WebSocket(window.location.hostname, 8080);

    XUIDBus.connect(socket, function() {
        XUICache.Host.uiReady();
        XUICache.init(function() {
            new reportWizard().show();
            XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
        });
    });
});
