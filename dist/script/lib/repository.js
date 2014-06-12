// Repository class
Namespace("XenClient.UI");

require([
    "dojo/_base/connect",
    "dojo/_base/array",
    "dojo/window"
],
function() {

XenClient.UI.Repository = function(model, readOnlyMap, readWriteMap, refreshIgnoreMap) {

    // Mappings
    // Interface only - will assume property has same name, but with all "_" replaced with "-" and ise freeorgdesktop get/set (2)
    // Single method will readonly using the return from that method (2)
    // Interface and property name will use that prop name for get and set via freeorgdesktop methods (3)
    // Interface and two property names will use first prop name for get and set via freeorgdesktop methods and then get second prop from array returned
    // Two methods will read/write using these methods (3)
    // Method and property will assume readonly using that method and property passed in (3)
    // Method and number will assume readonly, calling the method and return value from array returned at index specified (3)
    // Two method names names and property (4)

    readOnlyMap = readOnlyMap || [];
    readWriteMap = readWriteMap || [];
    refreshIgnoreMap = refreshIgnoreMap || [];

    // Public methods
    this.load = function() {
        var args = [].slice.call(arguments);
        var publishLoad = true;
        var success = undefined;
        var failure = undefined;
        if (typeof(args[args.length - 1]) === "function") {
            if (typeof(args[args.length - 2]) === "function") {
                failure = args.pop();
            }
            success = args.pop();
        }
        if (typeof(args[args.length - 1]) === "boolean") {
            publishLoad = args.pop();
        }
        var map = readOnlyMap.concat(readWriteMap);
        if (args.length > 0) {
            // Support array of values passed in
            if (args.length == 1 && typeof(args[0]) == Array) {
                args = args[0];
            }

            // let's not send undefined or null arguments to getMap
            for(var i = args.length - 1; i >= 0; i--) {
                if(!args[i]) {
                    args.splice(i, 1);
                }
            }
            map = getMap(map, args);
        }
        loadMap(map, publishLoad, success, failure);
    };

    // args:    string[], publishLoad (opt), success (opt), failure (opt)
    //   OR:    string, string, string, ..., publishLoad (opt), success (opt), failure (opt)
    //   OR:    publishLoad (opt), success (opt), failure (opt)
    // (opt) meaning that it doesn't need to be there AT ALL (i.e. don't need undefined placeholder)
    this.refresh = function() {
        var args = [].slice.call(arguments);
        var publishLoad = true;
        var success = undefined;
        var failure = undefined;
        if (typeof(args[args.length - 1]) === "function") {
            if (typeof(args[args.length - 2]) === "function") {
                failure = args.pop();
            }
            success = args.pop();
        }
        if (typeof(args[args.length - 1]) === "boolean") {
            publishLoad = args.pop();
        }
        var map = readOnlyMap.concat(readWriteMap);
        if (args.length > 0) {
            // Support array of values passed in
            if (args.length == 1 && typeof(args[0]) == Array) {
                args = args[0];
            }
            map = getMap(map, args);
        } else if (refreshIgnoreMap.length > 0) {
            for (var i = map.length - 1; i >= 0; i--) {
                for (var j = 0; j < refreshIgnoreMap.length; j++) {
                    if (map[i][0] == refreshIgnoreMap[j]) {
                        map.splice(i, 1);
                    }
                }
            }
        }
        loadMap(map, publishLoad, success, failure);
    };

    this.save = function() {
        var args = [].slice.call(arguments);
        var properties = [];
        var propsAndValues = {};
        var success = undefined;
        var failure = undefined;
        if (typeof(args[args.length - 1]) === "function") {
            if (typeof(args[args.length - 2]) === "function") {
                failure = args.pop();
            }
            success = args.pop();
        }
        var map = readWriteMap;
        if (args.length == 1) {
            // Assume a json object
            args = args[0];
            properties = Object.keys(args);
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                propsAndValues[property] = args[property];
            }
            map = getMap(map, properties);
        } else if (args.length == 2 && args[0] instanceof Array && args[1] instanceof Array) {
            var props = args[0];
            var values = args[1];
            for (var i = 0; i < props.length; i++) {
                var property = props[i];
                var value = values[i];
                propsAndValues[property] = value;
                properties.push(property);
            }
            map = getMap(map, properties);
        } else if (args.length > 0) {
            for (var i = 0; i < args.length; i+=2) {
                var property = args[i];
                var value = args[i + 1];
                propsAndValues[property] = value;
                properties.push(property);
            }
            map = getMap(map, properties);
        }
        saveMap(map, propsAndValues, success, failure);
    };

    // Private methods
    function publish(type, data) {
        model.publish(type, data);
    }

    function fail(error) {
        var msg = typeof(error) == "object" ? error.message : error;
        xc_debug.log(msg);
        publish(XenConstants.TopicTypes.MODEL_FAILURE, error);
    }

    function getMap(map, properties) {
        var foundMap = [];
        if (typeof(properties) === "string") {
            // Single property passed in
            for (var i = 0; i < map.length; i++) {
                if (map[i][0] == properties) {
                    foundMap.push(map[i]);
                    break;
                }
            }
            if (foundMap.length == 0) {
                fail(properties);
            }
        } else {
            var errorCount = 0;
            // Property array passed in
            for (var i = 0; i < properties.length; i++) {
                for (var j = 0; j < map.length; j++) {
                    if (properties[i] == map[j][0]) {
                        foundMap.push(map[j]);
                        break;
                    }
                }
                // Alert on mismatched properties trying to be saved
                if (foundMap.length + errorCount != i+1) {
                    errorCount ++;
                    fail(properties[i]);
                }
            }
        }
        return foundMap;
    }

    function loadMap(map, publishLoad, success, failure) {
        var wait = new XenClient.Utils.AsyncWait(function() {
            model.loaded = true;
            if (publishLoad) {
                publish(XenConstants.TopicTypes.MODEL_LOADED);
                publish(XenConstants.TopicTypes.MODEL_CHANGED);
            }
            if (success) {
                success();
            }
        }, function(error) {
            fail(error);
            if (failure) {
                failure(error);
            }
        });
        var queues = {};
        for (var i =0; i < map.length; i++) {
            loadSingleMap(map[i], map.length, wait, queues);
        }
        wait.finish();
    }

    function loadSingleMap(map, count, wait, queues) {
        var property = map[0];
        var reference = map[1];
        var lastItem = map[map.length - 1];
        var onSuccess = wait.addCallback(function(value) {
            if (value == undefined) {
                fail(property);
            } else {
                model[property] = value;
                publish(XenConstants.TopicTypes.MODEL_PROPERTY_CHANGED, property);
            }
        });
        if (typeof(reference) != "function") {
            // Interface only - will assume property has same name, but with all "_" replaced with "-" and use freeorgdesktop get/set
            // Interface and property name will use that prop name for get and set via freeorgdesktop methods
            // Interface and two property names will use first prop name for get and set via freeorgdesktop methods and then get second prop from array returned
            var interfaceProperty = map[2] || property.replace(/_/g, "-");
            loadInterfaceProperty(reference, interfaceProperty, count, onSuccess, wait.error, map[3], queues);
        } else if (typeof(lastItem) == "number") {
            // Method and number will assume readonly, calling the method and return value from array returned at index specified
            var argument = (typeof(map[2]) == "string") ? map[2] : undefined;
            loadNumberedProperty(reference, lastItem, onSuccess, wait.error, argument, queues);
        } else if (typeof(lastItem) == "string") {
            if(reference.length == 2) {
                // Invoke function and retrieve named property
                loadNamedProperty(reference, lastItem, onSuccess, wait.error, queues);
            } else {
                // Invoke function passed with property name
                reference(lastItem, onSuccess, wait.error);
            }
        } else {
            // Invoke function passed
            reference(onSuccess, wait.error);
        }
    }

    // Call method and return index specified from property array
    function loadNumberedProperty(functionRef, number, success, failure, argument, queues) {
        function onSuccess() {
            success(arguments[number]);
        }
        var fn = functionRef;
        var key = functionRef.getHashCode();
        if (argument) {
            fn = function(success, failure) {
                functionRef(argument, success, failure);
            };
            key += "|" + argument;
        }
        loadFunctionProperties(fn, onSuccess, failure, queues, key);
    }

    // Call method and return property specified from property name
    function loadNamedProperty(functionRef, name, success, failure, queues) {
        function onSuccess(result) {
            success(result[name]);
        }
        loadFunctionProperties(functionRef, onSuccess, failure, queues, functionRef.getHashCode());
    }

    // Use freedesktop properties to retrieve property from interface
    function loadInterfaceProperty(interfaceRef, property, count, success, failure, arrayProperty, queues) {
        function onSuccess(result) {
            var value = (count == 1) ? result : result[property];
            if (arrayProperty) {
                value = value[arrayProperty];
            }
            success(value);
        }
        if (count == 1) {
            // Use Get instead of GetAll
            interfaceRef.get_property(property, onSuccess, failure);
        } else {
            loadFunctionProperties(interfaceRef.get_all_properties, onSuccess, failure, queues);
        }
    }

    // Call function on interface and remember result for returning to subsequent calls async queued
    function loadFunctionProperties(functionRef, success, failure, queues, key) {
        if (!key) {
            key = functionRef.getHashCode();
        }
        if (!queues[key]) {
            queues[key] = new XenClient.Utils.AsyncQueue();
            function onSuccess() {
                success.apply(this, arguments);
                queues[key].success.apply(queues[key], arguments);
                delete queues[key];
            }
            function onFailure() {
                failure.apply(this, arguments);
                queues[key].failure.apply(queues[key], arguments);
                delete queues[key];
            }
            functionRef(onSuccess, onFailure);
        } else {
            queues[key].add(success, failure);
        }
    }

    function saveMap(map, propsAndValues, success, failure) {
        var wait = new XenClient.Utils.AsyncWait(function() {
            publish(XenConstants.TopicTypes.MODEL_SAVED);
            publish(XenConstants.TopicTypes.MODEL_CHANGED);
            if (success) {
                success();
            }
        }, function(error) {
            fail(error);
            if (failure) {
                failure(error);
            }
        });
        for (var i =0; i < map.length; i++) {
            saveSingleMap(map[i], propsAndValues, wait);
        }
        wait.finish();
    }

    function saveSingleMap(map, propsAndValues, wait) {
        var saveAll = (Object.keys(propsAndValues).length == 0);
        var property = map[0];
        var interface = map[1];
        var reference = map[2];
        var oldValue = model[property];
        var value = saveAll ? oldValue : propsAndValues[property];
        // Only update if we are saving all or value has changed
        if (saveAll || oldValue !== value) {
            var onSuccess = wait.addCallback(function() {
                if (!saveAll) {
                    model[property] = value;
                    publish(XenConstants.TopicTypes.MODEL_PROPERTY_CHANGED, property);
                }
            });
            if (typeof(interface) != "function") {
                // Use freedesktop properties to save property
                var interfaceProperty = reference || property.replace(/_/g, "-");
                interface.set_property(interfaceProperty, value, onSuccess, wait.error);
            } else if (typeof(reference) == "function") {
                var lastItem = map[map.length - 1];
                if (typeof(lastItem) == "string") {
                    // Invoke function passed with property name
                    reference(lastItem, value, onSuccess, wait.error);
                } else {
                    // Invoke function passed
                    reference(value, onSuccess, wait.error);
                }
            }
        }
    }
};

});