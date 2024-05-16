/* JSTORAGE 
 * Copyright (c) 2010 - 2012 Andris Reinman, andris.reinman@gmail.com
 * Project homepage: www.jstorage.info
 * Licensed under MIT-style license
 */
 (function () {
    var
    JSTORAGE_VERSION = "0.3.2",
        $ = window.jQuery || window.$ || (window.$ = {}),
        JSON = {
            parse: window.JSON && (window.JSON.parse || window.JSON.decode) || String.prototype.evalJSON && function (str) {
                return String(str).evalJSON();
            } || $.parseJSON || $.evalJSON,
            stringify: Object.toJSON || window.JSON && (window.JSON.stringify || window.JSON.encode) || $.toJSON
        };
    if (!JSON.parse || !JSON.stringify) {
        throw new Error("No JSON support found, include //cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.js to page");
    }
    var
    _storage = {
        __jstorage_meta: {
            CRC32: {}
        }
    },
    _storage_service = {
        jStorage: "{}"
    },
    _storage_elm = null,
        _storage_size = 0,
        _backend = false,
        _observers = {},
        _observer_timeout = false,
        _observer_update = 0,
        _pubsub_observers = {},
        _pubsub_last = +new Date(),
        _ttl_timeout,
        _XMLService = {
            isXML: function (elm) {
                var documentElement = (elm ? elm.ownerDocument || elm : 0).documentElement;
                return documentElement ? documentElement.nodeName !== "HTML" : false;
            },
            encode: function (xmlNode) {
                if (!this.isXML(xmlNode)) {
                    return false;
                }
                try { // Mozilla, Webkit, Opera
                    return new XMLSerializer().serializeToString(xmlNode);
                } catch (E1) {
                    try { // IE
                        return xmlNode.xml;
                    } catch (E2) {}
                }
                return false;
            },
            decode: function (xmlString) {
                var dom_parser = ("DOMParser" in window && (new DOMParser()).parseFromString) || (window.ActiveXObject && function (_xmlString) {
                    var xml_doc = new ActiveXObject('Microsoft.XMLDOM');
                    xml_doc.async = 'false';
                    xml_doc.loadXML(_xmlString);
                    return xml_doc;
                }),
                    resultXML;
                if (!dom_parser) {
                    return false;
                }
                resultXML = dom_parser.call("DOMParser" in window && (new DOMParser()) || window, xmlString, 'text/xml');
                return this.isXML(resultXML) ? resultXML : false;
            }
        },
        _localStoragePolyfillSetKey = function () {};
    function _init() {
        var localStorageReallyWorks = false;
        if ("localStorage" in window) {
            try {
                window.localStorage.setItem('_tmptest', 'tmpval');
                localStorageReallyWorks = true;
                window.localStorage.removeItem('_tmptest');
            } catch (BogusQuotaExceededErrorOnIos5) {
            }
        }
        if (localStorageReallyWorks) {
            try {
                if (window.localStorage) {
                    _storage_service = window.localStorage;
                    _backend = "localStorage";
                    _observer_update = _storage_service.jStorage_update;
                }
            } catch (E3) {
            }
        }
        else if ("globalStorage" in window) {
            try {
                if (window.globalStorage) {
                    _storage_service = window.globalStorage[window.location.hostname];
                    _backend = "globalStorage";
                    _observer_update = _storage_service.jStorage_update;
                }
            } catch (E4) {
            }
        }
        else {
            _storage_elm = document.createElement('link');
            if (_storage_elm.addBehavior) {
                _storage_elm.style.behavior = 'url(#default#userData)';
                document.getElementsByTagName('head')[0].appendChild(_storage_elm);
                try {
                    _storage_elm.load("jStorage");
                } catch (E) {
                    _storage_elm.setAttribute("jStorage", "{}");
                    _storage_elm.save("jStorage");
                    _storage_elm.load("jStorage");
                }
                var data = "{}";
                try {
                    data = _storage_elm.getAttribute("jStorage");
                } catch (E5) {}
                try {
                    _observer_update = _storage_elm.getAttribute("jStorage_update");
                } catch (E6) {}
                _storage_service.jStorage = data;
                _backend = "userDataBehavior";
            } else {
                _storage_elm = null;
                return;
            }
        }
        _load_storage();
        _handleTTL();
        _createPolyfillStorage("local");
        _createPolyfillStorage("session");
        _setupObserver();
        _handlePubSub();
        if ("addEventListener" in window) {
            window.addEventListener("pageshow", function (event) {
                if (event.persisted) {
                    _storageObserver();
                }
            }, false);
        }
    }
    function _createPolyfillStorage(type, forceCreate) {
        var _skipSave = false,
            _length = 0,
            i,
            storage,
            storage_source = {};
        var rand = Math.random();
        if (!forceCreate && typeof window[type + "Storage"] != "undefined") {
            return;
        }
        if (type == "local" && window.globalStorage) {
            localStorage = window.globalStorage[window.location.hostname];
            return;
        }
        if (_backend != "userDataBehavior") {
            return;
        }
        if (forceCreate && window[type + "Storage"] && window[type + "Storage"].parentNode) {
            window[type + "Storage"].parentNode.removeChild(window[type + "Storage"]);
        }
        storage = document.createElement("button");
        document.getElementsByTagName('head')[0].appendChild(storage);
        if (type == "local") {
            storage_source = _storage;
        } else if (type == "session") {
            _sessionStoragePolyfillUpdate();
        }
        for (i in storage_source) {
            if (storage_source.hasOwnProperty(i) && i != "__jstorage_meta" && i != "length" && typeof storage_source[i] != "undefined") {
                if (!(i in storage)) {
                    _length++;
                }
                storage[i] = storage_source[i];
            }
        }
        storage.length = _length;
        storage.key = function (n) {
            var count = 0,
                i;
            _sessionStoragePolyfillUpdate();
            for (i in storage_source) {
                if (storage_source.hasOwnProperty(i) && i != "__jstorage_meta" && i != "length" && typeof storage_source[i] != "undefined") {
                    if (count == n) {
                        return i;
                    }
                    count++;
                }
            }
        }

        storage.getItem = function (key) {
            _sessionStoragePolyfillUpdate();
            if (type == "session") {
                return storage_source[key];
            }
            return $.jStorage.get(key);
        }

        storage.setItem = function (key, value) {
            if (typeof value == "undefined") {
                return;
            }
            storage[key] = (value || "").toString();
        }

        storage.removeItem = function (key) {
            if (type == "local") {
                return $.jStorage.deleteKey(key);
            }
            storage[key] = undefined;
            _skipSave = true;
            if (key in storage) {
                storage.removeAttribute(key);
            }
            _skipSave = false;
        }

        storage.clear = function () {
            if (type == "session") {
                window.name = "";
                _createPolyfillStorage("session", true);
                return;
            }
            $.jStorage.flush();
        }
        if (type == "local") {
            _localStoragePolyfillSetKey = function (key, value) {
                if (key == "length") {
                    return;
                }
                _skipSave = true;
                if (typeof value == "undefined") {
                    if (key in storage) {
                        _length--;
                        storage.removeAttribute(key);
                    }
                } else {
                    if (!(key in storage)) {
                        _length++;
                    }
                    storage[key] = (value || "").toString();
                }
                storage.length = _length;
                _skipSave = false;
            }
        }

        function _sessionStoragePolyfillUpdate() {
            if (type != "session") {
                return;
            }
            try {
                storage_source = JSON.parse(window.name || "{}");
            } catch (E) {
                storage_source = {};
            }
        }

        function _sessionStoragePolyfillSave() {
            if (type != "session") {
                return;
            }
            window.name = JSON.stringify(storage_source);
        };
        storage.attachEvent("onpropertychange", function (e) {
            if (e.propertyName == "length") {
                return;
            }
            if (_skipSave || e.propertyName == "length") {
                return;
            }
            if (type == "local") {
                if (!(e.propertyName in storage_source) && typeof storage[e.propertyName] != "undefined") {
                    _length++;
                }
            } else if (type == "session") {
                _sessionStoragePolyfillUpdate();
                if (typeof storage[e.propertyName] != "undefined" && !(e.propertyName in storage_source)) {
                    storage_source[e.propertyName] = storage[e.propertyName];
                    _length++;
                } else if (typeof storage[e.propertyName] == "undefined" && e.propertyName in storage_source) {
                    delete storage_source[e.propertyName];
                    _length--;
                } else {
                    storage_source[e.propertyName] = storage[e.propertyName];
                }
                _sessionStoragePolyfillSave();
                storage.length = _length;
                return;
            }
            $.jStorage.set(e.propertyName, storage[e.propertyName]);
            storage.length = _length;
        });
        window[type + "Storage"] = storage;
    }

    function _reloadData() {
        var data = "{}";
        if (_backend == "userDataBehavior") {
            _storage_elm.load("jStorage");
            try {
                data = _storage_elm.getAttribute("jStorage");
            } catch (E5) {}
            try {
                _observer_update = _storage_elm.getAttribute("jStorage_update");
            } catch (E6) {}
            _storage_service.jStorage = data;
        }
        _load_storage();
        _handleTTL();
        _handlePubSub();
    }

    function _setupObserver() {
        if (_backend == "localStorage" || _backend == "globalStorage") {
            if ("addEventListener" in window) {
                window.addEventListener("storage", _storageObserver, false);
            } else {
                document.attachEvent("onstorage", _storageObserver);
            }
        } else if (_backend == "userDataBehavior") {
            setInterval(_storageObserver, 1000);
        }
    }

    function _storageObserver() {
        var updateTime;
        clearTimeout(_observer_timeout);
        _observer_timeout = setTimeout(function () {
            if (_backend == "localStorage" || _backend == "globalStorage") {
                updateTime = _storage_service.jStorage_update;
            } else if (_backend == "userDataBehavior") {
                _storage_elm.load("jStorage");
                try {
                    updateTime = _storage_elm.getAttribute("jStorage_update");
                } catch (E5) {}
            }
            if (updateTime && updateTime != _observer_update) {
                _observer_update = updateTime;
                _checkUpdatedKeys();
            }
        }, 25);
    }

    function _checkUpdatedKeys() {
        var oldCrc32List = JSON.parse(JSON.stringify(_storage.__jstorage_meta.CRC32)),
            newCrc32List;
        _reloadData();
        newCrc32List = JSON.parse(JSON.stringify(_storage.__jstorage_meta.CRC32));
        var key,
        updated = [],
            removed = [];
        for (key in oldCrc32List) {
            if (oldCrc32List.hasOwnProperty(key)) {
                if (!newCrc32List[key]) {
                    removed.push(key);
                    continue;
                }
                if (oldCrc32List[key] != newCrc32List[key] && String(oldCrc32List[key]).substr(0, 2) == "2.") {
                    updated.push(key);
                }
            }
        }
        for (key in newCrc32List) {
            if (newCrc32List.hasOwnProperty(key)) {
                if (!oldCrc32List[key]) {
                    updated.push(key);
                }
            }
        }
        _fireObservers(updated, "updated");
        _fireObservers(removed, "deleted");
    }

    function _fireObservers(keys, action) {
        keys = [].concat(keys || []);
        if (action == "flushed") {
            keys = [];
            for (var key in _observers) {
                if (_observers.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            action = "deleted";
        }
        for (var i = 0, len = keys.length; i < len; i++) {
            if (_observers[keys[i]]) {
                for (var j = 0, jlen = _observers[keys[i]].length; j < jlen; j++) {
                    _observers[keys[i]][j](keys[i], action);
                }
            }
        }
    }

    function _publishChange() {
        var updateTime = (+new Date()).toString();
        if (_backend == "localStorage" || _backend == "globalStorage") {
            _storage_service.jStorage_update = updateTime;
        } else if (_backend == "userDataBehavior") {
            _storage_elm.setAttribute("jStorage_update", updateTime);
            _storage_elm.save("jStorage");
        }
        _storageObserver();
    }

    function _load_storage() {
        if (_storage_service.jStorage) {
            try {
                _storage = JSON.parse(String(_storage_service.jStorage));
            } catch (E6) {
                _storage_service.jStorage = "{}";
            }
        } else {
            _storage_service.jStorage = "{}";
        }
        _storage_size = _storage_service.jStorage ? String(_storage_service.jStorage).length : 0;
        if (!_storage.__jstorage_meta) {
            _storage.__jstorage_meta = {};
        }
        if (!_storage.__jstorage_meta.CRC32) {
            _storage.__jstorage_meta.CRC32 = {};
        }
    }

    function _save() {
        _dropOldEvents(); 
        try {
            _storage_service.jStorage = JSON.stringify(_storage);
            if (_storage_elm) {
                _storage_elm.setAttribute("jStorage", _storage_service.jStorage);
                _storage_elm.save("jStorage");
            }
            _storage_size = _storage_service.jStorage ? String(_storage_service.jStorage).length : 0;
        } catch (E7) {
        }
    }

    function _checkKey(key) {
        if (!key || (typeof key != "string" && typeof key != "number")) {
            throw new TypeError('Key name must be string or numeric');
        }
        if (key == "__jstorage_meta") {
            throw new TypeError('Reserved key name');
        }
        return true;
    }

    function _handleTTL() {
        var curtime, i, TTL, CRC32, nextExpire = Infinity,
            changed = false,
            deleted = [];
        clearTimeout(_ttl_timeout);
        if (!_storage.__jstorage_meta || typeof _storage.__jstorage_meta.TTL != "object") {
            return;
        }
        curtime = +new Date();
        TTL = _storage.__jstorage_meta.TTL;
        CRC32 = _storage.__jstorage_meta.CRC32;
        for (i in TTL) {
            if (TTL.hasOwnProperty(i)) {
                if (TTL[i] <= curtime) {
                    delete TTL[i];
                    delete CRC32[i];
                    delete _storage[i];
                    changed = true;
                    deleted.push(i);
                } else if (TTL[i] < nextExpire) {
                    nextExpire = TTL[i];
                }
            }
        }
        if (nextExpire != Infinity) {
            _ttl_timeout = setTimeout(_handleTTL, nextExpire - curtime);
        }
        if (changed) {
            _save();
            _publishChange();
            _fireObservers(deleted, "deleted");
        }
    }

    function _handlePubSub() {
        if (!_storage.__jstorage_meta.PubSub) {
            return;
        }
        var pubelm,
        _pubsubCurrent = _pubsub_last;
        for (var i = len = _storage.__jstorage_meta.PubSub.length - 1; i >= 0; i--) {
            pubelm = _storage.__jstorage_meta.PubSub[i];
            if (pubelm[0] > _pubsub_last) {
                _pubsubCurrent = pubelm[0];
                _fireSubscribers(pubelm[1], pubelm[2]);
            }
        }
        _pubsub_last = _pubsubCurrent;
    }

    function _fireSubscribers(channel, payload) {
        if (_pubsub_observers[channel]) {
            for (var i = 0, len = _pubsub_observers[channel].length; i < len; i++) {
                _pubsub_observers[channel][i](channel, JSON.parse(JSON.stringify(payload)));
            }
        }
    }
    function _dropOldEvents() {
        if (!_storage.__jstorage_meta.PubSub) {
            return;
        }
        var retire = +new Date() - 2000;
        for (var i = 0, len = _storage.__jstorage_meta.PubSub.length; i < len; i++) {
            if (_storage.__jstorage_meta.PubSub[i][0] <= retire) {
                _storage.__jstorage_meta.PubSub.splice(i, _storage.__jstorage_meta.PubSub.length - i);
                break;
            }
        }
        if (!_storage.__jstorage_meta.PubSub.length) {
            delete _storage.__jstorage_meta.PubSub;
        }
    }
    function _publish(channel, payload) {
        if (!_storage.__jstorage_meta) {
            _storage.__jstorage_meta = {};
        }
        if (!_storage.__jstorage_meta.PubSub) {
            _storage.__jstorage_meta.PubSub = [];
        }
        _storage.__jstorage_meta.PubSub.unshift([+new Date, channel, payload]);
        _save();
        _publishChange();
    }
    /**
     * JS Implementation of MurmurHash2
     *
     * SOURCE: hxxps://github.com/garycourt/murmurhash-js (MIT licensed)
     *
     * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
     * @see hxxp://github.com/garycourt/murmurhash-js
     * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
     * @see hxxp://sites.google.com/site/murmurhash/
     *
     * @param {string} str ASCII only
     * @param {number} seed Positive integer only
     * @return {number} 32-bit positive integer hash
     */
    function murmurhash2_32_gc(str, seed) {
        var l = str.length,
            h = seed ^ l,
            i = 0,
            k;
        while (l >= 4) {
            k = ((str.charCodeAt(i) & 0xff)) | ((str.charCodeAt(++i) & 0xff) << 8) | ((str.charCodeAt(++i) & 0xff) << 16) | ((str.charCodeAt(++i) & 0xff) << 24);
            k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
            k ^= k >>> 24;
            k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
            l -= 4;
            ++i;
        }
        switch (l) {
            case 3:
                h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
            case 2:
                h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
            case 1:
                h ^= (str.charCodeAt(i) & 0xff);
                h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        }
        h ^= h >>> 13;
        h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        h ^= h >>> 15;
        return h >>> 0;
    }

    $.jStorage = {
        version: JSTORAGE_VERSION,
        set: function (key, value, options) {
            _checkKey(key);
            options = options || {};
            if (typeof value == "undefined") {
                this.deleteKey(key);
                return value;
            }
            if (_XMLService.isXML(value)) {
                value = {
                    _is_xml: true,
                    xml: _XMLService.encode(value)
                };
            } else if (typeof value == "function") {
                return undefined; // 
            } else if (value && typeof value == "object") {
                value = JSON.parse(JSON.stringify(value));
            }
            _storage[key] = value;
            _storage.__jstorage_meta.CRC32[key] = "2." + murmurhash2_32_gc(JSON.stringify(value));
            this.setTTL(key, options.TTL || 0); 
            _localStoragePolyfillSetKey(key, value);
            _fireObservers(key, "updated");
            return value;
        },

        get: function (key, def) {
            _checkKey(key);
            if (key in _storage) {
                if (_storage[key] && typeof _storage[key] == "object" && _storage[key]._is_xml) {
                    return _XMLService.decode(_storage[key].xml);
                } else {
                    return _storage[key];
                }
            }
            return typeof (def) == 'undefined' ? null : def;
        },

        deleteKey: function (key) {
            _checkKey(key);
            if (key in _storage) {
                delete _storage[key];
                // remove from TTL list
                if (typeof _storage.__jstorage_meta.TTL == "object" && key in _storage.__jstorage_meta.TTL) {
                    delete _storage.__jstorage_meta.TTL[key];
                }
                delete _storage.__jstorage_meta.CRC32[key];
                _localStoragePolyfillSetKey(key, undefined);
                _save();
                _publishChange();
                _fireObservers(key, "deleted");
                return true;
            }
            return false;
        },

        setTTL: function (key, ttl) {
            var curtime = +new Date();
            _checkKey(key);
            ttl = Number(ttl) || 0;
            if (key in _storage) {
                if (!_storage.__jstorage_meta.TTL) {
                    _storage.__jstorage_meta.TTL = {};
                }
                if (ttl > 0) {
                    _storage.__jstorage_meta.TTL[key] = curtime + ttl;
                } else {
                    delete _storage.__jstorage_meta.TTL[key];
                }
                _save();
                _handleTTL();
                _publishChange();
                return true;
            }
            return false;
        },

        getTTL: function (key) {
            var curtime = +new Date(),
                ttl;
            _checkKey(key);
            if (key in _storage && _storage.__jstorage_meta.TTL && _storage.__jstorage_meta.TTL[key]) {
                ttl = _storage.__jstorage_meta.TTL[key] - curtime;
                return ttl || 0;
            }
            return 0;
        },

        flush: function () {
            _storage = {
                __jstorage_meta: {
                    CRC32: {}
                }
            };
            _createPolyfillStorage("local", true);
            _save();
            _publishChange();
            _fireObservers(null, "flushed");
            return true;
        },

        storageObj: function () {
            function F() {}
            F.prototype = _storage;
            return new F();
        },

        index: function () {
            var index = [],
                i;
            for (i in _storage) {
                if (_storage.hasOwnProperty(i) && i != "__jstorage_meta") {
                    index.push(i);
                }
            }
            return index;
        },

        storageSize: function () {
            return _storage_size;
        },

        currentBackend: function () {
            return _backend;
        },

        storageAvailable: function () {
            return !!_backend;
        },

        listenKeyChange: function (key, callback) {
            _checkKey(key);
            if (!_observers[key]) {
                _observers[key] = [];
            }
            _observers[key].push(callback);
        },

        stopListening: function (key, callback) {
            _checkKey(key);
            if (!_observers[key]) {
                return;
            }
            if (!callback) {
                delete _observers[key];
                return;
            }
            for (var i = _observers[key].length - 1; i >= 0; i--) {
                if (_observers[key][i] == callback) {
                    _observers[key].splice(i, 1);
                }
            }
        },

        subscribe: function (channel, callback) {
            channel = (channel || "").toString();
            if (!channel) {
                throw new TypeError('Channel not defined');
            }
            if (!_pubsub_observers[channel]) {
                _pubsub_observers[channel] = [];
            }
            _pubsub_observers[channel].push(callback);
        },

        publish: function (channel, payload) {
            channel = (channel || "").toString();
            if (!channel) {
                throw new TypeError('Channel not defined');
            }
            _publish(channel, payload);
        },

        reInit: function () {
            _reloadData();
        }
    };
    _init();
})();