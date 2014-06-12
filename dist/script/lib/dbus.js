// Copyright (C) 2012 Citrix Ltd.
// Compared to xec:
// -s == destination
// -o == path (object path)
// -i == interface

Namespace("XenClient.UI");

require([
    "dojo/_base/connect",
    "dojo/_base/json",
],
function(dojoConnect, json) {

XenClient.UI.DBus = (function() {

    var socket = null;
    var connected = false;
    var signalFn;
    var returnFns = {};
    var id = 0;
    var current_in_progress = 0;
    var sendQueue = [];
    var signals = [];
    var timings = {};

    // Object model containing services we want to check are running before using
	var services = {"com.citrix.xenclient.bed": false};

    // Deregister any signals used and gracefully close socket
    window.onbeforeunload = function() {
        for (var interface in signals) {
            if (signals.hasOwnProperty(interface)) {
                signalDeregister(interface);
            }
        }
        if (socket && socket.close) {
            socket.close();
        }
    };

    // Connect to DBus
    function connect(elSocket, success, failure) {
        socket = elSocket;
        socket.connect(function() {
            socket.setReceiver(receiveMessage);
            var message = buildMessage("org.freedesktop.DBus", "Hello", "/org/freedesktop/DBus");
            dbusMessage(message, function() {
                xc_debug.log("Connected to DBus");
                connected = true;
            }.extend(success), failure, true);
        }, failure);
	}

    // Register for signals from DBus
    function signalRegister(interface, success, failure) {
        var message = buildMessage("org.freedesktop.DBus", "AddMatch", "/org/freedesktop/DBus", "org.freedesktop.DBus", "type='signal',interface='" + interface + "'");
    	dbusMessage(message, function() {
            xc_debug.log("Registered for signals with interface: {0}", interface);
            signals.push(interface);
        }.extend(success), function() {
            xc_debug.log("Registration failed for signals with interface: {0}", interface);
        }.extend(failure), connected);
	}

    // Deregister for signals from DBus
    function signalDeregister(interface, success, failure) {
        var message = buildMessage("org.freedesktop.DBus", "RemoveMatch", "/org/freedesktop/DBus", "org.freedesktop.DBus", "type='signal',interface='" + interface + "'");
    	dbusMessage(message, function() {
            xc_debug.log("Deregistered for signals with interface: {0}", interface);
        }.extend(success), function() {
            xc_debug.log("Deregistration failed for signals with interface: {0}", interface);
        }.extend(failure), connected);
    }

    // Returns (into the finish function) whether a service is running
    function serviceRunning(service, success, failure) {
        function onSuccess() {
            if (success) {
                success(services[service]);
            }
        }
        if (typeof(services[service]) === "undefined" ) {
            services[service] = true;
            onSuccess();
        }
        else if (services[service] === true) {
            onSuccess();
        } else {
            var message = buildMessage("com.citrix.xenclient.xenmgr", "is_service_running", "/host", "com.citrix.xenclient.xenmgr.host", service);
            dbusMessage(message, function(running) {
                services[service] = running;
                onSuccess();
            }, failure, connected);
        }
    }

    // Build a DBus message
    function buildMessage(destination, member, path, interface, args) {
        path = path || "/";
        interface = interface || destination;
        args = args || [];
        if (typeof(args) === "string") {
            args = [args];
        }

        id++;
        return {
            "id": id,
            "destination": destination,
            "method": member,
            "path": path,
            "interface": interface,
            "args": args
        };
    }

    // Build a DBus signal
    function buildSignal(interface, member, args, path) {
        path = path || "/";
        args = args || [];
        if (typeof(args) === "string") {
            args = [args];
        }

        id++;
        return {
            "id": id,
            "type": "signal",
            "method": member,
            "path": path,
            "interface": interface,
            "args": args
        };
    }

    // Send a DBus message if connected and store return functions. Honour message limit
    function dbusMessage(message, success, failure, connected) {
        if (connected) {
            if (success || failure) {
                returnFns[message.id] = {"success": success, "failure": failure};
            }
            if(current_in_progress >= XenConstants.Defaults.MESSAGE_LIMIT) {
                sendQueue.push(message);
            } else {
                socketMessage(message);
            }
        }
    }

    // Send a raw message on the WebSocket
    function socketMessage(message) {
        current_in_progress++;
        socket.sendMessage(message);
        if(XUtils.debug() === true && XenConstants.Defaults.MESSAGE_LOGGING) {
            message.sent = new Date().getTime();
            timings[message.id] = message;
        }
    }

    // Send XC DBus message if the service is running
    function sendMessage(message, success, failure) {
        serviceRunning(message.destination, function(running) {
            if (running) {
                return dbusMessage(message, success, failure, connected);
            } else {
                failure("The {0} service is not running.".format(message.destination));
            }
        }, failure);
    }

    // DBus callback function
    function receiveMessage(message) {
        var type = message.type;
        switch(type) {
            case "signal": {
                var fn = signalFn;
                var interface = message.interface;
                var member = message.member;
                var path = message.path;
                var params = message.args;

                var args = [];
                args.push(interface);
                args.push(member);
                args.push(path);
                args.push(params);

                // Publish signal
                dojoConnect.publish(interface, [{ interface: interface, type: member, path: path, data: params }]);
                xc_debug.debug("Received {0} with data {1}", interface + "." + member, json.toJson(params));
                break;
            }
            case "response":
            case "error": {
                var id = message["response-to"];
                current_in_progress--;
                if(sendQueue.length > 0) {
                    socketMessage(sendQueue.shift());
                }
                if (returnFns[id]) {
                    var fn = (type == "response" ? returnFns[id].success : returnFns[id].failure);
                    delete returnFns[id];
                    var args = message.args;
                }
                if(timings[id]) {
                    xc_debug.debug("message: {0} took {1} ms".format(json.toJson(timings[id]), new Date().getTime() - timings[id].sent));
                    delete timings[id];
                }
                break;
            }
        }
        if (fn) {
            if (type == "error") {
                var errorArray = args[0].split(':');
                if (errorArray.length == 1) {
                    // Handle errors without a code
                    args[0] = {code: 0, message: args[0]};
                } else {
                    args[0] = {code: errorArray.shift(), message: errorArray.join(':')};
                }
            }
            fn.apply(this, args);
        }
    }

    return {
        services: services,
        connect: connect,
        signalRegister: function(signals, receiveFn, success, failure) {
            if (typeof(signals) === "string") {
                signals = [signals];
            }
            var wait = new XUtils.AsyncWait(function() {
                if (receiveFn) {
                    signalFn = receiveFn;
                }
                if (success) {
                    success();
                }
            }, failure);
            for (var i = 0; i < signals.length; i++) {
                signalRegister(signals[i], wait.addCallback(), wait.error);
            }
            wait.finish();
        },
        sendMessage: function(destination, member, path, interface, args, success, failure) {
            var message = buildMessage(destination, member, path, interface, args);
            return sendMessage(message, success, failure);
        },
        sendSignal: function(interface, member, args, path) {
            var signal = buildSignal(interface, member, args, path);
            return sendMessage(signal);
        },
        getProperty: function(destination, path, interface, member, success, failure) {
            var args = [interface, member];
            var message = buildMessage(destination, "Get", path, "org.freedesktop.DBus.Properties", args);
            return sendMessage(message, success, failure);
        },
        getProperties: function(destination, path, interface, success, failure) {
            var message = buildMessage(destination, "GetAllProperties", path, interface);
            return sendMessage(message, success, failure);
        }
    }
})();

});

var XUIDBus = XenClient.UI.DBus;