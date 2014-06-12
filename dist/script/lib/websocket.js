// Copyright (C) 2012 Citrix Ltd.

Namespace("XenClient.UI");

require([
    "dojo/_base/json"
],
function(json) {

XenClient.UI.WebSocket = function(url, port) {

    port = port || 80;

    // Private variables
    var socket;
    var connected = false;
    var receiveMessage = null;

    // Private functions
    function onMessage(event) {
        var message = json.fromJson(event.data);
        xc_debug.debug(event.data);
        if (typeof(receiveMessage) === "function") {
            receiveMessage(message);
        }
    }

    function onClose() {
        xc_debug.log("WebSocket closed.");
        connected = false;
    }

    function onError() {
        xc_debug.log("WebSocket error.");
        // To Do
    }

    // Public functions
    this.setReceiver = function(fn) {
        receiveMessage = fn;
    };

    this.connect = function(success, failure) {
        var socketUrl =  "ws://" + url + ":" + port;
        try {
            socket = new WebSocket(socketUrl);
            xc_debug.log("WebSocket created on '{0}', waiting for server to open", socketUrl);
        } catch (error) {
            xc_debug.log("WebSocket creation failed on '{0}", socketUrl);
            if (failure) {
                failure(error);
            }
        }

        socket.onopen = function() {
            xc_debug.log("WebSocket opened on '{0}'", socketUrl);
            connected = true;
            socket.onmessage = onMessage;
            socket.onclose = onClose;
            socket.onerror = onError;
            if (success) {
                success(socket);
            }
        };
    };

    this.sendMessage = function(message) {
        if (connected) {
            var jsonStr = json.toJson(message);
            socket.send(jsonStr);
            xc_debug.debug("Message sent: {0}".format(jsonStr));
        }
    };

    this.close = function() {
        if (connected) {
            socket.close();
        }
    }
};

});