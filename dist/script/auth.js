require([
    "dojo",
    "dojo/dom",
    "dojo/parser",
    // Resources
    "dojo/i18n!citrix/xenclient/nls/Alerts",
    // Required from auth.html
    "citrix/common/ContentPane",
    "citrix/xenclient/Frame",
    "citrix/xenclient/Authentication",
    // DOM Ready
    "dojo/domReady!"
],
function(dojo, dom, parser, alerts) {
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
            XUICache.Host.authCollectPassword(function() {
                XUtils.publish(XenConstants.TopicTypes.UI_HIDE_WAIT);
            });
        });
    });
});