// Copyright (C) 2012 Citrix Ltd.

Namespace("XenClient.UI");

require([
    "dojo/_base/json"
],
function(json) {

XenClient.UI.Xhr = (function() {
    var defaults = {
        async: true,
        preventCache: true,
        handleAs: "json", // see accepts
        contentType: "application/json", // currently cater for "json" only
        timeout: 0
    };
    var accepts = {
        xml: "application/xml, text/xml",
        html: "text/html",
        text: "text/plain",
        json: "application/json, text/javascript",
        "*": "*/*"
    };
    function getNewXhr() {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        return xmlhttp;
    }
    function mixinDefaults(args) {
        // add in default options that are missing from the passed in params
        if(args) {
            for(var prop in defaults) {
                if(defaults.hasOwnProperty(prop) && !args[prop]) {
                    args[prop] = defaults[prop];
                }
            }
        }
    }
    function send(url, data, success, failure, args) {
        mixinDefaults(args);
        var xmlhttp = getNewXhr();
        var timeoutHandle = null;
        function handleResponse(event, timedOut) {
            if(timedOut) {
                xmlhttp = null;
                if(failure) {
                    failure("timeout", "timeout");
                }
                return;
            }
            if(xmlhttp.readyState == 4) {
                if(timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                var statusText = "";
                var response = null;
                var isSuccess = true;
                if (xmlhttp.status >= 200 && xmlhttp.status < 300 || xmlhttp.status === 304 ) {
                    statusText = xmlhttp.statusText;
                    if(xmlhttp.status == 304) {
                        // not modified
                    }
                    else {
                        switch(args.handleAs) {
                            case "json":
                                try {
                                    response = json.fromJson(xmlhttp.responseText || null);
                                } catch (e) {
                                    statusText = "parsererror";
                                    response = e;
                                    isSuccess = false;
                                }
                                break;
                            case "xml":
                                response = xmlhttp.responseXML;
                                break;
                            default:
                                response = xmlhttp.responseText;
                                break;
                        }
                    }
                } else if (xmlhttp.status == 0) {
                    // this happens on an xmlhttp.abort()
                    isSuccess = false;
                    statusText = xmlhttp.statusText || "abort";
                    response = xmlhttp.statusText;
                } else {
                    statusText = xmlhttp.statusText || "error";
                    response = xmlhttp.statusText;
                    isSuccess = false;
                }
                if(isSuccess && success) {
                    success(statusText, response);
                } else if(!isSuccess && failure) {
                    failure(statusText, response);
                }
                xmlhttp = null;
            }
        }
        if(args.async) {
            xmlhttp.onreadystatechange = handleResponse;
            if(args.timeout > 0) {
                timeoutHandle = setTimeout(function() {
                    xmlhttp.abort();
                    handleResponse(null, true);
                }, args.timeout);
            }
        }
        if(args.preventCache && args.type == "GET") {
            url = url + "?randomDate=" + new Date().valueOf().toString();
        }
        xmlhttp.open(args.type, url, args.async);
        if(args.handleAs && accepts[args.handleAs]) {
            xmlhttp.setRequestHeader("Accept", args.handleAs == "*" ? accepts["*"] : accepts[args.handleAs] + ", */*; q=0.01");
        }
        xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        switch(args.type) {
            case "GET":
                xmlhttp.send();
                break;
            case "POST":
                xmlhttp.setRequestHeader("content-type", args.contentType);
                xmlhttp.send(data);
                break;
        }
        if(!args.async) {
            handleResponse();
        }
    }
    return {
        post: function(url, data, success, failure, args) {
            if(!args) {
                args = {};
            }
            args.type = "POST";
            send(url, data, success, failure, args);
        },
        get: function(url, success, failure, args) {
            if(!args) {
                args = {};
            }
            args.type = "GET";
            send(url, null, success, failure, args);
        }
    };
})();

});

var XUIXhr = XenClient.UI.Xhr;