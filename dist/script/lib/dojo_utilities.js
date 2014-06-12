// Dojo-based utilities
require([
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/_base/connect"
],
function(lang, array, dojoConnect) {

String.prototype.format = function(){
    var regex = /\{([^\}]+)\}/g;
    var separator = ":";
    var args = arguments;
    // Support array of values passed in
    if (args.length == 1 && lang.isArray(args[0])) {
        args = args[0];
    }
    return this.replace(regex, function(m, k) {
        var formatter = k.split(separator);
        var key = formatter.shift();
        if (typeof(args[key]) == "undefined") {
            return m;
        }
        var value = args[key];
        if (formatter[0]) {
            formatter = formatter.join(separator);
            if (formatter == "n" || formatter == "f" ) {
                value = XenClient.Utils.dojoNumber.format(value, {places: (formatter == "f") ? 2 : 0});
            } else {
                var date = (value instanceof Date) ? value : new Date(value);
                value = XenClient.Utils.dojoLocale.format(date, {selector: "date", datePattern: formatter});
            }
        }
        return value;
    });
};

//XenClient.Utils Namespace
XenClient.Utils.extendImageArray = function(baseArray, extensionArray, basePath) {
    array.forEach(extensionArray, function(image){
        if (basePath) {
            image = basePath + image;
        }
        XUtils.pathExists(image, function(exists) {
            if (exists) {
                baseArray.push(image);
            }
        });
    });
};

XenClient.Utils.publishTopic = "/ui/xui";
XenClient.Utils.publish = function(type, data) {
    dojoConnect.publish(XenClient.Utils.publishTopic, [{ type: type, data: data }]);
};

XenClient.Utils.loadRequires = function(callback) {
    require(["dojo/date/locale", "dojo/number"], function(locale, number) {
        XenClient.Utils.dojoLocale = locale;
        XenClient.Utils.dojoNumber = number;
        callback();
    });
};

});