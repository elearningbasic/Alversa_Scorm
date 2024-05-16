 /**
 * jQuery logging console 
 * Copyright (c) 2011 Artem Votincev (apmem.org)
 * Distributed under BSD license
 */
(function ($) {
    var config = {
        loggerEnabled: true,
        recursionBehaviour: "stop",
        maxLevel: 0, //-1,
        defaultElement: null,
        prefix: "message"
    };
    $.logConfig = function (settings) {
        if (settings) $.extend(config, settings);
    }
    var LOG_HTML = 1;
    var LOG_TEXT = 2;
    var logPrint = function (name, value, logType) {
        if (logType == "html") {
            value = ('' + value).replace(/&/gi, "&amp;").replace(/</gi, "&lt;").replace(/>/gi, "&gt;");
            return '<b>' + name + '</b> = ' + value + '<br />';
        } else if (logType == "text") return name + ' = ' + value + '\n';
        else throw new Error("Index out of range exception: logType = ", logType);
    }
    var logExpand = function (obj, objName, curLevel, currentConfig) {
        var result = "";
        if (
        curLevel == 0 || (
        $.inArray(obj, currentConfig.visitedObjs) != -1 && currentConfig.recursionBehaviour == "stop")) {
            return logPrint(objName, obj, currentConfig.logType);
        }
        currentConfig.visitedObjs.push(obj);
        for (var i in obj) {
            var objVal = obj[i];
            if (
            typeof (objVal) == "object" && Object.prototype.toString.call(objVal) != "[object nsXPCComponents]") {
                try {
                    result += logExpand(objVal, objName + "." + i, curLevel - 1, currentConfig);
                } catch (e) {
                    result += logPrint(objName + '.' + i, objVal + ' ' + e, currentConfig.logType);
                }
            } else {
                result += logPrint(objName + '.' + i, objVal, currentConfig.logType);
            }
        }
        return result;
    }
    var logConsole = function (obj, currentConfig) {
        if (window.console && window.console.log) {
            if (window.console.log.apply) {
                console.log.apply(window.console, obj);
            } else {
                console.log(obj);
            }
        } else {
            $.extend(currentConfig, {
                logType: "text",
                visitedObjs: []
            });
            var expanded = logExpand(obj, currentConfig.prefix, currentConfig.maxLevel, currentConfig);
            throw new Error(expanded);
        }
    }
    var log = function (element, arg) {
        if (!config.loggerEnabled) return true;
        if (arg.length == 0) return true;
        if (element == null) {
            element = config.defaultElement;
        }
        var currentConfig = {};
        $.extend(currentConfig, config);
        setTimeout(function () {
            var obj = [].slice.call(arg);
            if (element == null) {
                logConsole(obj);
            }
            $.extend(currentConfig, {
                logType: "html",
                visitedObjs: []
            });
            var text = logExpand(obj, currentConfig.prefix, currentConfig.maxLevel, currentConfig);
            $(element).html($(element).html() + '<hr>' + text);
        }, 0);
        return true;
    }
    $.log = function () {
        log(null, arguments);
        return true;
    };
    $.fn.log = function () {
        log(this, arguments);
        return true;
    }
})(jQuery);