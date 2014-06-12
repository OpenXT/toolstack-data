//Debug singleton
Namespace("XenClient.UI");

XenClient.UI.Debug = (function() {
    
    function isConsoleEnabled() {
        return typeof (console) != "undefined";
    }
    
    var logId = 0;

    return {
        
        debug: function() {
            if (XUtils.debug() === true) {
                this.log.apply(this, arguments);
            }
        },

        // print a log message to the console
        log: function() {
            var args = [].slice.call(arguments);

            // First argument is the mask, the rest are values
            var message = args.shift();
            message = message.format(args);

            try {
                logId ++;
                message += " [" + logId + "]";

                if (isConsoleEnabled()) {
                    console.log(message);
                }

                if (XUtils.debug() === true) {
                    message += " (Debug)";
                }

                XUIXhr.post(
                    "/log/0",
                    "UI: " + message,
                    null,
                    null,
                    {
                        handleAs: "text"
                    }
                );
            }
            catch (e) {
                this.trace(e);
            }
        },

        // print a stack trace to the console
        trace: function(obj) {
            if (isConsoleEnabled()) {
                console.trace(obj);
            }
        },

        // print a listing of all properties of the specified object
        dir: function(obj) {
            if (isConsoleEnabled()) {
                console.dir(obj);
            }
        }
    };
})();

var xc_debug = XenClient.UI.Debug;
xc_debug.debug("XenClient.UI.Debug script loaded");