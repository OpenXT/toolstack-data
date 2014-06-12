// Cache Singleton
Namespace("XenClient.UI");

XenClient.UI.Cache = {

    Host: new XenClient.UI.HostModel(),
    messageBox: null,
    alerts: null,
    keyboard: null,

    init: function(finish) {
        var wait = new XUtils.AsyncWait(finish);

        XUICache.Host.load(wait.addCallback());
        XUIDBus.signalRegister("com.citrix.xenclient.status_tool", null, wait.addCallback());

        wait.finish();
    }
}

var XUICache = XenClient.UI.Cache;