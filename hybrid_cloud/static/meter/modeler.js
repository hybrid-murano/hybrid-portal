var Clazz = function() {
};
Clazz.prototype.construct = function() {
};
Clazz.extend = function(def) {
  var classDef = function() {
    if (arguments[0] !== Clazz) {
      this.construct.apply(this, arguments);
    }
  };
  var proto = new this(Clazz);
  var superClass = this.prototype;
  for (var n in def) {
    var item = def[n];
    if (item instanceof Function) {
      item.$ = superClass;
    }
    proto[n] = item;
  }
  classDef.prototype = proto;
  classDef.extend = this.extend;
  return classDef;
};
var PROTOTYPE = {};
(function() {
  var Prototype = {Version:"1.7.1", Browser:function() {
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == "[object Opera]";
    return{IE:!!window.attachEvent && !isOpera, Opera:isOpera, WebKit:ua.indexOf("AppleWebKit/") > -1, Gecko:ua.indexOf("Gecko") > -1 && ua.indexOf("KHTML") === -1, MobileSafari:/Apple.*Mobile/.test(ua)};
  }(), BrowserFeatures:{XPath:!!document.evaluate, SelectorsAPI:!!document.querySelector, ElementExtensions:function() {
    var constructor = window.Element || window.HTMLElement;
    return!!(constructor && constructor.prototype);
  }(), SpecificElementExtensions:function() {
    if (typeof window.HTMLDivElement !== "undefined") {
      return true;
    }
    var div = document.createElement("div"), form = document.createElement("form"), isSupported = false;
    if (div["__proto__"] && div["__proto__"] !== form["__proto__"]) {
      isSupported = true;
    }
    div = form = null;
    return isSupported;
  }()}, ScriptFragment:"<script[^>]*>([\\S\\s]*?)\x3c/script\\s*>", JSONFilter:/^\/\*-secure-([\s\S]*)\*\/\s*$/, emptyFunction:function() {
  }, K:function(x) {
    return x;
  }};
  if (Prototype.Browser.MobileSafari) {
    Prototype.BrowserFeatures.SpecificElementExtensions = false;
  }
  var Class = function() {
    var IS_DONTENUM_BUGGY = function() {
      for (var p in{toString:1}) {
        if (p === "toString") {
          return false;
        }
      }
      return true;
    }();
    function subclass() {
    }
    function create() {
      var parent = null, properties = $A(arguments);
      if (Object.isFunction(properties[0])) {
        parent = properties.shift();
      }
      function klass() {
        this.initialize.apply(this, arguments);
      }
      Object.extend(klass, Class.Methods);
      klass.superclass = parent;
      klass.subclasses = [];
      if (parent) {
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }
      for (var i = 0, length = properties.length;i < length;i++) {
        klass.addMethods(properties[i]);
      }
      if (!klass.prototype.initialize) {
        klass.prototype.initialize = Prototype.emptyFunction;
      }
      klass.prototype.constructor = klass;
      return klass;
    }
    function addMethods(source) {
      var ancestor = this.superclass && this.superclass.prototype, properties = Object.keys(source);
      if (IS_DONTENUM_BUGGY) {
        if (source.toString != Object.prototype.toString) {
          properties.push("toString");
        }
        if (source.valueOf != Object.prototype.valueOf) {
          properties.push("valueOf");
        }
      }
      for (var i = 0, length = properties.length;i < length;i++) {
        var property = properties[i], value = source[property];
        if (ancestor && (Object.isFunction(value) && value.argumentNames()[0] == "$super")) {
          var method = value;
          value = function(m) {
            return function() {
              return ancestor[m].apply(this, arguments);
            };
          }(property).wrap(method);
          value.valueOf = function(method) {
            return function() {
              return method.valueOf.call(method);
            };
          }(method);
          value.toString = function(method) {
            return function() {
              return method.toString.call(method);
            };
          }(method);
        }
        this.prototype[property] = value;
      }
      return this;
    }
    return{create:create, Methods:{addMethods:addMethods}};
  }();
  (function() {
    var _toString = Object.prototype.toString, _hasOwnProperty = Object.prototype.hasOwnProperty, NULL_TYPE = "Null", UNDEFINED_TYPE = "Undefined", BOOLEAN_TYPE = "Boolean", NUMBER_TYPE = "Number", STRING_TYPE = "String", OBJECT_TYPE = "Object", FUNCTION_CLASS = "[object Function]", BOOLEAN_CLASS = "[object Boolean]", NUMBER_CLASS = "[object Number]", STRING_CLASS = "[object String]", ARRAY_CLASS = "[object Array]", DATE_CLASS = "[object Date]", NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON && (typeof JSON.stringify === 
    "function" && (JSON.stringify(0) === "0" && typeof JSON.stringify(Prototype.K) === "undefined"));
    var DONT_ENUMS = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"];
    var IS_DONTENUM_BUGGY = function() {
      for (var p in{toString:1}) {
        if (p === "toString") {
          return false;
        }
      }
      return true;
    }();
    function Type(o) {
      switch(o) {
        case null:
          return NULL_TYPE;
        case void 0:
          return UNDEFINED_TYPE;
      }
      var type = typeof o;
      switch(type) {
        case "boolean":
          return BOOLEAN_TYPE;
        case "number":
          return NUMBER_TYPE;
        case "string":
          return STRING_TYPE;
      }
      return OBJECT_TYPE;
    }
    function extend(destination, source) {
      for (var property in source) {
        destination[property] = source[property];
      }
      return destination;
    }
    function inspect(object) {
      try {
        if (isUndefined(object)) {
          return "undefined";
        }
        if (object === null) {
          return "null";
        }
        return object.inspect ? object.inspect() : String(object);
      } catch (e) {
        if (e instanceof RangeError) {
          return "...";
        }
        throw e;
      }
    }
    function toJSON(value) {
      return Str("", {"":value}, []);
    }
    function Str(key, holder, stack) {
      var value = holder[key];
      if (Type(value) === OBJECT_TYPE && typeof value.toJSON === "function") {
        value = value.toJSON(key);
      }
      var _class = _toString.call(value);
      switch(_class) {
        case NUMBER_CLASS:
        ;
        case BOOLEAN_CLASS:
        ;
        case STRING_CLASS:
          value = value.valueOf();
      }
      switch(value) {
        case null:
          return "null";
        case true:
          return "true";
        case false:
          return "false";
      }
      var type = typeof value;
      switch(type) {
        case "string":
          return value.inspect(true);
        case "number":
          return isFinite(value) ? String(value) : "null";
        case "object":
          for (var i = 0, length = stack.length;i < length;i++) {
            if (stack[i] === value) {
              throw new TypeError("Cyclic reference to '" + value + "' in object");
            }
          }
          stack.push(value);
          var partial = [];
          if (_class === ARRAY_CLASS) {
            for (var i = 0, length = value.length;i < length;i++) {
              var str = Str(i, value, stack);
              partial.push(typeof str === "undefined" ? "null" : str);
            }
            partial = "[" + partial.join(",") + "]";
          } else {
            var keys = Object.keys(value);
            for (var i = 0, length = keys.length;i < length;i++) {
              var key = keys[i], str = Str(key, value, stack);
              if (typeof str !== "undefined") {
                partial.push(key.inspect(true) + ":" + str);
              }
            }
            partial = "{" + partial.join(",") + "}";
          }
          stack.pop();
          return partial;
      }
    }
    function stringify(object) {
      return JSON.stringify(object);
    }
    function toQueryString(object) {
      return $H(object).toQueryString();
    }
    function toHTML(object) {
      return object && object.toHTML ? object.toHTML() : String.interpret(object);
    }
    function keys(object) {
      if (Type(object) !== OBJECT_TYPE) {
        throw new TypeError;
      }
      var results = [];
      for (var property in object) {
        if (_hasOwnProperty.call(object, property)) {
          results.push(property);
        }
      }
      if (IS_DONTENUM_BUGGY) {
        for (var i = 0;property = DONT_ENUMS[i];i++) {
          if (_hasOwnProperty.call(object, property)) {
            results.push(property);
          }
        }
      }
      return results;
    }
    function values(object) {
      var results = [];
      for (var property in object) {
        results.push(object[property]);
      }
      return results;
    }
    function clone(object) {
      return extend({}, object);
    }
    function isElement(object) {
      return!!(object && object.nodeType == 1);
    }
    function isArray(object) {
      return _toString.call(object) === ARRAY_CLASS;
    }
    var hasNativeIsArray = typeof Array.isArray == "function" && (Array.isArray([]) && !Array.isArray({}));
    if (hasNativeIsArray) {
      isArray = Array.isArray;
    }
    function isHash(object) {
      return object instanceof Hash;
    }
    function isFunction(object) {
      return _toString.call(object) === FUNCTION_CLASS;
    }
    function isString(object) {
      return _toString.call(object) === STRING_CLASS;
    }
    function isNumber(object) {
      return _toString.call(object) === NUMBER_CLASS;
    }
    function isDate(object) {
      return _toString.call(object) === DATE_CLASS;
    }
    function isUndefined(object) {
      return typeof object === "undefined";
    }
    extend(Object, {extend:extend, inspect:inspect, toJSON:NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON, toQueryString:toQueryString, toHTML:toHTML, keys:Object.keys || keys, values:values, clone:clone, isElement:isElement, isArray:isArray, isHash:isHash, isFunction:isFunction, isString:isString, isNumber:isNumber, isDate:isDate, isUndefined:isUndefined});
  })();
  Object.extend(Function.prototype, function() {
    var slice = Array.prototype.slice;
    function update(array, args) {
      var arrayLength = array.length, length = args.length;
      while (length--) {
        array[arrayLength + length] = args[length];
      }
      return array;
    }
    function merge(array, args) {
      array = slice.call(array, 0);
      return update(array, args);
    }
    function argumentNames() {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, "").replace(/\s+/g, "").split(",");
      return names.length == 1 && !names[0] ? [] : names;
    }
    function bind(context) {
      if (arguments.length < 2 && Object.isUndefined(arguments[0])) {
        return this;
      }
      if (!Object.isFunction(this)) {
        throw new TypeError("The object is not callable.");
      }
      var nop = function() {
      };
      var __method = this, args = slice.call(arguments, 1);
      var bound = function() {
        var a = merge(args, arguments), c = context;
        var c = this instanceof bound ? this : context;
        return __method.apply(c, a);
      };
      nop.prototype = this.prototype;
      bound.prototype = new nop;
      return bound;
    }
    function bindAsEventListener(context) {
      var __method = this, args = slice.call(arguments, 1);
      return function(event) {
        var a = update([event || window.event], args);
        return __method.apply(context, a);
      };
    }
    function curry() {
      if (!arguments.length) {
        return this;
      }
      var __method = this, args = slice.call(arguments, 0);
      return function() {
        var a = merge(args, arguments);
        return __method.apply(this, a);
      };
    }
    function delay(timeout) {
      var __method = this, args = slice.call(arguments, 1);
      timeout = timeout * 1E3;
      return window.setTimeout(function() {
        return __method.apply(__method, args);
      }, timeout);
    }
    function defer() {
      var args = update([0.01], arguments);
      return this.delay.apply(this, args);
    }
    function wrap(wrapper) {
      var __method = this;
      return function() {
        var a = update([__method.bind(this)], arguments);
        return wrapper.apply(this, a);
      };
    }
    function methodize() {
      if (this._methodized) {
        return this._methodized;
      }
      var __method = this;
      return this._methodized = function() {
        var a = update([this], arguments);
        return __method.apply(null, a);
      };
    }
    var extensions = {argumentNames:argumentNames, bindAsEventListener:bindAsEventListener, curry:curry, delay:delay, defer:defer, wrap:wrap, methodize:methodize};
    if (!Function.prototype.bind) {
      extensions.bind = bind;
    }
    return extensions;
  }());
  (function(proto) {
    function toISOString() {
      return this.getUTCFullYear() + "-" + (this.getUTCMonth() + 1).toPaddedString(2) + "-" + this.getUTCDate().toPaddedString(2) + "T" + this.getUTCHours().toPaddedString(2) + ":" + this.getUTCMinutes().toPaddedString(2) + ":" + this.getUTCSeconds().toPaddedString(2) + "Z";
    }
    function toJSON() {
      return this.toISOString();
    }
    if (!proto.toISOString) {
      proto.toISOString = toISOString;
    }
    if (!proto.toJSON) {
      proto.toJSON = toJSON;
    }
  })(Date.prototype);
  RegExp.prototype.match = RegExp.prototype.test;
  RegExp.escape = function(str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
  };
  var PeriodicalExecuter = Class.create({initialize:function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;
    this.registerCallback();
  }, registerCallback:function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1E3);
  }, execute:function() {
    this.callback(this);
  }, stop:function() {
    if (!this.timer) {
      return;
    }
    clearInterval(this.timer);
    this.timer = null;
  }, onTimerEvent:function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch (e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }});
  Object.extend(String, {interpret:function(value) {
    return value == null ? "" : String(value);
  }, specialChar:{"\b":"\\b", "\t":"\\t", "\n":"\\n", "\f":"\\f", "\r":"\\r", "\\":"\\\\"}});
  Object.extend(String.prototype, function() {
    var NATIVE_JSON_PARSE_SUPPORT = window.JSON && (typeof JSON.parse === "function" && JSON.parse('{"test": true}').test);
    function prepareReplacement(replacement) {
      if (Object.isFunction(replacement)) {
        return replacement;
      }
      var template = new Template(replacement);
      return function(match) {
        return template.evaluate(match);
      };
    }
    function gsub(pattern, replacement) {
      var result = "", source = this, match;
      replacement = prepareReplacement(replacement);
      if (Object.isString(pattern)) {
        pattern = RegExp.escape(pattern);
      }
      if (!(pattern.length || pattern.source)) {
        replacement = replacement("");
        return replacement + source.split("").join(replacement) + replacement;
      }
      while (source.length > 0) {
        if (match = source.match(pattern)) {
          result += source.slice(0, match.index);
          result += String.interpret(replacement(match));
          source = source.slice(match.index + match[0].length);
        } else {
          result += source, source = "";
        }
      }
      return result;
    }
    function sub(pattern, replacement, count) {
      replacement = prepareReplacement(replacement);
      count = Object.isUndefined(count) ? 1 : count;
      return this.gsub(pattern, function(match) {
        if (--count < 0) {
          return match[0];
        }
        return replacement(match);
      });
    }
    function scan(pattern, iterator) {
      this.gsub(pattern, iterator);
      return String(this);
    }
    function truncate(length, truncation) {
      length = length || 30;
      truncation = Object.isUndefined(truncation) ? "..." : truncation;
      return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
    }
    function strip() {
      return this.replace(/^\s+/, "").replace(/\s+$/, "");
    }
    function stripTags() {
      return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, "");
    }
    function stripScripts() {
      return this.replace(new RegExp(Prototype.ScriptFragment, "img"), "");
    }
    function extractScripts() {
      var matchAll = new RegExp(Prototype.ScriptFragment, "img"), matchOne = new RegExp(Prototype.ScriptFragment, "im");
      return(this.match(matchAll) || []).map(function(scriptTag) {
        return(scriptTag.match(matchOne) || ["", ""])[1];
      });
    }
    function evalScripts() {
      return this.extractScripts().map(function(script) {
        return eval(script);
      });
    }
    function escapeHTML() {
      return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function unescapeHTML() {
      return this.stripTags().replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }
    function toQueryParams(separator) {
      var match = this.strip().match(/([^?#]*)(#.*)?$/);
      if (!match) {
        return{};
      }
      return match[1].split(separator || "&").inject({}, function(hash, pair) {
        if ((pair = pair.split("="))[0]) {
          var key = decodeURIComponent(pair.shift()), value = pair.length > 1 ? pair.join("=") : pair[0];
          if (value != undefined) {
            value = decodeURIComponent(value);
          }
          if (key in hash) {
            if (!Object.isArray(hash[key])) {
              hash[key] = [hash[key]];
            }
            hash[key].push(value);
          } else {
            hash[key] = value;
          }
        }
        return hash;
      });
    }
    function toArray() {
      return this.split("");
    }
    function succ() {
      return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    }
    function times(count) {
      return count < 1 ? "" : (new Array(count + 1)).join(this);
    }
    function camelize() {
      return this.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : "";
      });
    }
    function capitalize() {
      return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    }
    function underscore() {
      return this.replace(/::/g, "/").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
    }
    function dasherize() {
      return this.replace(/_/g, "-");
    }
    function inspect(useDoubleQuotes) {
      var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
        if (character in String.specialChar) {
          return String.specialChar[character];
        }
        return "\\u00" + character.charCodeAt().toPaddedString(2, 16);
      });
      if (useDoubleQuotes) {
        return'"' + escapedString.replace(/"/g, '\\"') + '"';
      }
      return "'" + escapedString.replace(/'/g, "\\'") + "'";
    }
    function unfilterJSON(filter) {
      return this.replace(filter || Prototype.JSONFilter, "$1");
    }
    function isJSON() {
      var str = this;
      if (str.blank()) {
        return false;
      }
      str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@");
      str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]");
      str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, "");
      return/^[\],:{}\s]*$/.test(str);
    }
    function evalJSON(sanitize) {
      var json = this.unfilterJSON(), cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      if (cx.test(json)) {
        json = json.replace(cx, function(a) {
          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }
      try {
        if (!sanitize || json.isJSON()) {
          return eval("(" + json + ")");
        }
      } catch (e) {
      }
      throw new SyntaxError("Badly formed JSON string: " + this.inspect());
    }
    function parseJSON() {
      var json = this.unfilterJSON();
      return JSON.parse(json);
    }
    function include(pattern) {
      return this.indexOf(pattern) > -1;
    }
    function startsWith(pattern) {
      return this.lastIndexOf(pattern, 0) === 0;
    }
    function endsWith(pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.indexOf(pattern, d) === d;
    }
    function empty() {
      return this == "";
    }
    function blank() {
      return/^\s*$/.test(this);
    }
    function interpolate(object, pattern) {
      return(new Template(this, pattern)).evaluate(object);
    }
    return{gsub:gsub, sub:sub, scan:scan, truncate:truncate, strip:String.prototype.trim || strip, stripTags:stripTags, stripScripts:stripScripts, extractScripts:extractScripts, evalScripts:evalScripts, escapeHTML:escapeHTML, unescapeHTML:unescapeHTML, toQueryParams:toQueryParams, parseQuery:toQueryParams, toArray:toArray, succ:succ, times:times, camelize:camelize, capitalize:capitalize, underscore:underscore, dasherize:dasherize, inspect:inspect, unfilterJSON:unfilterJSON, isJSON:isJSON, evalJSON:NATIVE_JSON_PARSE_SUPPORT ? 
    parseJSON : evalJSON, include:include, startsWith:startsWith, endsWith:endsWith, empty:empty, blank:blank, interpolate:interpolate};
  }());
  var Template = Class.create({initialize:function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  }, evaluate:function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements)) {
      object = object.toTemplateReplacements();
    }
    return this.template.gsub(this.pattern, function(match) {
      if (object == null) {
        return match[1] + "";
      }
      var before = match[1] || "";
      if (before == "\\") {
        return match[2];
      }
      var ctx = object, expr = match[3], pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
      match = pattern.exec(expr);
      if (match == null) {
        return before;
      }
      while (match != null) {
        var comp = match[1].startsWith("[") ? match[2].replace(/\\\\]/g, "]") : match[1];
        ctx = ctx[comp];
        if (null == ctx || "" == match[3]) {
          break;
        }
        expr = expr.substring("[" == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }
      return before + String.interpret(ctx);
    });
  }});
  Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
  var $break = {};
  var Enumerable = function() {
    function each(iterator, context) {
      try {
        this._each(iterator, context);
      } catch (e) {
        if (e != $break) {
          throw e;
        }
      }
      return this;
    }
    function eachSlice(number, iterator, context) {
      var index = -number, slices = [], array = this.toArray();
      if (number < 1) {
        return array;
      }
      while ((index += number) < array.length) {
        slices.push(array.slice(index, index + number));
      }
      return slices.collect(iterator, context);
    }
    function all(iterator, context) {
      iterator = iterator || Prototype.K;
      var result = true;
      this.each(function(value, index) {
        result = result && !!iterator.call(context, value, index, this);
        if (!result) {
          throw $break;
        }
      }, this);
      return result;
    }
    function any(iterator, context) {
      iterator = iterator || Prototype.K;
      var result = false;
      this.each(function(value, index) {
        if (result = !!iterator.call(context, value, index, this)) {
          throw $break;
        }
      }, this);
      return result;
    }
    function collect(iterator, context) {
      iterator = iterator || Prototype.K;
      var results = [];
      this.each(function(value, index) {
        results.push(iterator.call(context, value, index, this));
      }, this);
      return results;
    }
    function detect(iterator, context) {
      var result;
      this.each(function(value, index) {
        if (iterator.call(context, value, index, this)) {
          result = value;
          throw $break;
        }
      }, this);
      return result;
    }
    function findAll(iterator, context) {
      var results = [];
      this.each(function(value, index) {
        if (iterator.call(context, value, index, this)) {
          results.push(value);
        }
      }, this);
      return results;
    }
    function grep(filter, iterator, context) {
      iterator = iterator || Prototype.K;
      var results = [];
      if (Object.isString(filter)) {
        filter = new RegExp(RegExp.escape(filter));
      }
      this.each(function(value, index) {
        if (filter.match(value)) {
          results.push(iterator.call(context, value, index, this));
        }
      }, this);
      return results;
    }
    function include(object) {
      if (Object.isFunction(this.indexOf)) {
        if (this.indexOf(object) != -1) {
          return true;
        }
      }
      var found = false;
      this.each(function(value) {
        if (value == object) {
          found = true;
          throw $break;
        }
      });
      return found;
    }
    function inGroupsOf(number, fillWith) {
      fillWith = Object.isUndefined(fillWith) ? null : fillWith;
      return this.eachSlice(number, function(slice) {
        while (slice.length < number) {
          slice.push(fillWith);
        }
        return slice;
      });
    }
    function inject(memo, iterator, context) {
      this.each(function(value, index) {
        memo = iterator.call(context, memo, value, index, this);
      }, this);
      return memo;
    }
    function invoke(method) {
      var args = $A(arguments).slice(1);
      return this.map(function(value) {
        return value[method].apply(value, args);
      });
    }
    function max(iterator, context) {
      iterator = iterator || Prototype.K;
      var result;
      this.each(function(value, index) {
        value = iterator.call(context, value, index, this);
        if (result == null || value >= result) {
          result = value;
        }
      }, this);
      return result;
    }
    function min(iterator, context) {
      iterator = iterator || Prototype.K;
      var result;
      this.each(function(value, index) {
        value = iterator.call(context, value, index, this);
        if (result == null || value < result) {
          result = value;
        }
      }, this);
      return result;
    }
    function partition(iterator, context) {
      iterator = iterator || Prototype.K;
      var trues = [], falses = [];
      this.each(function(value, index) {
        (iterator.call(context, value, index, this) ? trues : falses).push(value);
      }, this);
      return[trues, falses];
    }
    function pluck(property) {
      var results = [];
      this.each(function(value) {
        results.push(value[property]);
      });
      return results;
    }
    function reject(iterator, context) {
      var results = [];
      this.each(function(value, index) {
        if (!iterator.call(context, value, index, this)) {
          results.push(value);
        }
      }, this);
      return results;
    }
    function sortBy(iterator, context) {
      return this.map(function(value, index) {
        return{value:value, criteria:iterator.call(context, value, index, this)};
      }, this).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck("value");
    }
    function toArray() {
      return this.map();
    }
    function zip() {
      var iterator = Prototype.K, args = $A(arguments);
      if (Object.isFunction(args.last())) {
        iterator = args.pop();
      }
      var collections = [this].concat(args).map($A);
      return this.map(function(value, index) {
        return iterator(collections.pluck(index));
      });
    }
    function size() {
      return this.toArray().length;
    }
    function inspect() {
      return "#<Enumerable:" + this.toArray().inspect() + ">";
    }
    return{each:each, eachSlice:eachSlice, all:all, every:all, any:any, some:any, collect:collect, map:collect, detect:detect, findAll:findAll, select:findAll, filter:findAll, grep:grep, include:include, member:include, inGroupsOf:inGroupsOf, inject:inject, invoke:invoke, max:max, min:min, partition:partition, pluck:pluck, reject:reject, sortBy:sortBy, toArray:toArray, entries:toArray, zip:zip, size:size, inspect:inspect, find:detect};
  }();
  function $A(iterable) {
    if (!iterable) {
      return[];
    }
    if ("toArray" in Object(iterable)) {
      return iterable.toArray();
    }
    var length = iterable.length || 0, results = new Array(length);
    while (length--) {
      results[length] = iterable[length];
    }
    return results;
  }
  function $w(string) {
    if (!Object.isString(string)) {
      return[];
    }
    string = string.strip();
    return string ? string.split(/\s+/) : [];
  }
  Array.from = $A;
  (function() {
    var arrayProto = Array.prototype, slice = arrayProto.slice, _each = arrayProto.forEach;
    function each(iterator, context) {
      for (var i = 0, length = this.length >>> 0;i < length;i++) {
        if (i in this) {
          iterator.call(context, this[i], i, this);
        }
      }
    }
    if (!_each) {
      _each = each;
    }
    function clear() {
      this.length = 0;
      return this;
    }
    function first() {
      return this[0];
    }
    function last() {
      return this[this.length - 1];
    }
    function compact() {
      return this.select(function(value) {
        return value != null;
      });
    }
    function flatten() {
      return this.inject([], function(array, value) {
        if (Object.isArray(value)) {
          return array.concat(value.flatten());
        }
        array.push(value);
        return array;
      });
    }
    function without() {
      var values = slice.call(arguments, 0);
      return this.select(function(value) {
        return!values.include(value);
      });
    }
    function reverse(inline) {
      return(inline === false ? this.toArray() : this)._reverse();
    }
    function uniq(sorted) {
      return this.inject([], function(array, value, index) {
        if (0 == index || (sorted ? array.last() != value : !array.include(value))) {
          array.push(value);
        }
        return array;
      });
    }
    function intersect(array) {
      return this.uniq().findAll(function(item) {
        return array.indexOf(item) !== -1;
      });
    }
    function clone() {
      return slice.call(this, 0);
    }
    function size() {
      return this.length;
    }
    function inspect() {
      return "[" + this.map(Object.inspect).join(", ") + "]";
    }
    function indexOf(item, i) {
      if (this == null) {
        throw new TypeError;
      }
      var array = Object(this), length = array.length >>> 0;
      if (length === 0) {
        return-1;
      }
      i = Number(i);
      if (isNaN(i)) {
        i = 0;
      } else {
        if (i !== 0 && isFinite(i)) {
          i = (i > 0 ? 1 : -1) * Math.floor(Math.abs(i));
        }
      }
      if (i > length) {
        return-1;
      }
      var k = i >= 0 ? i : Math.max(length - Math.abs(i), 0);
      for (;k < length;k++) {
        if (k in array && array[k] === item) {
          return k;
        }
      }
      return-1;
    }
    function lastIndexOf(item, i) {
      if (this == null) {
        throw new TypeError;
      }
      var array = Object(this), length = array.length >>> 0;
      if (length === 0) {
        return-1;
      }
      if (!Object.isUndefined(i)) {
        i = Number(i);
        if (isNaN(i)) {
          i = 0;
        } else {
          if (i !== 0 && isFinite(i)) {
            i = (i > 0 ? 1 : -1) * Math.floor(Math.abs(i));
          }
        }
      } else {
        i = length;
      }
      var k = i >= 0 ? Math.min(i, length - 1) : length - Math.abs(i);
      for (;k >= 0;k--) {
        if (k in array && array[k] === item) {
          return k;
        }
      }
      return-1;
    }
    function concat(_) {
      var array = [], items = slice.call(arguments, 0), item, n = 0;
      items.unshift(this);
      for (var i = 0, length = items.length;i < length;i++) {
        item = items[i];
        if (Object.isArray(item) && !("callee" in item)) {
          for (var j = 0, arrayLength = item.length;j < arrayLength;j++) {
            if (j in item) {
              array[n] = item[j];
            }
            n++;
          }
        } else {
          array[n++] = item;
        }
      }
      array.length = n;
      return array;
    }
    function wrapNative(method) {
      return function() {
        if (arguments.length === 0) {
          return method.call(this, Prototype.K);
        } else {
          if (arguments[0] === undefined) {
            var args = slice.call(arguments, 1);
            args.unshift(Prototype.K);
            return method.apply(this, args);
          } else {
            return method.apply(this, arguments);
          }
        }
      };
    }
    function map(iterator) {
      if (this == null) {
        throw new TypeError;
      }
      iterator = iterator || Prototype.K;
      var object = Object(this);
      var results = [], context = arguments[1], n = 0;
      for (var i = 0, length = object.length >>> 0;i < length;i++) {
        if (i in object) {
          results[n] = iterator.call(context, object[i], i, object);
        }
        n++;
      }
      results.length = n;
      return results;
    }
    if (arrayProto.map) {
      map = wrapNative(Array.prototype.map);
    }
    function filter(iterator) {
      if (this == null || !Object.isFunction(iterator)) {
        throw new TypeError;
      }
      var object = Object(this);
      var results = [], context = arguments[1], value;
      for (var i = 0, length = object.length >>> 0;i < length;i++) {
        if (i in object) {
          value = object[i];
          if (iterator.call(context, value, i, object)) {
            results.push(value);
          }
        }
      }
      return results;
    }
    if (arrayProto.filter) {
      filter = Array.prototype.filter;
    }
    function some(iterator) {
      if (this == null) {
        throw new TypeError;
      }
      iterator = iterator || Prototype.K;
      var context = arguments[1];
      var object = Object(this);
      for (var i = 0, length = object.length >>> 0;i < length;i++) {
        if (i in object && iterator.call(context, object[i], i, object)) {
          return true;
        }
      }
      return false;
    }
    if (arrayProto.some) {
      var some = wrapNative(Array.prototype.some)
    }
    function every(iterator) {
      if (this == null) {
        throw new TypeError;
      }
      iterator = iterator || Prototype.K;
      var context = arguments[1];
      var object = Object(this);
      for (var i = 0, length = object.length >>> 0;i < length;i++) {
        if (i in object && !iterator.call(context, object[i], i, object)) {
          return false;
        }
      }
      return true;
    }
    if (arrayProto.every) {
      var every = wrapNative(Array.prototype.every)
    }
    var _reduce = arrayProto.reduce;
    function inject(memo, iterator) {
      iterator = iterator || Prototype.K;
      var context = arguments[2];
      return _reduce.call(this, iterator.bind(context), memo);
    }
    if (!arrayProto.reduce) {
      var inject = Enumerable.inject
    }
    Object.extend(arrayProto, Enumerable);
    if (!arrayProto._reverse) {
      arrayProto._reverse = arrayProto.reverse;
    }
    Object.extend(arrayProto, {_each:_each, map:map, collect:map, select:filter, filter:filter, findAll:filter, some:some, any:some, every:every, all:every, inject:inject, clear:clear, first:first, last:last, compact:compact, flatten:flatten, without:without, reverse:reverse, uniq:uniq, intersect:intersect, clone:clone, toArray:clone, size:size, inspect:inspect});
    var CONCAT_ARGUMENTS_BUGGY = function() {
      return[].concat(arguments)[0][0] !== 1;
    }(1, 2);
    if (CONCAT_ARGUMENTS_BUGGY) {
      arrayProto.concat = concat;
    }
    if (!arrayProto.indexOf) {
      arrayProto.indexOf = indexOf;
    }
    if (!arrayProto.lastIndexOf) {
      arrayProto.lastIndexOf = lastIndexOf;
    }
  })();
  function $H(object) {
    return new Hash(object);
  }
  var Hash = Class.create(Enumerable, function() {
    function initialize(object) {
      this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    }
    function _each(iterator, context) {
      for (var key in this._object) {
        var value = this._object[key], pair = [key, value];
        pair.key = key;
        pair.value = value;
        iterator.call(context, pair);
      }
    }
    function set(key, value) {
      return this._object[key] = value;
    }
    function get(key) {
      if (this._object[key] !== Object.prototype[key]) {
        return this._object[key];
      }
    }
    function unset(key) {
      var value = this._object[key];
      delete this._object[key];
      return value;
    }
    function toObject() {
      return Object.clone(this._object);
    }
    function keys() {
      return this.pluck("key");
    }
    function values() {
      return this.pluck("value");
    }
    function index(value) {
      var match = this.detect(function(pair) {
        return pair.value === value;
      });
      return match && match.key;
    }
    function merge(object) {
      return this.clone().update(object);
    }
    function update(object) {
      return(new Hash(object)).inject(this, function(result, pair) {
        result.set(pair.key, pair.value);
        return result;
      });
    }
    function toQueryPair(key, value) {
      if (Object.isUndefined(value)) {
        return key;
      }
      var value = String.interpret(value);
      value = value.gsub(/(\r)?\n/, "\r\n");
      value = encodeURIComponent(value);
      value = value.gsub(/%20/, "+");
      return key + "=" + value;
    }
    function toQueryString() {
      return this.inject([], function(results, pair) {
        var key = encodeURIComponent(pair.key), values = pair.value;
        if (values && typeof values == "object") {
          if (Object.isArray(values)) {
            var queryValues = [];
            for (var i = 0, len = values.length, value;i < len;i++) {
              value = values[i];
              queryValues.push(toQueryPair(key, value));
            }
            return results.concat(queryValues);
          }
        } else {
          results.push(toQueryPair(key, values));
        }
        return results;
      }).join("&");
    }
    function inspect() {
      return "#<Hash:{" + this.map(function(pair) {
        return pair.map(Object.inspect).join(": ");
      }).join(", ") + "}>";
    }
    function clone() {
      return new Hash(this);
    }
    return{initialize:initialize, _each:_each, set:set, get:get, unset:unset, toObject:toObject, toTemplateReplacements:toObject, keys:keys, values:values, index:index, merge:merge, update:update, toQueryString:toQueryString, inspect:inspect, toJSON:toObject, clone:clone};
  }());
  Hash.from = $H;
  Object.extend(Number.prototype, function() {
    function toColorPart() {
      return this.toPaddedString(2, 16);
    }
    function succ() {
      return this + 1;
    }
    function times(iterator, context) {
      $R(0, this, true).each(iterator, context);
      return this;
    }
    function toPaddedString(length, radix) {
      var string = this.toString(radix || 10);
      return "0".times(length - string.length) + string;
    }
    function abs() {
      return Math.abs(this);
    }
    function round() {
      return Math.round(this);
    }
    function ceil() {
      return Math.ceil(this);
    }
    function floor() {
      return Math.floor(this);
    }
    return{toColorPart:toColorPart, succ:succ, times:times, toPaddedString:toPaddedString, abs:abs, round:round, ceil:ceil, floor:floor};
  }());
  function $R(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
  }
  var ObjectRange = Class.create(Enumerable, function() {
    function initialize(start, end, exclusive) {
      this.start = start;
      this.end = end;
      this.exclusive = exclusive;
    }
    function _each(iterator, context) {
      var value = this.start;
      while (this.include(value)) {
        iterator.call(context, value);
        value = value.succ();
      }
    }
    function include(value) {
      if (value < this.start) {
        return false;
      }
      if (this.exclusive) {
        return value < this.end;
      }
      return value <= this.end;
    }
    return{initialize:initialize, _each:_each, include:include};
  }());
  var Abstract = {};
  var Try = {these:function() {
    var returnValue;
    for (var i = 0, length = arguments.length;i < length;i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) {
      }
    }
    return returnValue;
  }};
  var Ajax = {getTransport:function() {
    return Try.these(function() {
      return new XMLHttpRequest;
    }, function() {
      return new ActiveXObject("Msxml2.XMLHTTP");
    }, function() {
      return new ActiveXObject("Microsoft.XMLHTTP");
    }) || false;
  }, activeRequestCount:0};
  Ajax.Responders = {responders:[], _each:function(iterator, context) {
    this.responders._each(iterator, context);
  }, register:function(responder) {
    if (!this.include(responder)) {
      this.responders.push(responder);
    }
  }, unregister:function(responder) {
    this.responders = this.responders.without(responder);
  }, dispatch:function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) {
        }
      }
    });
  }};
  Object.extend(Ajax.Responders, Enumerable);
  Ajax.Responders.register({onCreate:function() {
    Ajax.activeRequestCount++;
  }, onComplete:function() {
    Ajax.activeRequestCount--;
  }});
  Ajax.Base = Class.create({initialize:function(options) {
    this.options = {method:"post", asynchronous:true, contentType:"application/x-www-form-urlencoded", encoding:"UTF-8", parameters:"", evalJSON:true, evalJS:true};
    Object.extend(this.options, options || {});
    this.options.method = this.options.method.toLowerCase();
    if (Object.isHash(this.options.parameters)) {
      this.options.parameters = this.options.parameters.toObject();
    }
  }});
  Ajax.Request = Class.create(Ajax.Base, {_complete:false, initialize:function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  }, request:function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.isString(this.options.parameters) ? this.options.parameters : Object.toQueryString(this.options.parameters);
    if (!["get", "post"].include(this.method)) {
      params += (params ? "&" : "") + "_method=" + this.method;
      this.method = "post";
    }
    if (params && this.method === "get") {
      this.url += (this.url.include("?") ? "&" : "?") + params;
    }
    this.parameters = params.toQueryParams();
    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) {
        this.options.onCreate(response);
      }
      Ajax.Responders.dispatch("onCreate", this, response);
      this.transport.open(this.method.toUpperCase(), this.url, this.options.asynchronous);
      if (this.options.asynchronous) {
        this.respondToReadyState.bind(this).defer(1);
      }
      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();
      this.body = this.method == "post" ? this.options.postBody || params : null;
      this.transport.send(this.body);
      if (!this.options.asynchronous && this.transport.overrideMimeType) {
        this.onStateChange();
      }
    } catch (e) {
      this.dispatchException(e);
    }
  }, onStateChange:function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !(readyState == 4 && this._complete)) {
      this.respondToReadyState(this.transport.readyState);
    }
  }, setRequestHeaders:function() {
    var headers = {"X-Requested-With":"XMLHttpRequest", "X-Prototype-Version":Prototype.Version, "Accept":"text/javascript, text/html, application/xml, text/xml, */*"};
    if (this.method == "post") {
      headers["Content-type"] = this.options.contentType + (this.options.encoding ? "; charset=" + this.options.encoding : "");
      if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005) {
        headers["Connection"] = "close";
      }
    }
    if (typeof this.options.requestHeaders == "object") {
      var extras = this.options.requestHeaders;
      if (Object.isFunction(extras.push)) {
        for (var i = 0, length = extras.length;i < length;i += 2) {
          headers[extras[i]] = extras[i + 1];
        }
      } else {
        $H(extras).each(function(pair) {
          headers[pair.key] = pair.value;
        });
      }
    }
    for (var name in headers) {
      this.transport.setRequestHeader(name, headers[name]);
    }
  }, success:function() {
    var status = this.getStatus();
    return!status || (status >= 200 && status < 300 || status == 304);
  }, getStatus:function() {
    try {
      if (this.transport.status === 1223) {
        return 204;
      }
      return this.transport.status || 0;
    } catch (e) {
      return 0;
    }
  }, respondToReadyState:function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);
    if (state == "Complete") {
      try {
        this._complete = true;
        (this.options["on" + response.status] || (this.options["on" + (this.success() ? "Success" : "Failure")] || Prototype.emptyFunction))(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      var contentType = response.getHeader("Content-type");
      if (this.options.evalJS == "force" || this.options.evalJS && (this.isSameOrigin() && (contentType && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))) {
        this.evalResponse();
      }
    }
    try {
      (this.options["on" + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch("on" + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }
    if (state == "Complete") {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  }, isSameOrigin:function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return!m || m[0] == "#{protocol}//#{domain}#{port}".interpolate({protocol:location.protocol, domain:document.domain, port:location.port ? ":" + location.port : ""});
  }, getHeader:function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) {
      return null;
    }
  }, evalResponse:function() {
    try {
      return eval((this.transport.responseText || "").unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  }, dispatchException:function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch("onException", this, exception);
  }});
  Ajax.Request.Events = ["Uninitialized", "Loading", "Loaded", "Interactive", "Complete"];
  Ajax.Response = Class.create({initialize:function(request) {
    this.request = request;
    var transport = this.transport = request.transport, readyState = this.readyState = transport.readyState;
    if (readyState > 2 && !Prototype.Browser.IE || readyState == 4) {
      this.status = this.getStatus();
      this.statusText = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON = this._getHeaderJSON();
    }
    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  }, status:0, statusText:"", getStatus:Ajax.Request.prototype.getStatus, getStatusText:function() {
    try {
      return this.transport.statusText || "";
    } catch (e) {
      return "";
    }
  }, getHeader:Ajax.Request.prototype.getHeader, getAllHeaders:function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) {
      return null;
    }
  }, getResponseHeader:function(name) {
    return this.transport.getResponseHeader(name);
  }, getAllResponseHeaders:function() {
    return this.transport.getAllResponseHeaders();
  }, _getHeaderJSON:function() {
    var json = this.getHeader("X-JSON");
    if (!json) {
      return null;
    }
    try {
      json = decodeURIComponent(escape(json));
    } catch (e) {
    }
    try {
      return json.evalJSON(this.request.options.sanitizeJSON || !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }, _getResponseJSON:function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != "force" && !(this.getHeader("Content-type") || "").include("application/json") || this.responseText.blank())) {
      return null;
    }
    try {
      return this.responseText.evalJSON(options.sanitizeJSON || !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }});
  Ajax.Updater = Class.create(Ajax.Request, {initialize:function($super, container, url, options) {
    this.container = {success:container.success || container, failure:container.failure || (container.success ? null : container)};
    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) {
        onComplete(response, json);
      }
    }.bind(this);
    $super(url, options);
  }, updateContent:function(responseText) {
    var receiver = this.container[this.success() ? "success" : "failure"], options = this.options;
    if (!options.evalScripts) {
      responseText = responseText.stripScripts();
    }
    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = {};
          insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        } else {
          options.insertion(receiver, responseText);
        }
      } else {
        receiver.update(responseText);
      }
    }
  }});
  Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {initialize:function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;
    this.frequency = this.options.frequency || 2;
    this.decay = this.options.decay || 1;
    this.updater = {};
    this.container = container;
    this.url = url;
    this.start();
  }, start:function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  }, stop:function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  }, updateComplete:function(response) {
    if (this.options.decay) {
      this.decay = response.responseText == this.lastText ? this.decay * this.options.decay : 1;
      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  }, onTimerEvent:function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }});
  (function(GLOBAL) {
    var UNDEFINED;
    var SLICE = Array.prototype.slice;
    var DIV = document.createElement("div");
    function $(element) {
      if (arguments.length > 1) {
        for (var i = 0, elements = [], length = arguments.length;i < length;i++) {
          elements.push($(arguments[i]));
        }
        return elements;
      }
      if (Object.isString(element)) {
        element = document.getElementById(element);
      }
      return Element.extend(element);
    }
    GLOBAL.$ = $;
    if (!GLOBAL.Node) {
      GLOBAL.Node = {};
    }
    if (!GLOBAL.Node.ELEMENT_NODE) {
      Object.extend(GLOBAL.Node, {ELEMENT_NODE:1, ATTRIBUTE_NODE:2, TEXT_NODE:3, CDATA_SECTION_NODE:4, ENTITY_REFERENCE_NODE:5, ENTITY_NODE:6, PROCESSING_INSTRUCTION_NODE:7, COMMENT_NODE:8, DOCUMENT_NODE:9, DOCUMENT_TYPE_NODE:10, DOCUMENT_FRAGMENT_NODE:11, NOTATION_NODE:12});
    }
    var ELEMENT_CACHE = {};
    function shouldUseCreationCache(tagName, attributes) {
      if (tagName === "select") {
        return false;
      }
      if ("type" in attributes) {
        return false;
      }
      return true;
    }
    var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = function() {
      try {
        var el = document.createElement('<input name="x">');
        return el.tagName.toLowerCase() === "input" && el.name === "x";
      } catch (err) {
        return false;
      }
    }();
    var oldElement = GLOBAL.Element;
    function Element(tagName, attributes) {
      attributes = attributes || {};
      tagName = tagName.toLowerCase();
      if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
        tagName = "<" + tagName + ' name="' + attributes.name + '">';
        delete attributes.name;
        return Element.writeAttribute(document.createElement(tagName), attributes);
      }
      if (!ELEMENT_CACHE[tagName]) {
        ELEMENT_CACHE[tagName] = Element.extend(document.createElement(tagName));
      }
      var node = shouldUseCreationCache(tagName, attributes) ? ELEMENT_CACHE[tagName].cloneNode(false) : document.createElement(tagName);
      return Element.writeAttribute(node, attributes);
    }
    GLOBAL.Element = Element;
    Object.extend(GLOBAL.Element, oldElement || {});
    if (oldElement) {
      GLOBAL.Element.prototype = oldElement.prototype;
    }
    Element.Methods = {ByTag:{}, Simulated:{}};
    var methods = {};
    var INSPECT_ATTRIBUTES = {id:"id", className:"class"};
    function inspect(element) {
      element = $(element);
      var result = "<" + element.tagName.toLowerCase();
      var attribute, value;
      for (var property in INSPECT_ATTRIBUTES) {
        attribute = INSPECT_ATTRIBUTES[property];
        value = (element[property] || "").toString();
        if (value) {
          result += " " + attribute + "=" + value.inspect(true);
        }
      }
      return result + ">";
    }
    methods.inspect = inspect;
    function visible(element) {
      return $(element).style.display !== "none";
    }
    function toggle(element, bool) {
      element = $(element);
      if (Object.isUndefined(bool)) {
        bool = !Element.visible(element);
      }
      Element[bool ? "show" : "hide"](element);
      return element;
    }
    function hide(element) {
      element = $(element);
      element.style.display = "none";
      return element;
    }
    function show(element) {
      element = $(element);
      element.style.display = "";
      return element;
    }
    Object.extend(methods, {visible:visible, toggle:toggle, hide:hide, show:show});
    function remove(element) {
      element = $(element);
      element.parentNode.removeChild(element);
      return element;
    }
    var SELECT_ELEMENT_INNERHTML_BUGGY = function() {
      var el = document.createElement("select"), isBuggy = true;
      el.innerHTML = '<option value="test">test</option>';
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    }();
    var TABLE_ELEMENT_INNERHTML_BUGGY = function() {
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    }();
    var LINK_ELEMENT_INNERHTML_BUGGY = function() {
      try {
        var el = document.createElement("div");
        el.innerHTML = "<link />";
        var isBuggy = el.childNodes.length === 0;
        el = null;
        return isBuggy;
      } catch (e) {
        return true;
      }
    }();
    var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY || (TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY);
    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = function() {
      var s = document.createElement("script"), isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild || s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    }();
    function update(element, content) {
      element = $(element);
      var descendants = element.getElementsByTagName("*"), i = descendants.length;
      while (i--) {
        purgeElement(descendants[i]);
      }
      if (content && content.toElement) {
        content = content.toElement();
      }
      if (Object.isElement(content)) {
        return element.update().insert(content);
      }
      content = Object.toHTML(content);
      var tagName = element.tagName.toUpperCase();
      if (tagName === "SCRIPT" && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }
      if (ANY_INNERHTML_BUGGY) {
        if (tagName in INSERTION_TRANSLATIONS.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          var nodes = getContentFromAnonymousElement(tagName, content.stripScripts());
          for (var i = 0, node;node = nodes[i];i++) {
            element.appendChild(node);
          }
        } else {
          if (LINK_ELEMENT_INNERHTML_BUGGY && (Object.isString(content) && content.indexOf("<link") > -1)) {
            while (element.firstChild) {
              element.removeChild(element.firstChild);
            }
            var nodes = getContentFromAnonymousElement(tagName, content.stripScripts(), true);
            for (var i = 0, node;node = nodes[i];i++) {
              element.appendChild(node);
            }
          } else {
            element.innerHTML = content.stripScripts();
          }
        }
      } else {
        element.innerHTML = content.stripScripts();
      }
      content.evalScripts.bind(content).defer();
      return element;
    }
    function replace(element, content) {
      element = $(element);
      if (content && content.toElement) {
        content = content.toElement();
      } else {
        if (!Object.isElement(content)) {
          content = Object.toHTML(content);
          var range = element.ownerDocument.createRange();
          range.selectNode(element);
          content.evalScripts.bind(content).defer();
          content = range.createContextualFragment(content.stripScripts());
        }
      }
      element.parentNode.replaceChild(content, element);
      return element;
    }
    var INSERTION_TRANSLATIONS = {before:function(element, node) {
      element.parentNode.insertBefore(node, element);
    }, top:function(element, node) {
      element.insertBefore(node, element.firstChild);
    }, bottom:function(element, node) {
      element.appendChild(node);
    }, after:function(element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    }, tags:{TABLE:["<table>", "</table>", 1], TBODY:["<table><tbody>", "</tbody></table>", 2], TR:["<table><tbody><tr>", "</tr></tbody></table>", 3], TD:["<table><tbody><tr><td>", "</td></tr></tbody></table>", 4], SELECT:["<select>", "</select>", 1]}};
    var tags = INSERTION_TRANSLATIONS.tags;
    Object.extend(tags, {THEAD:tags.TBODY, TFOOT:tags.TBODY, TH:tags.TD});
    function replace_IE(element, content) {
      element = $(element);
      if (content && content.toElement) {
        content = content.toElement();
      }
      if (Object.isElement(content)) {
        element.parentNode.replaceChild(content, element);
        return element;
      }
      content = Object.toHTML(content);
      var parent = element.parentNode, tagName = parent.tagName.toUpperCase();
      if (tagName in INSERTION_TRANSLATIONS.tags) {
        var nextSibling = Element.next(element);
        var fragments = getContentFromAnonymousElement(tagName, content.stripScripts());
        parent.removeChild(element);
        var iterator;
        if (nextSibling) {
          iterator = function(node) {
            parent.insertBefore(node, nextSibling);
          };
        } else {
          iterator = function(node) {
            parent.appendChild(node);
          };
        }
        fragments.each(iterator);
      } else {
        element.outerHTML = content.stripScripts();
      }
      content.evalScripts.bind(content).defer();
      return element;
    }
    if ("outerHTML" in document.documentElement) {
      replace = replace_IE;
    }
    function isContent(content) {
      if (Object.isUndefined(content) || content === null) {
        return false;
      }
      if (Object.isString(content) || Object.isNumber(content)) {
        return true;
      }
      if (Object.isElement(content)) {
        return true;
      }
      if (content.toElement || content.toHTML) {
        return true;
      }
      return false;
    }
    function insertContentAt(element, content, position) {
      position = position.toLowerCase();
      var method = INSERTION_TRANSLATIONS[position];
      if (content && content.toElement) {
        content = content.toElement();
      }
      if (Object.isElement(content)) {
        method(element, content);
        return element;
      }
      content = Object.toHTML(content);
      var tagName = (position === "before" || position === "after" ? element.parentNode : element).tagName.toUpperCase();
      var childNodes = getContentFromAnonymousElement(tagName, content.stripScripts());
      if (position === "top" || position === "after") {
        childNodes.reverse();
      }
      for (var i = 0, node;node = childNodes[i];i++) {
        method(element, node);
      }
      content.evalScripts.bind(content).defer();
    }
    function insert(element, insertions) {
      element = $(element);
      if (isContent(insertions)) {
        insertions = {bottom:insertions};
      }
      for (var position in insertions) {
        insertContentAt(element, insertions[position], position);
      }
      return element;
    }
    function wrap(element, wrapper, attributes) {
      element = $(element);
      if (Object.isElement(wrapper)) {
        $(wrapper).writeAttribute(attributes || {});
      } else {
        if (Object.isString(wrapper)) {
          wrapper = new Element(wrapper, attributes);
        } else {
          wrapper = new Element("div", wrapper);
        }
      }
      if (element.parentNode) {
        element.parentNode.replaceChild(wrapper, element);
      }
      wrapper.appendChild(element);
      return wrapper;
    }
    function cleanWhitespace(element) {
      element = $(element);
      var node = element.firstChild;
      while (node) {
        var nextNode = node.nextSibling;
        if (node.nodeType === GLOBAL.Node.TEXT_NODE && !/\S/.test(node.nodeValue)) {
          element.removeChild(node);
        }
        node = nextNode;
      }
      return element;
    }
    function empty(element) {
      return $(element).innerHTML.blank();
    }
    function getContentFromAnonymousElement(tagName, html, force) {
      var t = INSERTION_TRANSLATIONS.tags[tagName], div = DIV;
      var workaround = !!t;
      if (!workaround && force) {
        workaround = true;
        t = ["", "", 0];
      }
      if (workaround) {
        div.innerHTML = "&#160;" + t[0] + html + t[1];
        div.removeChild(div.firstChild);
        for (var i = t[2];i--;) {
          div = div.firstChild;
        }
      } else {
        div.innerHTML = html;
      }
      return $A(div.childNodes);
    }
    function clone(element, deep) {
      if (!(element = $(element))) {
        return;
      }
      var clone = element.cloneNode(deep);
      if (!HAS_UNIQUE_ID_PROPERTY) {
        clone._prototypeUID = UNDEFINED;
        if (deep) {
          var descendants = Element.select(clone, "*"), i = descendants.length;
          while (i--) {
            descendants[i]._prototypeUID = UNDEFINED;
          }
        }
      }
      return Element.extend(clone);
    }
    function purgeElement(element) {
      var uid = getUniqueElementID(element);
      if (uid) {
        Element.stopObserving(element);
        if (!HAS_UNIQUE_ID_PROPERTY) {
          element._prototypeUID = UNDEFINED;
        }
        delete Element.Storage[uid];
      }
    }
    function purgeCollection(elements) {
      var i = elements.length;
      while (i--) {
        purgeElement(elements[i]);
      }
    }
    function purgeCollection_IE(elements) {
      var i = elements.length, element, uid;
      while (i--) {
        element = elements[i];
        uid = getUniqueElementID(element);
        delete Element.Storage[uid];
        delete Event.cache[uid];
      }
    }
    if (HAS_UNIQUE_ID_PROPERTY) {
      purgeCollection = purgeCollection_IE;
    }
    function purge(element) {
      if (!(element = $(element))) {
        return;
      }
      purgeElement(element);
      var descendants = element.getElementsByTagName("*"), i = descendants.length;
      while (i--) {
        purgeElement(descendants[i]);
      }
      return null;
    }
    Object.extend(methods, {remove:remove, update:update, replace:replace, insert:insert, wrap:wrap, cleanWhitespace:cleanWhitespace, empty:empty, clone:clone, purge:purge});
    function recursivelyCollect(element, property, maximumLength) {
      element = $(element);
      maximumLength = maximumLength || -1;
      var elements = [];
      while (element = element[property]) {
        if (element.nodeType === GLOBAL.Node.ELEMENT_NODE) {
          elements.push(Element.extend(element));
        }
        if (elements.length === maximumLength) {
          break;
        }
      }
      return elements;
    }
    function ancestors(element) {
      return recursivelyCollect(element, "parentNode");
    }
    function descendants(element) {
      return Element.select(element, "*");
    }
    function firstDescendant(element) {
      element = $(element).firstChild;
      while (element && element.nodeType !== GLOBAL.Node.ELEMENT_NODE) {
        element = element.nextSibling;
      }
      return $(element);
    }
    function immediateDescendants(element) {
      var results = [], child = $(element).firstChild;
      while (child) {
        if (child.nodeType === GLOBAL.Node.ELEMENT_NODE) {
          results.push(Element.extend(child));
        }
        child = child.nextSibling;
      }
      return results;
    }
    function previousSiblings(element) {
      return recursivelyCollect(element, "previousSibling");
    }
    function nextSiblings(element) {
      return recursivelyCollect(element, "nextSibling");
    }
    function siblings(element) {
      element = $(element);
      var previous = previousSiblings(element), next = nextSiblings(element);
      return previous.reverse().concat(next);
    }
    function match(element, selector) {
      element = $(element);
      if (Object.isString(selector)) {
        return Prototype.Selector.match(element, selector);
      }
      return selector.match(element);
    }
    function _recursivelyFind(element, property, expression, index) {
      element = $(element), expression = expression || 0, index = index || 0;
      if (Object.isNumber(expression)) {
        index = expression, expression = null;
      }
      while (element = element[property]) {
        if (element.nodeType !== 1) {
          continue;
        }
        if (expression && !Prototype.Selector.match(element, expression)) {
          continue;
        }
        if (--index >= 0) {
          continue;
        }
        return Element.extend(element);
      }
    }
    function up(element, expression, index) {
      element = $(element);
      if (arguments.length === 1) {
        return $(element.parentNode);
      }
      return _recursivelyFind(element, "parentNode", expression, index);
    }
    function down(element, expression, index) {
      element = $(element), expression = expression || 0, index = index || 0;
      if (Object.isNumber(expression)) {
        index = expression, expression = "*";
      }
      var node = Prototype.Selector.select(expression, element)[index];
      return Element.extend(node);
    }
    function previous(element, expression, index) {
      return _recursivelyFind(element, "previousSibling", expression, index);
    }
    function next(element, expression, index) {
      return _recursivelyFind(element, "nextSibling", expression, index);
    }
    function select(element) {
      element = $(element);
      var expressions = SLICE.call(arguments, 1).join(", ");
      return Prototype.Selector.select(expressions, element);
    }
    function adjacent(element) {
      element = $(element);
      var expressions = SLICE.call(arguments, 1).join(", ");
      var siblings = Element.siblings(element), results = [];
      for (var i = 0, sibling;sibling = siblings[i];i++) {
        if (Prototype.Selector.match(sibling, expressions)) {
          results.push(sibling);
        }
      }
      return results;
    }
    function descendantOf_DOM(element, ancestor) {
      element = $(element), ancestor = $(ancestor);
      while (element = element.parentNode) {
        if (element === ancestor) {
          return true;
        }
      }
      return false;
    }
    function descendantOf_contains(element, ancestor) {
      element = $(element), ancestor = $(ancestor);
      if (!ancestor.contains) {
        return descendantOf_DOM(element, ancestor);
      }
      return ancestor.contains(element) && ancestor !== element;
    }
    function descendantOf_compareDocumentPosition(element, ancestor) {
      element = $(element), ancestor = $(ancestor);
      return(element.compareDocumentPosition(ancestor) & 8) === 8;
    }
    var descendantOf;
    if (DIV.compareDocumentPosition) {
      descendantOf = descendantOf_compareDocumentPosition;
    } else {
      if (DIV.contains) {
        descendantOf = descendantOf_contains;
      } else {
        descendantOf = descendantOf_DOM;
      }
    }
    Object.extend(methods, {recursivelyCollect:recursivelyCollect, ancestors:ancestors, descendants:descendants, firstDescendant:firstDescendant, immediateDescendants:immediateDescendants, previousSiblings:previousSiblings, nextSiblings:nextSiblings, siblings:siblings, match:match, up:up, down:down, previous:previous, next:next, select:select, adjacent:adjacent, descendantOf:descendantOf, getElementsBySelector:select, childElements:immediateDescendants});
    var idCounter = 1;
    function identify(element) {
      element = $(element);
      var id = Element.readAttribute(element, "id");
      if (id) {
        return id;
      }
      do {
        id = "anonymous_element_" + idCounter++;
      } while ($(id));
      Element.writeAttribute(element, "id", id);
      return id;
    }
    function readAttribute(element, name) {
      return $(element).getAttribute(name);
    }
    function readAttribute_IE(element, name) {
      element = $(element);
      var table = ATTRIBUTE_TRANSLATIONS.read;
      if (table.values[name]) {
        return table.values[name](element, name);
      }
      if (table.names[name]) {
        name = table.names[name];
      }
      if (name.include(":")) {
        if (!element.attributes || !element.attributes[name]) {
          return null;
        }
        return element.attributes[name].value;
      }
      return element.getAttribute(name);
    }
    function readAttribute_Opera(element, name) {
      if (name === "title") {
        return element.title;
      }
      return element.getAttribute(name);
    }
    var PROBLEMATIC_ATTRIBUTE_READING = function() {
      DIV.setAttribute("onclick", Prototype.emptyFunction);
      var value = DIV.getAttribute("onclick");
      var isFunction = typeof value === "function";
      DIV.removeAttribute("onclick");
      return isFunction;
    }();
    if (PROBLEMATIC_ATTRIBUTE_READING) {
      readAttribute = readAttribute_IE;
    } else {
      if (Prototype.Browser.Opera) {
        readAttribute = readAttribute_Opera;
      }
    }
    function writeAttribute(element, name, value) {
      element = $(element);
      var attributes = {}, table = ATTRIBUTE_TRANSLATIONS.write;
      if (typeof name === "object") {
        attributes = name;
      } else {
        attributes[name] = Object.isUndefined(value) ? true : value;
      }
      for (var attr in attributes) {
        name = table.names[attr] || attr;
        value = attributes[attr];
        if (table.values[attr]) {
          name = table.values[attr](element, value);
        }
        if (value === false || value === null) {
          element.removeAttribute(name);
        } else {
          if (value === true) {
            element.setAttribute(name, name);
          } else {
            element.setAttribute(name, value);
          }
        }
      }
      return element;
    }
    function hasAttribute(element, attribute) {
      attribute = ATTRIBUTE_TRANSLATIONS.has[attribute] || attribute;
      var node = $(element).getAttributeNode(attribute);
      return!!(node && node.specified);
    }
    GLOBAL.Element.Methods.Simulated.hasAttribute = hasAttribute;
    function classNames(element) {
      return new Element.ClassNames(element);
    }
    var regExpCache = {};
    function getRegExpForClassName(className) {
      if (regExpCache[className]) {
        return regExpCache[className];
      }
      var re = new RegExp("(^|\\s+)" + className + "(\\s+|$)");
      regExpCache[className] = re;
      return re;
    }
    function hasClassName(element, className) {
      if (!(element = $(element))) {
        return;
      }
      var elementClassName = element.className;
      if (elementClassName.length === 0) {
        return false;
      }
      if (elementClassName === className) {
        return true;
      }
      return getRegExpForClassName(className).test(elementClassName);
    }
    function addClassName(element, className) {
      if (!(element = $(element))) {
        return;
      }
      if (!hasClassName(element, className)) {
        element.className += (element.className ? " " : "") + className;
      }
      return element;
    }
    function removeClassName(element, className) {
      if (!(element = $(element))) {
        return;
      }
      element.className = element.className.replace(getRegExpForClassName(className), " ").strip();
      return element;
    }
    function toggleClassName(element, className, bool) {
      if (!(element = $(element))) {
        return;
      }
      if (Object.isUndefined(bool)) {
        bool = !hasClassName(element, className);
      }
      var method = Element[bool ? "addClassName" : "removeClassName"];
      return method(element, className);
    }
    var ATTRIBUTE_TRANSLATIONS = {};
    var classProp = "className", forProp = "for";
    DIV.setAttribute(classProp, "x");
    if (DIV.className !== "x") {
      DIV.setAttribute("class", "x");
      if (DIV.className === "x") {
        classProp = "class";
      }
    }
    var LABEL = document.createElement("label");
    LABEL.setAttribute(forProp, "x");
    if (LABEL.htmlFor !== "x") {
      LABEL.setAttribute("htmlFor", "x");
      if (LABEL.htmlFor === "x") {
        forProp = "htmlFor";
      }
    }
    LABEL = null;
    function _getAttr(element, attribute) {
      return element.getAttribute(attribute);
    }
    function _getAttr2(element, attribute) {
      return element.getAttribute(attribute, 2);
    }
    function _getAttrNode(element, attribute) {
      var node = element.getAttributeNode(attribute);
      return node ? node.value : "";
    }
    function _getFlag(element, attribute) {
      return $(element).hasAttribute(attribute) ? attribute : null;
    }
    DIV.onclick = Prototype.emptyFunction;
    var onclickValue = DIV.getAttribute("onclick");
    var _getEv;
    if (String(onclickValue).indexOf("{") > -1) {
      _getEv = function(element, attribute) {
        var value = element.getAttribute(attribute);
        if (!value) {
          return null;
        }
        value = value.toString();
        value = value.split("{")[1];
        value = value.split("}")[0];
        return value.strip();
      };
    } else {
      if (onclickValue === "") {
        _getEv = function(element, attribute) {
          var value = element.getAttribute(attribute);
          if (!value) {
            return null;
          }
          return value.strip();
        };
      }
    }
    ATTRIBUTE_TRANSLATIONS.read = {names:{"class":classProp, "className":classProp, "for":forProp, "htmlFor":forProp}, values:{style:function(element) {
      return element.style.cssText.toLowerCase();
    }, title:function(element) {
      return element.title;
    }}};
    ATTRIBUTE_TRANSLATIONS.write = {names:{className:"class", htmlFor:"for", cellpadding:"cellPadding", cellspacing:"cellSpacing"}, values:{checked:function(element, value) {
      element.checked = !!value;
    }, style:function(element, value) {
      element.style.cssText = value ? value : "";
    }}};
    ATTRIBUTE_TRANSLATIONS.has = {names:{}};
    Object.extend(ATTRIBUTE_TRANSLATIONS.write.names, ATTRIBUTE_TRANSLATIONS.read.names);
    var CAMEL_CASED_ATTRIBUTE_NAMES = $w("colSpan rowSpan vAlign dateTime " + "accessKey tabIndex encType maxLength readOnly longDesc frameBorder");
    for (var i = 0, attr;attr = CAMEL_CASED_ATTRIBUTE_NAMES[i];i++) {
      ATTRIBUTE_TRANSLATIONS.write.names[attr.toLowerCase()] = attr;
      ATTRIBUTE_TRANSLATIONS.has.names[attr.toLowerCase()] = attr;
    }
    Object.extend(ATTRIBUTE_TRANSLATIONS.read.values, {href:_getAttr2, src:_getAttr2, type:_getAttr, action:_getAttrNode, disabled:_getFlag, checked:_getFlag, readonly:_getFlag, multiple:_getFlag, onload:_getEv, onunload:_getEv, onclick:_getEv, ondblclick:_getEv, onmousedown:_getEv, onmouseup:_getEv, onmouseover:_getEv, onmousemove:_getEv, onmouseout:_getEv, onfocus:_getEv, onblur:_getEv, onkeypress:_getEv, onkeydown:_getEv, onkeyup:_getEv, onsubmit:_getEv, onreset:_getEv, onselect:_getEv, onchange:_getEv});
    Object.extend(methods, {identify:identify, readAttribute:readAttribute, writeAttribute:writeAttribute, classNames:classNames, hasClassName:hasClassName, addClassName:addClassName, removeClassName:removeClassName, toggleClassName:toggleClassName});
    function normalizeStyleName(style) {
      if (style === "float" || style === "styleFloat") {
        return "cssFloat";
      }
      return style.camelize();
    }
    function normalizeStyleName_IE(style) {
      if (style === "float" || style === "cssFloat") {
        return "styleFloat";
      }
      return style.camelize();
    }
    function setStyle(element, styles) {
      element = $(element);
      var elementStyle = element.style, match;
      if (Object.isString(styles)) {
        elementStyle.cssText += ";" + styles;
        if (styles.include("opacity")) {
          var opacity = styles.match(/opacity:\s*(\d?\.?\d*)/)[1];
          Element.setOpacity(element, opacity);
        }
        return element;
      }
      for (var property in styles) {
        if (property === "opacity") {
          Element.setOpacity(element, styles[property]);
        } else {
          var value = styles[property];
          if (property === "float" || property === "cssFloat") {
            property = Object.isUndefined(elementStyle.styleFloat) ? "cssFloat" : "styleFloat";
          }
          elementStyle[property] = value;
        }
      }
      return element;
    }
    function getStyle(element, style) {
      element = $(element);
      style = normalizeStyleName(style);
      var value = element.style[style];
      if (!value || value === "auto") {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css[style] : null;
      }
      if (style === "opacity") {
        return value ? parseFloat(value) : 1;
      }
      return value === "auto" ? null : value;
    }
    function getStyle_Opera(element, style) {
      switch(style) {
        case "height":
        ;
        case "width":
          if (!Element.visible(element)) {
            return null;
          }
          var dim = parseInt(getStyle(element, style), 10);
          if (dim !== element["offset" + style.capitalize()]) {
            return dim + "px";
          }
          return Element.measure(element, style);
        default:
          return getStyle(element, style);
      }
    }
    function getStyle_IE(element, style) {
      element = $(element);
      style = normalizeStyleName_IE(style);
      var value = element.style[style];
      if (!value && element.currentStyle) {
        value = element.currentStyle[style];
      }
      if (style === "opacity" && !STANDARD_CSS_OPACITY_SUPPORTED) {
        return getOpacity_IE(element);
      }
      if (value === "auto") {
        if ((style === "width" || style === "height") && Element.visible(element)) {
          return Element.measure(element, style) + "px";
        }
        return null;
      }
      return value;
    }
    function stripAlphaFromFilter_IE(filter) {
      return(filter || "").replace(/alpha\([^\)]*\)/gi, "");
    }
    function hasLayout_IE(element) {
      if (!element.currentStyle.hasLayout) {
        element.style.zoom = 1;
      }
      return element;
    }
    var STANDARD_CSS_OPACITY_SUPPORTED = function() {
      DIV.style.cssText = "opacity:.55";
      return/^0.55/.test(DIV.style.opacity);
    }();
    function setOpacity(element, value) {
      element = $(element);
      if (value == 1 || value === "") {
        value = "";
      } else {
        if (value < 1E-5) {
          value = 0;
        }
      }
      element.style.opacity = value;
      return element;
    }
    function setOpacity_IE(element, value) {
      if (STANDARD_CSS_OPACITY_SUPPORTED) {
        return setOpacity(element, value);
      }
      element = hasLayout_IE($(element));
      var filter = Element.getStyle(element, "filter"), style = element.style;
      if (value == 1 || value === "") {
        filter = stripAlphaFromFilter_IE(filter);
        if (filter) {
          style.filter = filter;
        } else {
          style.removeAttribute("filter");
        }
        return element;
      }
      if (value < 1E-5) {
        value = 0;
      }
      style.filter = stripAlphaFromFilter_IE(filter) + "alpha(opacity=" + value * 100 + ")";
      return element;
    }
    function getOpacity(element) {
      return Element.getStyle(element, "opacity");
    }
    function getOpacity_IE(element) {
      if (STANDARD_CSS_OPACITY_SUPPORTED) {
        return getOpacity(element);
      }
      var filter = Element.getStyle(element, "filter");
      if (filter.length === 0) {
        return 1;
      }
      var match = (filter || "").match(/alpha\(opacity=(.*)\)/);
      if (match[1]) {
        return parseFloat(match[1]) / 100;
      }
      return 1;
    }
    Object.extend(methods, {setStyle:setStyle, getStyle:getStyle, setOpacity:setOpacity, getOpacity:getOpacity});
    if ("styleFloat" in DIV.style) {
      methods.getStyle = getStyle_IE;
      methods.setOpacity = setOpacity_IE;
      methods.getOpacity = getOpacity_IE;
    }
    var UID = 0;
    GLOBAL.Element.Storage = {UID:1};
    function getUniqueElementID(element) {
      if (element === window) {
        return 0;
      }
      if (typeof element._prototypeUID === "undefined") {
        element._prototypeUID = Element.Storage.UID++;
      }
      return element._prototypeUID;
    }
    function getUniqueElementID_IE(element) {
      if (element === window) {
        return 0;
      }
      if (element == document) {
        return 1;
      }
      return element.uniqueID;
    }
    var HAS_UNIQUE_ID_PROPERTY = "uniqueID" in DIV;
    if (HAS_UNIQUE_ID_PROPERTY) {
      getUniqueElementID = getUniqueElementID_IE;
    }
    function getStorage(element) {
      if (!(element = $(element))) {
        return;
      }
      var uid = getUniqueElementID(element);
      if (!Element.Storage[uid]) {
        Element.Storage[uid] = $H();
      }
      return Element.Storage[uid];
    }
    function store(element, key, value) {
      if (!(element = $(element))) {
        return;
      }
      var storage = getStorage(element);
      if (arguments.length === 2) {
        storage.update(key);
      } else {
        storage.set(key, value);
      }
      return element;
    }
    function retrieve(element, key, defaultValue) {
      if (!(element = $(element))) {
        return;
      }
      var storage = getStorage(element), value = storage.get(key);
      if (Object.isUndefined(value)) {
        storage.set(key, defaultValue);
        value = defaultValue;
      }
      return value;
    }
    Object.extend(methods, {getStorage:getStorage, store:store, retrieve:retrieve});
    var Methods = {}, ByTag = Element.Methods.ByTag, F = Prototype.BrowserFeatures;
    if (!F.ElementExtensions && "__proto__" in DIV) {
      GLOBAL.HTMLElement = {};
      GLOBAL.HTMLElement.prototype = DIV["__proto__"];
      F.ElementExtensions = true;
    }
    function checkElementPrototypeDeficiency(tagName) {
      if (typeof window.Element === "undefined") {
        return false;
      }
      var proto = window.Element.prototype;
      if (proto) {
        var id = "_" + (Math.random() + "").slice(2), el = document.createElement(tagName);
        proto[id] = "x";
        var isBuggy = el[id] !== "x";
        delete proto[id];
        el = null;
        return isBuggy;
      }
      return false;
    }
    var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkElementPrototypeDeficiency("object");
    function extendElementWith(element, methods) {
      for (var property in methods) {
        var value = methods[property];
        if (Object.isFunction(value) && !(property in element)) {
          element[property] = value.methodize();
        }
      }
    }
    var EXTENDED = {};
    function elementIsExtended(element) {
      var uid = getUniqueElementID(element);
      return uid in EXTENDED;
    }
    function extend(element) {
      if (!element || elementIsExtended(element)) {
        return element;
      }
      if (element.nodeType !== GLOBAL.Node.ELEMENT_NODE || element == window) {
        return element;
      }
      var methods = Object.clone(Methods), tagName = element.tagName.toUpperCase();
      if (ByTag[tagName]) {
        Object.extend(methods, ByTag[tagName]);
      }
      extendElementWith(element, methods);
      EXTENDED[getUniqueElementID(element)] = true;
      return element;
    }
    function extend_IE8(element) {
      if (!element || elementIsExtended(element)) {
        return element;
      }
      var t = element.tagName;
      if (t && /^(?:object|applet|embed)$/i.test(t)) {
        extendElementWith(element, Element.Methods);
        extendElementWith(element, Element.Methods.Simulated);
        extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
      }
      return element;
    }
    if (F.SpecificElementExtensions) {
      extend = HTMLOBJECTELEMENT_PROTOTYPE_BUGGY ? extend_IE8 : Prototype.K;
    }
    function addMethodsToTagName(tagName, methods) {
      tagName = tagName.toUpperCase();
      if (!ByTag[tagName]) {
        ByTag[tagName] = {};
      }
      Object.extend(ByTag[tagName], methods);
    }
    function mergeMethods(destination, methods, onlyIfAbsent) {
      if (Object.isUndefined(onlyIfAbsent)) {
        onlyIfAbsent = false;
      }
      for (var property in methods) {
        var value = methods[property];
        if (!Object.isFunction(value)) {
          continue;
        }
        if (!onlyIfAbsent || !(property in destination)) {
          destination[property] = value.methodize();
        }
      }
    }
    function findDOMClass(tagName) {
      var klass;
      var trans = {"OPTGROUP":"OptGroup", "TEXTAREA":"TextArea", "P":"Paragraph", "FIELDSET":"FieldSet", "UL":"UList", "OL":"OList", "DL":"DList", "DIR":"Directory", "H1":"Heading", "H2":"Heading", "H3":"Heading", "H4":"Heading", "H5":"Heading", "H6":"Heading", "Q":"Quote", "INS":"Mod", "DEL":"Mod", "A":"Anchor", "IMG":"Image", "CAPTION":"TableCaption", "COL":"TableCol", "COLGROUP":"TableCol", "THEAD":"TableSection", "TFOOT":"TableSection", "TBODY":"TableSection", "TR":"TableRow", "TH":"TableCell", 
      "TD":"TableCell", "FRAMESET":"FrameSet", "IFRAME":"IFrame"};
      if (trans[tagName]) {
        klass = "HTML" + trans[tagName] + "Element";
      }
      if (window[klass]) {
        return window[klass];
      }
      klass = "HTML" + tagName + "Element";
      if (window[klass]) {
        return window[klass];
      }
      klass = "HTML" + tagName.capitalize() + "Element";
      if (window[klass]) {
        return window[klass];
      }
      var element = document.createElement(tagName), proto = element["__proto__"] || element.constructor.prototype;
      element = null;
      return proto;
    }
    function addMethods(methods) {
      if (arguments.length === 0) {
        addFormMethods();
      }
      if (arguments.length === 2) {
        var tagName = methods;
        methods = arguments[1];
      }
      if (!tagName) {
        Object.extend(Element.Methods, methods || {});
      } else {
        if (Object.isArray(tagName)) {
          for (var i = 0, tag;tag = tagName[i];i++) {
            addMethodsToTagName(tag, methods);
          }
        } else {
          addMethodsToTagName(tagName, methods);
        }
      }
      var ELEMENT_PROTOTYPE = window.HTMLElement ? HTMLElement.prototype : Element.prototype;
      if (F.ElementExtensions) {
        mergeMethods(ELEMENT_PROTOTYPE, Element.Methods);
        mergeMethods(ELEMENT_PROTOTYPE, Element.Methods.Simulated, true);
      }
      if (F.SpecificElementExtensions) {
        for (var tag in Element.Methods.ByTag) {
          var klass = findDOMClass(tag);
          if (Object.isUndefined(klass)) {
            continue;
          }
          mergeMethods(klass.prototype, ByTag[tag]);
        }
      }
      Object.extend(Element, Element.Methods);
      Object.extend(Element, Element.Methods.Simulated);
      delete Element.ByTag;
      delete Element.Simulated;
      Element.extend.refresh();
      ELEMENT_CACHE = {};
    }
    Object.extend(GLOBAL.Element, {extend:extend, addMethods:addMethods});
    if (extend === Prototype.K) {
      GLOBAL.Element.extend.refresh = Prototype.emptyFunction;
    } else {
      GLOBAL.Element.extend.refresh = function() {
        if (Prototype.BrowserFeatures.ElementExtensions) {
          return;
        }
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
        EXTENDED = {};
      };
    }
    function addFormMethods() {
      Object.extend(Form, Form.Methods);
      Object.extend(Form.Element, Form.Element.Methods);
      Object.extend(Element.Methods.ByTag, {"FORM":Object.clone(Form.Methods), "INPUT":Object.clone(Form.Element.Methods), "SELECT":Object.clone(Form.Element.Methods), "TEXTAREA":Object.clone(Form.Element.Methods), "BUTTON":Object.clone(Form.Element.Methods)});
    }
    Element.addMethods(methods);
  })(this);
  (function(GLOBAL) {
    function $(element) {
      return GLOBAL.$(element);
    }
    Element = GLOBAL.Element;
    function toDecimal(pctString) {
      var match = pctString.match(/^(\d+)%?$/i);
      if (!match) {
        return null;
      }
      return Number(match[1]) / 100;
    }
    function getRawStyle(element, style) {
      element = $(element);
      var value = element.style[style];
      if (!value || value === "auto") {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css[style] : null;
      }
      if (style === "opacity") {
        return value ? parseFloat(value) : 1;
      }
      return value === "auto" ? null : value;
    }
    function getRawStyle_IE(element, style) {
      var value = element.style[style];
      if (!value && element.currentStyle) {
        value = element.currentStyle[style];
      }
      return value;
    }
    function getContentWidth(element, context) {
      var boxWidth = element.offsetWidth;
      var bl = getPixelValue(element, "borderLeftWidth", context) || 0;
      var br = getPixelValue(element, "borderRightWidth", context) || 0;
      var pl = getPixelValue(element, "paddingLeft", context) || 0;
      var pr = getPixelValue(element, "paddingRight", context) || 0;
      return boxWidth - bl - br - pl - pr;
    }
    if ("currentStyle" in document.documentElement) {
      getRawStyle = getRawStyle_IE;
    }
    function getPixelValue(value, property, context) {
      var element = null;
      if (Object.isElement(value)) {
        element = value;
        value = getRawStyle(element, property);
      }
      if (value === null || Object.isUndefined(value)) {
        return null;
      }
      if (/^(?:-)?\d+(\.\d+)?(px)?$/i.test(value)) {
        return window.parseFloat(value);
      }
      var isPercentage = value.include("%"), isViewport = context === document.viewport;
      if (/\d/.test(value) && (element && (element.runtimeStyle && !(isPercentage && isViewport)))) {
        var style = element.style.left, rStyle = element.runtimeStyle.left;
        element.runtimeStyle.left = element.currentStyle.left;
        element.style.left = value || 0;
        value = element.style.pixelLeft;
        element.style.left = style;
        element.runtimeStyle.left = rStyle;
        return value;
      }
      if (element && isPercentage) {
        context = context || element.parentNode;
        var decimal = toDecimal(value), whole = null;
        var isHorizontal = property.include("left") || (property.include("right") || property.include("width"));
        var isVertical = property.include("top") || (property.include("bottom") || property.include("height"));
        if (context === document.viewport) {
          if (isHorizontal) {
            whole = document.viewport.getWidth();
          } else {
            if (isVertical) {
              whole = document.viewport.getHeight();
            }
          }
        } else {
          if (isHorizontal) {
            whole = $(context).measure("width");
          } else {
            if (isVertical) {
              whole = $(context).measure("height");
            }
          }
        }
        return whole === null ? 0 : whole * decimal;
      }
      return 0;
    }
    function toCSSPixels(number) {
      if (Object.isString(number) && number.endsWith("px")) {
        return number;
      }
      return number + "px";
    }
    function isDisplayed(element) {
      while (element && element.parentNode) {
        var display = element.getStyle("display");
        if (display === "none") {
          return false;
        }
        element = $(element.parentNode);
      }
      return true;
    }
    var hasLayout = Prototype.K;
    if ("currentStyle" in document.documentElement) {
      hasLayout = function(element) {
        if (!element.currentStyle.hasLayout) {
          element.style.zoom = 1;
        }
        return element;
      };
    }
    function cssNameFor(key) {
      if (key.include("border")) {
        key = key + "-width";
      }
      return key.camelize();
    }
    Element.Layout = Class.create(Hash, {initialize:function($super, element, preCompute) {
      $super();
      this.element = $(element);
      Element.Layout.PROPERTIES.each(function(property) {
        this._set(property, null);
      }, this);
      if (preCompute) {
        this._preComputing = true;
        this._begin();
        Element.Layout.PROPERTIES.each(this._compute, this);
        this._end();
        this._preComputing = false;
      }
    }, _set:function(property, value) {
      return Hash.prototype.set.call(this, property, value);
    }, set:function(property, value) {
      throw "Properties of Element.Layout are read-only.";
    }, get:function($super, property) {
      var value = $super(property);
      return value === null ? this._compute(property) : value;
    }, _begin:function() {
      if (this._isPrepared()) {
        return;
      }
      var element = this.element;
      if (isDisplayed(element)) {
        this._setPrepared(true);
        return;
      }
      var originalStyles = {position:element.style.position || "", width:element.style.width || "", visibility:element.style.visibility || "", display:element.style.display || ""};
      element.store("prototype_original_styles", originalStyles);
      var position = getRawStyle(element, "position"), width = element.offsetWidth;
      if (width === 0 || width === null) {
        element.style.display = "block";
        width = element.offsetWidth;
      }
      var context = position === "fixed" ? document.viewport : element.parentNode;
      var tempStyles = {visibility:"hidden", display:"block"};
      if (position !== "fixed") {
        tempStyles.position = "absolute";
      }
      element.setStyle(tempStyles);
      var positionedWidth = element.offsetWidth, newWidth;
      if (width && positionedWidth === width) {
        newWidth = getContentWidth(element, context);
      } else {
        if (position === "absolute" || position === "fixed") {
          newWidth = getContentWidth(element, context);
        } else {
          var parent = element.parentNode, pLayout = $(parent).getLayout();
          newWidth = pLayout.get("width") - this.get("margin-left") - this.get("border-left") - this.get("padding-left") - this.get("padding-right") - this.get("border-right") - this.get("margin-right");
        }
      }
      element.setStyle({width:newWidth + "px"});
      this._setPrepared(true);
    }, _end:function() {
      var element = this.element;
      var originalStyles = element.retrieve("prototype_original_styles");
      element.store("prototype_original_styles", null);
      element.setStyle(originalStyles);
      this._setPrepared(false);
    }, _compute:function(property) {
      var COMPUTATIONS = Element.Layout.COMPUTATIONS;
      if (!(property in COMPUTATIONS)) {
        throw "Property not found.";
      }
      return this._set(property, COMPUTATIONS[property].call(this, this.element));
    }, _isPrepared:function() {
      return this.element.retrieve("prototype_element_layout_prepared", false);
    }, _setPrepared:function(bool) {
      return this.element.store("prototype_element_layout_prepared", bool);
    }, toObject:function() {
      var args = $A(arguments);
      var keys = args.length === 0 ? Element.Layout.PROPERTIES : args.join(" ").split(" ");
      var obj = {};
      keys.each(function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) {
          return;
        }
        var value = this.get(key);
        if (value != null) {
          obj[key] = value;
        }
      }, this);
      return obj;
    }, toHash:function() {
      var obj = this.toObject.apply(this, arguments);
      return new Hash(obj);
    }, toCSS:function() {
      var args = $A(arguments);
      var keys = args.length === 0 ? Element.Layout.PROPERTIES : args.join(" ").split(" ");
      var css = {};
      keys.each(function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) {
          return;
        }
        if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) {
          return;
        }
        var value = this.get(key);
        if (value != null) {
          css[cssNameFor(key)] = value + "px";
        }
      }, this);
      return css;
    }, inspect:function() {
      return "#<Element.Layout>";
    }});
    Object.extend(Element.Layout, {PROPERTIES:$w("height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height"), COMPOSITE_PROPERTIES:$w("padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height"), COMPUTATIONS:{"height":function(element) {
      if (!this._preComputing) {
        this._begin();
      }
      var bHeight = this.get("border-box-height");
      if (bHeight <= 0) {
        if (!this._preComputing) {
          this._end();
        }
        return 0;
      }
      var bTop = this.get("border-top"), bBottom = this.get("border-bottom");
      var pTop = this.get("padding-top"), pBottom = this.get("padding-bottom");
      if (!this._preComputing) {
        this._end();
      }
      return bHeight - bTop - bBottom - pTop - pBottom;
    }, "width":function(element) {
      if (!this._preComputing) {
        this._begin();
      }
      var bWidth = this.get("border-box-width");
      if (bWidth <= 0) {
        if (!this._preComputing) {
          this._end();
        }
        return 0;
      }
      var bLeft = this.get("border-left"), bRight = this.get("border-right");
      var pLeft = this.get("padding-left"), pRight = this.get("padding-right");
      if (!this._preComputing) {
        this._end();
      }
      return bWidth - bLeft - bRight - pLeft - pRight;
    }, "padding-box-height":function(element) {
      var height = this.get("height"), pTop = this.get("padding-top"), pBottom = this.get("padding-bottom");
      return height + pTop + pBottom;
    }, "padding-box-width":function(element) {
      var width = this.get("width"), pLeft = this.get("padding-left"), pRight = this.get("padding-right");
      return width + pLeft + pRight;
    }, "border-box-height":function(element) {
      if (!this._preComputing) {
        this._begin();
      }
      var height = element.offsetHeight;
      if (!this._preComputing) {
        this._end();
      }
      return height;
    }, "border-box-width":function(element) {
      if (!this._preComputing) {
        this._begin();
      }
      var width = element.offsetWidth;
      if (!this._preComputing) {
        this._end();
      }
      return width;
    }, "margin-box-height":function(element) {
      var bHeight = this.get("border-box-height"), mTop = this.get("margin-top"), mBottom = this.get("margin-bottom");
      if (bHeight <= 0) {
        return 0;
      }
      return bHeight + mTop + mBottom;
    }, "margin-box-width":function(element) {
      var bWidth = this.get("border-box-width"), mLeft = this.get("margin-left"), mRight = this.get("margin-right");
      if (bWidth <= 0) {
        return 0;
      }
      return bWidth + mLeft + mRight;
    }, "top":function(element) {
      var offset = element.positionedOffset();
      return offset.top;
    }, "bottom":function(element) {
      var offset = element.positionedOffset(), parent = element.getOffsetParent(), pHeight = parent.measure("height");
      var mHeight = this.get("border-box-height");
      return pHeight - mHeight - offset.top;
    }, "left":function(element) {
      var offset = element.positionedOffset();
      return offset.left;
    }, "right":function(element) {
      var offset = element.positionedOffset(), parent = element.getOffsetParent(), pWidth = parent.measure("width");
      var mWidth = this.get("border-box-width");
      return pWidth - mWidth - offset.left;
    }, "padding-top":function(element) {
      return getPixelValue(element, "paddingTop");
    }, "padding-bottom":function(element) {
      return getPixelValue(element, "paddingBottom");
    }, "padding-left":function(element) {
      return getPixelValue(element, "paddingLeft");
    }, "padding-right":function(element) {
      return getPixelValue(element, "paddingRight");
    }, "border-top":function(element) {
      return getPixelValue(element, "borderTopWidth");
    }, "border-bottom":function(element) {
      return getPixelValue(element, "borderBottomWidth");
    }, "border-left":function(element) {
      return getPixelValue(element, "borderLeftWidth");
    }, "border-right":function(element) {
      return getPixelValue(element, "borderRightWidth");
    }, "margin-top":function(element) {
      return getPixelValue(element, "marginTop");
    }, "margin-bottom":function(element) {
      return getPixelValue(element, "marginBottom");
    }, "margin-left":function(element) {
      return getPixelValue(element, "marginLeft");
    }, "margin-right":function(element) {
      return getPixelValue(element, "marginRight");
    }}});
    if ("getBoundingClientRect" in document.documentElement) {
      Object.extend(Element.Layout.COMPUTATIONS, {"right":function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(), pRect = parent.getBoundingClientRect();
        return(pRect.right - rect.right).round();
      }, "bottom":function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(), pRect = parent.getBoundingClientRect();
        return(pRect.bottom - rect.bottom).round();
      }});
    }
    Element.Offset = Class.create({initialize:function(left, top) {
      this.left = left.round();
      this.top = top.round();
      this[0] = this.left;
      this[1] = this.top;
    }, relativeTo:function(offset) {
      return new Element.Offset(this.left - offset.left, this.top - offset.top);
    }, inspect:function() {
      return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
    }, toString:function() {
      return "[#{left}, #{top}]".interpolate(this);
    }, toArray:function() {
      return[this.left, this.top];
    }});
    function getLayout(element, preCompute) {
      return new Element.Layout(element, preCompute);
    }
    function measure(element, property) {
      return $(element).getLayout().get(property);
    }
    function getHeight(element) {
      return Element.getDimensions(element).height;
    }
    function getWidth(element) {
      return Element.getDimensions(element).width;
    }
    function getDimensions(element) {
      element = $(element);
      var display = Element.getStyle(element, "display");
      if (display && display !== "none") {
        return{width:element.offsetWidth, height:element.offsetHeight};
      }
      var style = element.style;
      var originalStyles = {visibility:style.visibility, position:style.position, display:style.display};
      var newStyles = {visibility:"hidden", display:"block"};
      if (originalStyles.position !== "fixed") {
        newStyles.position = "absolute";
      }
      Element.setStyle(element, newStyles);
      var dimensions = {width:element.offsetWidth, height:element.offsetHeight};
      Element.setStyle(element, originalStyles);
      return dimensions;
    }
    function getOffsetParent(element) {
      element = $(element);
      if (isDocument(element) || (isDetached(element) || (isBody(element) || isHtml(element)))) {
        return $(document.body);
      }
      var isInline = Element.getStyle(element, "display") === "inline";
      if (!isInline && element.offsetParent) {
        return $(element.offsetParent);
      }
      while ((element = element.parentNode) && element !== document.body) {
        if (Element.getStyle(element, "position") !== "static") {
          return isHtml(element) ? $(document.body) : $(element);
        }
      }
      return $(document.body);
    }
    function cumulativeOffset(element) {
      element = $(element);
      var valueT = 0, valueL = 0;
      if (element.parentNode) {
        do {
          valueT += element.offsetTop || 0;
          valueL += element.offsetLeft || 0;
          element = element.offsetParent;
        } while (element);
      }
      return new Element.Offset(valueL, valueT);
    }
    function positionedOffset(element) {
      element = $(element);
      var layout = element.getLayout();
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
        if (element) {
          if (isBody(element)) {
            break;
          }
          var p = Element.getStyle(element, "position");
          if (p !== "static") {
            break;
          }
        }
      } while (element);
      valueL -= layout.get("margin-top");
      valueT -= layout.get("margin-left");
      return new Element.Offset(valueL, valueT);
    }
    function cumulativeScrollOffset(element) {
      var valueT = 0, valueL = 0;
      do {
        valueT += element.scrollTop || 0;
        valueL += element.scrollLeft || 0;
        element = element.parentNode;
      } while (element);
      return new Element.Offset(valueL, valueT);
    }
    function viewportOffset(forElement) {
      var valueT = 0, valueL = 0, docBody = document.body;
      var element = $(forElement);
      do {
        valueT += element.offsetTop || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == docBody && Element.getStyle(element, "position") == "absolute") {
          break;
        }
      } while (element = element.offsetParent);
      element = forElement;
      do {
        if (element != docBody) {
          valueT -= element.scrollTop || 0;
          valueL -= element.scrollLeft || 0;
        }
      } while (element = element.parentNode);
      return new Element.Offset(valueL, valueT);
    }
    function absolutize(element) {
      element = $(element);
      if (Element.getStyle(element, "position") === "absolute") {
        return element;
      }
      var offsetParent = getOffsetParent(element);
      var eOffset = element.viewportOffset(), pOffset = offsetParent.viewportOffset();
      var offset = eOffset.relativeTo(pOffset);
      var layout = element.getLayout();
      element.store("prototype_absolutize_original_styles", {left:element.getStyle("left"), top:element.getStyle("top"), width:element.getStyle("width"), height:element.getStyle("height")});
      element.setStyle({position:"absolute", top:offset.top + "px", left:offset.left + "px", width:layout.get("width") + "px", height:layout.get("height") + "px"});
      return element;
    }
    function relativize(element) {
      element = $(element);
      if (Element.getStyle(element, "position") === "relative") {
        return element;
      }
      var originalStyles = element.retrieve("prototype_absolutize_original_styles");
      if (originalStyles) {
        element.setStyle(originalStyles);
      }
      return element;
    }
    function scrollTo(element) {
      element = $(element);
      var pos = Element.cumulativeOffset(element);
      window.scrollTo(pos.left, pos.top);
      return element;
    }
    function makePositioned(element) {
      element = $(element);
      var position = Element.getStyle(element, "position"), styles = {};
      if (position === "static" || !position) {
        styles.position = "relative";
        if (Prototype.Browser.Opera) {
          styles.top = 0;
          styles.left = 0;
        }
        Element.setStyle(element, styles);
        Element.store(element, "prototype_made_positioned", true);
      }
      return element;
    }
    function undoPositioned(element) {
      element = $(element);
      var storage = Element.getStorage(element), madePositioned = storage.get("prototype_made_positioned");
      if (madePositioned) {
        storage.unset("prototype_made_positioned");
        Element.setStyle(element, {position:"", top:"", bottom:"", left:"", right:""});
      }
      return element;
    }
    function makeClipping(element) {
      element = $(element);
      var storage = Element.getStorage(element), madeClipping = storage.get("prototype_made_clipping");
      if (Object.isUndefined(madeClipping)) {
        var overflow = Element.getStyle(element, "overflow");
        storage.set("prototype_made_clipping", overflow);
        if (overflow !== "hidden") {
          element.style.overflow = "hidden";
        }
      }
      return element;
    }
    function undoClipping(element) {
      element = $(element);
      var storage = Element.getStorage(element), overflow = storage.get("prototype_made_clipping");
      if (!Object.isUndefined(overflow)) {
        storage.unset("prototype_made_clipping");
        element.style.overflow = overflow || "";
      }
      return element;
    }
    function clonePosition(element, source, options) {
      options = Object.extend({setLeft:true, setTop:true, setWidth:true, setHeight:true, offsetTop:0, offsetLeft:0}, options || {});
      source = $(source);
      element = $(element);
      var p, delta, layout, styles = {};
      if (options.setLeft || options.setTop) {
        p = Element.viewportOffset(source);
        delta = [0, 0];
        if (Element.getStyle(element, "position") === "absolute") {
          var parent = Element.getOffsetParent(element);
          if (parent !== document.body) {
            delta = Element.viewportOffset(parent);
          }
        }
      }
      if (options.setWidth || options.setHeight) {
        layout = Element.getLayout(source);
      }
      if (options.setLeft) {
        styles.left = p[0] - delta[0] + options.offsetLeft + "px";
      }
      if (options.setTop) {
        styles.top = p[1] - delta[1] + options.offsetTop + "px";
      }
      if (options.setWidth) {
        styles.width = layout.get("border-box-width") + "px";
      }
      if (options.setHeight) {
        styles.height = layout.get("border-box-height") + "px";
      }
      return Element.setStyle(element, styles);
    }
    if (Prototype.Browser.IE) {
      getOffsetParent = getOffsetParent.wrap(function(proceed, element) {
        element = $(element);
        if (isDocument(element) || (isDetached(element) || (isBody(element) || isHtml(element)))) {
          return $(document.body);
        }
        var position = element.getStyle("position");
        if (position !== "static") {
          return proceed(element);
        }
        element.setStyle({position:"relative"});
        var value = proceed(element);
        element.setStyle({position:position});
        return value;
      });
      positionedOffset = positionedOffset.wrap(function(proceed, element) {
        element = $(element);
        if (!element.parentNode) {
          return new Element.Offset(0, 0);
        }
        var position = element.getStyle("position");
        if (position !== "static") {
          return proceed(element);
        }
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle("position") === "fixed") {
          hasLayout(offsetParent);
        }
        element.setStyle({position:"relative"});
        var value = proceed(element);
        element.setStyle({position:position});
        return value;
      });
    } else {
      if (Prototype.Browser.Webkit) {
        cumulativeOffset = function(element) {
          element = $(element);
          var valueT = 0, valueL = 0;
          do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            if (element.offsetParent == document.body) {
              if (Element.getStyle(element, "position") == "absolute") {
                break;
              }
            }
            element = element.offsetParent;
          } while (element);
          return new Element.Offset(valueL, valueT);
        };
      }
    }
    Element.addMethods({getLayout:getLayout, measure:measure, getWidth:getWidth, getHeight:getHeight, getDimensions:getDimensions, getOffsetParent:getOffsetParent, cumulativeOffset:cumulativeOffset, positionedOffset:positionedOffset, cumulativeScrollOffset:cumulativeScrollOffset, viewportOffset:viewportOffset, absolutize:absolutize, relativize:relativize, scrollTo:scrollTo, makePositioned:makePositioned, undoPositioned:undoPositioned, makeClipping:makeClipping, undoClipping:undoClipping, clonePosition:clonePosition});
    function isBody(element) {
      return element.nodeName.toUpperCase() === "BODY";
    }
    function isHtml(element) {
      return element.nodeName.toUpperCase() === "HTML";
    }
    function isDocument(element) {
      return element.nodeType === GLOBAL.Node.DOCUMENT_NODE;
    }
    function isDetached(element) {
      return element !== document.body && !Element.descendantOf(element, document.body);
    }
    if ("getBoundingClientRect" in document.documentElement) {
      Element.addMethods({viewportOffset:function(element) {
        element = $(element);
        if (isDetached(element)) {
          return new Element.Offset(0, 0);
        }
        var rect = element.getBoundingClientRect(), docEl = document.documentElement;
        return new Element.Offset(rect.left - docEl.clientLeft, rect.top - docEl.clientTop);
      }});
    }
  })(this);
  (function() {
    var IS_OLD_OPERA = Prototype.Browser.Opera && window.parseFloat(window.opera.version()) < 9.5;
    var ROOT = null;
    function getRootElement() {
      if (ROOT) {
        return ROOT;
      }
      ROOT = IS_OLD_OPERA ? document.body : document.documentElement;
      return ROOT;
    }
    function getDimensions() {
      return{width:this.getWidth(), height:this.getHeight()};
    }
    function getWidth() {
      return getRootElement().clientWidth;
    }
    function getHeight() {
      return getRootElement().clientHeight;
    }
    function getScrollOffsets() {
      var x = window.pageXOffset || (document.documentElement.scrollLeft || document.body.scrollLeft);
      var y = window.pageYOffset || (document.documentElement.scrollTop || document.body.scrollTop);
      return new Element.Offset(x, y);
    }
    document.viewport = {getDimensions:getDimensions, getWidth:getWidth, getHeight:getHeight, getScrollOffsets:getScrollOffsets};
  })();
  this.$$ = function() {
    var expression = $A(arguments).join(", ");
    return Prototype.Selector.select(expression, document);
  };
  Prototype.Selector = function() {
    function select() {
      throw new Error('Method "Prototype.Selector.select" must be defined.');
    }
    function match() {
      throw new Error('Method "Prototype.Selector.match" must be defined.');
    }
    function find(elements, expression, index) {
      index = index || 0;
      var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;
      for (i = 0;i < length;i++) {
        if (match(elements[i], expression) && index == matchIndex++) {
          return Element.extend(elements[i]);
        }
      }
    }
    function extendElements(elements) {
      for (var i = 0, length = elements.length;i < length;i++) {
        Element.extend(elements[i]);
      }
      return elements;
    }
    var K = Prototype.K;
    return{select:select, match:match, find:find, extendElements:Element.extend === K ? K : extendElements, extendElement:Element.extend};
  }();
  (function(GLOBAL) {
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g, done = 0, toString = Object.prototype.toString, hasDuplicate = false, baseHasDuplicate = true, rBackslash = /\\/g, rNonWord = /\W/;
    [0, 0].sort(function() {
      baseHasDuplicate = false;
      return 0;
    });
    var Sizzle = function(selector, context, results, seed) {
      results = results || [];
      context = context || document;
      var origContext = context;
      if (context.nodeType !== 1 && context.nodeType !== 9) {
        return[];
      }
      if (!selector || typeof selector !== "string") {
        return results;
      }
      var m, set, checkSet, extra, ret, cur, pop, i, prune = true, contextXML = Sizzle.isXML(context), parts = [], soFar = selector;
      do {
        chunker.exec("");
        m = chunker.exec(soFar);
        if (m) {
          soFar = m[3];
          parts.push(m[1]);
          if (m[2]) {
            extra = m[3];
            break;
          }
        }
      } while (m);
      if (parts.length > 1 && origPOS.exec(selector)) {
        if (parts.length === 2 && Expr.relative[parts[0]]) {
          set = posProcess(parts[0] + parts[1], context);
        } else {
          set = Expr.relative[parts[0]] ? [context] : Sizzle(parts.shift(), context);
          while (parts.length) {
            selector = parts.shift();
            if (Expr.relative[selector]) {
              selector += parts.shift();
            }
            set = posProcess(selector, set);
          }
        }
      } else {
        if (!seed && (parts.length > 1 && (context.nodeType === 9 && (!contextXML && (Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1])))))) {
          ret = Sizzle.find(parts.shift(), context, contextXML);
          context = ret.expr ? Sizzle.filter(ret.expr, ret.set)[0] : ret.set[0];
        }
        if (context) {
          ret = seed ? {expr:parts.pop(), set:makeArray(seed)} : Sizzle.find(parts.pop(), parts.length === 1 && ((parts[0] === "~" || parts[0] === "+") && context.parentNode) ? context.parentNode : context, contextXML);
          set = ret.expr ? Sizzle.filter(ret.expr, ret.set) : ret.set;
          if (parts.length > 0) {
            checkSet = makeArray(set);
          } else {
            prune = false;
          }
          while (parts.length) {
            cur = parts.pop();
            pop = cur;
            if (!Expr.relative[cur]) {
              cur = "";
            } else {
              pop = parts.pop();
            }
            if (pop == null) {
              pop = context;
            }
            Expr.relative[cur](checkSet, pop, contextXML);
          }
        } else {
          checkSet = parts = [];
        }
      }
      if (!checkSet) {
        checkSet = set;
      }
      if (!checkSet) {
        Sizzle.error(cur || selector);
      }
      if (toString.call(checkSet) === "[object Array]") {
        if (!prune) {
          results.push.apply(results, checkSet);
        } else {
          if (context && context.nodeType === 1) {
            for (i = 0;checkSet[i] != null;i++) {
              if (checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i]))) {
                results.push(set[i]);
              }
            }
          } else {
            for (i = 0;checkSet[i] != null;i++) {
              if (checkSet[i] && checkSet[i].nodeType === 1) {
                results.push(set[i]);
              }
            }
          }
        }
      } else {
        makeArray(checkSet, results);
      }
      if (extra) {
        Sizzle(extra, origContext, results, seed);
        Sizzle.uniqueSort(results);
      }
      return results;
    };
    Sizzle.uniqueSort = function(results) {
      if (sortOrder) {
        hasDuplicate = baseHasDuplicate;
        results.sort(sortOrder);
        if (hasDuplicate) {
          for (var i = 1;i < results.length;i++) {
            if (results[i] === results[i - 1]) {
              results.splice(i--, 1);
            }
          }
        }
      }
      return results;
    };
    Sizzle.matches = function(expr, set) {
      return Sizzle(expr, null, null, set);
    };
    Sizzle.matchesSelector = function(node, expr) {
      return Sizzle(expr, null, null, [node]).length > 0;
    };
    Sizzle.find = function(expr, context, isXML) {
      var set;
      if (!expr) {
        return[];
      }
      for (var i = 0, l = Expr.order.length;i < l;i++) {
        var match, type = Expr.order[i];
        if (match = Expr.leftMatch[type].exec(expr)) {
          var left = match[1];
          match.splice(1, 1);
          if (left.substr(left.length - 1) !== "\\") {
            match[1] = (match[1] || "").replace(rBackslash, "");
            set = Expr.find[type](match, context, isXML);
            if (set != null) {
              expr = expr.replace(Expr.match[type], "");
              break;
            }
          }
        }
      }
      if (!set) {
        set = typeof context.getElementsByTagName !== "undefined" ? context.getElementsByTagName("*") : [];
      }
      return{set:set, expr:expr};
    };
    Sizzle.filter = function(expr, set, inplace, not) {
      var match, anyFound, old = expr, result = [], curLoop = set, isXMLFilter = set && (set[0] && Sizzle.isXML(set[0]));
      while (expr && set.length) {
        for (var type in Expr.filter) {
          if ((match = Expr.leftMatch[type].exec(expr)) != null && match[2]) {
            var found, item, filter = Expr.filter[type], left = match[1];
            anyFound = false;
            match.splice(1, 1);
            if (left.substr(left.length - 1) === "\\") {
              continue;
            }
            if (curLoop === result) {
              result = [];
            }
            if (Expr.preFilter[type]) {
              match = Expr.preFilter[type](match, curLoop, inplace, result, not, isXMLFilter);
              if (!match) {
                anyFound = found = true;
              } else {
                if (match === true) {
                  continue;
                }
              }
            }
            if (match) {
              for (var i = 0;(item = curLoop[i]) != null;i++) {
                if (item) {
                  found = filter(item, match, i, curLoop);
                  var pass = not ^ !!found;
                  if (inplace && found != null) {
                    if (pass) {
                      anyFound = true;
                    } else {
                      curLoop[i] = false;
                    }
                  } else {
                    if (pass) {
                      result.push(item);
                      anyFound = true;
                    }
                  }
                }
              }
            }
            if (found !== undefined) {
              if (!inplace) {
                curLoop = result;
              }
              expr = expr.replace(Expr.match[type], "");
              if (!anyFound) {
                return[];
              }
              break;
            }
          }
        }
        if (expr === old) {
          if (anyFound == null) {
            Sizzle.error(expr);
          } else {
            break;
          }
        }
        old = expr;
      }
      return curLoop;
    };
    Sizzle.error = function(msg) {
      throw "Syntax error, unrecognized expression: " + msg;
    };
    var Expr = Sizzle.selectors = {order:["ID", "NAME", "TAG"], match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/, CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/, NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/, ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/, TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/, CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/, POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/, 
    PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/}, leftMatch:{}, attrMap:{"class":"className", "for":"htmlFor"}, attrHandle:{href:function(elem) {
      return elem.getAttribute("href");
    }, type:function(elem) {
      return elem.getAttribute("type");
    }}, relative:{"+":function(checkSet, part) {
      var isPartStr = typeof part === "string", isTag = isPartStr && !rNonWord.test(part), isPartStrNotTag = isPartStr && !isTag;
      if (isTag) {
        part = part.toLowerCase();
      }
      for (var i = 0, l = checkSet.length, elem;i < l;i++) {
        if (elem = checkSet[i]) {
          while ((elem = elem.previousSibling) && elem.nodeType !== 1) {
          }
          checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ? elem || false : elem === part;
        }
      }
      if (isPartStrNotTag) {
        Sizzle.filter(part, checkSet, true);
      }
    }, ">":function(checkSet, part) {
      var elem, isPartStr = typeof part === "string", i = 0, l = checkSet.length;
      if (isPartStr && !rNonWord.test(part)) {
        part = part.toLowerCase();
        for (;i < l;i++) {
          elem = checkSet[i];
          if (elem) {
            var parent = elem.parentNode;
            checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
          }
        }
      } else {
        for (;i < l;i++) {
          elem = checkSet[i];
          if (elem) {
            checkSet[i] = isPartStr ? elem.parentNode : elem.parentNode === part;
          }
        }
        if (isPartStr) {
          Sizzle.filter(part, checkSet, true);
        }
      }
    }, "":function(checkSet, part, isXML) {
      var nodeCheck, doneName = done++, checkFn = dirCheck;
      if (typeof part === "string" && !rNonWord.test(part)) {
        part = part.toLowerCase();
        nodeCheck = part;
        checkFn = dirNodeCheck;
      }
      checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
    }, "~":function(checkSet, part, isXML) {
      var nodeCheck, doneName = done++, checkFn = dirCheck;
      if (typeof part === "string" && !rNonWord.test(part)) {
        part = part.toLowerCase();
        nodeCheck = part;
        checkFn = dirNodeCheck;
      }
      checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
    }}, find:{ID:function(match, context, isXML) {
      if (typeof context.getElementById !== "undefined" && !isXML) {
        var m = context.getElementById(match[1]);
        return m && m.parentNode ? [m] : [];
      }
    }, NAME:function(match, context) {
      if (typeof context.getElementsByName !== "undefined") {
        var ret = [], results = context.getElementsByName(match[1]);
        for (var i = 0, l = results.length;i < l;i++) {
          if (results[i].getAttribute("name") === match[1]) {
            ret.push(results[i]);
          }
        }
        return ret.length === 0 ? null : ret;
      }
    }, TAG:function(match, context) {
      if (typeof context.getElementsByTagName !== "undefined") {
        return context.getElementsByTagName(match[1]);
      }
    }}, preFilter:{CLASS:function(match, curLoop, inplace, result, not, isXML) {
      match = " " + match[1].replace(rBackslash, "") + " ";
      if (isXML) {
        return match;
      }
      for (var i = 0, elem;(elem = curLoop[i]) != null;i++) {
        if (elem) {
          if (not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0)) {
            if (!inplace) {
              result.push(elem);
            }
          } else {
            if (inplace) {
              curLoop[i] = false;
            }
          }
        }
      }
      return false;
    }, ID:function(match) {
      return match[1].replace(rBackslash, "");
    }, TAG:function(match, curLoop) {
      return match[1].replace(rBackslash, "").toLowerCase();
    }, CHILD:function(match) {
      if (match[1] === "nth") {
        if (!match[2]) {
          Sizzle.error(match[0]);
        }
        match[2] = match[2].replace(/^\+|\s*/g, "");
        var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(match[2] === "even" && "2n" || (match[2] === "odd" && "2n+1" || (!/\D/.test(match[2]) && "0n+" + match[2] || match[2])));
        match[2] = test[1] + (test[2] || 1) - 0;
        match[3] = test[3] - 0;
      } else {
        if (match[2]) {
          Sizzle.error(match[0]);
        }
      }
      match[0] = done++;
      return match;
    }, ATTR:function(match, curLoop, inplace, result, not, isXML) {
      var name = match[1] = match[1].replace(rBackslash, "");
      if (!isXML && Expr.attrMap[name]) {
        match[1] = Expr.attrMap[name];
      }
      match[4] = (match[4] || (match[5] || "")).replace(rBackslash, "");
      if (match[2] === "~=") {
        match[4] = " " + match[4] + " ";
      }
      return match;
    }, PSEUDO:function(match, curLoop, inplace, result, not) {
      if (match[1] === "not") {
        if ((chunker.exec(match[3]) || "").length > 1 || /^\w/.test(match[3])) {
          match[3] = Sizzle(match[3], null, null, curLoop);
        } else {
          var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
          if (!inplace) {
            result.push.apply(result, ret);
          }
          return false;
        }
      } else {
        if (Expr.match.POS.test(match[0]) || Expr.match.CHILD.test(match[0])) {
          return true;
        }
      }
      return match;
    }, POS:function(match) {
      match.unshift(true);
      return match;
    }}, filters:{enabled:function(elem) {
      return elem.disabled === false && elem.type !== "hidden";
    }, disabled:function(elem) {
      return elem.disabled === true;
    }, checked:function(elem) {
      return elem.checked === true;
    }, selected:function(elem) {
      return elem.selected === true;
    }, parent:function(elem) {
      return!!elem.firstChild;
    }, empty:function(elem) {
      return!elem.firstChild;
    }, has:function(elem, i, match) {
      return!!Sizzle(match[3], elem).length;
    }, header:function(elem) {
      return/h\d/i.test(elem.nodeName);
    }, text:function(elem) {
      var attr = elem.getAttribute("type"), type = elem.type;
      return elem.nodeName.toLowerCase() === "input" && ("text" === type && (attr === type || attr === null));
    }, radio:function(elem) {
      return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
    }, checkbox:function(elem) {
      return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
    }, file:function(elem) {
      return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
    }, password:function(elem) {
      return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
    }, submit:function(elem) {
      var name = elem.nodeName.toLowerCase();
      return(name === "input" || name === "button") && "submit" === elem.type;
    }, image:function(elem) {
      return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
    }, reset:function(elem) {
      var name = elem.nodeName.toLowerCase();
      return(name === "input" || name === "button") && "reset" === elem.type;
    }, button:function(elem) {
      var name = elem.nodeName.toLowerCase();
      return name === "input" && "button" === elem.type || name === "button";
    }, input:function(elem) {
      return/input|select|textarea|button/i.test(elem.nodeName);
    }, focus:function(elem) {
      return elem === elem.ownerDocument.activeElement;
    }}, setFilters:{first:function(elem, i) {
      return i === 0;
    }, last:function(elem, i, match, array) {
      return i === array.length - 1;
    }, even:function(elem, i) {
      return i % 2 === 0;
    }, odd:function(elem, i) {
      return i % 2 === 1;
    }, lt:function(elem, i, match) {
      return i < match[3] - 0;
    }, gt:function(elem, i, match) {
      return i > match[3] - 0;
    }, nth:function(elem, i, match) {
      return match[3] - 0 === i;
    }, eq:function(elem, i, match) {
      return match[3] - 0 === i;
    }}, filter:{PSEUDO:function(elem, match, i, array) {
      var name = match[1], filter = Expr.filters[name];
      if (filter) {
        return filter(elem, i, match, array);
      } else {
        if (name === "contains") {
          return(elem.textContent || (elem.innerText || (Sizzle.getText([elem]) || ""))).indexOf(match[3]) >= 0;
        } else {
          if (name === "not") {
            var not = match[3];
            for (var j = 0, l = not.length;j < l;j++) {
              if (not[j] === elem) {
                return false;
              }
            }
            return true;
          } else {
            Sizzle.error(name);
          }
        }
      }
    }, CHILD:function(elem, match) {
      var type = match[1], node = elem;
      switch(type) {
        case "only":
        ;
        case "first":
          while (node = node.previousSibling) {
            if (node.nodeType === 1) {
              return false;
            }
          }
          if (type === "first") {
            return true;
          }
          node = elem;
        case "last":
          while (node = node.nextSibling) {
            if (node.nodeType === 1) {
              return false;
            }
          }
          return true;
        case "nth":
          var first = match[2], last = match[3];
          if (first === 1 && last === 0) {
            return true;
          }
          var doneName = match[0], parent = elem.parentNode;
          if (parent && (parent.sizcache !== doneName || !elem.nodeIndex)) {
            var count = 0;
            for (node = parent.firstChild;node;node = node.nextSibling) {
              if (node.nodeType === 1) {
                node.nodeIndex = ++count;
              }
            }
            parent.sizcache = doneName;
          }
          var diff = elem.nodeIndex - last;
          if (first === 0) {
            return diff === 0;
          } else {
            return diff % first === 0 && diff / first >= 0;
          }
        ;
      }
    }, ID:function(elem, match) {
      return elem.nodeType === 1 && elem.getAttribute("id") === match;
    }, TAG:function(elem, match) {
      return match === "*" && elem.nodeType === 1 || elem.nodeName.toLowerCase() === match;
    }, CLASS:function(elem, match) {
      return(" " + (elem.className || elem.getAttribute("class")) + " ").indexOf(match) > -1;
    }, ATTR:function(elem, match) {
      var name = match[1], result = Expr.attrHandle[name] ? Expr.attrHandle[name](elem) : elem[name] != null ? elem[name] : elem.getAttribute(name), value = result + "", type = match[2], check = match[4];
      return result == null ? type === "!=" : type === "=" ? value === check : type === "*=" ? value.indexOf(check) >= 0 : type === "~=" ? (" " + value + " ").indexOf(check) >= 0 : !check ? value && result !== false : type === "!=" ? value !== check : type === "^=" ? value.indexOf(check) === 0 : type === "$=" ? value.substr(value.length - check.length) === check : type === "|=" ? value === check || value.substr(0, check.length + 1) === check + "-" : false;
    }, POS:function(elem, match, i, array) {
      var name = match[2], filter = Expr.setFilters[name];
      if (filter) {
        return filter(elem, i, match, array);
      }
    }}};
    var origPOS = Expr.match.POS, fescape = function(all, num) {
      return "\\" + (num - 0 + 1);
    };
    for (var type in Expr.match) {
      Expr.match[type] = new RegExp(Expr.match[type].source + /(?![^\[]*\])(?![^\(]*\))/.source);
      Expr.leftMatch[type] = new RegExp(/(^(?:.|\r|\n)*?)/.source + Expr.match[type].source.replace(/\\(\d+)/g, fescape));
    }
    var makeArray = function(array, results) {
      array = Array.prototype.slice.call(array, 0);
      if (results) {
        results.push.apply(results, array);
        return results;
      }
      return array;
    };
    try {
      Array.prototype.slice.call(document.documentElement.childNodes, 0);
    } catch (e) {
      makeArray = function(array, results) {
        var i = 0, ret = results || [];
        if (toString.call(array) === "[object Array]") {
          Array.prototype.push.apply(ret, array);
        } else {
          if (typeof array.length === "number") {
            for (var l = array.length;i < l;i++) {
              ret.push(array[i]);
            }
          } else {
            for (;array[i];i++) {
              ret.push(array[i]);
            }
          }
        }
        return ret;
      };
    }
    var sortOrder, siblingCheck;
    if (document.documentElement.compareDocumentPosition) {
      sortOrder = function(a, b) {
        if (a === b) {
          hasDuplicate = true;
          return 0;
        }
        if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
          return a.compareDocumentPosition ? -1 : 1;
        }
        return a.compareDocumentPosition(b) & 4 ? -1 : 1;
      };
    } else {
      sortOrder = function(a, b) {
        if (a === b) {
          hasDuplicate = true;
          return 0;
        } else {
          if (a.sourceIndex && b.sourceIndex) {
            return a.sourceIndex - b.sourceIndex;
          }
        }
        var al, bl, ap = [], bp = [], aup = a.parentNode, bup = b.parentNode, cur = aup;
        if (aup === bup) {
          return siblingCheck(a, b);
        } else {
          if (!aup) {
            return-1;
          } else {
            if (!bup) {
              return 1;
            }
          }
        }
        while (cur) {
          ap.unshift(cur);
          cur = cur.parentNode;
        }
        cur = bup;
        while (cur) {
          bp.unshift(cur);
          cur = cur.parentNode;
        }
        al = ap.length;
        bl = bp.length;
        for (var i = 0;i < al && i < bl;i++) {
          if (ap[i] !== bp[i]) {
            return siblingCheck(ap[i], bp[i]);
          }
        }
        return i === al ? siblingCheck(a, bp[i], -1) : siblingCheck(ap[i], b, 1);
      };
      siblingCheck = function(a, b, ret) {
        if (a === b) {
          return ret;
        }
        var cur = a.nextSibling;
        while (cur) {
          if (cur === b) {
            return-1;
          }
          cur = cur.nextSibling;
        }
        return 1;
      };
    }
    Sizzle.getText = function(elems) {
      var ret = "", elem;
      for (var i = 0;elems[i];i++) {
        elem = elems[i];
        if (elem.nodeType === 3 || elem.nodeType === 4) {
          ret += elem.nodeValue;
        } else {
          if (elem.nodeType !== 8) {
            ret += Sizzle.getText(elem.childNodes);
          }
        }
      }
      return ret;
    };
    (function() {
      var form = document.createElement("div"), id = "script" + (new Date).getTime(), root = document.documentElement;
      form.innerHTML = "<a name='" + id + "'/>";
      root.insertBefore(form, root.firstChild);
      if (document.getElementById(id)) {
        Expr.find.ID = function(match, context, isXML) {
          if (typeof context.getElementById !== "undefined" && !isXML) {
            var m = context.getElementById(match[1]);
            return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
          }
        };
        Expr.filter.ID = function(elem, match) {
          var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
          return elem.nodeType === 1 && (node && node.nodeValue === match);
        };
      }
      root.removeChild(form);
      root = form = null;
    })();
    (function() {
      var div = document.createElement("div");
      div.appendChild(document.createComment(""));
      if (div.getElementsByTagName("*").length > 0) {
        Expr.find.TAG = function(match, context) {
          var results = context.getElementsByTagName(match[1]);
          if (match[1] === "*") {
            var tmp = [];
            for (var i = 0;results[i];i++) {
              if (results[i].nodeType === 1) {
                tmp.push(results[i]);
              }
            }
            results = tmp;
          }
          return results;
        };
      }
      div.innerHTML = "<a href='#'></a>";
      if (div.firstChild && (typeof div.firstChild.getAttribute !== "undefined" && div.firstChild.getAttribute("href") !== "#")) {
        Expr.attrHandle.href = function(elem) {
          return elem.getAttribute("href", 2);
        };
      }
      div = null;
    })();
    if (document.querySelectorAll) {
      (function() {
        var oldSizzle = Sizzle, div = document.createElement("div"), id = "__sizzle__";
        div.innerHTML = "<p class='TEST'></p>";
        if (div.querySelectorAll && div.querySelectorAll(".TEST").length === 0) {
          return;
        }
        Sizzle = function(query, context, extra, seed) {
          context = context || document;
          if (!seed && !Sizzle.isXML(context)) {
            var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(query);
            if (match && (context.nodeType === 1 || context.nodeType === 9)) {
              if (match[1]) {
                return makeArray(context.getElementsByTagName(query), extra);
              } else {
                if (match[2] && (Expr.find.CLASS && context.getElementsByClassName)) {
                  return makeArray(context.getElementsByClassName(match[2]), extra);
                }
              }
            }
            if (context.nodeType === 9) {
              if (query === "body" && context.body) {
                return makeArray([context.body], extra);
              } else {
                if (match && match[3]) {
                  var elem = context.getElementById(match[3]);
                  if (elem && elem.parentNode) {
                    if (elem.id === match[3]) {
                      return makeArray([elem], extra);
                    }
                  } else {
                    return makeArray([], extra);
                  }
                }
              }
              try {
                return makeArray(context.querySelectorAll(query), extra);
              } catch (qsaError) {
              }
            } else {
              if (context.nodeType === 1 && context.nodeName.toLowerCase() !== "object") {
                var oldContext = context, old = context.getAttribute("id"), nid = old || id, hasParent = context.parentNode, relativeHierarchySelector = /^\s*[+~]/.test(query);
                if (!old) {
                  context.setAttribute("id", nid);
                } else {
                  nid = nid.replace(/'/g, "\\$&");
                }
                if (relativeHierarchySelector && hasParent) {
                  context = context.parentNode;
                }
                try {
                  if (!relativeHierarchySelector || hasParent) {
                    return makeArray(context.querySelectorAll("[id='" + nid + "'] " + query), extra);
                  }
                } catch (pseudoError) {
                } finally {
                  if (!old) {
                    oldContext.removeAttribute("id");
                  }
                }
              }
            }
          }
          return oldSizzle(query, context, extra, seed);
        };
        for (var prop in oldSizzle) {
          Sizzle[prop] = oldSizzle[prop];
        }
        div = null;
      })();
    }
    (function() {
      var html = document.documentElement, matches = html.matchesSelector || (html.mozMatchesSelector || (html.webkitMatchesSelector || html.msMatchesSelector));
      if (matches) {
        var disconnectedMatch = !matches.call(document.createElement("div"), "div"), pseudoWorks = false;
        try {
          matches.call(document.documentElement, "[test!='']:sizzle");
        } catch (pseudoError) {
          pseudoWorks = true;
        }
        Sizzle.matchesSelector = function(node, expr) {
          expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
          if (!Sizzle.isXML(node)) {
            try {
              if (pseudoWorks || !Expr.match.PSEUDO.test(expr) && !/!=/.test(expr)) {
                var ret = matches.call(node, expr);
                if (ret || (!disconnectedMatch || node.document && node.document.nodeType !== 11)) {
                  return ret;
                }
              }
            } catch (e) {
            }
          }
          return Sizzle(expr, null, null, [node]).length > 0;
        };
      }
    })();
    (function() {
      var div = document.createElement("div");
      div.innerHTML = "<div class='test e'></div><div class='test'></div>";
      if (!div.getElementsByClassName || div.getElementsByClassName("e").length === 0) {
        return;
      }
      div.lastChild.className = "e";
      if (div.getElementsByClassName("e").length === 1) {
        return;
      }
      Expr.order.splice(1, 0, "CLASS");
      Expr.find.CLASS = function(match, context, isXML) {
        if (typeof context.getElementsByClassName !== "undefined" && !isXML) {
          return context.getElementsByClassName(match[1]);
        }
      };
      div = null;
    })();
    function dirNodeCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
      for (var i = 0, l = checkSet.length;i < l;i++) {
        var elem = checkSet[i];
        if (elem) {
          var match = false;
          elem = elem[dir];
          while (elem) {
            if (elem.sizcache === doneName) {
              match = checkSet[elem.sizset];
              break;
            }
            if (elem.nodeType === 1 && !isXML) {
              elem.sizcache = doneName;
              elem.sizset = i;
            }
            if (elem.nodeName.toLowerCase() === cur) {
              match = elem;
              break;
            }
            elem = elem[dir];
          }
          checkSet[i] = match;
        }
      }
    }
    function dirCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
      for (var i = 0, l = checkSet.length;i < l;i++) {
        var elem = checkSet[i];
        if (elem) {
          var match = false;
          elem = elem[dir];
          while (elem) {
            if (elem.sizcache === doneName) {
              match = checkSet[elem.sizset];
              break;
            }
            if (elem.nodeType === 1) {
              if (!isXML) {
                elem.sizcache = doneName;
                elem.sizset = i;
              }
              if (typeof cur !== "string") {
                if (elem === cur) {
                  match = true;
                  break;
                }
              } else {
                if (Sizzle.filter(cur, [elem]).length > 0) {
                  match = elem;
                  break;
                }
              }
            }
            elem = elem[dir];
          }
          checkSet[i] = match;
        }
      }
    }
    if (document.documentElement.contains) {
      Sizzle.contains = function(a, b) {
        return a !== b && (a.contains ? a.contains(b) : true);
      };
    } else {
      if (document.documentElement.compareDocumentPosition) {
        Sizzle.contains = function(a, b) {
          return!!(a.compareDocumentPosition(b) & 16);
        };
      } else {
        Sizzle.contains = function() {
          return false;
        };
      }
    }
    Sizzle.isXML = function(elem) {
      var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
      return documentElement ? documentElement.nodeName !== "HTML" : false;
    };
    var posProcess = function(selector, context) {
      var match, tmpSet = [], later = "", root = context.nodeType ? [context] : context;
      while (match = Expr.match.PSEUDO.exec(selector)) {
        later += match[0];
        selector = selector.replace(Expr.match.PSEUDO, "");
      }
      selector = Expr.relative[selector] ? selector + "*" : selector;
      for (var i = 0, l = root.length;i < l;i++) {
        Sizzle(selector, root[i], tmpSet);
      }
      return Sizzle.filter(later, tmpSet);
    };
    GLOBAL.Sizzle = Sizzle;
  })(this);
  Prototype._original_property = this.Sizzle;
  (function(engine) {
    var extendElements = Prototype.Selector.extendElements;
    function select(selector, scope) {
      return extendElements(engine(selector, scope || document));
    }
    function match(element, selector) {
      return engine.matches(selector, [element]).length == 1;
    }
    Prototype.Selector.engine = engine;
    Prototype.Selector.select = select;
    Prototype.Selector.match = match;
  })(this.Sizzle);
  this.Sizzle = Prototype._original_property;
  delete Prototype._original_property;
  var Form = {reset:function(form) {
    form = $(form);
    form.reset();
    return form;
  }, serializeElements:function(elements, options) {
    if (typeof options != "object") {
      options = {hash:!!options};
    } else {
      if (Object.isUndefined(options.hash)) {
        options.hash = true;
      }
    }
    var key, value, submitted = false, submit = options.submit, accumulator, initial;
    if (options.hash) {
      initial = {};
      accumulator = function(result, key, value) {
        if (key in result) {
          if (!Object.isArray(result[key])) {
            result[key] = [result[key]];
          }
          result[key].push(value);
        } else {
          result[key] = value;
        }
        return result;
      };
    } else {
      initial = "";
      accumulator = function(result, key, value) {
        value = value.gsub(/(\r)?\n/, "\r\n");
        value = encodeURIComponent(value);
        value = value.gsub(/%20/, "+");
        return result + (result ? "&" : "") + encodeURIComponent(key) + "=" + value;
      };
    }
    return elements.inject(initial, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name;
        value = $(element).getValue();
        if (value != null && (element.type != "file" && (element.type != "submit" || !submitted && (submit !== false && ((!submit || key == submit) && (submitted = true)))))) {
          result = accumulator(result, key, value);
        }
      }
      return result;
    });
  }};
  Form.Methods = {serialize:function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  }, getElements:function(form) {
    var elements = $(form).getElementsByTagName("*");
    var element, results = [], serializers = Form.Element.Serializers;
    for (var i = 0;element = elements[i];i++) {
      if (serializers[element.tagName.toLowerCase()]) {
        results.push(Element.extend(element));
      }
    }
    return results;
  }, getInputs:function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName("input");
    if (!typeName && !name) {
      return $A(inputs).map(Element.extend);
    }
    for (var i = 0, matchingInputs = [], length = inputs.length;i < length;i++) {
      var input = inputs[i];
      if (typeName && input.type != typeName || name && input.name != name) {
        continue;
      }
      matchingInputs.push(Element.extend(input));
    }
    return matchingInputs;
  }, disable:function(form) {
    form = $(form);
    Form.getElements(form).invoke("disable");
    return form;
  }, enable:function(form) {
    form = $(form);
    Form.getElements(form).invoke("enable");
    return form;
  }, findFirstElement:function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return "hidden" != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute("tabIndex") && element.tabIndex >= 0;
    }).sortBy(function(element) {
      return element.tabIndex;
    }).first();
    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return/^(?:input|select|textarea)$/i.test(element.tagName);
    });
  }, focusFirstElement:function(form) {
    form = $(form);
    var element = form.findFirstElement();
    if (element) {
      element.activate();
    }
    return form;
  }, request:function(form, options) {
    form = $(form), options = Object.clone(options || {});
    var params = options.parameters, action = form.readAttribute("action") || "";
    if (action.blank()) {
      action = window.location.href;
    }
    options.parameters = form.serialize(true);
    if (params) {
      if (Object.isString(params)) {
        params = params.toQueryParams();
      }
      Object.extend(options.parameters, params);
    }
    if (form.hasAttribute("method") && !options.method) {
      options.method = form.method;
    }
    return new Ajax.Request(action, options);
  }};
  Form.Element = {focus:function(element) {
    $(element).focus();
    return element;
  }, select:function(element) {
    $(element).select();
    return element;
  }};
  Form.Element.Methods = {serialize:function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = {};
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return "";
  }, getValue:function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  }, setValue:function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  }, clear:function(element) {
    $(element).value = "";
    return element;
  }, present:function(element) {
    return $(element).value != "";
  }, activate:function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != "input" || !/^(?:button|reset|submit)$/i.test(element.type))) {
        element.select();
      }
    } catch (e) {
    }
    return element;
  }, disable:function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  }, enable:function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }};
  var Field = Form.Element;
  var $F = Form.Element.Methods.getValue;
  Form.Element.Serializers = function() {
    function input(element, value) {
      switch(element.type.toLowerCase()) {
        case "checkbox":
        ;
        case "radio":
          return inputSelector(element, value);
        default:
          return valueSelector(element, value);
      }
    }
    function inputSelector(element, value) {
      if (Object.isUndefined(value)) {
        return element.checked ? element.value : null;
      } else {
        element.checked = !!value;
      }
    }
    function valueSelector(element, value) {
      if (Object.isUndefined(value)) {
        return element.value;
      } else {
        element.value = value;
      }
    }
    function select(element, value) {
      if (Object.isUndefined(value)) {
        return(element.type === "select-one" ? selectOne : selectMany)(element);
      }
      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length;i < length;i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        } else {
          opt.selected = value.include(currentValue);
        }
      }
    }
    function selectOne(element) {
      var index = element.selectedIndex;
      return index >= 0 ? optionValue(element.options[index]) : null;
    }
    function selectMany(element) {
      var values, length = element.length;
      if (!length) {
        return null;
      }
      for (var i = 0, values = [];i < length;i++) {
        var opt = element.options[i];
        if (opt.selected) {
          values.push(optionValue(opt));
        }
      }
      return values;
    }
    function optionValue(opt) {
      return Element.hasAttribute(opt, "value") ? opt.value : opt.text;
    }
    return{input:input, inputSelector:inputSelector, textarea:valueSelector, select:select, selectOne:selectOne, selectMany:selectMany, optionValue:optionValue, button:valueSelector};
  }();
  Abstract.TimedObserver = Class.create(PeriodicalExecuter, {initialize:function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element = $(element);
    this.lastValue = this.getValue();
  }, execute:function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ? this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }});
  Form.Element.Observer = Class.create(Abstract.TimedObserver, {getValue:function() {
    return Form.Element.getValue(this.element);
  }});
  Form.Observer = Class.create(Abstract.TimedObserver, {getValue:function() {
    return Form.serialize(this.element);
  }});
  Abstract.EventObserver = Class.create({initialize:function(element, callback) {
    this.element = $(element);
    this.callback = callback;
    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == "form") {
      this.registerFormCallbacks();
    } else {
      this.registerCallback(this.element);
    }
  }, onElementEvent:function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }, registerFormCallbacks:function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  }, registerCallback:function(element) {
    if (element.type) {
      switch(element.type.toLowerCase()) {
        case "checkbox":
        ;
        case "radio":
          Event.observe(element, "click", this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, "change", this.onElementEvent.bind(this));
          break;
      }
    }
  }});
  Form.Element.EventObserver = Class.create(Abstract.EventObserver, {getValue:function() {
    return Form.Element.getValue(this.element);
  }});
  Form.EventObserver = Class.create(Abstract.EventObserver, {getValue:function() {
    return Form.serialize(this.element);
  }});
  (function(GLOBAL) {
    function $(element) {
      return GLOBAL.$(element);
    }
    var DIV = document.createElement("div");
    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = "onmouseenter" in docEl && "onmouseleave" in docEl;
    var Event = {KEY_BACKSPACE:8, KEY_TAB:9, KEY_RETURN:13, KEY_ESC:27, KEY_LEFT:37, KEY_UP:38, KEY_RIGHT:39, KEY_DOWN:40, KEY_DELETE:46, KEY_HOME:36, KEY_END:35, KEY_PAGEUP:33, KEY_PAGEDOWN:34, KEY_INSERT:45};
    var isIELegacyEvent = function(event) {
      return false;
    };
    if (window.attachEvent) {
      if (window.addEventListener) {
        isIELegacyEvent = function(event) {
          return false;
        };
      } else {
        isIELegacyEvent = function(event) {
          return true;
        };
      }
    }
    var _isButton;
    function _isButtonForDOMEvents(event, code) {
      return event.which ? event.which === code + 1 : event.button === code;
    }
    var legacyButtonMap = {0:1, 1:4, 2:2};
    function _isButtonForLegacyEvents(event, code) {
      return event.button === legacyButtonMap[code];
    }
    function _isButtonForWebKit(event, code) {
      switch(code) {
        case 0:
          return event.which == 1 && !event.metaKey;
        case 1:
          return event.which == 2 || event.which == 1 && event.metaKey;
        case 2:
          return event.which == 3;
        default:
          return false;
      }
    }
    if (window.attachEvent) {
      if (!window.addEventListener) {
        _isButton = _isButtonForLegacyEvents;
      } else {
        _isButton = function(event, code) {
          return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) : _isButtonForDOMEvents(event, code);
        };
      }
    } else {
      if (Prototype.Browser.WebKit) {
        _isButton = _isButtonForWebKit;
      } else {
        _isButton = _isButtonForDOMEvents;
      }
    }
    function isLeftClick(event) {
      return _isButton(event, 0);
    }
    function isMiddleClick(event) {
      return _isButton(event, 1);
    }
    function isRightClick(event) {
      return _isButton(event, 2);
    }
    function element(event) {
      return Element.extend(_element(event));
    }
    function _element(event) {
      event = Event.extend(event);
      var node = event.target, type = event.type, currentTarget = event.currentTarget;
      if (currentTarget && currentTarget.tagName) {
        if (type === "load" || (type === "error" || type === "click" && (currentTarget.tagName.toLowerCase() === "input" && currentTarget.type === "radio"))) {
          node = currentTarget;
        }
      }
      if (node.nodeType == GLOBAL.Node.TEXT_NODE) {
        node = node.parentNode;
      }
      return Element.extend(node);
    }
    function findElement(event, expression) {
      var element = _element(event), match = Prototype.Selector.match;
      if (!expression) {
        return Element.extend(element);
      }
      while (element) {
        if (Object.isElement(element) && match(element, expression)) {
          return Element.extend(element);
        }
        element = element.parentNode;
      }
    }
    function pointer(event) {
      return{x:pointerX(event), y:pointerY(event)};
    }
    function pointerX(event) {
      var docElement = document.documentElement, body = document.body || {scrollLeft:0};
      return event.pageX || event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0);
    }
    function pointerY(event) {
      var docElement = document.documentElement, body = document.body || {scrollTop:0};
      return event.pageY || event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0);
    }
    function stop(event) {
      GLOBAL.Event.extend(event);
      event.preventDefault();
      event.stopPropagation();
      event.stopped = true;
    }
    Event.Methods = {isLeftClick:isLeftClick, isMiddleClick:isMiddleClick, isRightClick:isRightClick, element:element, findElement:findElement, pointer:pointer, pointerX:pointerX, pointerY:pointerY, stop:stop};
    var methods = Object.keys(Event.Methods).inject({}, function(m, name) {
      m[name] = Event.Methods[name].methodize();
      return m;
    });
    if (window.attachEvent) {
      function _relatedTarget(event) {
        var element;
        switch(event.type) {
          case "mouseover":
          ;
          case "mouseenter":
            element = event.fromElement;
            break;
          case "mouseout":
          ;
          case "mouseleave":
            element = event.toElement;
            break;
          default:
            return null;
        }
        return Element.extend(element);
      }
      var additionalMethods = {stopPropagation:function() {
        this.cancelBubble = true;
      }, preventDefault:function() {
        this.returnValue = false;
      }, inspect:function() {
        return "[object Event]";
      }};
      Event.extend = function(event, element) {
        if (!event) {
          return false;
        }
        if (!isIELegacyEvent(event)) {
          return event;
        }
        if (event._extendedByPrototype) {
          return event;
        }
        event._extendedByPrototype = Prototype.emptyFunction;
        var pointer = Event.pointer(event);
        Object.extend(event, {target:event.srcElement || element, relatedTarget:_relatedTarget(event), pageX:pointer.x, pageY:pointer.y});
        Object.extend(event, methods);
        Object.extend(event, additionalMethods);
        return event;
      };
    } else {
      Event.extend = Prototype.K;
    }
    if (window.addEventListener) {
      Event.prototype = window.Event.prototype || document.createEvent("HTMLEvents").__proto__;
      Object.extend(Event.prototype, methods);
    }
    var EVENT_TRANSLATIONS = {mouseenter:"mouseover", mouseleave:"mouseout"};
    function getDOMEventName(eventName) {
      return EVENT_TRANSLATIONS[eventName] || eventName;
    }
    if (MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
      getDOMEventName = Prototype.K;
    }
    function getUniqueElementID(element) {
      if (element === window) {
        return 0;
      }
      if (typeof element._prototypeUID === "undefined") {
        element._prototypeUID = Element.Storage.UID++;
      }
      return element._prototypeUID;
    }
    function getUniqueElementID_IE(element) {
      if (element === window) {
        return 0;
      }
      if (element == document) {
        return 1;
      }
      return element.uniqueID;
    }
    if ("uniqueID" in DIV) {
      getUniqueElementID = getUniqueElementID_IE;
    }
    function isCustomEvent(eventName) {
      return eventName.include(":");
    }
    Event._isCustomEvent = isCustomEvent;
    function getRegistryForElement(element, uid) {
      var CACHE = GLOBAL.Event.cache;
      if (Object.isUndefined(uid)) {
        uid = getUniqueElementID(element);
      }
      if (!CACHE[uid]) {
        CACHE[uid] = {element:element};
      }
      return CACHE[uid];
    }
    function destroyRegistryForElement(element, uid) {
      if (Object.isUndefined(uid)) {
        uid = getUniqueElementID(element);
      }
      delete GLOBAL.Event.cache[uid];
    }
    function register(element, eventName, handler) {
      var registry = getRegistryForElement(element);
      if (!registry[eventName]) {
        registry[eventName] = [];
      }
      var entries = registry[eventName];
      var i = entries.length;
      while (i--) {
        if (entries[i].handler === handler) {
          return null;
        }
      }
      var uid = getUniqueElementID(element);
      var responder = GLOBAL.Event._createResponder(uid, eventName, handler);
      var entry = {responder:responder, handler:handler};
      entries.push(entry);
      return entry;
    }
    function unregister(element, eventName, handler) {
      var registry = getRegistryForElement(element);
      var entries = registry[eventName];
      if (!entries) {
        return;
      }
      var i = entries.length, entry;
      while (i--) {
        if (entries[i].handler === handler) {
          entry = entries[i];
          break;
        }
      }
      if (!entry) {
        return;
      }
      var index = entries.indexOf(entry);
      entries.splice(index, 1);
      return entry;
    }
    function observe(element, eventName, handler) {
      element = $(element);
      var entry = register(element, eventName, handler);
      if (entry === null) {
        return element;
      }
      var responder = entry.responder;
      if (isCustomEvent(eventName)) {
        observeCustomEvent(element, eventName, responder);
      } else {
        observeStandardEvent(element, eventName, responder);
      }
      return element;
    }
    function observeStandardEvent(element, eventName, responder) {
      var actualEventName = getDOMEventName(eventName);
      if (element.addEventListener) {
        element.addEventListener(actualEventName, responder, false);
      } else {
        element.attachEvent("on" + actualEventName, responder);
      }
    }
    function observeCustomEvent(element, eventName, responder) {
      if (element.addEventListener) {
        element.addEventListener("dataavailable", responder, false);
      } else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onlosecapture", responder);
      }
    }
    function stopObserving(element, eventName, handler) {
      element = $(element);
      var handlerGiven = !Object.isUndefined(handler), eventNameGiven = !Object.isUndefined(eventName);
      if (!eventNameGiven && !handlerGiven) {
        stopObservingElement(element);
        return element;
      }
      if (!handlerGiven) {
        stopObservingEventName(element, eventName);
        return element;
      }
      var entry = unregister(element, eventName, handler);
      if (!entry) {
        return element;
      }
      removeEvent(element, eventName, entry.responder);
      return element;
    }
    function stopObservingStandardEvent(element, eventName, responder) {
      var actualEventName = getDOMEventName(eventName);
      if (element.removeEventListener) {
        element.removeEventListener(actualEventName, responder, false);
      } else {
        element.detachEvent("on" + actualEventName, responder);
      }
    }
    function stopObservingCustomEvent(element, eventName, responder) {
      if (element.removeEventListener) {
        element.removeEventListener("dataavailable", responder, false);
      } else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onlosecapture", responder);
      }
    }
    function stopObservingElement(element) {
      var uid = getUniqueElementID(element), registry = getRegistryForElement(element, uid);
      destroyRegistryForElement(element, uid);
      var entries, i;
      for (var eventName in registry) {
        if (eventName === "element") {
          continue;
        }
        entries = registry[eventName];
        i = entries.length;
        while (i--) {
          removeEvent(element, eventName, entries[i].responder);
        }
      }
    }
    function stopObservingEventName(element, eventName) {
      var registry = getRegistryForElement(element);
      var entries = registry[eventName];
      if (!entries) {
        return;
      }
      delete registry[eventName];
      var i = entries.length;
      while (i--) {
        removeEvent(element, eventName, entries[i].responder);
      }
    }
    function removeEvent(element, eventName, handler) {
      if (isCustomEvent(eventName)) {
        stopObservingCustomEvent(element, eventName, handler);
      } else {
        stopObservingStandardEvent(element, eventName, handler);
      }
    }
    function getFireTarget(element) {
      if (element !== document) {
        return element;
      }
      if (document.createEvent && !element.dispatchEvent) {
        return document.documentElement;
      }
      return element;
    }
    function fire(element, eventName, memo, bubble) {
      element = getFireTarget($(element));
      if (Object.isUndefined(bubble)) {
        bubble = true;
      }
      memo = memo || {};
      var event = fireEvent(element, eventName, memo, bubble);
      return Event.extend(event);
    }
    function fireEvent_DOM(element, eventName, memo, bubble) {
      var event = document.createEvent("HTMLEvents");
      event.initEvent("dataavailable", bubble, true);
      event.eventName = eventName;
      event.memo = memo;
      element.dispatchEvent(event);
      return event;
    }
    function fireEvent_IE(element, eventName, memo, bubble) {
      var event = document.createEventObject();
      event.eventType = bubble ? "ondataavailable" : "onlosecapture";
      event.eventName = eventName;
      event.memo = memo;
      element.fireEvent(event.eventType, event);
      return event;
    }
    var fireEvent = document.createEvent ? fireEvent_DOM : fireEvent_IE;
    Event.Handler = Class.create({initialize:function(element, eventName, selector, callback) {
      this.element = $(element);
      this.eventName = eventName;
      this.selector = selector;
      this.callback = callback;
      this.handler = this.handleEvent.bind(this);
    }, start:function() {
      Event.observe(this.element, this.eventName, this.handler);
      return this;
    }, stop:function() {
      Event.stopObserving(this.element, this.eventName, this.handler);
      return this;
    }, handleEvent:function(event) {
      var element = Event.findElement(event, this.selector);
      if (element) {
        this.callback.call(this.element, event, element);
      }
    }});
    function on(element, eventName, selector, callback) {
      element = $(element);
      if (Object.isFunction(selector) && Object.isUndefined(callback)) {
        callback = selector, selector = null;
      }
      return(new Event.Handler(element, eventName, selector, callback)).start();
    }
    Object.extend(Event, Event.Methods);
    Object.extend(Event, {fire:fire, observe:observe, stopObserving:stopObserving, on:on});
    Element.addMethods({fire:fire, observe:observe, stopObserving:stopObserving, on:on});
    Object.extend(document, {fire:fire.methodize(), observe:observe.methodize(), stopObserving:stopObserving.methodize(), on:on.methodize(), loaded:false});
    if (GLOBAL.Event) {
      Object.extend(GLOBAL.Event, Event);
    } else {
      GLOBAL.Event = Event;
    }
    GLOBAL.Event.cache = {};
    function destroyCache_IE() {
      GLOBAL.Event.cache = null;
    }
    if (window.attachEvent) {
      window.attachEvent("onunload", destroyCache_IE);
    }
    DIV = null;
    docEl = null;
  })(this);
  (function(GLOBAL) {
    var Event = GLOBAL.Event;
    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = "onmouseenter" in docEl && "onmouseleave" in docEl;
    function isSimulatedMouseEnterLeaveEvent(eventName) {
      return!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED && (eventName === "mouseenter" || eventName === "mouseleave");
    }
    function createResponder(uid, eventName, handler) {
      if (Event._isCustomEvent(eventName)) {
        return createResponderForCustomEvent(uid, eventName, handler);
      }
      if (isSimulatedMouseEnterLeaveEvent(eventName)) {
        return createMouseEnterLeaveResponder(uid, eventName, handler);
      }
      return function(event) {
        var cacheEntry = Event.cache[uid];
        var element = cacheEntry.element;
        Event.extend(event, element);
        handler.call(element, event);
      };
    }
    function createResponderForCustomEvent(uid, eventName, handler) {
      return function(event) {
        var cacheEntry = Event.cache[uid], element = cacheEntry.element;
        if (Object.isUndefined(event.eventName)) {
          return false;
        }
        if (event.eventName !== eventName) {
          return false;
        }
        Event.extend(event, element);
        handler.call(element, event);
      };
    }
    function createMouseEnterLeaveResponder(uid, eventName, handler) {
      return function(event) {
        var cacheEntry = Event.cache[uid], element = cacheEntry.element;
        Event.extend(event, element);
        var parent = event.relatedTarget;
        while (parent && parent !== element) {
          try {
            parent = parent.parentNode;
          } catch (e) {
            parent = element;
          }
        }
        if (parent === element) {
          return;
        }
        handler.call(element, event);
      };
    }
    GLOBAL.Event._createResponder = createResponder;
    docEl = null;
  })(this);
  (function(GLOBAL) {
    var Event = GLOBAL.Event;
    var TIMER;
    function fireContentLoadedEvent() {
      if (document.loaded) {
        return;
      }
      if (TIMER) {
        window.clearTimeout(TIMER);
      }
      document.loaded = true;
      document.fire("dom:loaded");
    }
    function checkReadyState() {
      if (document.readyState === "complete") {
        document.detachEvent("onreadystatechange", checkReadyState);
        fireContentLoadedEvent();
      }
    }
    function pollDoScroll() {
      try {
        document.documentElement.doScroll("left");
      } catch (e) {
        TIMER = pollDoScroll.defer();
        return;
      }
      fireContentLoadedEvent();
    }
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", fireContentLoadedEvent, false);
    } else {
      document.attachEvent("onreadystatechange", checkReadyState);
      if (window == top) {
        TIMER = pollDoScroll.defer();
      }
    }
    Event.observe(window, "load", fireContentLoadedEvent);
  })(this);
  Element.addMethods();
  Hash.toQueryString = Object.toQueryString;
  var Toggle = {display:Element.toggle};
  Element.Methods.childOf = Element.Methods.descendantOf;
  var Insertion = {Before:function(element, content) {
    return Element.insert(element, {before:content});
  }, Top:function(element, content) {
    return Element.insert(element, {top:content});
  }, Bottom:function(element, content) {
    return Element.insert(element, {bottom:content});
  }, After:function(element, content) {
    return Element.insert(element, {after:content});
  }};
  var $continue = new Error('"throw $continue" is deprecated, use "return" instead');
  var Position = {includeScrollOffsets:false, prepare:function() {
    this.deltaX = window.pageXOffset || (document.documentElement.scrollLeft || (document.body.scrollLeft || 0));
    this.deltaY = window.pageYOffset || (document.documentElement.scrollTop || (document.body.scrollTop || 0));
  }, within:function(element, x, y) {
    if (this.includeScrollOffsets) {
      return this.withinIncludingScrolloffsets(element, x, y);
    }
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);
    return y >= this.offset[1] && (y < this.offset[1] + element.offsetHeight && (x >= this.offset[0] && x < this.offset[0] + element.offsetWidth));
  }, withinIncludingScrolloffsets:function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);
    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);
    return this.ycomp >= this.offset[1] && (this.ycomp < this.offset[1] + element.offsetHeight && (this.xcomp >= this.offset[0] && this.xcomp < this.offset[0] + element.offsetWidth));
  }, overlap:function(mode, element) {
    if (!mode) {
      return 0;
    }
    if (mode == "vertical") {
      return(this.offset[1] + element.offsetHeight - this.ycomp) / element.offsetHeight;
    }
    if (mode == "horizontal") {
      return(this.offset[0] + element.offsetWidth - this.xcomp) / element.offsetWidth;
    }
  }, cumulativeOffset:Element.Methods.cumulativeOffset, positionedOffset:Element.Methods.positionedOffset, absolutize:function(element) {
    Position.prepare();
    return Element.absolutize(element);
  }, relativize:function(element) {
    Position.prepare();
    return Element.relativize(element);
  }, realOffset:Element.Methods.cumulativeScrollOffset, offsetParent:Element.Methods.getOffsetParent, page:Element.Methods.viewportOffset, clone:function(source, target, options) {
    options = options || {};
    return Element.clonePosition(target, source, options);
  }};
  if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(instanceMethods) {
      function iter(name) {
        return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
      }
      instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ? function(element, className) {
        className = className.toString().strip();
        var cond = /\s/.test(className) ? $w(className).map(iter).join("") : iter(className);
        return cond ? document._getElementsByXPath(".//*" + cond, element) : [];
      } : function(element, className) {
        className = className.toString().strip();
        var elements = [], classNames = /\s/.test(className) ? $w(className) : null;
        if (!classNames && !className) {
          return elements;
        }
        var nodes = $(element).getElementsByTagName("*");
        className = " " + className + " ";
        for (var i = 0, child, cn;child = nodes[i];i++) {
          if (child.className && ((cn = " " + child.className + " ") && (cn.include(className) || classNames && classNames.all(function(name) {
            return!name.toString().blank() && cn.include(" " + name + " ");
          })))) {
            elements.push(Element.extend(child));
          }
        }
        return elements;
      };
      return function(className, parentElement) {
        return $(parentElement || document.body).getElementsByClassName(className);
      };
    }(Element.Methods);
  }
  Element.ClassNames = Class.create();
  Element.ClassNames.prototype = {initialize:function(element) {
    this.element = $(element);
  }, _each:function(iterator, context) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator, context);
  }, set:function(className) {
    this.element.className = className;
  }, add:function(classNameToAdd) {
    if (this.include(classNameToAdd)) {
      return;
    }
    this.set($A(this).concat(classNameToAdd).join(" "));
  }, remove:function(classNameToRemove) {
    if (!this.include(classNameToRemove)) {
      return;
    }
    this.set($A(this).without(classNameToRemove).join(" "));
  }, toString:function() {
    return $A(this).join(" ");
  }};
  Object.extend(Element.ClassNames.prototype, Enumerable);
  (function(GLOBAL) {
    GLOBAL.Selector = Class.create({initialize:function(expression) {
      this.expression = expression.strip();
    }, findElements:function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    }, match:function(element) {
      return Prototype.Selector.match(element, this.expression);
    }, toString:function() {
      return this.expression;
    }, inspect:function() {
      return "#<Selector: " + this.expression + ">";
    }});
    Object.extend(GLOBAL.Selector, {matchElements:function(elements, expression) {
      var match = Prototype.Selector.match, results = [];
      for (var i = 0, length = elements.length;i < length;i++) {
        var element = elements[i];
        if (match(element, expression)) {
          results.push(Element.extend(element));
        }
      }
      return results;
    }, findElement:function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length;i < length;i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    }, findChildElements:function(element, expressions) {
      var selector = expressions.toArray().join(", ");
      return Prototype.Selector.select(selector, element || document);
    }});
  })(this);
  this.Ajax = Ajax;
  this.$A = $A;
  this.$H = $H;
  this.$w = $w;
  this.Prototype = Prototype;
  this.Class = Class;
  this.Enumerable = Enumerable;
  this.Template = Template;
  this.Position = Position;
}).apply(PROTOTYPE);
var Lang = {SUBREGEX:/\{\s*([^\|\}]+?)\s*(?:\|([^\}]*))?\s*\}/g, UNDEFINED:"undefined", isUndefined:function(o) {
  return typeof o === Lang.UNDEFINED;
}, sub:function(s, o) {
  return s.replace ? s.replace(Lang.SUBREGEX, function(match, key) {
    return!Lang.isUndefined(o[key]) ? o[key] : match;
  }) : s;
}};
if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
  };
}
if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}
if (!Array.prototype.findAll) {
  Array.prototype.findAll = function(iterator) {
    if (this == null || !Object.isFunction(iterator)) {
      throw new TypeError;
    }
    var object = Object(this);
    var results = [], context = arguments[1], value;
    for (var i = 0, length = object.length >>> 0;i < length;i++) {
      if (i in object) {
        value = object[i];
        if (iterator.call(context, value, i, object)) {
          results.push(value);
        }
      }
    }
    return results;
  };
}
if (!Raphael.fn.polygone) {
  Raphael.fn.polygone = function(points) {
    var first = [points[0], points[1]];
    var last = first;
    var path = "m" + points[0] + "," + points[1];
    for (var i = 2;i < points.length;i++) {
      path = path + "l" + (points[i] - last[0]) + "," + (points[i + 1] - last[1]);
      last[0] = points[i];
      last[1] = points[i + 1];
      i++;
    }
    path = path + "l" + (first[0] - last[0]) + "," + (first[1] - last[1]) + "z";
    polygon = this.path(path);
    polygon.type = "polygone";
    return polygon.data("points", points);
  };
}
function printf() {
  var result = arguments[0];
  for (var i = 1;i < arguments.length;i++) {
    result = result.replace("%" + (i - 1), arguments[i]);
  }
  return result;
}
window.$A = PROTOTYPE.$A;
window.$H = PROTOTYPE.$H;
window.$w = PROTOTYPE.$w;
window.Prototype = PROTOTYPE.Prototype;
window.Class = PROTOTYPE.Class;
window.Enumerable = PROTOTYPE.Enumerable;
window.Template = PROTOTYPE.Template;
window.Event = PROTOTYPE.Event;
window.Position = PROTOTYPE.Position;
if (!ORCHESTRATOR.CONFIG.LOGLEVEL) {
  ORCHESTRATOR.CONFIG.LOGLEVEL = 4;
}
if (!ORYX) {
  var ORYX = {}
}
ORYX = Object.extend(ORYX, {observe:function(el, evt, callback) {
  PROTOTYPE.Event.observe(el, evt, callback);
}, stopObserving:function(el) {
  PROTOTYPE.Event.stopObserving(el);
}, stop:function(event) {
  PROTOTYPE.Event.stop(event);
}, isLeftClick:function(event) {
  return PROTOTYPE.Event.isLeftClick(event);
}, pointerX:function(event) {
  var docElement = document.documentElement, body = document.body || {scrollLeft:0};
  return event.pageX || event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0);
}, pointerY:function(event) {
  var docElement = document.documentElement, body = document.body || {scrollTop:0};
  return event.pageY || event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0);
}, apply:function(o, c, defaults) {
  if (defaults) {
    ORYX.apply(o, defaults);
  }
  if (o && (c && typeof c == "object")) {
    for (var p in c) {
      o[p] = c[p];
    }
  }
  return o;
}, extend:function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}, type:function(o) {
  if (o === undefined || o === null) {
    return false;
  }
  if (o.htmlElement) {
    return "element";
  }
  var t = typeof o;
  if (t == "object" && o.nodeName) {
    switch(o.nodeType) {
      case 1:
        return "element";
      case 3:
        return/\S/.test(o.nodeValue) ? "textnode" : "whitespace";
    }
  }
  if (t == "object" || t == "function") {
    switch(o.constructor) {
      case Array:
        return "array";
      case RegExp:
        return "regexp";
    }
    if (typeof o.length == "number" && typeof o.item == "function") {
      return "nodelist";
    }
  }
  return t;
}, Log:{__appenders:[{append:function(message) {
  try {
    console.log(message);
  } catch (e) {
  }
}}], addAppender:function(appender) {
  ORYX.Log.__appenders.push(appender);
}, trace:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_TRACE) {
    ORYX.Log.__log("TRACE", arguments);
  }
}, debug:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_DEBUG) {
    ORYX.Log.__log("DEBUG", arguments);
  }
}, info:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_INFO) {
    ORYX.Log.__log("INFO ", arguments);
  }
}, warn:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_WARN) {
    ORYX.Log.__log("WARN ", arguments);
  }
}, error:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_ERROR) {
    ORYX.Log.__log("ERROR", arguments);
  }
}, fatal:function() {
  if (ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_FATAL) {
    ORYX.Log.__log("FATAL", arguments);
  }
}, exception:function(e) {
  if (e.stack) {
    ORYX.Log.debug(" Exception: " + e.stack);
  } else {
    ORYX.Log.debug(" Exception: " + e);
  }
}, __log:function(prefix, messageParts) {
  messageParts[0] = (new Date).getTime() + " " + prefix + " " + messageParts[0];
  var message = printf.apply(null, messageParts);
  ORYX.Log.__appenders.each(function(appender) {
    appender.append(message);
  });
}}});
ORYX.Hash = {construct:function(object) {
  this._object = object instanceof ORYX.Hash ? object.toObject() : ORYX.extend({}, object);
}, set:function(key, value) {
  return this._object[key] = value;
}, get:function(key) {
  if (this._object[key] !== Object.prototype[key]) {
    return this._object[key];
  }
}, unset:function(key) {
  var value = this._object[key];
  delete this._object[key];
  return value;
}, toObject:function() {
  return Object.clone(this._object);
}, keys:function() {
  return this.pluck("key");
}, values:function() {
  return this.pluck("value");
}, pluck:function(property) {
  var results = [];
  this.each(function(value) {
    results.push(value[property]);
  });
  return results;
}, $break:function() {
}, each:function(iterator, context) {
  try {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator.call(context, pair);
    }
  } catch (e) {
    if (e != this.$break) {
      throw e;
    }
  }
  return this;
}, any:function(iterator, context) {
  iterator = iterator || function(x) {
    return x;
  };
  var result = false;
  this.each(function(value, index) {
    if (result = !!iterator.call(context, value, index, this)) {
      throw this.$break;
    }
  }, this);
  return result;
}, inject:function(memo, iterator, context) {
  this.each(function(value, index) {
    memo = iterator.call(context, memo, value, index, this);
  }, this);
  return memo;
}, clone:function() {
  return new ORYX.Hash(this);
}};
ORYX.Hash = Clazz.extend(ORYX.Hash);
if (!ORCHESTRATOR) {
  var ORCHESTRATOR = {}
}
if (!ORCHESTRATOR.api) {
  ORCHESTRATOR.api = {};
}
Object.extend(ORCHESTRATOR.api, {getDeployment:function(deploymentId, callback) {
  if (deploymentId) {
    this.url = Lang.sub(ORCHESTRATOR.options.getDeploymentById, {deploymentId:deploymentId});
  } else {
    this.url = ORCHESTRATOR.options.getDeployment;
  }
  this.request(this.url, callback);
}, deleteDeloyment:function(deploymentId, callback) {
  if (deploymentId) {
    this.url = Lang.sub(ORCHESTRATOR.options.deleteDeployment, {deploymentId:deploymentId});
    this.post("DELETE", this.url, null, callback);
  } else {
    alert("deploymentId parameter is required");
  }
}, destroyProcess:function(processInstanceId, callback) {
  if (processInstanceId) {
    this.url = Lang.sub(ORCHESTRATOR.options.destroyProcessById, {processInstanceId:processInstanceId});
    this.post("DELETE", this.url, null, callback);
  } else {
    alert("processInstanceId parameter is required");
  }
}, getProcessDefinitionModel:function(processDefinition, callback) {
  this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionModel, {processDefinition:processDefinition, tick:(new Date).getTime()});
  this.request(this.url, callback);
}, getProcessParams:function(processDefinition, callback) {
  this.url = Lang.sub(ORCHESTRATOR.options.getProcessForm, {processDefinitionId:processDefinition, tick:(new Date).getTime()});
  this.request(this.url, callback);
}, startProcess:function(processDefinition, params, callback) {
  this.url = ORCHESTRATOR.options.startProcess;
  this.post("POST", this.url, Object.toJSON({processDefinitionKey:processDefinition.substring(0, processDefinition.indexOf(":")), variables:params}), callback, "application/json");
}, putProcessDefinitionModel:function(processDefinition, params, callback) {
  this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionModel, {processDefinition:processDefinition, tick:(new Date).getTime()});
  this.post("PUT", this.url, params, callback);
}, getProcessDefinition:function(processDefinitionId, callback) {
  if (processDefinitionId) {
    this.url = Lang.sub(ORCHESTRATOR.options.getProcessDefinitionById, {processDefinitionId:processDefinitionId});
  } else {
    this.url = ORCHESTRATOR.options.getProcessDefinition;
  }
  this.request(this.url, callback);
}, getInstanceHighlight:function(instance, callback) {
  if (instance) {
    this.url = Lang.sub(ORCHESTRATOR.options.getHighlight, {processInstanceId:instance, tick:(new Date).getTime()});
    this.request(this.url, callback);
  } else {
    alert("processInstanceId parameter is required");
  }
}, getHistory:function(callback) {
  this.url = ORCHESTRATOR.options.getHistory;
  this.request(this.url, callback);
}, getHistoryVars:function(instance, key, callback) {
  var self = this;
  if (key) {
    self.url = Lang.sub(ORCHESTRATOR.options.getInstanceHistByKey, {processInstanceId:instance, taskDefinitionKey:key});
  } else {
    self.url = Lang.sub(ORCHESTRATOR.options.getInstanceHist, {processInstanceId:instance});
  }
  self.request(self.url, function(json) {
    if (key) {
      if (json.data.length == 1) {
        self.url = Lang.sub(ORCHESTRATOR.options.getTaskHistory, {taskId:json.data[0].id});
        self.request(self.url, callback);
      } else {
        callback.call(null, {});
      }
    } else {
      callback.call(null, json);
    }
  });
}, getInstanceVars:function(instance, key, callback) {
  if (instance) {
    if (key) {
      var self = this;
      this.url = Lang.sub(ORCHESTRATOR.options.getInstanceTaskByKey, {processInstanceId:instance, taskDefinitionKey:key});
      this.request(this.url, function(json) {
        if (json.data.length == 1) {
          self.url = Lang.sub(ORCHESTRATOR.options.getTaskForm, {taskId:json.data[0].id});
          self.request(self.url, callback);
        } else {
          self.getHistoryVars(instance, key, callback);
        }
      });
    } else {
      this.url = Lang.sub(ORCHESTRATOR.options.getInstanceVarsById, {processInstanceId:instance});
      this.request(this.url, callback);
    }
  } else {
    alert("processInstanceId parameter is required");
  }
}, submitTask:function(task, properties, callback) {
  this.url = ORCHESTRATOR.options.submitTask;
  this.post("POST", this.url, Object.toJSON({taskId:task, properties:properties}), callback, "application/json");
}, getProcessInstance:function(processDefinitionId, processInstanceId, callback) {
  if (processInstanceId) {
    this.url = Lang.sub(ORCHESTRATOR.options.getProcessInstanceById, {processDefinitionId:processDefinitionId, processInstanceId:processInstanceId});
  } else {
    this.url = ORCHESTRATOR.options.getProcessInstance;
  }
  this.request(this.url, callback);
}});
if (!ORCHESTRATOR.api.post) {
  ORCHESTRATOR.api.post = function(method, url, params, callback, type) {
    new PROTOTYPE.Ajax.Request(ORCHESTRATOR.SERVICE_PATH + url, {method:method, parameters:params, contentType:type || "application/x-www-form-urlencoded", onSuccess:function(transport) {
      var data = eval("(" + transport.responseText + ")");
      if (callback) {
        callback.call(null, true, data);
      }
    }.bind(this), onFailure:function(transport) {
      if (callback) {
        callback.call(null, false, transport);
      }
    }.bind(this)});
  };
}
if (!ORCHESTRATOR.api.request) {
  ORCHESTRATOR.api.request = function(url, callback) {
    new PROTOTYPE.Ajax.Request(ORCHESTRATOR.SERVICE_PATH + url, {method:"GET", onSuccess:function(transport) {
      try {
        var data = eval("(" + transport.responseText + ")");
        if (data) {
          callback.call(null, data);
        }
      } catch (e) {
        ORYX.Log.exception(e);
      }
    }});
  };
}
;if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.SVG) {
  ORYX.Core.SVG = {};
}
ORYX.Core.SVG.EditPathHandler = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this.x = 0;
  this.y = 0;
  this.oldX = 0;
  this.oldY = 0;
  this.deltaWidth = 1;
  this.deltaHeight = 1;
  this.d = "";
}, init:function(x, y, oldX, oldY, deltaWidth, deltaHeight) {
  this.x = x;
  this.y = y;
  this.oldX = oldX;
  this.oldY = oldY;
  this.deltaWidth = deltaWidth;
  this.deltaHeight = deltaHeight;
  this.d = "";
}, editPointsAbs:function(points) {
  if (points instanceof Array) {
    var newPoints = [];
    var x, y;
    for (var i = 0;i < points.length;i++) {
      x = (parseFloat(points[i]) - this.oldX) * this.deltaWidth + this.x;
      i++;
      y = (parseFloat(points[i]) - this.oldY) * this.deltaHeight + this.y;
      newPoints.push(x);
      newPoints.push(y);
    }
    return newPoints;
  } else {
  }
}, editPointsRel:function(points) {
  if (points instanceof Array) {
    var newPoints = [];
    var x, y;
    for (var i = 0;i < points.length;i++) {
      x = parseFloat(points[i]) * this.deltaWidth;
      i++;
      y = parseFloat(points[i]) * this.deltaHeight;
      newPoints.push(x);
      newPoints.push(y);
    }
    return newPoints;
  } else {
  }
}, arcAbs:function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
  var pointsAbs = this.editPointsAbs([x, y]);
  var pointsRel = this.editPointsRel([rx, ry]);
  this.d = this.d.concat(" A" + pointsRel[0] + " " + pointsRel[1] + " " + xAxisRotation + " " + largeArcFlag + " " + sweepFlag + " " + pointsAbs[0] + " " + pointsAbs[1] + " ");
}, arcRel:function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
  var pointsRel = this.editPointsRel([rx, ry, x, y]);
  this.d = this.d.concat(" a" + pointsRel[0] + " " + pointsRel[1] + " " + xAxisRotation + " " + largeArcFlag + " " + sweepFlag + " " + pointsRel[2] + " " + pointsRel[3] + " ");
}, curvetoCubicAbs:function(x1, y1, x2, y2, x, y) {
  var pointsAbs = this.editPointsAbs([x1, y1, x2, y2, x, y]);
  this.d = this.d.concat(" C" + pointsAbs[0] + " " + pointsAbs[1] + " " + pointsAbs[2] + " " + pointsAbs[3] + " " + pointsAbs[4] + " " + pointsAbs[5] + " ");
}, curvetoCubicRel:function(x1, y1, x2, y2, x, y) {
  var pointsRel = this.editPointsRel([x1, y1, x2, y2, x, y]);
  this.d = this.d.concat(" c" + pointsRel[0] + " " + pointsRel[1] + " " + pointsRel[2] + " " + pointsRel[3] + " " + pointsRel[4] + " " + pointsRel[5] + " ");
}, linetoHorizontalAbs:function(x) {
  var pointsAbs = this.editPointsAbs([x, 0]);
  this.d = this.d.concat(" H" + pointsAbs[0] + " ");
}, linetoHorizontalRel:function(x) {
  var pointsRel = this.editPointsRel([x, 0]);
  this.d = this.d.concat(" h" + pointsRel[0] + " ");
}, linetoAbs:function(x, y) {
  var pointsAbs = this.editPointsAbs([x, y]);
  this.d = this.d.concat(" L" + pointsAbs[0] + " " + pointsAbs[1] + " ");
}, linetoRel:function(x, y) {
  var pointsRel = this.editPointsRel([x, y]);
  this.d = this.d.concat(" l" + pointsRel[0] + " " + pointsRel[1] + " ");
}, movetoAbs:function(x, y) {
  var pointsAbs = this.editPointsAbs([x, y]);
  this.d = this.d.concat(" M" + pointsAbs[0] + " " + pointsAbs[1] + " ");
}, movetoRel:function(x, y) {
  var pointsRel;
  if (this.d === "") {
    pointsRel = this.editPointsAbs([x, y]);
  } else {
    pointsRel = this.editPointsRel([x, y]);
  }
  this.d = this.d.concat(" m" + pointsRel[0] + " " + pointsRel[1] + " ");
}, curvetoQuadraticAbs:function(x1, y1, x, y) {
  var pointsAbs = this.editPointsAbs([x1, y1, x, y]);
  this.d = this.d.concat(" Q" + pointsAbs[0] + " " + pointsAbs[1] + " " + pointsAbs[2] + " " + pointsAbs[3] + " ");
}, curvetoQuadraticRel:function(x1, y1, x, y) {
  var pointsRel = this.editPointsRel([x1, y1, x, y]);
  this.d = this.d.concat(" q" + pointsRel[0] + " " + pointsRel[1] + " " + pointsRel[2] + " " + pointsRel[3] + " ");
}, curvetoCubicSmoothAbs:function(x2, y2, x, y) {
  var pointsAbs = this.editPointsAbs([x2, y2, x, y]);
  this.d = this.d.concat(" S" + pointsAbs[0] + " " + pointsAbs[1] + " " + pointsAbs[2] + " " + pointsAbs[3] + " ");
}, curvetoCubicSmoothRel:function(x2, y2, x, y) {
  var pointsRel = this.editPointsRel([x2, y2, x, y]);
  this.d = this.d.concat(" s" + pointsRel[0] + " " + pointsRel[1] + " " + pointsRel[2] + " " + pointsRel[3] + " ");
}, curvetoQuadraticSmoothAbs:function(x, y) {
  var pointsAbs = this.editPointsAbs([x, y]);
  this.d = this.d.concat(" T" + pointsAbs[0] + " " + pointsAbs[1] + " ");
}, curvetoQuadraticSmoothRel:function(x, y) {
  var pointsRel = this.editPointsRel([x, y]);
  this.d = this.d.concat(" t" + pointsRel[0] + " " + pointsRel[1] + " ");
}, linetoVerticalAbs:function(y) {
  var pointsAbs = this.editPointsAbs([0, y]);
  this.d = this.d.concat(" V" + pointsAbs[1] + " ");
}, linetoVerticalRel:function(y) {
  var pointsRel = this.editPointsRel([0, y]);
  this.d = this.d.concat(" v" + pointsRel[1] + " ");
}, closePath:function() {
  this.d = this.d.concat(" z");
}};
ORYX.Core.SVG.EditPathHandler = Clazz.extend(ORYX.Core.SVG.EditPathHandler);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.SVG) {
  ORYX.Core.SVG = {};
}
ORYX.Core.SVG.MinMaxPathHandler = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this.minX = undefined;
  this.minY = undefined;
  this.maxX = undefined;
  this.maxY = undefined;
  this._lastAbsX = undefined;
  this._lastAbsY = undefined;
}, calculateMinMax:function(points) {
  if (points instanceof Array) {
    var x, y;
    for (var i = 0;i < points.length;i++) {
      x = parseFloat(points[i]);
      i++;
      y = parseFloat(points[i]);
      this.minX = this.minX !== undefined ? Math.min(this.minX, x) : x;
      this.maxX = this.maxX !== undefined ? Math.max(this.maxX, x) : x;
      this.minY = this.minY !== undefined ? Math.min(this.minY, y) : y;
      this.maxY = this.maxY !== undefined ? Math.max(this.maxY, y) : y;
      this._lastAbsX = x;
      this._lastAbsY = y;
    }
  } else {
  }
}, arcAbs:function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
  this.calculateMinMax([x, y]);
}, arcRel:function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
  this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
}, curvetoCubicAbs:function(x1, y1, x2, y2, x, y) {
  this.calculateMinMax([x1, y1, x2, y2, x, y]);
}, curvetoCubicRel:function(x1, y1, x2, y2, x, y) {
  this.calculateMinMax([this._lastAbsX + x1, this._lastAbsY + y1, this._lastAbsX + x2, this._lastAbsY + y2, this._lastAbsX + x, this._lastAbsY + y]);
}, linetoHorizontalAbs:function(x) {
  this.calculateMinMax([x, this._lastAbsY]);
}, linetoHorizontalRel:function(x) {
  this.calculateMinMax([this._lastAbsX + x, this._lastAbsY]);
}, linetoAbs:function(x, y) {
  this.calculateMinMax([x, y]);
}, linetoRel:function(x, y) {
  this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
}, movetoAbs:function(x, y) {
  this.calculateMinMax([x, y]);
}, movetoRel:function(x, y) {
  if (this._lastAbsX && this._lastAbsY) {
    this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
  } else {
    this.calculateMinMax([x, y]);
  }
}, curvetoQuadraticAbs:function(x1, y1, x, y) {
  this.calculateMinMax([x1, y1, x, y]);
}, curvetoQuadraticRel:function(x1, y1, x, y) {
  this.calculateMinMax([this._lastAbsX + x1, this._lastAbsY + y1, this._lastAbsX + x, this._lastAbsY + y]);
}, curvetoCubicSmoothAbs:function(x2, y2, x, y) {
  this.calculateMinMax([x2, y2, x, y]);
}, curvetoCubicSmoothRel:function(x2, y2, x, y) {
  this.calculateMinMax([this._lastAbsX + x2, this._lastAbsY + y2, this._lastAbsX + x, this._lastAbsY + y]);
}, curvetoQuadraticSmoothAbs:function(x, y) {
  this.calculateMinMax([x, y]);
}, curvetoQuadraticSmoothRel:function(x, y) {
  this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
}, linetoVerticalAbs:function(y) {
  this.calculateMinMax([this._lastAbsX, y]);
}, linetoVerticalRel:function(y) {
  this.calculateMinMax([this._lastAbsX, this._lastAbsY + y]);
}, closePath:function() {
  return;
}};
ORYX.Core.SVG.MinMaxPathHandler = Clazz.extend(ORYX.Core.SVG.MinMaxPathHandler);
Svg.VERSION = 1;
Svg.NAMESPACE = "http://www.w3.org/2000/svg";
function Svg() {
}
PathParser.PARAMCOUNT = {A:7, C:6, H:1, L:2, M:2, Q:4, S:4, T:2, V:1, Z:0};
PathParser.METHODNAME = {A:"arcAbs", a:"arcRel", C:"curvetoCubicAbs", c:"curvetoCubicRel", H:"linetoHorizontalAbs", h:"linetoHorizontalRel", L:"linetoAbs", l:"linetoRel", M:"movetoAbs", m:"movetoRel", Q:"curvetoQuadraticAbs", q:"curvetoQuadraticRel", S:"curvetoCubicSmoothAbs", s:"curvetoCubicSmoothRel", T:"curvetoQuadraticSmoothAbs", t:"curvetoQuadraticSmoothRel", V:"linetoVerticalAbs", v:"linetoVerticalRel", Z:"closePath", z:"closePath"};
function PathParser() {
  this._lexer = new PathLexer;
  this._handler = null;
}
PathParser.prototype.parsePath = function(path) {
  if (path == null || (path.namespaceURI != Svg.NAMESPACE || path.localName != "path")) {
    throw new Error("PathParser.parsePath: The first parameter must be an SVG path element");
  }
  this.parseData(path.getAttributeNS(null, "d"));
};
PathParser.prototype.parseData = function(pathData) {
  if (typeof pathData != "string") {
    throw new Error("PathParser.parseData: The first parameter must be a string");
  }
  if (this._handler != null && this._handler.beginParse != null) {
    this._handler.beginParse();
  }
  var lexer = this._lexer;
  lexer.setPathData(pathData);
  var mode = "BOP";
  var token = lexer.getNextToken();
  while (!token.typeis(PathToken.EOD)) {
    var param_count;
    var params = new Array;
    switch(token.type) {
      case PathToken.COMMAND:
        if (mode == "BOP" && (token.text != "M" && token.text != "m")) {
          throw new Error("PathParser.parseData: a path must begin with a moveto command");
        }
        mode = token.text;
        param_count = PathParser.PARAMCOUNT[token.text.toUpperCase()];
        token = lexer.getNextToken();
        break;
      case PathToken.NUMBER:
        break;
      default:
        throw new Error("PathParser.parseData: unrecognized token type: " + token.type);;
    }
    for (var i = 0;i < param_count;i++) {
      switch(token.type) {
        case PathToken.COMMAND:
          throw new Error("PathParser.parseData: parameter must be a number: " + token.text);;
        case PathToken.NUMBER:
          params[i] = token.text - 0;
          break;
        default:
          throw new Errot("PathParser.parseData: unrecognized token type: " + token.type);;
      }
      token = lexer.getNextToken();
    }
    if (this._handler != null) {
      var handler = this._handler;
      var method = PathParser.METHODNAME[mode];
      if (handler[method] != null) {
        handler[method].apply(handler, params);
      }
    }
    if (mode == "M") {
      mode = "L";
    }
    if (mode == "m") {
      mode = "l";
    }
  }
};
PathParser.prototype.setHandler = function(handler) {
  this._handler = handler;
};
PathLexer.VERSION = 1;
function PathLexer(pathData) {
  if (pathData == null) {
    pathData = "";
  }
  this.setPathData(pathData);
}
PathLexer.prototype.setPathData = function(pathData) {
  if (typeof pathData != "string") {
    throw new Error("PathLexer.setPathData: The first parameter must be a string");
  }
  this._pathData = pathData;
};
PathLexer.prototype.getNextToken = function() {
  var result = null;
  var d = this._pathData;
  while (result == null) {
    if (d == null || d == "") {
      result = new PathToken(PathToken.EOD, "");
    } else {
      if (d.match(/^([ \t\r\n,]+)/)) {
        d = d.substr(RegExp.$1.length);
      } else {
        if (d.match(/^([AaCcHhLlMmQqSsTtVvZz])/)) {
          result = new PathToken(PathToken.COMMAND, RegExp.$1);
          d = d.substr(RegExp.$1.length);
        } else {
          if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
            result = new PathToken(PathToken.NUMBER, parseFloat(RegExp.$1));
            d = d.substr(RegExp.$1.length);
          } else {
            throw new Error("PathLexer.getNextToken: unrecognized path data " + d);
          }
        }
      }
    }
  }
  this._pathData = d;
  return result;
};
PathToken.UNDEFINED = 0;
PathToken.COMMAND = 1;
PathToken.NUMBER = 2;
PathToken.EOD = 3;
function PathToken(type, text) {
  if (arguments.length > 0) {
    this.init(type, text);
  }
}
PathToken.prototype.init = function(type, text) {
  this.type = type;
  this.text = text;
};
PathToken.prototype.typeis = function(type) {
  return this.type == type;
};
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.SVG) {
  ORYX.Core.SVG = {};
}
ORYX.Core.SVG.SVGShape = {construct:function(svgElem) {
  arguments.callee.$.construct.apply(this, arguments);
  this.element = svgElem;
  this.x = undefined;
  this.y = undefined;
  this.width = undefined;
  this.height = undefined;
  this.oldX = undefined;
  this.oldY = undefined;
  this.oldWidth = undefined;
  this.oldHeight = undefined;
  this.radiusX = undefined;
  this.radiusY = undefined;
  this.isHorizontallyResizable = false;
  this.isVerticallyResizable = false;
  this.anchorLeft = false;
  this.anchorRight = false;
  this.anchorTop = false;
  this.anchorBottom = false;
  this.init();
}, init:function() {
  switch(this.element.type) {
    case "rect":
    ;
    case "image":
      this.oldX = this.element.attr("x");
      this.oldY = this.element.attr("y");
      this.oldWidth = this.element.attr("width");
      this.oldHeight = this.element.attr("height");
      break;
    case "circle":
      cx = this.element.attr("cx");
      cy = this.element.attr("cy");
      this.radiusX = this.element.attr("r");
      this.oldX = cx - this.radiusX;
      this.oldY = cy - this.radiusX;
      this.oldWidth = 2 * this.radiusX;
      this.oldHeight = 2 * this.radiusX;
      break;
    case "ellipse":
      cx = this.element.attr("cx");
      cy = this.element.attr("cy");
      this.radiusX = this.element.attr("rx");
      this.radiusY = this.element.attr("ry");
      this.oldX = cx - this.radiusX;
      this.oldY = cy - this.radiusY;
      this.oldWidth = 2 * this.radiusX;
      this.oldHeight = 2 * this.radiusY;
      break;
    case "line":
      x1 = this.element.data("x1");
      y1 = this.element.data("y1");
      x2 = this.element.data("x2");
      y2 = this.element.data("y2");
      this.oldX = Math.min(x1, x2);
      this.oldY = Math.min(y1, y2);
      this.oldWidth = Math.abs(x1 - x2);
      this.oldHeight = Math.abs(y1 - y2);
      break;
    case "polygone":
      var pointsArray = this.element.data("points");
      if (pointsArray && (pointsArray.length && pointsArray.length > 1)) {
        var minX = pointsArray[0];
        var minY = pointsArray[1];
        var maxX = pointsArray[0];
        var maxY = pointsArray[1];
        for (var i = 0;i < pointsArray.length;i++) {
          minX = Math.min(minX, pointsArray[i]);
          maxX = Math.max(maxX, pointsArray[i]);
          i++;
          minY = Math.min(minY, pointsArray[i]);
          maxY = Math.max(maxY, pointsArray[i]);
        }
        this.oldX = minX;
        this.oldY = minY;
        this.oldWidth = maxX - minX;
        this.oldHeight = maxY - minY;
      } else {
        throw "Missing attribute in element " + this.element;
      }
      break;
    case "path":
      this.editPathParser = new PathParser;
      this.editPathHandler = new ORYX.Core.SVG.EditPathHandler;
      this.editPathParser.setHandler(this.editPathHandler);
      var parser = new PathParser;
      var handler = new ORYX.Core.SVG.MinMaxPathHandler;
      parser.setHandler(handler);
      parser.parseData(this.element.attr("path").toString());
      this.oldX = handler.minX;
      this.oldY = handler.minY;
      this.oldWidth = handler.maxX - handler.minX;
      this.oldHeight = handler.maxY - handler.minY;
      delete parser;
      delete handler;
      break;
    default:
      throw "Element is not a shape.";;
  }
  var resizeAttr = this.element.data("resize");
  if (resizeAttr) {
    resizeAttr = resizeAttr.toLowerCase();
    if (resizeAttr.match(/horizontal/)) {
      this.isHorizontallyResizable = true;
    } else {
      this.isHorizontallyResizable = false;
    }
    if (resizeAttr.match(/vertical/)) {
      this.isVerticallyResizable = true;
    } else {
      this.isVerticallyResizable = false;
    }
  } else {
    this.isHorizontallyResizable = false;
    this.isVerticallyResizable = false;
  }
  var anchorAttr = this.element.data("anchors");
  if (anchorAttr) {
    anchorAttr = anchorAttr.replace("/,/g", " ");
    var anchors = anchorAttr.split(" ").without("");
    for (var i = 0;i < anchors.length;i++) {
      switch(anchors[i].toLowerCase()) {
        case "left":
          this.anchorLeft = true;
          break;
        case "right":
          this.anchorRight = true;
          break;
        case "top":
          this.anchorTop = true;
          break;
        case "bottom":
          this.anchorBottom = true;
          break;
      }
    }
  }
  this.bound = this.element.data("bound") ? this.element.data("bound") : false;
  this.x = this.oldX;
  this.y = this.oldY;
  this.width = this.oldWidth;
  this.height = this.oldHeight;
}, refresh:function(options) {
  if (this.x !== this.oldX || (this.y !== this.oldY || (this.width !== this.oldWidth || this.height !== this.oldHeight))) {
    switch(this.element.type) {
      case "rect":
        if (this.x !== this.oldX) {
          this.element.attr({x:this.x});
        }
        if (this.y !== this.oldY) {
          this.element.attr({y:this.y});
        }
        if (this.width !== this.oldWidth) {
          this.element.attr({width:this.width});
        }
        if (this.height !== this.oldHeight) {
          this.element.attr({height:this.height});
        }
        break;
      case "circle":
        this.radiusX = (this.width < this.height ? this.width : this.height) / 2;
        this.element.attr({cx:this.x + this.width / 2, cy:this.y + this.height / 2, r:this.radiusX});
        break;
      case "ellipse":
        this.radiusX = this.width / 2;
        this.radiusY = this.height / 2;
        this.element.attr({cx:this.x + this.radiusX, cy:this.y + this.radiusY, rx:this.radiusX, ry:this.radiusY});
        break;
      case "line":
        if (this.x !== this.oldX) {
          this.element.data("x1", this.x);
        }
        if (this.y !== this.oldY) {
          this.element.data("y1", this.y);
        }
        if (this.x !== this.oldX || this.width !== this.oldWidth) {
          this.element.data("x2", this.x + this.width);
        }
        if (this.y !== this.oldY || this.height !== this.oldHeight) {
          this.element.data("y2", this.y + this.height);
        }
        break;
      case "polygone":
        var points = this.element.data("points");
        if (points) {
          var widthDelta = this.oldWidth === 0 ? 0 : this.width / this.oldWidth;
          var heightDelta = this.oldHeight === 0 ? 0 : this.height / this.oldHeight;
          var updatedPoints = null;
          for (var i = 0;i < points.length;i++) {
            var x = (points[i] - this.oldX) * widthDelta + this.x;
            updatedPoints.push(x);
            i++;
            var y = (points[i] - this.oldY) * heightDelta + this.y;
            updatedPoints.push(y);
          }
          this.element.data("points", updatedPoints);
        }
        break;
      case "path":
        var widthDelta = this.oldWidth === 0 ? 0 : this.width / this.oldWidth;
        var heightDelta = this.oldHeight === 0 ? 0 : this.height / this.oldHeight;
        this.editPathHandler.init(this.x, this.y, this.oldX, this.oldY, widthDelta, heightDelta);
        this.editPathParser.parseData(this.element.attr("path").toString());
        this.element.attr("path", this.editPathHandler.d);
        break;
    }
    this.oldX = this.x;
    this.oldY = this.y;
    this.oldWidth = this.width;
    this.oldHeight = this.height;
  }
  if (options && this.bound) {
    options.color && this.element.attr({stroke:options.color});
    options.width && this.element.attr("stroke-width", options.width);
  }
}, isPointIncluded:function(pointX, pointY) {
  if (!pointX || (!pointY || !this.bound)) {
    return false;
  }
  switch(this.element.type) {
    case "rect":
      return pointX >= this.x && (pointX <= this.x + this.width && (pointY >= this.y && pointY <= this.y + this.height));
      break;
    case "circle":
      return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.width / 2, this.y + this.height / 2, this.radiusX, this.radiusX);
      break;
    case "ellipse":
      return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.radiusX, this.y + this.radiusY, this.radiusX, this.radiusY);
      break;
    case "line":
      return ORYX.Core.Math.isPointInLine(pointX, pointY, this.x, this.y, this.x + this.width, this.y + this.height);
      break;
    case "polygone":
      var points = this.element.data("points");
      return points ? ORYX.Core.Math.isPointInPolygone(pointX, pointY, points) : false;
      break;
    case "path":
      if (!this.handler) {
        var parser = new PathParser;
        this.handler = new ORYX.Core.SVG.PointsPathHandler;
        parser.setHandler(this.handler);
        parser.parseData(this.element.attr("path").toString());
      }
      return ORYX.Core.Math.isPointInPolygone(pointX, pointY, this.handler.points);
      break;
    default:
      return false;
  }
}, toString:function() {
  return this.element ? "SVGShape " + this.element.id : "SVGShape " + this.element;
}};
ORYX.Core.SVG.SVGShape = Clazz.extend(ORYX.Core.SVG.SVGShape);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.SVG) {
  ORYX.Core.SVG = {};
}
ORYX.Core.SVG.Label = {_characterSets:["%W", "@", "m", "wDGMOQ\u00d6#+=<>~^", "ABCHKNRSUVXZ\u00dc\u00c4&", "bdghnopqux\u00f6\u00fcETY1234567890\u00df_\u00a7${}*\u00b4`\u00b5\u20ac", "aeksvyz\u00e4FLP?\u00b0\u00b2\u00b3", "c-", 'rtJ"/()[]:;!|\\', "fjI., ", "'", "il"], _characterSetValues:[15, 14, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3], construct:function(options) {
  arguments.callee.$.construct.apply(this, arguments);
  this.invisibleRenderPoint = -5E3;
  this.element = options.textElement;
  this.element.attr("stroke-width", "0pt");
  this.shapeId = options.shapeId;
  this.isVisible = true;
  this._isChanged = true;
  var _id = this.shapeId + this.element.data("id");
  if (_id) {
    this.id = _id;
  }
  this.fitToElemId = this.element.data("fittoelem");
  var alignValues = this.element.data("align");
  if (alignValues) {
    alignValues = alignValues.replace(/,/g, " ");
    alignValues = alignValues.split(" ");
    alignValues = alignValues.without("");
    alignValues.each(function(alignValue) {
      switch(alignValue) {
        case "top":
        ;
        case "middle":
        ;
        case "bottom":
          if (!this._verticalAlign) {
            this._originVerticalAlign = this._verticalAlign = alignValue;
          }
          break;
        case "left":
        ;
        case "center":
        ;
        case "right":
          if (!this._horizontalAlign) {
            this._originHorizontalAlign = this._horizontalAlign = alignValue;
          }
          break;
      }
    }.bind(this));
  }
  this.edgePosition = this.element.data("edgePosition");
  if (this.edgePosition) {
    this.originEdgePosition = this.edgePosition = this.edgePosition.toLowerCase();
  }
  this.offsetTop = this.element.data("offsetTop") || ORCHESTRATOR.CONFIG.OFFSET_LABEL_TOP;
  if (this.offsetTop) {
    this.offsetTop = parseInt(this.offsetTop);
  }
  this.offsetBottom = this.element.data("offsetBottom") || ORCHESTRATOR.CONFIG.OFFSET_LABEL_BOTTOM;
  if (this.offsetBottom) {
    this.offsetBottom = parseInt(this.offsetBottom);
  }
  var rotateValue = this.element.data("rotate");
  if (rotateValue) {
    try {
      this._rotate = parseFloat(rotateValue);
    } catch (e) {
      this._rotate = 0;
    }
  } else {
    this._rotate = 0;
  }
  var anchorAttr = this.element.data("anchors");
  if (anchorAttr) {
    anchorAttr = anchorAttr.replace("/,/g", " ");
    var anchors = anchorAttr.split(" ").without("");
    for (var i = 0;i < anchors.length;i++) {
      switch(anchors[i].toLowerCase()) {
        case "left":
          this.originAnchorLeft = this.anchorLeft = true;
          break;
        case "right":
          this.originAnchorRight = this.anchorRight = true;
          break;
        case "top":
          this.originAnchorTop = this.anchorTop = true;
          break;
        case "bottom":
          this.originAnchorBottom = this.anchorBottom = true;
          break;
      }
    }
  }
  if (!this._verticalAlign) {
    this._verticalAlign = "middle";
  }
  if (!this._horizontalAlign) {
    this._horizontalAlign = "center";
  }
  var xValue = this.element.attr("x");
  if (xValue) {
    this.oldX = this.x = parseFloat(xValue);
  } else {
  }
  var yValue = this.element.attr("y");
  if (yValue) {
    this.oldY = this.y = parseFloat(yValue);
  } else {
  }
  this.text(this.element.attr("text"));
}, resetAnchorPosition:function() {
  this.anchorLeft = this.originAnchorLeft || false;
  this.anchorRight = this.originAnchorRight || false;
  this.anchorTop = this.originAnchorTop || false;
  this.anchorBottom = this.originAnchorBottom || false;
}, isOriginAnchorLeft:function() {
  return this.originAnchorLeft || false;
}, isOriginAnchorRight:function() {
  return this.originAnchorRight || false;
}, isOriginAnchorTop:function() {
  return this.originAnchorTop || false;
}, isOriginAnchorBottom:function() {
  return this.originAnchorBottom || false;
}, isAnchorLeft:function() {
  return this.anchorLeft || false;
}, isAnchorRight:function() {
  return this.anchorRight || false;
}, isAnchorTop:function() {
  return this.anchorTop || false;
}, isAnchorBottom:function() {
  return this.anchorBottom || false;
}, getX:function() {
  try {
    var x = this.element.attr("x");
    switch(this.horizontalAlign()) {
      case "left":
        return x;
      case "center":
        return x - this.getWidth() / 2;
      case "right":
        return x - this.getWidth();
    }
    return this.element.getBBox().x;
  } catch (e) {
    return this.x;
  }
}, setX:function(x) {
  if (this.position) {
    this.position.x = x;
  } else {
    this.setOriginX(x);
  }
}, getY:function() {
  try {
    return this.element.getBBox().y;
  } catch (e) {
    return this.y;
  }
}, setY:function(y) {
  if (this.position) {
    this.position.y = y;
  } else {
    this.setOriginY(y);
  }
}, setOriginX:function(x) {
  this.x = x;
}, setOriginY:function(y) {
  this.y = y;
}, getWidth:function() {
  try {
    try {
      var width, cn = this.element.node.childNodes;
      if (cn.length == 0 || !Prototype.Browser.Gecko) {
        width = this.element.getBBox().width;
      } else {
        for (var i = 0, size = cn.length;i < size;++i) {
          var w = cn[i].getComputedTextLength();
          if ("undefined" == typeof width || width < w) {
            width = w;
          }
        }
      }
      return width + (width % 2 == 0 ? 0 : 1);
    } catch (ee) {
      return this.element.getBBox().width;
    }
  } catch (e) {
    return 0;
  }
}, getOriginUpperLeft:function() {
  var x = this.x, y = this.y;
  switch(this._horizontalAlign) {
    case "center":
      x -= this.getWidth() / 2;
      break;
    case "right":
      x -= this.getWidth();
      break;
  }
  switch(this._verticalAlign) {
    case "middle":
      y -= this.getHeight() / 2;
      break;
    case "bottom":
      y -= this.getHeight();
      break;
  }
  return{x:x, y:y};
}, getHeight:function() {
  try {
    return this.element.getBBox().height;
  } catch (e) {
    return 0;
  }
}, getCenter:function() {
  var up = {x:this.getX(), y:this.getY()};
  up.x += this.getWidth() / 2;
  up.y += this.getHeight() / 2;
  return up;
}, setPosition:function(position) {
  if (!position || (position.x === undefined || position.y === undefined)) {
    delete this.position;
  } else {
    this.position = position;
  }
  if (this.position) {
    delete this._referencePoint;
    delete this.edgePosition;
  }
  this._isChanged = true;
  this.update();
}, getPosition:function() {
  return this.position;
}, setReferencePoint:function(ref) {
  if (ref) {
    this._referencePoint = ref;
  } else {
    delete this._referencePoint;
  }
  if (this._referencePoint) {
    delete this.position;
  }
}, getReferencePoint:function() {
  return this._referencePoint || undefined;
}, changed:function() {
  this._isChanged = true;
}, registerOnChange:function(fn) {
  if (!this.changeCallbacks) {
    this.changeCallbacks = [];
  }
  if (fn instanceof Function && !this.changeCallbacks.include(fn)) {
    this.changeCallbacks.push(fn);
  }
}, unregisterOnChange:function(fn) {
  if (this.changeCallbacks && (fn instanceof Function && this.changeCallbacks.include(fn))) {
    this.changeCallbacks = this.changeCallbacks.without(fn);
  }
}, isUpdating:function() {
  return!!this._isUpdating;
}, getOriginEdgePosition:function() {
  return this.originEdgePosition;
}, getEdgePosition:function() {
  return this.edgePosition || null;
}, setEdgePosition:function(position) {
  if (["starttop", "startmiddle", "startbottom", "midtop", "midbottom", "endtop", "endbottom"].include(position)) {
    this.edgePosition = position;
    delete this.position;
    delete this._referencePoint;
  } else {
    delete this.edgePosition;
  }
}, update:function(force) {
  var x = this.x, y = this.y;
  if (this.position) {
    x = this.position.x;
    y = this.position.y;
  }
  x = Math.floor(x);
  y = Math.floor(y);
  if (this._isChanged || (x !== this.oldX || (y !== this.oldY || force === true))) {
    if (this.isVisible) {
      this._isChanged = false;
      this._isUpdating = true;
      this.element.attr({x:x, y:y});
      this.oldX = x;
      this.oldY = y;
      if (!this.position && !this.getReferencePoint()) {
        if (this._rotate !== undefined) {
          if (this._rotationPoint) {
            this.element.transform("...r" + this._rotate + " " + Math.floor(this._rotationPoint.x) + " " + Math.floor(this._rotationPoint.y));
          } else {
            this.element.transform("...r" + this._rotate + " " + Math.floor(x) + " " + Math.floor(y));
          }
        }
      } else {
        this.element.transform("");
      }
      var textLines = this._text.split("\n");
      while (textLines.last() == "") {
        textLines.pop();
      }
      this.element.attr("text", this._text);
      switch(this._horizontalAlign) {
        case "left":
          this.element.attr("text-anchor", "start");
          break;
        case "center":
          this.element.attr("text-anchor", "middle");
          break;
        case "right":
          this.element.attr("text-anchor", "end");
          break;
      }
      (this.changeCallbacks || []).each(function(fn) {
        fn.apply(fn);
      });
    }
  }
}, _fitLines:function(textLines) {
  if (this.fitToElemId || this._textHasChanged) {
    this.node.textContent = "";
    textLines.each(function(textLine, index) {
      var tspan = document.createElementNS(ORCHESTRATOR.CONST.NAMESPACE_SVG, "tspan");
      tspan.textContent = textLine.trim();
      if (this.fitToElemId) {
        tspan.setAttribute("x", this.invisibleRenderPoint);
        tspan.setAttribute("y", this.invisibleRenderPoint);
      }
      if (tspan.textContent === "") {
        tspan.textContent = " ";
      }
      this.node.appendChild(tspan);
    }.bind(this));
    delete this._textHasChanged;
    delete this.indices;
  }
  if (this.isVisible && this.fitToElemId) {
    this.element.node.style.visibility = "hidden";
  }
  if (this.fitToElemId) {
    window.setTimeout(this._checkFittingToReferencedElem.bind(this), 0);
  } else {
    window.setTimeout(this._positionText.bind(this), 0);
  }
}, _checkFittingToReferencedElem:function() {
  try {
    var tspans = $A(this.node.getElementsByTagNameNS(ORCHESTRATOR.CONST.NAMESPACE_SVG, "tspan"));
    var newtspans = [];
    var refNode = this.node.ownerDocument.getElementById(this.fitToElemId);
    if (refNode) {
      var refbb = refNode.getBBox();
      var fontSize = this.getFontSize();
      for (var j = 0;j < tspans.length;j++) {
        var tspan = tspans[j];
        var textLength = this._getRenderedTextLength(tspan, undefined, undefined, fontSize);
        var refBoxLength = this._rotate != 0 && (this._rotate % 180 != 0 && this._rotate % 90 == 0) ? refbb.height : refbb.width;
        if (textLength > refBoxLength) {
          var startIndex = 0;
          var lastSeperatorIndex = 0;
          var numOfChars = this.getTrimmedTextLength(tspan.textContent);
          for (var i = 0;i < numOfChars;i++) {
            var sslength = this._getRenderedTextLength(tspan, startIndex, i - startIndex, fontSize);
            if (sslength > refBoxLength - 2) {
              var newtspan = document.createElementNS(ORCHESTRATOR.CONST.NAMESPACE_SVG, "tspan");
              if (lastSeperatorIndex <= startIndex) {
                lastSeperatorIndex = i == 0 ? i : i - 1;
                newtspan.textContent = tspan.textContent.slice(startIndex, lastSeperatorIndex).trim();
              } else {
                newtspan.textContent = tspan.textContent.slice(startIndex, ++lastSeperatorIndex).trim();
              }
              newtspan.setAttribute("x", this.invisibleRenderPoint);
              newtspan.setAttribute("y", this.invisibleRenderPoint);
              newtspans.push(newtspan);
              startIndex = lastSeperatorIndex;
            } else {
              var curChar = tspan.textContent.charAt(i);
              if (curChar == " " || (curChar == "-" || (curChar == "." || (curChar == "," || (curChar == ";" || curChar == ":"))))) {
                lastSeperatorIndex = i;
              }
            }
          }
          tspan.textContent = tspan.textContent.slice(startIndex).trim();
        }
        newtspans.push(tspan);
      }
      while (this.node.hasChildNodes()) {
        this.node.removeChild(this.node.childNodes[0]);
      }
      while (newtspans.length > 0) {
        this.node.appendChild(newtspans.shift());
      }
    }
  } catch (e) {
    ORYX.Log.fatal("Error " + e);
  }
  window.setTimeout(this._positionText.bind(this), 0);
}, _positionText:function() {
  try {
    var tspans = this.node.childNodes;
    var fontSize = this.getFontSize(this.node);
    var invalidTSpans = [];
    var x = this.x, y = this.y;
    if (this.position) {
      x = this.position.x;
      y = this.position.y;
    }
    x = Math.floor(x);
    y = Math.floor(y);
    var i = 0, indic = [];
    var is = this.indices || $R(0, tspans.length - 1).toArray();
    var length = is.length;
    is.each(function(index) {
      if ("undefined" == typeof index) {
        return;
      }
      var tspan = tspans[i++];
      if (tspan.textContent.trim() === "") {
        invalidTSpans.push(tspan);
      } else {
        var dy = 0;
        switch(this._verticalAlign) {
          case "bottom":
            dy = -(length - index - 1) * fontSize;
            break;
          case "middle":
            dy = -(length / 2 - index - 1) * fontSize;
            dy -= ORCHESTRATOR.CONFIG.LABEL_LINE_DISTANCE / 2;
            break;
          case "top":
            dy = index * fontSize;
            dy += fontSize;
            break;
        }
        tspan.setAttribute("dy", Math.floor(dy));
        tspan.setAttribute("x", x);
        tspan.setAttribute("y", y);
        indic.push(index);
      }
    }.bind(this));
    this.indices = this.indices || indic;
    invalidTSpans.each(function(tspan) {
      this.node.removeChild(tspan);
    }.bind(this));
    switch(this._horizontalAlign) {
      case "left":
        this.node.setAttribute("text-anchor", "start");
        break;
      case "center":
        this.node.setAttribute("text-anchor", "middle");
        break;
      case "right":
        this.node.setAttribute("text-anchor", "end");
        break;
    }
  } catch (e) {
    this._isChanged = true;
  }
  if (this.isVisible) {
    this.element.node.style.visibility = "visible";
  }
  delete this._isUpdating;
  (this.changeCallbacks || []).each(function(fn) {
    fn.apply(fn);
  });
}, _getRenderedTextLength:function(tspan, startIndex, endIndex, fontSize) {
  if (startIndex === undefined) {
    return tspan.getComputedTextLength();
  } else {
    return tspan.getSubStringLength(startIndex, endIndex);
  }
}, _estimateTextWidth:function(text, fontSize) {
  var sum = 0;
  for (var i = 0;i < text.length;i++) {
    sum += this._estimateCharacterWidth(text.charAt(i));
  }
  return sum * (fontSize / 14);
}, _estimateCharacterWidth:function(character) {
  for (var i = 0;i < this._characterSets.length;i++) {
    if (this._characterSets[i].indexOf(character) >= 0) {
      return this._characterSetValues[i];
    }
  }
  return 9;
}, text:function() {
  switch(arguments.length) {
    case 0:
      return this._text;
      break;
    case 1:
      var oldText = this._text;
      if (arguments[0]) {
        this._text = arguments[0].toString();
      } else {
        this._text = "";
      }
      if (oldText !== this._text) {
        this._isChanged = true;
        this._textHasChanged = true;
      }
      break;
    default:
      break;
  }
}, getOriginVerticalAlign:function() {
  return this._originVerticalAlign;
}, verticalAlign:function() {
  switch(arguments.length) {
    case 0:
      return this._verticalAlign;
    case 1:
      if (["top", "middle", "bottom"].member(arguments[0])) {
        var oldValue = this._verticalAlign;
        this._verticalAlign = arguments[0];
        if (this._verticalAlign !== oldValue) {
          this._isChanged = true;
        }
      }
      break;
    default:
      break;
  }
}, getOriginHorizontalAlign:function() {
  return this._originHorizontalAlign;
}, horizontalAlign:function() {
  switch(arguments.length) {
    case 0:
      return this._horizontalAlign;
    case 1:
      if (["left", "center", "right"].member(arguments[0])) {
        var oldValue = this._horizontalAlign;
        this._horizontalAlign = arguments[0];
        if (this._horizontalAlign !== oldValue) {
          this._isChanged = true;
        }
      }
      break;
    default:
      break;
  }
}, rotate:function() {
  switch(arguments.length) {
    case 0:
      return this._rotate;
    case 1:
      if (this._rotate != arguments[0]) {
        this._rotate = arguments[0];
        this._rotationPoint = undefined;
        this._isChanged = true;
      }
    ;
    case 2:
      if (this._rotate != arguments[0] || (!this._rotationPoint || (this._rotationPoint.x != arguments[1].x || this._rotationPoint.y != arguments[1].y))) {
        this._rotate = arguments[0];
        this._rotationPoint = arguments[1];
        this._isChanged = true;
      }
    ;
  }
}, hide:function() {
  if (this.isVisible) {
    this.isVisible = false;
    this.element.node.style.visibility = "hidden";
  }
}, show:function() {
  if (!this.isVisible) {
    this.isVisible = true;
    this.element.node.style.visibility = "visible";
  }
}, getInheritedFontSize:function(node) {
  if (!node || !node.getAttributeNS) {
    return;
  }
  var attr = node.getAttribute("font-size");
  if (attr) {
    return parseFloat(attr);
  } else {
    if (!ORYX.Editor.checkClassType(node, SVGSVGElement)) {
      return this.getInheritedFontSize(node.parentNode);
    }
  }
}, getFontSize:function(node) {
  var tspans = this.node.getElementsByTagNameNS(ORCHESTRATOR.CONST.NAMESPACE_SVG, "tspan");
  var fontSize = this.getInheritedFontSize(this.node);
  if (!fontSize) {
    if (tspans[0] && (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent) && new Number(RegExp.$1) >= 3)) {
      fontSize = tspans[0].getExtentOfChar(0).height;
    } else {
      fontSize = ORCHESTRATOR.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
    }
    if (fontSize <= 0) {
      fontSize = ORCHESTRATOR.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
    }
  }
  if (fontSize) {
    this.node.setAttribute("oryx:fontSize", fontSize);
  }
  return fontSize;
}, getTrimmedTextLength:function(text) {
  text = text.strip().gsub("  ", " ");
  var oldLength;
  do {
    oldLength = text.length;
    text = text.gsub("  ", " ");
  } while (oldLength > text.length);
  return text.length;
}, getOffsetBottom:function() {
  return this.offsetBottom;
}, getOffsetTop:function() {
  return this.offsetTop;
}, deserialize:function(obj, shape) {
  if (obj && ("undefined" != typeof obj.x && "undefined" != typeof obj.y)) {
    this.setPosition({x:obj.x, y:obj.y});
    if ("undefined" != typeof obj.distance) {
      var from = shape.dockers[obj.from];
      var to = shape.dockers[obj.to];
      if (from && to) {
        this.setReferencePoint({dirty:true, distance:obj.distance, intersection:{x:obj.x, y:obj.y}, orientation:obj.orientation, segment:{from:from, fromIndex:obj.from, fromPosition:from.bounds.center(), to:to, toIndex:obj.to, toPosition:to.bounds.center()}});
      }
    }
    if (obj.left) {
      this.anchorLeft = true;
    }
    if (obj.right) {
      this.anchorRight = true;
    }
    if (obj.top) {
      this.anchorTop = true;
    }
    if (obj.bottom) {
      this.anchorBottom = true;
    }
    if (obj.valign) {
      this.verticalAlign(obj.valign);
    }
    if (obj.align) {
      this.horizontalAlign(obj.align);
    }
  } else {
    if (obj && "undefined" != typeof obj.edge) {
      this.setEdgePosition(obj.edge);
    }
  }
}, serialize:function() {
  if (this.getEdgePosition()) {
    if (this.getOriginEdgePosition() !== this.getEdgePosition()) {
      return{edge:this.getEdgePosition()};
    } else {
      return null;
    }
  }
  if (this.position) {
    var pos = {x:this.position.x, y:this.position.y};
    if (this.isAnchorLeft() && this.isAnchorLeft() !== this.isOriginAnchorLeft()) {
      pos.left = true;
    }
    if (this.isAnchorRight() && this.isAnchorRight() !== this.isOriginAnchorRight()) {
      pos.right = true;
    }
    if (this.isAnchorTop() && this.isAnchorTop() !== this.isOriginAnchorTop()) {
      pos.top = true;
    }
    if (this.isAnchorBottom() && this.isAnchorBottom() !== this.isOriginAnchorBottom()) {
      pos.bottom = true;
    }
    if (this.getOriginVerticalAlign() !== this.verticalAlign()) {
      pos.valign = this.verticalAlign();
    }
    if (this.getOriginHorizontalAlign() !== this.horizontalAlign()) {
      pos.align = this.horizontalAlign();
    }
    return pos;
  }
  if (this.getReferencePoint()) {
    var ref = this.getReferencePoint();
    return{distance:ref.distance, x:ref.intersection.x, y:ref.intersection.y, from:ref.segment.fromIndex, to:ref.segment.toIndex, orientation:ref.orientation, valign:this.verticalAlign(), align:this.horizontalAlign()};
  }
  return null;
}, toString:function() {
  return "Label " + this.id;
}};
ORYX.Core.SVG.Label = Clazz.extend(ORYX.Core.SVG.Label);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Math) {
  ORYX.Core.Math = {};
}
ORYX.Core.Math.midPoint = function(point1, point2) {
  return{x:(point1.x + point2.x) / 2, y:(point1.y + point2.y) / 2};
};
ORYX.Core.Math.isPointInLine = function(pointX, pointY, lPoint1X, lPoint1Y, lPoint2X, lPoint2Y, offset) {
  offset = offset ? Math.abs(offset) : 1;
  if (Math.abs(lPoint1X - lPoint2X) <= offset && (Math.abs(pointX - lPoint1X) <= offset && (pointY - Math.max(lPoint1Y, lPoint2Y) <= offset && Math.min(lPoint1Y, lPoint2Y) - pointY <= offset))) {
    return true;
  }
  if (Math.abs(lPoint1Y - lPoint2Y) <= offset && (Math.abs(pointY - lPoint1Y) <= offset && (pointX - Math.max(lPoint1X, lPoint2X) <= offset && Math.min(lPoint1X, lPoint2X) - pointX <= offset))) {
    return true;
  }
  if (pointX > Math.max(lPoint1X, lPoint2X) || pointX < Math.min(lPoint1X, lPoint2X)) {
    return false;
  }
  if (pointY > Math.max(lPoint1Y, lPoint2Y) || pointY < Math.min(lPoint1Y, lPoint2Y)) {
    return false;
  }
  var s = (lPoint1Y - lPoint2Y) / (lPoint1X - lPoint2X);
  return Math.abs(pointY - (s * pointX + lPoint1Y - s * lPoint1X)) < offset;
};
ORYX.Core.Math.isPointInEllipse = function(pointX, pointY, cx, cy, rx, ry) {
  if (cx === undefined || (cy === undefined || (rx === undefined || ry === undefined))) {
    throw "ORYX.Core.Math.isPointInEllipse needs a ellipse with these properties: x, y, radiusX, radiusY";
  }
  var tx = (pointX - cx) / rx;
  var ty = (pointY - cy) / ry;
  return tx * tx + ty * ty < 1;
};
ORYX.Core.Math.isPointInPolygone = function(pointX, pointY, polygone) {
  if (arguments.length < 3) {
    throw "ORYX.Core.Math.isPointInPolygone needs two arguments";
  }
  var lastIndex = polygone.length - 1;
  if (polygone[0] !== polygone[lastIndex - 1] || polygone[1] !== polygone[lastIndex]) {
    polygone.push(polygone[0]);
    polygone.push(polygone[1]);
  }
  var crossings = 0;
  var x1, y1, x2, y2, d;
  for (var i = 0;i < polygone.length - 3;) {
    x1 = polygone[i];
    y1 = polygone[++i];
    x2 = polygone[++i];
    y2 = polygone[i + 1];
    d = (pointY - y1) * (x2 - x1) - (pointX - x1) * (y2 - y1);
    if (y1 >= pointY != y2 >= pointY) {
      crossings += y2 - y1 >= 0 ? d >= 0 : d <= 0;
    }
    if (!d && (Math.min(x1, x2) <= pointX && (pointX <= Math.max(x1, x2) && (Math.min(y1, y2) <= pointY && pointY <= Math.max(y1, y2))))) {
      return true;
    }
  }
  return crossings % 2 ? true : false;
};
ORYX.Core.Math.distancePointLinie = function(lineP1, lineP2, point, toSegmentOnly) {
  var intersectionPoint = ORYX.Core.Math.getPointOfIntersectionPointLine(lineP1, lineP2, point, toSegmentOnly);
  if (!intersectionPoint) {
    return null;
  }
  return ORYX.Core.Math.getDistancePointToPoint(point, intersectionPoint);
};
ORYX.Core.Math.getDistancePointToPoint = function(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};
ORYX.Core.Math.getDistanceBetweenTwoPoints = function(between1, between2, point) {
  return ORYX.Core.Math.getDistancePointToPoint(point, between1) / ORYX.Core.Math.getDistancePointToPoint(between1, between2);
};
ORYX.Core.Math.pointIsLeftOfLine = function(lineP1, lineP2, point) {
  var vec1 = ORYX.Core.Math.getVector(lineP1, lineP2);
  var vec2 = ORYX.Core.Math.getVector(lineP1, point);
  return vec1.x * vec2.y - vec2.x * vec1.y > 0;
};
ORYX.Core.Math.getPointBetweenTwoPoints = function(point1, point2, relative) {
  relative = Math.max(Math.min(relative || 0, 1), 0);
  if (relative === 0) {
    return point1;
  } else {
    if (relative === 1) {
      return point2;
    }
  }
  return{x:point1.x + (point2.x - point1.x) * relative, y:point1.y + (point2.y - point1.y) * relative};
};
ORYX.Core.Math.getVector = function(point1, point2) {
  return{x:point2.x - point1.x, y:point2.y - point1.y};
};
ORYX.Core.Math.getIdentityVector = function(vector) {
  if (arguments.length == 2) {
    vector = ORYX.Core.Math.getVector(arguments[0], arguments[1]);
  }
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return{x:vector.x / (length || 1), y:vector.y / (length || 1)};
};
ORYX.Core.Math.getOrthogonalIdentityVector = function(point1, point2) {
  var vec = arguments.length == 1 ? point1 : ORYX.Core.Math.getIdentityVector(point1, point2);
  return{x:vec.y, y:-vec.x};
};
ORYX.Core.Math.getPointOfIntersectionPointLine = function(lineP1, lineP2, point, onSegmentOnly) {
  var denominator = Math.pow(lineP2.x - lineP1.x, 2) + Math.pow(lineP2.y - lineP1.y, 2);
  if (denominator == 0) {
    return undefined;
  }
  var u = ((point.x - lineP1.x) * (lineP2.x - lineP1.x) + (point.y - lineP1.y) * (lineP2.y - lineP1.y)) / denominator;
  if (onSegmentOnly) {
    if (!(0 <= u && u <= 1)) {
      return undefined;
    }
  }
  pointOfIntersection = new Object;
  pointOfIntersection.x = lineP1.x + u * (lineP2.x - lineP1.x);
  pointOfIntersection.y = lineP1.y + u * (lineP2.y - lineP1.y);
  return pointOfIntersection;
};
ORYX.Core.Math.getTranslatedPoint = function(point, matrix) {
  var x = matrix.a * point.x + matrix.c * point.y + matrix.e * 1;
  var y = matrix.b * point.x + matrix.d * point.y + matrix.f * 1;
  return{x:x, y:y};
};
ORYX.Core.Math.getInverseMatrix = function(matrix) {
  var det = ORYX.Core.Math.getDeterminant(matrix), m = matrix;
  return{a:det * (m.d * 1 - m.f * 0), b:det * (m.f * 0 - m.b * 1), c:det * (m.e * 0 - m.c * 1), d:det * (m.a * 1 - m.e * 0), e:det * (m.c * m.f - m.e * m.d), f:det * (m.e * m.b - m.a * m.f)};
};
ORYX.Core.Math.getDeterminant = function(m) {
  return m.a * m.d * 1 + m.c * m.f * 0 + m.e * m.b * 0 - m.e * m.d * 0 - m.c * m.b * 1 - m.a * m.f * 0;
};
ORYX.Core.Math.getTranslatedBoundingBox = function(node) {
  var matrix = node.getCTM();
  var bb = node.getBBox();
  var ul = ORYX.Core.Math.getTranslatedPoint({x:bb.x, y:bb.y}, matrix);
  var ll = ORYX.Core.Math.getTranslatedPoint({x:bb.x, y:bb.y + bb.height}, matrix);
  var ur = ORYX.Core.Math.getTranslatedPoint({x:bb.x + bb.width, y:bb.y}, matrix);
  var lr = ORYX.Core.Math.getTranslatedPoint({x:bb.x + bb.width, y:bb.y + bb.height}, matrix);
  var minPoint = {x:Math.min(ul.x, ll.x, ur.x, lr.x), y:Math.min(ul.y, ll.y, ur.y, lr.y)};
  var maxPoint = {x:Math.max(ul.x, ll.x, ur.x, lr.x), y:Math.max(ul.y, ll.y, ur.y, lr.y)};
  return{x:minPoint.x, y:minPoint.y, width:maxPoint.x - minPoint.x, height:maxPoint.y - minPoint.y};
};
ORYX.Core.Math.getAngle = function(p1, p2) {
  if (p1.x == p2.x && p1.y == p2.y) {
    return 0;
  }
  var angle = Math.asin(Math.sqrt(Math.pow(p1.y - p2.y, 2)) / Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p1.y - p2.y, 2))) * 180 / Math.PI;
  if (p2.x >= p1.x && p2.y <= p1.y) {
    return angle;
  } else {
    if (p2.x < p1.x && p2.y <= p1.y) {
      return 180 - angle;
    } else {
      if (p2.x < p1.x && p2.y > p1.y) {
        return 180 + angle;
      } else {
        return 360 - angle;
      }
    }
  }
};
var RIGHT = 2, TOP = 8, BOTTOM = 4, LEFT = 1;
function computeOutCode(x, y, xmin, ymin, xmax, ymax) {
  var code = 0;
  if (y > ymax) {
    code |= TOP;
  } else {
    if (y < ymin) {
      code |= BOTTOM;
    }
  }
  if (x > xmax) {
    code |= RIGHT;
  } else {
    if (x < xmin) {
      code |= LEFT;
    }
  }
  return code;
}
ORYX.Core.Math.isRectOverLine = function(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  return!!ORYX.Core.Math.clipLineOnRect.apply(ORYX.Core.Math, arguments);
};
ORYX.Core.Math.clipLineOnRect = function(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  var outcode0, outcode1, outcodeOut, hhh = 0;
  var accept = false, done = false;
  outcode0 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
  outcode1 = computeOutCode(x2, y2, xmin, ymin, xmax, ymax);
  do {
    if ((outcode0 | outcode1) == 0) {
      accept = true;
      done = true;
    } else {
      if ((outcode0 & outcode1) > 0) {
        done = true;
      } else {
        var x = 0, y = 0;
        outcodeOut = outcode0 != 0 ? outcode0 : outcode1;
        if ((outcodeOut & TOP) > 0) {
          x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
          y = ymax;
        } else {
          if ((outcodeOut & BOTTOM) > 0) {
            x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
            y = ymin;
          } else {
            if ((outcodeOut & RIGHT) > 0) {
              y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
              x = xmax;
            } else {
              if ((outcodeOut & LEFT) > 0) {
                y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                x = xmin;
              }
            }
          }
        }
        if (outcodeOut == outcode0) {
          x1 = x;
          y1 = y;
          outcode0 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
        } else {
          x2 = x;
          y2 = y;
          outcode1 = computeOutCode(x2, y2, xmin, ymin, xmax, ymax);
        }
      }
    }
    hhh++;
  } while (done != true && hhh < 5E3);
  if (accept) {
    return{a:{x:x1, y:y1}, b:{x:x2, y:y2}};
  }
  return null;
};
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.Stencil = {construct:function(jsonStencil, namespace, source, stencilSet, propertyPackages, defaultPosition) {
  arguments.callee.$.construct.apply(this, arguments);
  if (!jsonStencil) {
    throw "Stencilset seems corrupt.";
  }
  if (!namespace) {
    throw "Stencil does not provide namespace.";
  }
  if (!stencilSet) {
    throw "Fatal internal error loading stencilset.";
  }
  this._jsonStencil = jsonStencil;
  this._stencilSet = stencilSet;
  this._namespace = namespace;
  this._propertyPackages = propertyPackages;
  if (defaultPosition && !this._jsonStencil.position) {
    this._jsonStencil.position = defaultPosition;
  }
  this._properties = new ORYX.Hash;
  if (!this._jsonStencil.type || !(this._jsonStencil.type === "edge" || this._jsonStencil.type === "node")) {
    throw "ORYX.Core.StencilSet.Stencil(construct): Type is not defined.";
  }
  if (!this._jsonStencil.id || this._jsonStencil.id === "") {
    throw "ORYX.Core.StencilSet.Stencil(construct): Id is not defined.";
  }
  if (!this._jsonStencil.title || this._jsonStencil.title === "") {
    throw "ORYX.Core.StencilSet.Stencil(construct): Title is not defined.";
  }
  if (!this._jsonStencil.description) {
    this._jsonStencil.description = "";
  }
  if (!this._jsonStencil.groups) {
    this._jsonStencil.groups = [];
  }
  if (!this._jsonStencil.roles) {
    this._jsonStencil.roles = [];
  }
  this._jsonStencil.roles.push(this._jsonStencil.id);
  this._jsonStencil.roles.each(function(role, index) {
    this._jsonStencil.roles[index] = namespace + role;
  }.bind(this));
  this._jsonStencil.roles = this._jsonStencil.roles.uniq();
  this.postProcessProperties();
  if (!this._jsonStencil.serialize) {
    this._jsonStencil.serialize = {};
  }
  if (!this._jsonStencil.deserialize) {
    this._jsonStencil.deserialize = {};
  }
  if (!this._jsonStencil.layout) {
    this._jsonStencil.layout = [];
  }
}, postProcessProperties:function() {
  if (this._jsonStencil.icon && this._jsonStencil.icon.indexOf("://") === -1) {
    this._jsonStencil.icon = "";
  }
  if (this._jsonStencil.propertyPackages && this._jsonStencil.propertyPackages instanceof Array) {
    this._jsonStencil.propertyPackages.each(function(ppId) {
      var pp = this._propertyPackages.get(ppId);
      if (pp) {
        pp.each(function(prop) {
          var oProp = new ORYX.Core.StencilSet.Property(prop, this._namespace, this);
          this._properties.set(oProp.id(), oProp);
        }.bind(this));
      }
    }.bind(this));
  }
  if (this._jsonStencil.properties && this._jsonStencil.properties instanceof Array) {
    this._jsonStencil.properties.each(function(prop) {
      var oProp = new ORYX.Core.StencilSet.Property(prop, this._namespace, this);
      this._properties.set(oProp.id(), oProp);
    }.bind(this));
  }
}, equals:function(stencil) {
  return this.id() === stencil.id();
}, stencilSet:function() {
  return this._stencilSet;
}, type:function() {
  return this._jsonStencil.type;
}, namespace:function() {
  return this._namespace;
}, id:function() {
  return this._jsonStencil.id;
}, idWithoutNs:function() {
  return this.id().replace(this.namespace(), "");
}, title:function() {
  return this._jsonStencil.title;
}, description:function() {
  return this._jsonStencil.description;
}, groups:function() {
  return this._jsonStencil.groups;
}, position:function() {
  return isNaN(this._jsonStencil.position) ? 0 : this._jsonStencil.position;
}, view:function() {
  return this._view.cloneNode(true) || this._view;
}, icon:function() {
  return this._jsonStencil.icon;
}, fixedAspectRatio:function() {
  return this._jsonStencil.fixedAspectRatio === true;
}, properties:function() {
  return this._properties.values();
}, property:function(id) {
  return this._properties.get(id);
}, roles:function() {
  return this._jsonStencil.roles;
}, defaultAlign:function() {
  if (!this._jsonStencil.defaultAlign) {
    return "east";
  }
  return this._jsonStencil.defaultAlign;
}, serialize:function(shape, data) {
  return this._jsonStencil.serialize;
}, deserialize:function(shape, data) {
  return this._jsonStencil.deserialize;
}, layout:function(shape) {
  return this._jsonStencil.layout;
}, addProperty:function(property, namespace) {
  if (property && namespace) {
    var oProp = new ORYX.Core.StencilSet.Property(property, namespace, this);
    this._properties.set(oProp.id(), oProp);
  }
}, removeProperty:function(propertyId) {
  if (propertyId) {
    var oProp = this._properties.values().find(function(prop) {
      return propertyId == prop.id();
    });
    if (oProp) {
      this._properties.unset(oProp.id());
    }
  }
}, toString:function() {
  return "Stencil " + this.title() + " (" + this.id() + ")";
}};
ORYX.Core.StencilSet.Stencil = Clazz.extend(ORYX.Core.StencilSet.Stencil);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.Property = {construct:function(jsonProp, namespace, stencil) {
  arguments.callee.$.construct.apply(this, arguments);
  this._jsonProp = jsonProp || ORYX.Log.error("Parameter jsonProp is not defined.");
  this._namespace = namespace || ORYX.Log.error("Parameter namespace is not defined.");
  this._stencil = stencil || ORYX.Log.error("Parameter stencil is not defined.");
  this._items = {};
  this._complexItems = {};
  jsonProp.id = jsonProp.id || ORYX.Log.error("ORYX.Core.StencilSet.Property(construct): Id is not defined.");
  jsonProp.id = jsonProp.id.toLowerCase();
  if (!jsonProp.type) {
    ORYX.Log.info("Type is not defined for stencil '%0', id '%1'. Falling back to 'String'.", stencil, jsonProp.id);
    jsonProp.type = "string";
  } else {
    jsonProp.type = jsonProp.type.toLowerCase();
  }
  jsonProp.title = jsonProp.title || "";
  jsonProp.value = jsonProp.value || "";
  jsonProp.description = jsonProp.description || "";
  jsonProp.readonly = jsonProp.readonly || false;
  jsonProp.optional = jsonProp.optional !== false;
  if (this._jsonProp.refToView) {
    if (!(this._jsonProp.refToView instanceof Array)) {
      this._jsonProp.refToView = [this._jsonProp.refToView];
    }
  } else {
    this._jsonProp.refToView = [];
  }
  var globalMin = this.getMinForType(jsonProp.type);
  if (jsonProp.min === undefined || jsonProp.min === null) {
    jsonProp.min = globalMin;
  } else {
    if (jsonProp.min < globalMin) {
      jsonProp.min = globalMin;
    }
  }
  var globalMax = this.getMaxForType(jsonProp.type);
  if (jsonProp.max === undefined || jsonProp.max === null) {
    jsonProp.max = globalMax;
  } else {
    if (jsonProp.max > globalMax) {
      jsonProp.min = globalMax;
    }
  }
  if (!jsonProp.fillOpacity) {
    jsonProp.fillOpacity = false;
  }
  if ("number" != typeof jsonProp.lightness) {
    jsonProp.lightness = 1;
  } else {
    jsonProp.lightness = Math.max(0, Math.min(1, jsonProp.lightness));
  }
  if (!jsonProp.strokeOpacity) {
    jsonProp.strokeOpacity = false;
  }
  if (jsonProp.length === undefined || jsonProp.length === null) {
    jsonProp.length = Number.MAX_VALUE;
  }
  if (!jsonProp.wrapLines) {
    jsonProp.wrapLines = false;
  }
  if (!jsonProp.dateFormat) {
    jsonProp.dateFormat = ORCHESTRATOR.CONFIG.DATE_FORMAT || "m/d/y";
  }
  if (!jsonProp.fill) {
    jsonProp.fill = false;
  }
  if (!jsonProp.stroke) {
    jsonProp.stroke = false;
  }
  if (!jsonProp.inverseBoolean) {
    jsonProp.inverseBoolean = false;
  }
  if (!jsonProp.directlyEditable && jsonProp.directlyEditable != false) {
    jsonProp.directlyEditable = true;
  }
  if (jsonProp.visible !== false) {
    jsonProp.visible = true;
  }
  if (jsonProp.isList !== true) {
    jsonProp.isList = false;
    if (!jsonProp.list || !(jsonProp.list instanceof Array)) {
      jsonProp.list = [];
    }
  }
  if (!jsonProp.category) {
    if (jsonProp.popular) {
      jsonProp.category = "popular";
    } else {
      jsonProp.category = "others";
    }
  }
  if (!jsonProp.alwaysAppearInMultiselect) {
    jsonProp.alwaysAppearInMultiselect = false;
  }
  if (jsonProp.type === ORCHESTRATOR.TYPES.CHOICE) {
    if (jsonProp.items && jsonProp.items instanceof Array) {
      jsonProp.items.each(function(jsonItem) {
        this._items[jsonItem.value.toLowerCase()] = new ORYX.Core.StencilSet.PropertyItem(jsonItem, namespace, this);
      }.bind(this));
    } else {
      throw "ORYX.Core.StencilSet.Property(construct): No property items defined.";
    }
  } else {
    if (jsonProp.type === ORCHESTRATOR.TYPES.COMPLEX || jsonProp.type == ORCHESTRATOR.TYPES.MULTIPLECOMPLEX) {
      if (jsonProp.complexItems && jsonProp.complexItems instanceof Array) {
        jsonProp.complexItems.each(function(jsonComplexItem) {
          this._complexItems[jsonComplexItem.id.toLowerCase()] = new ORYX.Core.StencilSet.ComplexPropertyItem(jsonComplexItem, namespace, this);
        }.bind(this));
      } else {
        throw "ORYX.Core.StencilSet.Property(construct): No complex property items defined.";
      }
    }
  }
}, getMinForType:function(type) {
  if (type.toLowerCase() == ORCHESTRATOR.TYPES.INTEGER) {
    return-Math.pow(2, 31);
  } else {
    return-Number.MAX_VALUE + 1;
  }
}, getMaxForType:function(type) {
  if (type.toLowerCase() == ORCHESTRATOR.TYPES.INTEGER) {
    return Math.pow(2, 31) - 1;
  } else {
    return Number.MAX_VALUE;
  }
}, equals:function(property) {
  return this._namespace === property.namespace() && this.id() === property.id() ? true : false;
}, namespace:function() {
  return this._namespace;
}, stencil:function() {
  return this._stencil;
}, id:function() {
  return this._jsonProp.id;
}, type:function() {
  return this._jsonProp.type;
}, inverseBoolean:function() {
  return this._jsonProp.inverseBoolean;
}, category:function() {
  return this._jsonProp.category;
}, setCategory:function(value) {
  this._jsonProp.category = value;
}, directlyEditable:function() {
  return this._jsonProp.directlyEditable;
}, visible:function() {
  return this._jsonProp.visible;
}, title:function() {
  return this._jsonProp.title;
}, value:function() {
  return this._jsonProp.value;
}, readonly:function() {
  return this._jsonProp.readonly;
}, optional:function() {
  return this._jsonProp.optional;
}, description:function() {
  return this._jsonProp.description;
}, refToView:function() {
  return this._jsonProp.refToView;
}, min:function() {
  return this._jsonProp.min;
}, max:function() {
  return this._jsonProp.max;
}, fillOpacity:function() {
  return this._jsonProp.fillOpacity;
}, strokeOpacity:function() {
  return this._jsonProp.strokeOpacity;
}, length:function() {
  return this._jsonProp.length ? this._jsonProp.length : Number.MAX_VALUE;
}, wrapLines:function() {
  return this._jsonProp.wrapLines;
}, dateFormat:function() {
  return this._jsonProp.dateFormat;
}, fill:function() {
  return this._jsonProp.fill;
}, lightness:function() {
  return this._jsonProp.lightness;
}, stroke:function() {
  return this._jsonProp.stroke;
}, items:function() {
  return $H(this._items).values();
}, item:function(value) {
  if (value) {
    return this._items[value.toLowerCase()];
  } else {
    return null;
  }
}, toString:function() {
  return "Property " + this.title() + " (" + this.id() + ")";
}, complexItems:function() {
  return $H(this._complexItems).values();
}, complexItem:function(id) {
  if (id) {
    return this._complexItems[id.toLowerCase()];
  } else {
    return null;
  }
}, complexAttributeToView:function() {
  return this._jsonProp.complexAttributeToView || "";
}, isList:function() {
  return!!this._jsonProp.isList;
}, getListItems:function() {
  return this._jsonProp.list;
}, linkableType:function() {
  return this._jsonProp.linkableType || "";
}, alwaysAppearInMultiselect:function() {
  return this._jsonProp.alwaysAppearInMultiselect;
}, popular:function() {
  return this._jsonProp.popular || false;
}, setPopular:function() {
  this._jsonProp.popular = true;
}};
ORYX.Core.StencilSet.Property = Clazz.extend(ORYX.Core.StencilSet.Property);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.PropertyItem = {construct:function(jsonItem, namespace, property) {
  arguments.callee.$.construct.apply(this, arguments);
  if (!jsonItem) {
    throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter jsonItem is not defined.";
  }
  if (!namespace) {
    throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter namespace is not defined.";
  }
  if (!property) {
    throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter property is not defined.";
  }
  this._jsonItem = jsonItem;
  this._namespace = namespace;
  this._property = property;
  if (!jsonItem.value) {
    throw "ORYX.Core.StencilSet.PropertyItem(construct): Value is not defined.";
  }
  if (this._jsonItem.refToView) {
    if (!(this._jsonItem.refToView instanceof Array)) {
      this._jsonItem.refToView = [this._jsonItem.refToView];
    }
  } else {
    this._jsonItem.refToView = [];
  }
}, equals:function(item) {
  return this.property().equals(item.property()) && this.value() === item.value();
}, namespace:function() {
  return this._namespace;
}, property:function() {
  return this._property;
}, value:function() {
  return this._jsonItem.value;
}, title:function() {
  return this._jsonItem.title;
}, refToView:function() {
  return this._jsonItem.refToView;
}, icon:function() {
  return this._jsonItem.icon ? this.property().stencil()._source + "icons/" + this._jsonItem.icon : "";
}, toString:function() {
  return "PropertyItem " + this.property() + " (" + this.value() + ")";
}};
ORYX.Core.StencilSet.PropertyItem = Clazz.extend(ORYX.Core.StencilSet.PropertyItem);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.ComplexPropertyItem = {construct:function(jsonItem, namespace, property) {
  arguments.callee.$.construct.apply(this, arguments);
  if (!jsonItem) {
    throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter jsonItem is not defined.";
  }
  if (!namespace) {
    throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter namespace is not defined.";
  }
  if (!property) {
    throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter property is not defined.";
  }
  this._jsonItem = jsonItem;
  this._namespace = namespace;
  this._property = property;
  this._items = new ORYX.Hash;
  this._complexItems = new ORYX.Hash;
  if (!jsonItem.name) {
    throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Name is not defined.";
  }
  if (!jsonItem.type) {
    throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Type is not defined.";
  } else {
    jsonItem.type = jsonItem.type.toLowerCase();
  }
  if (jsonItem.type === ORCHESTRATOR.TYPES.CHOICE) {
    if (jsonItem.items && jsonItem.items instanceof Array) {
      jsonItem.items.each(function(item) {
        this._items.set(item.value, new ORYX.Core.StencilSet.PropertyItem(item, namespace, this));
      }.bind(this));
    } else {
      throw "ORYX.Core.StencilSet.Property(construct): No property items defined.";
    }
  } else {
    if (jsonItem.type === ORCHESTRATOR.TYPES.COMPLEX) {
      if (jsonItem.complexItems && jsonItem.complexItems instanceof Array) {
        jsonItem.complexItems.each(function(complexItem) {
          this._complexItems.set(complexItem.id, new ORYX.Core.StencilSet.ComplexPropertyItem(complexItem, namespace, this));
        }.bind(this));
      } else {
        throw "ORYX.Core.StencilSet.Property(construct): No property items defined.";
      }
    }
  }
}, equals:function(item) {
  return this.property().equals(item.property()) && this.name() === item.name();
}, namespace:function() {
  return this._namespace;
}, property:function() {
  return this._property;
}, name:function() {
  return this._jsonItem.name;
}, id:function() {
  return this._jsonItem.id;
}, type:function() {
  return this._jsonItem.type;
}, optional:function() {
  return this._jsonItem.optional;
}, width:function() {
  return this._jsonItem.width;
}, value:function() {
  return this._jsonItem.value;
}, items:function() {
  return this._items.values();
}, complexItems:function() {
  return this._complexItems.values();
}, disable:function() {
  return this._jsonItem.disable;
}};
ORYX.Core.StencilSet.ComplexPropertyItem = Clazz.extend(ORYX.Core.StencilSet.ComplexPropertyItem);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.Rules = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this._stencilSets = [];
  this._stencils = [];
  this._containerStencils = [];
  this._cachedConnectSET = new ORYX.Hash;
  this._cachedConnectSE = new ORYX.Hash;
  this._cachedConnectTE = new ORYX.Hash;
  this._cachedCardSE = new ORYX.Hash;
  this._cachedCardTE = new ORYX.Hash;
  this._cachedContainPC = new ORYX.Hash;
  this._cachedMorphRS = new ORYX.Hash;
  this._connectionRules = new ORYX.Hash;
  this._cardinalityRules = new ORYX.Hash;
  this._containmentRules = new ORYX.Hash;
  this._morphingRules = new ORYX.Hash;
  this._layoutRules = new ORYX.Hash;
}, initializeRules:function(stencilSet) {
  var existingSS = this._stencilSets.find(function(ss) {
    return ss.namespace() == stencilSet.namespace();
  });
  if (existingSS) {
    var stencilsets = this._stencilSets.clone();
    stencilsets = stencilsets.without(existingSS);
    stencilsets.push(stencilSet);
    this._stencilSets = [];
    this._stencils = [];
    this._containerStencils = [];
    this._cachedConnectSET = new ORYX.Hash;
    this._cachedConnectSE = new ORYX.Hash;
    this._cachedConnectTE = new ORYX.Hash;
    this._cachedCardSE = new ORYX.Hash;
    this._cachedCardTE = new ORYX.Hash;
    this._cachedContainPC = new ORYX.Hash;
    this._cachedMorphRS = new ORYX.Hash;
    this._connectionRules = new ORYX.Hash;
    this._cardinalityRules = new ORYX.Hash;
    this._containmentRules = new ORYX.Hash;
    this._morphingRules = new ORYX.Hash;
    this._layoutRules = new ORYX.Hash;
    stencilsets.each(function(ss) {
      this.initializeRules(ss);
    }.bind(this));
    return;
  } else {
    this._stencilSets.push(stencilSet);
    var jsonRules = new ORYX.Hash(stencilSet.jsonRules());
    var namespace = stencilSet.namespace();
    var stencils = stencilSet.stencils();
    stencilSet.extensions().values().each(function(extension) {
      if (extension.rules) {
        if (extension.rules.connectionRules) {
          jsonRules.set("connectionRules", jsonRules.get("connectionRules").concat(extension.rules.connectionRules));
        }
        if (extension.rules.cardinalityRules) {
          jsonRules.set("cardinalityRules", jsonRules.get("cardinalityRules").concat(extension.rules.cardinalityRules));
        }
        if (extension.rules.containmentRules) {
          jsonRules.set("containmentRules", jsonRules.get("containmentRules").concat(extension.rules.containmentRules));
        }
        if (extension.rules.morphingRules) {
          jsonRules.set("morphingRules", jsonRules.get("morphingRules").concat(extension.rules.morphingRules));
        }
      }
      if (extension.stencils) {
        stencils = stencils.concat(extension.stencils);
      }
    });
    this._stencils = this._stencils.concat(stencilSet.stencils());
    var cr = this._connectionRules;
    if (jsonRules.get("connectionRules")) {
      jsonRules.get("connectionRules").each(function(rules) {
        if (this._isRoleOfOtherNamespace(rules.role)) {
          if (!cr.get(rules.role)) {
            cr.set(rules.role, new ORYX.Hash);
          }
        } else {
          if (!cr.get(namespace + rules.role)) {
            cr.set(namespace + rules.role, new ORYX.Hash);
          }
        }
        rules.connects.each(function(connect) {
          var toRoles = [];
          if (connect.to) {
            if (!(connect.to instanceof Array)) {
              connect.to = [connect.to];
            }
            connect.to.each(function(to) {
              if (this._isRoleOfOtherNamespace(to)) {
                toRoles.push(to);
              } else {
                toRoles.push(namespace + to);
              }
            }.bind(this));
          }
          var role, from;
          if (this._isRoleOfOtherNamespace(rules.role)) {
            role = rules.role;
          } else {
            role = namespace + rules.role;
          }
          if (this._isRoleOfOtherNamespace(connect.from)) {
            from = connect.from;
          } else {
            from = namespace + connect.from;
          }
          if (!cr.get(role).get(from)) {
            cr.get(role).set(from, toRoles);
          } else {
            cr.get(role).set(from, cr.get(role)[from].concat(toRoles));
          }
        }.bind(this));
      }.bind(this));
    }
    var cardr = this._cardinalityRules;
    if (jsonRules.get("cardinalityRules")) {
      jsonRules.get("cardinalityRules").each(function(rules) {
        var cardrKey;
        if (this._isRoleOfOtherNamespace(rules.role)) {
          cardrKey = rules.role;
        } else {
          cardrKey = namespace + rules.role;
        }
        if (!cardr.get(cardrKey)) {
          cardr.set(cardrKey, {});
          for (i in rules) {
            cardr.get(cardrKey)[i] = rules[i];
          }
        }
        var oe = new ORYX.Hash;
        if (rules.outgoingEdges) {
          rules.outgoingEdges.each(function(rule) {
            if (this._isRoleOfOtherNamespace(rule.role)) {
              oe.set(rule.role, rule);
            } else {
              oe.set(namespace + rule.role, rule);
            }
          }.bind(this));
        }
        cardr.get(cardrKey).outgoingEdges = oe;
        var ie = new ORYX.Hash;
        if (rules.incomingEdges) {
          rules.incomingEdges.each(function(rule) {
            if (this._isRoleOfOtherNamespace(rule.role)) {
              ie.set(rule.role, rule);
            } else {
              ie.set(namespace + rule.role, rule);
            }
          }.bind(this));
        }
        cardr.get(cardrKey).incomingEdges = ie;
      }.bind(this));
    }
    var conr = this._containmentRules;
    if (jsonRules.get("containmentRules")) {
      jsonRules.get("containmentRules").each(function(rules) {
        var conrKey;
        if (this._isRoleOfOtherNamespace(rules.role)) {
          conrKey = rules.role;
        } else {
          this._containerStencils.push(namespace + rules.role);
          conrKey = namespace + rules.role;
        }
        if (!conr.get(conrKey)) {
          conr.set(conrKey, []);
        }
        (rules.contains || []).each(function(containRole) {
          if (this._isRoleOfOtherNamespace(containRole)) {
            conr.get(conrKey).push(containRole);
          } else {
            conr.get(conrKey).push(namespace + containRole);
          }
        }.bind(this));
      }.bind(this));
    }
    var morphr = this._morphingRules;
    if (jsonRules.get("morphingRules")) {
      jsonRules.get("morphingRules").each(function(rules) {
        var morphrKey;
        if (this._isRoleOfOtherNamespace(rules.role)) {
          morphrKey = rules.role;
        } else {
          morphrKey = namespace + rules.role;
        }
        if (!morphr.get(morphrKey)) {
          morphr.set(morphrKey, []);
        }
        if (!rules.preserveBounds) {
          rules.preserveBounds = false;
        }
        rules.baseMorphs.each(function(baseMorphStencilId) {
          var morphStencil = this._getStencilById(namespace + baseMorphStencilId);
          if (morphStencil) {
            morphr.get(morphrKey).push(morphStencil);
          }
        }.bind(this));
      }.bind(this));
    }
    var layoutRules = this._layoutRules;
    if (jsonRules.get("layoutRules")) {
      var getDirections = function(o) {
        return{"edgeRole":o.edgeRole || undefined, "t":o["t"] || 1, "r":o["r"] || 1, "b":o["b"] || 1, "l":o["l"] || 1};
      };
      jsonRules.get("layoutRules").each(function(rules) {
        var layoutKey;
        if (this._isRoleOfOtherNamespace(rules.role)) {
          layoutKey = rules.role;
        } else {
          layoutKey = namespace + rules.role;
        }
        if (!layoutRules.get(layoutKey)) {
          layoutRules.set(layoutKey, {});
        }
        if (rules["in"]) {
          layoutRules.get(layoutKey)["in"] = getDirections(rules["in"]);
        }
        if (rules["ins"]) {
          layoutRules.get(layoutKey)["ins"] = (rules["ins"] || []).map(function(e) {
            return getDirections(e);
          });
        }
        if (rules["out"]) {
          layoutRules.get(layoutKey)["out"] = getDirections(rules["out"]);
        }
        if (rules["outs"]) {
          layoutRules.get(layoutKey)["outs"] = (rules["outs"] || []).map(function(e) {
            return getDirections(e);
          });
        }
      }.bind(this));
    }
  }
}, _getStencilById:function(id) {
  return this._stencils.find(function(stencil) {
    return stencil.id() == id;
  });
}, _cacheConnect:function(args) {
  result = this._canConnect(args);
  if (args.sourceStencil && args.targetStencil) {
    var source = this._cachedConnectSET.get(args.sourceStencil.id());
    if (!source) {
      source = new ORYX.Hash;
      this._cachedConnectSET.set(args.sourceStencil.id(), source);
    }
    var edge = source.get(args.edgeStencil.id());
    if (!edge) {
      edge = new ORYX.Hash;
      source.set(args.edgeStencil.id(), edge);
    }
    edge.set(args.targetStencil.id(), result);
  } else {
    if (args.sourceStencil) {
      var source = this._cachedConnectSE.get(args.sourceStencil.id());
      if (!source) {
        source = new ORYX.Hash;
        this._cachedConnectSE.set(args.sourceStencil.id(), source);
      }
      source.set(args.edgeStencil.id(), result);
    } else {
      var target = this._cachedConnectTE.get(args.targetStencil.id());
      if (!target) {
        target = new ORYX.Hash;
        this._cachedConnectTE.set(args.targetStencil.id(), target);
      }
      target.set(args.edgeStencil.id(), result);
    }
  }
  return result;
}, _cacheCard:function(args) {
  if (args.sourceStencil) {
    var source = this._cachedCardSE.get(args.sourceStencil.id());
    if (!source) {
      source = new ORYX.Hash;
      this._cachedCardSE.set(args.sourceStencil.id(), source);
    }
    var max = this._getMaximumNumberOfOutgoingEdge(args);
    if (max == undefined) {
      max = -1;
    }
    source.set(args.edgeStencil.id(), max);
  }
  if (args.targetStencil) {
    var target = this._cachedCardTE.get(args.targetStencil.id());
    if (!target) {
      target = new ORYX.Hash;
      this._cachedCardTE.set(args.targetStencil.id(), target);
    }
    var max = this._getMaximumNumberOfIncomingEdge(args);
    if (max == undefined) {
      max = -1;
    }
    target.set(args.edgeStencil.id(), max);
  }
}, _cacheContain:function(args) {
  var result = [this._canContain(args), this._getMaximumOccurrence(args.containingStencil, args.containedStencil)];
  if (result[1] == undefined) {
    result[1] = -1;
  }
  var children = this._cachedContainPC.get(args.containingStencil.id());
  if (!children) {
    children = new ORYX.Hash;
    this._cachedContainPC.set(args.containingStencil.id(), children);
  }
  children.set(args.containedStencil.id(), result);
  return result;
}, _cacheMorph:function(role) {
  var morphs = this._cachedMorphRS.get(role);
  if (!morphs) {
    morphs = [];
    if (this._morphingRules.keys().include(role)) {
      morphs = this._stencils.select(function(stencil) {
        return stencil.roles().include(role);
      });
    }
    this._cachedMorphRS.set(role, morphs);
  }
  return morphs;
}, outgoingEdgeStencils:function(args) {
  if (!args.sourceShape && !args.sourceStencil) {
    return[];
  }
  if (args.sourceShape) {
    args.sourceStencil = args.sourceShape.getStencil();
  }
  var _edges = [];
  this._stencils.each(function(stencil) {
    if (stencil.type() === "edge") {
      var newArgs = Object.clone(args);
      newArgs.edgeStencil = stencil;
      if (this.canConnect(newArgs)) {
        _edges.push(stencil);
      }
    }
  }.bind(this));
  return _edges;
}, incomingEdgeStencils:function(args) {
  if (!args.targetShape && !args.targetStencil) {
    return[];
  }
  if (args.targetShape) {
    args.targetStencil = args.targetShape.getStencil();
  }
  var _edges = [];
  this._stencils.each(function(stencil) {
    if (stencil.type() === "edge") {
      var newArgs = Object.clone(args);
      newArgs.edgeStencil = stencil;
      if (this.canConnect(newArgs)) {
        _edges.push(stencil);
      }
    }
  }.bind(this));
  return _edges;
}, sourceStencils:function(args) {
  if (!args || !args.edgeShape && !args.edgeStencil) {
    return[];
  }
  if (args.targetShape) {
    args.targetStencil = args.targetShape.getStencil();
  }
  if (args.edgeShape) {
    args.edgeStencil = args.edgeShape.getStencil();
  }
  var _sources = [];
  this._stencils.each(function(stencil) {
    var newArgs = Object.clone(args);
    newArgs.sourceStencil = stencil;
    if (this.canConnect(newArgs)) {
      _sources.push(stencil);
    }
  }.bind(this));
  return _sources;
}, targetStencils:function(args) {
  if (!args || !args.edgeShape && !args.edgeStencil) {
    return[];
  }
  if (args.sourceShape) {
    args.sourceStencil = args.sourceShape.getStencil();
  }
  if (args.edgeShape) {
    args.edgeStencil = args.edgeShape.getStencil();
  }
  var _targets = [];
  this._stencils.each(function(stencil) {
    var newArgs = Object.clone(args);
    newArgs.targetStencil = stencil;
    if (this.canConnect(newArgs)) {
      _targets.push(stencil);
    }
  }.bind(this));
  return _targets;
}, canConnect:function(args) {
  if (!args || (!args.sourceShape && (!args.sourceStencil && (!args.targetShape && !args.targetStencil)) || !args.edgeShape && !args.edgeStencil)) {
    return false;
  }
  if (args.sourceShape) {
    args.sourceStencil = args.sourceShape.getStencil();
  }
  if (args.targetShape) {
    args.targetStencil = args.targetShape.getStencil();
  }
  if (args.edgeShape) {
    args.edgeStencil = args.edgeShape.getStencil();
  }
  var result;
  if (args.sourceStencil && args.targetStencil) {
    var source = this._cachedConnectSET.get(args.sourceStencil.id());
    if (!source) {
      result = this._cacheConnect(args);
    } else {
      var edge = source.get(args.edgeStencil.id());
      if (!edge) {
        result = this._cacheConnect(args);
      } else {
        var target = edge[args.targetStencil.id()];
        if (target == undefined) {
          result = this._cacheConnect(args);
        } else {
          result = target;
        }
      }
    }
  } else {
    if (args.sourceStencil) {
      var source = this._cachedConnectSE.get(args.sourceStencil.id());
      if (!source) {
        result = this._cacheConnect(args);
      } else {
        var edge = source.get(args.edgeStencil.id());
        if (edge == undefined) {
          result = this._cacheConnect(args);
        } else {
          result = edge;
        }
      }
    } else {
      var target = this._cachedConnectTE.get(args.targetStencil.id());
      if (!target) {
        result = this._cacheConnect(args);
      } else {
        var edge = target.get(args.edgeStencil.id());
        if (edge == undefined) {
          result = this._cacheConnect(args);
        } else {
          result = edge;
        }
      }
    }
  }
  if (result) {
    if (args.sourceShape) {
      var source = this._cachedCardSE.get(args.sourceStencil.id());
      if (!source) {
        this._cacheCard(args);
        source = this._cachedCardSE.get(args.sourceStencil.id());
      }
      var max = source.get(args.edgeStencil.id());
      if (max == undefined) {
        this._cacheCard(args);
      }
      max = source.get(args.edgeStencil.id());
      if (max != -1) {
        result = args.sourceShape.getOutgoingShapes().all(function(cs) {
          if (cs.getStencil().id() === args.edgeStencil.id() && (args.edgeShape ? cs !== args.edgeShape : true)) {
            max--;
            return max > 0 ? true : false;
          } else {
            return true;
          }
        });
      }
    }
    if (args.targetShape) {
      var target = this._cachedCardTE.get(args.targetStencil.id());
      if (!target) {
        this._cacheCard(args);
        target = this._cachedCardTE.get(args.targetStencil.id());
      }
      var max = target.get(args.edgeStencil.id());
      if (max == undefined) {
        this._cacheCard(args);
      }
      max = target.get(args.edgeStencil.id());
      if (max != -1) {
        result = args.targetShape.getIncomingShapes().all(function(cs) {
          if (cs.getStencil().id() === args.edgeStencil.id() && (args.edgeShape ? cs !== args.edgeShape : true)) {
            max--;
            return max > 0 ? true : false;
          } else {
            return true;
          }
        });
      }
    }
  }
  return result;
}, _canConnect:function(args) {
  if (!args || (!args.sourceShape && (!args.sourceStencil && (!args.targetShape && !args.targetStencil)) || !args.edgeShape && !args.edgeStencil)) {
    return false;
  }
  if (args.sourceShape) {
    args.sourceStencil = args.sourceShape.getStencil();
  }
  if (args.targetShape) {
    args.targetStencil = args.targetShape.getStencil();
  }
  if (args.edgeShape) {
    args.edgeStencil = args.edgeShape.getStencil();
  }
  var resultCR;
  var edgeRules = this._getConnectionRulesOfEdgeStencil(args.edgeStencil);
  if (edgeRules.keys().length === 0) {
    resultCR = false;
  } else {
    if (args.sourceStencil) {
      resultCR = args.sourceStencil.roles().any(function(sourceRole) {
        var targetRoles = edgeRules.get(sourceRole);
        if (!targetRoles) {
          return false;
        }
        if (args.targetStencil) {
          return targetRoles.any(function(targetRole) {
            return args.targetStencil.roles().member(targetRole);
          });
        } else {
          return true;
        }
      });
    } else {
      resultCR = edgeRules.values().any(function(targetRoles) {
        return args.targetStencil.roles().any(function(targetRole) {
          return targetRoles.member(targetRole);
        });
      });
    }
  }
  return resultCR;
}, isContainer:function(shape) {
  return this._containerStencils.member(shape.getStencil().id());
}, canContain:function(args) {
  if (!args || (!args.containingStencil && !args.containingShape || !args.containedStencil && !args.containedShape)) {
    return false;
  }
  if (args.containedShape) {
    args.containedStencil = args.containedShape.getStencil();
  }
  if (args.containingShape) {
    args.containingStencil = args.containingShape.getStencil();
  }
  if (args.containedStencil.type() == "edge") {
    return false;
  }
  var childValues;
  var parent = this._cachedContainPC.get(args.containingStencil.id());
  if (!parent) {
    childValues = this._cacheContain(args);
  } else {
    childValues = parent.get(args.containedStencil.id());
    if (!childValues) {
      childValues = this._cacheContain(args);
    }
  }
  if (!childValues[0]) {
    return false;
  } else {
    if (childValues[1] == -1) {
      return true;
    } else {
      if (args.containingShape) {
        var max = childValues[1];
        return args.containingShape.getChildShapes(false).all(function(as) {
          if (as.getStencil().id() === args.containedStencil.id()) {
            max--;
            return max > 0 ? true : false;
          } else {
            return true;
          }
        });
      } else {
        return true;
      }
    }
  }
}, _canContain:function(args) {
  if (!args || (!args.containingStencil && !args.containingShape || !args.containedStencil && !args.containedShape)) {
    return false;
  }
  if (args.containedShape) {
    args.containedStencil = args.containedShape.getStencil();
  }
  if (args.containingShape) {
    args.containingStencil = args.containingShape.getStencil();
  }
  var result;
  result = args.containingStencil.roles().any(function(role) {
    var roles = this._containmentRules.get(role);
    if (roles) {
      return roles.any(function(role) {
        return args.containedStencil.roles().member(role);
      });
    } else {
      return false;
    }
  }.bind(this));
  return result;
}, morphStencils:function(args) {
  if (!args.stencil && !args.shape) {
    return[];
  }
  if (args.shape) {
    args.stencil = args.shape.getStencil();
  }
  var _morphStencils = [];
  args.stencil.roles().each(function(role) {
    this._cacheMorph(role).each(function(stencil) {
      _morphStencils.push(stencil);
    });
  }.bind(this));
  var baseMorphs = this.baseMorphs();
  _morphStencils = _morphStencils.uniq().sort(function(a, b) {
    return baseMorphs.include(a) && !baseMorphs.include(b) ? -1 : baseMorphs.include(b) && !baseMorphs.include(a) ? 1 : 0;
  });
  return _morphStencils;
}, baseMorphs:function() {
  var _baseMorphs = [];
  this._morphingRules.each(function(pair) {
    pair.value.each(function(baseMorph) {
      _baseMorphs.push(baseMorph);
    });
  });
  return _baseMorphs;
}, containsMorphingRules:function() {
  return this._stencilSets.any(function(ss) {
    return!!ss.jsonRules().morphingRules;
  });
}, connectMorph:function(args) {
  if (!args || !args.sourceShape && (!args.sourceStencil && (!args.targetShape && !args.targetStencil))) {
    return false;
  }
  if (args.sourceShape) {
    args.sourceStencil = args.sourceShape.getStencil();
  }
  if (args.targetShape) {
    args.targetStencil = args.targetShape.getStencil();
  }
  var incoming = this.incomingEdgeStencils(args);
  var outgoing = this.outgoingEdgeStencils(args);
  var edgeStencils = incoming.select(function(e) {
    return outgoing.member(e);
  });
  var baseEdgeStencils = this.baseMorphs().select(function(e) {
    return edgeStencils.member(e);
  });
  if (baseEdgeStencils.size() > 0) {
    return baseEdgeStencils[0];
  } else {
    if (edgeStencils.size() > 0) {
      return edgeStencils[0];
    }
  }
  return null;
}, showInShapeMenu:function(stencil) {
  return this._stencilSets.any(function(ss) {
    return ss.jsonRules().morphingRules.any(function(r) {
      return stencil.roles().include(ss.namespace() + r.role) && r.showInShapeMenu !== false;
    });
  });
}, preserveBounds:function(stencil) {
  return this._stencilSets.any(function(ss) {
    return ss.jsonRules().morphingRules.any(function(r) {
      return stencil.roles().include(ss.namespace() + r.role) && r.preserveBounds;
    });
  });
}, getLayoutingRules:function(shape, edgeShape) {
  if (!shape || !(shape instanceof ORYX.Core.Shape)) {
    return;
  }
  var layout = {"in":{}, "out":{}};
  var parseValues = function(o, v) {
    if (o && o[v]) {
      ["t", "r", "b", "l"].each(function(d) {
        layout[v][d] = Math.max(o[v][d], layout[v][d] || 0);
      });
    }
    if (o && o[v + "s"] instanceof Array) {
      ["t", "r", "b", "l"].each(function(d) {
        var defaultRule = o[v + "s"].find(function(e) {
          return!e.edgeRole;
        });
        var edgeRule;
        if (edgeShape instanceof ORYX.Core.Edge) {
          edgeRule = o[v + "s"].find(function(e) {
            return this._hasRole(edgeShape, e.edgeRole);
          }.bind(this));
        }
        layout[v][d] = Math.max(edgeRule ? edgeRule[d] : defaultRule[d], layout[v][d] || 0);
      }.bind(this));
    }
  }.bind(this);
  shape.getStencil().roles().each(function(role) {
    if (this._layoutRules.get(role)) {
      parseValues(this._layoutRules.get(role), "in");
      parseValues(this._layoutRules.get(role), "out");
    }
  }.bind(this));
  ["in", "out"].each(function(v) {
    ["t", "r", "b", "l"].each(function(d) {
      layout[v][d] = layout[v][d] !== undefined ? layout[v][d] : 1;
    });
  });
  return layout;
}, _hasRole:function(shape, role) {
  if (!(shape instanceof ORYX.Core.Shape) || !role) {
    return;
  }
  var isRole = shape.getStencil().roles().any(function(r) {
    return r == role;
  });
  return isRole || shape.getStencil().id() == shape.getStencil().namespace() + role;
}, _stencilsWithRole:function(role) {
  return this._stencils.findAll(function(stencil) {
    return stencil.roles().member(role) ? true : false;
  });
}, _edgesWithRole:function(role) {
  return this._stencils.findAll(function(stencil) {
    return stencil.roles().member(role) && stencil.type() === "edge" ? true : false;
  });
}, _nodesWithRole:function(role) {
  return this._stencils.findAll(function(stencil) {
    return stencil.roles().member(role) && stencil.type() === "node" ? true : false;
  });
}, _getMaximumOccurrence:function(parent, child) {
  var max;
  child.roles().each(function(role) {
    var cardRule = this._cardinalityRules.get(role);
    if (cardRule && cardRule.maximumOccurrence) {
      if (max) {
        max = Math.min(max, cardRule.maximumOccurrence);
      } else {
        max = cardRule.maximumOccurrence;
      }
    }
  }.bind(this));
  return max;
}, _getMaximumNumberOfOutgoingEdge:function(args) {
  if (!args || (!args.sourceStencil || !args.edgeStencil)) {
    return false;
  }
  var max;
  args.sourceStencil.roles().each(function(role) {
    var cardRule = this._cardinalityRules.get(role);
    if (cardRule && cardRule.outgoingEdges) {
      args.edgeStencil.roles().each(function(edgeRole) {
        var oe = cardRule.outgoingEdges.get(edgeRole);
        if (oe && oe.maximum) {
          if (max) {
            max = Math.min(max, oe.maximum);
          } else {
            max = oe.maximum;
          }
        }
      });
    }
  }.bind(this));
  return max;
}, _getMaximumNumberOfIncomingEdge:function(args) {
  if (!args || (!args.targetStencil || !args.edgeStencil)) {
    return false;
  }
  var max;
  args.targetStencil.roles().each(function(role) {
    var cardRule = this._cardinalityRules.get(role);
    if (cardRule && cardRule.incomingEdges) {
      args.edgeStencil.roles().each(function(edgeRole) {
        var ie = cardRule.incomingEdges.get(edgeRole);
        if (ie && ie.maximum) {
          if (max) {
            max = Math.min(max, ie.maximum);
          } else {
            max = ie.maximum;
          }
        }
      });
    }
  }.bind(this));
  return max;
}, _getConnectionRulesOfEdgeStencil:function(edgeStencil) {
  var edgeRules = new ORYX.Hash;
  edgeStencil.roles().each(function(role) {
    if (this._connectionRules.get(role)) {
      this._connectionRules.get(role).each(function(cr) {
        if (edgeRules.get(cr.key)) {
          edgeRules.set(cr.key, edgeRules.get(cr.key).concat(cr.value));
        } else {
          edgeRules.set(cr.key, cr.value);
        }
      });
    }
  }.bind(this));
  return edgeRules;
}, _isRoleOfOtherNamespace:function(role) {
  return role.indexOf("#") > 0;
}, toString:function() {
  return "Rules";
}};
ORYX.Core.StencilSet.Rules = Clazz.extend(ORYX.Core.StencilSet.Rules);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
  ORYX.Core.StencilSet = {};
}
ORYX.Core.StencilSet.StencilSet = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this._extensions = new ORYX.Hash;
  this._jsonObject = {};
  this._stencils = new ORYX.Hash;
  this._availableStencils = new ORYX.Hash;
  this._init();
}, equals:function(stencilSet) {
  return this.namespace() === stencilSet.namespace();
}, stencils:function(rootStencil, rules, sortByGroup) {
  if (rootStencil && rules) {
    var stencils = this._availableStencils.values();
    var containers = [rootStencil];
    var checkedContainers = [];
    var result = [];
    while (containers.size() > 0) {
      var container = containers.pop();
      checkedContainers.push(container);
      var children = stencils.findAll(function(stencil) {
        var args = {containingStencil:container, containedStencil:stencil};
        return rules.canContain(args);
      });
      for (var i = 0;i < children.size();i++) {
        if (!checkedContainers.member(children[i])) {
          containers.push(children[i]);
        }
      }
      result = result.concat(children).uniq();
    }
    result = result.sortBy(function(stencil) {
      return stencils.indexOf(stencil);
    });
    if (sortByGroup) {
      result = result.sortBy(function(stencil) {
        return stencil.groups()[0];
      });
    }
    var edges = stencils.findAll(function(stencil) {
      return stencil.type() == "edge";
    });
    result = result.concat(edges);
    return result;
  } else {
    if (sortByGroup) {
      return this._availableStencils.values().sortBy(function(stencil) {
        return stencil.groups()[0];
      });
    } else {
      return this._availableStencils.values();
    }
  }
}, nodes:function() {
  return this._availableStencils.values().findAll(function(stencil) {
    return stencil.type() === "node";
  });
}, edges:function() {
  return this._availableStencils.values().findAll(function(stencil) {
    return stencil.type() === "edge";
  });
}, stencil:function(id) {
  return this._stencils.get(this.namespace() + id);
}, title:function() {
  return this._jsonObject.title;
}, description:function() {
  return this._jsonObject.description;
}, namespace:function() {
  return this._jsonObject ? this._jsonObject.namespace : null;
}, jsonRules:function() {
  return this._jsonObject ? this._jsonObject.rules : null;
}, source:function() {
  return this._source;
}, extensions:function() {
  return this._extensions;
}, __handleStencilset:function() {
  this._jsonObject = ORCHESTRATOR.model;
  if (!this._jsonObject) {
    throw "Error evaluating stencilset. It may be corrupt.";
  }
  if (!this._jsonObject.namespace || this._jsonObject.namespace === "") {
    throw "Namespace definition missing in stencilset.";
  }
  if (!(this._jsonObject.stencils instanceof Array)) {
    throw "Stencilset corrupt.";
  }
  if (!this._jsonObject.namespace.endsWith("#")) {
    this._jsonObject.namespace = this._jsonObject.namespace + "#";
  }
  if (!this._jsonObject.title) {
    this._jsonObject.title = "";
  }
  if (!this._jsonObject.description) {
    this._jsonObject.description = "";
  }
}, _init:function() {
  this.__handleStencilset();
  var pps = new ORYX.Hash;
  if (this._jsonObject.propertyPackages) {
    $A(this._jsonObject.propertyPackages).each(function(pp) {
      pps.set(pp.name, pp.properties);
    }.bind(this));
  }
  var defaultPosition = 0;
  $A(this._jsonObject.stencils).each(function(stencil) {
    defaultPosition++;
    var oStencil = new ORYX.Core.StencilSet.Stencil(stencil, this.namespace(), this._baseUrl, this, pps, defaultPosition);
    this._stencils.set(this.namespace() + oStencil.id(), oStencil);
    this._availableStencils.set(oStencil.id(), oStencil);
  }.bind(this));
}, _cancelInit:function(response) {
  this.errornous = true;
}, toString:function() {
  return "StencilSet " + this.title() + " (" + this.namespace() + ")";
}};
ORYX.Core.StencilSet.StencilSet = Clazz.extend(ORYX.Core.StencilSet.StencilSet);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Command = {construct:function() {
}, execute:function() {
  throw "Command.execute() has to be implemented!";
}, rollback:function() {
  throw "Command.rollback() has to be implemented!";
}};
ORYX.Core.Command = Clazz.extend(ORYX.Core.Command);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Bounds = {construct:function() {
  this._changedCallbacks = [];
  this.a = {};
  this.b = {};
  this.set.apply(this, arguments);
  this.suspendChange = false;
  this.changedWhileSuspend = false;
}, _changed:function(sizeChanged) {
  if (!this.suspendChange) {
    this._changedCallbacks.each(function(callback) {
      callback(this, sizeChanged);
    }.bind(this));
    this.changedWhileSuspend = false;
  } else {
    this.changedWhileSuspend = true;
  }
}, registerCallback:function(callback) {
  if (!this._changedCallbacks.member(callback)) {
    this._changedCallbacks.push(callback);
  }
}, unregisterCallback:function(callback) {
  this._changedCallbacks = this._changedCallbacks.without(callback);
}, set:function() {
  var changed = false;
  switch(arguments.length) {
    case 1:
      if (this.a.x !== arguments[0].a.x) {
        changed = true;
        this.a.x = arguments[0].a.x;
      }
      if (this.a.y !== arguments[0].a.y) {
        changed = true;
        this.a.y = arguments[0].a.y;
      }
      if (this.b.x !== arguments[0].b.x) {
        changed = true;
        this.b.x = arguments[0].b.x;
      }
      if (this.b.y !== arguments[0].b.y) {
        changed = true;
        this.b.y = arguments[0].b.y;
      }
      break;
    case 2:
      var ax = Math.min(arguments[0].x, arguments[1].x);
      var ay = Math.min(arguments[0].y, arguments[1].y);
      var bx = Math.max(arguments[0].x, arguments[1].x);
      var by = Math.max(arguments[0].y, arguments[1].y);
      if (this.a.x !== ax) {
        changed = true;
        this.a.x = ax;
      }
      if (this.a.y !== ay) {
        changed = true;
        this.a.y = ay;
      }
      if (this.b.x !== bx) {
        changed = true;
        this.b.x = bx;
      }
      if (this.b.y !== by) {
        changed = true;
        this.b.y = by;
      }
      break;
    case 4:
      var ax = Math.min(arguments[0], arguments[2]);
      var ay = Math.min(arguments[1], arguments[3]);
      var bx = Math.max(arguments[0], arguments[2]);
      var by = Math.max(arguments[1], arguments[3]);
      if (this.a.x !== ax) {
        changed = true;
        this.a.x = ax;
      }
      if (this.a.y !== ay) {
        changed = true;
        this.a.y = ay;
      }
      if (this.b.x !== bx) {
        changed = true;
        this.b.x = bx;
      }
      if (this.b.y !== by) {
        changed = true;
        this.b.y = by;
      }
      break;
  }
  if (changed) {
    this._changed(true);
  }
}, moveTo:function() {
  var currentPosition = this.upperLeft();
  switch(arguments.length) {
    case 1:
      this.moveBy({x:arguments[0].x - currentPosition.x, y:arguments[0].y - currentPosition.y});
      break;
    case 2:
      this.moveBy({x:arguments[0] - currentPosition.x, y:arguments[1] - currentPosition.y});
      break;
    default:
    ;
  }
}, moveBy:function() {
  var changed = false;
  switch(arguments.length) {
    case 1:
      var p = arguments[0];
      if (p.x !== 0 || p.y !== 0) {
        changed = true;
        this.a.x += p.x;
        this.b.x += p.x;
        this.a.y += p.y;
        this.b.y += p.y;
      }
      break;
    case 2:
      var x = arguments[0];
      var y = arguments[1];
      if (x !== 0 || y !== 0) {
        changed = true;
        this.a.x += x;
        this.b.x += x;
        this.a.y += y;
        this.b.y += y;
      }
      break;
    default:
    ;
  }
  if (changed) {
    this._changed();
  }
}, include:function(b) {
  if (this.a.x === undefined && (this.a.y === undefined && (this.b.x === undefined && this.b.y === undefined))) {
    return b;
  }
  var cx = Math.min(this.a.x, b.a.x);
  var cy = Math.min(this.a.y, b.a.y);
  var dx = Math.max(this.b.x, b.b.x);
  var dy = Math.max(this.b.y, b.b.y);
  this.set(cx, cy, dx, dy);
}, extend:function(p) {
  if (p.x !== 0 || p.y !== 0) {
    this.b.x += p.x;
    this.b.y += p.y;
    this._changed(true);
  }
}, widen:function(x) {
  if (x !== 0) {
    this.suspendChange = true;
    this.moveBy({x:-x, y:-x});
    this.extend({x:2 * x, y:2 * x});
    this.suspendChange = false;
    if (this.changedWhileSuspend) {
      this._changed(true);
    }
  }
}, upperLeft:function() {
  return{x:this.a.x, y:this.a.y};
}, lowerRight:function() {
  return{x:this.b.x, y:this.b.y};
}, width:function() {
  return this.b.x - this.a.x;
}, height:function() {
  return this.b.y - this.a.y;
}, center:function() {
  return{x:(this.a.x + this.b.x) / 2, y:(this.a.y + this.b.y) / 2};
}, midPoint:function() {
  return{x:(this.b.x - this.a.x) / 2, y:(this.b.y - this.a.y) / 2};
}, centerMoveTo:function() {
  var currentPosition = this.center();
  switch(arguments.length) {
    case 1:
      this.moveBy(arguments[0].x - currentPosition.x, arguments[0].y - currentPosition.y);
      break;
    case 2:
      this.moveBy(arguments[0] - currentPosition.x, arguments[1] - currentPosition.y);
      break;
  }
}, isIncluded:function(point, offset) {
  var pointX, pointY, offset;
  switch(arguments.length) {
    case 1:
      pointX = arguments[0].x;
      pointY = arguments[0].y;
      offset = 0;
      break;
    case 2:
      if (arguments[0].x && arguments[0].y) {
        pointX = arguments[0].x;
        pointY = arguments[0].y;
        offset = Math.abs(arguments[1]);
      } else {
        pointX = arguments[0];
        pointY = arguments[1];
        offset = 0;
      }
      break;
    case 3:
      pointX = arguments[0];
      pointY = arguments[1];
      offset = Math.abs(arguments[2]);
      break;
    default:
      throw "isIncluded needs one, two or three arguments";;
  }
  var ul = this.upperLeft();
  var lr = this.lowerRight();
  if (pointX >= ul.x - offset && (pointX <= lr.x + offset && (pointY >= ul.y - offset && pointY <= lr.y + offset))) {
    return true;
  } else {
    return false;
  }
}, clone:function() {
  return new ORYX.Core.Bounds(this);
}, toString:function() {
  return "( " + this.a.x + " | " + this.a.y + " )/( " + this.b.x + " | " + this.b.y + " )";
}, serializeForERDF:function() {
  return this.a.x + "," + this.a.y + "," + this.b.x + "," + this.b.y;
}};
ORYX.Core.Bounds = Clazz.extend(ORYX.Core.Bounds);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.UIObject = {construct:function(options) {
  this.isChanged = true;
  this.isResized = true;
  this.isVisible = true;
  this.isSelectable = false;
  this.isResizable = false;
  this.isMovable = false;
  this.id = ORYX.Editor.prototype.provideId();
  this.parent = undefined;
  this.children = [];
  this.bounds = new ORYX.Core.Bounds;
  this._changedCallback = this._changed.bind(this);
  this.bounds.registerCallback(this._changedCallback);
  if (options && options.eventHandlerCallback) {
    this.eventHandlerCallback = options.eventHandlerCallback;
    this.paper = options.paper;
  }
}, setParent:function(parent) {
  this.parent = parent;
}, _changed:function(bounds, isResized) {
  this.isChanged = true;
  if (this.bounds == bounds) {
    this.isResized = isResized || this.isResized;
  }
}, update:function() {
  if (this.isChanged) {
    this.refresh();
    this.isChanged = false;
    this.children.each(function(value) {
      value.update();
    });
  }
}, refresh:function() {
  this.children.each(function(child) {
    child.refresh();
  });
}, getChildren:function() {
  return this.children.clone();
}, getParents:function() {
  var parents = [];
  var parent = this.parent;
  while (parent) {
    parents.push(parent);
    parent = parent.parent;
  }
  return parents;
}, isParent:function(parent) {
  var cparent = this;
  while (cparent) {
    if (cparent === parent) {
      return true;
    }
    cparent = cparent.parent;
  }
  return false;
}, getId:function() {
  return this.id;
}, getChildById:function(id, deep) {
  return this.children.find(function(uiObj) {
    if (uiObj.getId() === id) {
      return uiObj;
    } else {
      if (deep) {
        var obj = uiObj.getChildById(id, deep);
        if (obj) {
          return obj;
        }
      }
    }
  });
}, add:function(uiObject) {
  if (!this.children.member(uiObject)) {
    if (uiObject.parent) {
      uiObject.remove(uiObject);
    }
    this.children.push(uiObject);
    uiObject.parent = this;
    uiObject.bounds.registerCallback(this._changedCallback);
  } else {
    ORYX.Log.info("add: ORYX.Core.UIObject is already a child of this object.");
  }
}, remove:function(uiObject) {
  if (this.children.member(uiObject)) {
    this.children = this._uiObjects.without(uiObject);
    uiObject.parent = undefined;
    uiObject.hide();
    uiObject.bounds.unregisterCallback(this._changedCallback);
  } else {
    ORYX.Log.info("remove: ORYX.Core.UIObject is not a child of this object.");
  }
}, absoluteBounds:function() {
  if (this.parent) {
    var absUL = this.absoluteXY();
    return new ORYX.Core.Bounds(absUL.x, absUL.y, absUL.x + this.bounds.width(), absUL.y + this.bounds.height());
  } else {
    return this.bounds.clone();
  }
}, absoluteXY:function() {
  if (this.parent) {
    var pXY = this.parent.absoluteXY();
    return{x:pXY.x + this.bounds.upperLeft().x, y:pXY.y + this.bounds.upperLeft().y};
  } else {
    return{x:this.bounds.upperLeft().x, y:this.bounds.upperLeft().y};
  }
}, absoluteCenterXY:function() {
  if (this.parent) {
    var pXY = this.parent.absoluteXY();
    return{x:pXY.x + this.bounds.center().x, y:pXY.y + this.bounds.center().y};
  } else {
    return{x:this.bounds.center().x, y:this.bounds.center().y};
  }
}, hide:function() {
  this.raphael.forEach(function(el) {
    el.node.style.display = "none";
  });
  this.isVisible = false;
}, show:function() {
  this.raphael.forEach(function(el) {
    el.node.style.display = "";
    el.toFront();
  });
  this.isVisible = true;
}, addEventHandlers:function(node) {
  if (this.eventHandlerCallback) {
    ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEDOWN, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEMOVE, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEUP, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEOVER, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.MOUSEOUT, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.CLICK, this._delegateEvent.bind(this));
    ORYX.observe(node, ORCHESTRATOR.EVENTS.DBLCLICK, this._delegateEvent.bind(this));
    this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.REGISTERED, element:node});
  }
}, _delegateEvent:function(event) {
  if (this.eventHandlerCallback) {
    this.eventHandlerCallback(event, this);
  }
}, toString:function() {
  return "UIObject " + this.id;
}};
ORYX.Core.UIObject = Clazz.extend(ORYX.Core.UIObject);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.AbstractPlugin = {construct:function(facade) {
  this.facade = facade;
}, openDownloadWindow:function(filename, content) {
  var win = window.open("");
  if (win != null) {
    win.document.open();
    win.document.write("<html><body>");
    var submitForm = win.document.createElement("form");
    win.document.body.appendChild(submitForm);
    var createHiddenElement = function(name, value) {
      var newElement = document.createElement("input");
      newElement.name = name;
      newElement.type = "hidden";
      newElement.value = value;
      return newElement;
    };
    submitForm.appendChild(createHiddenElement("download", content));
    submitForm.appendChild(createHiddenElement("file", filename));
    submitForm.method = "POST";
    win.document.write("</body></html>");
    win.document.close();
    submitForm.action = ORYX.PATH + "/download";
    submitForm.submit();
  }
}, enableReadOnlyMode:function() {
  this.facade.disableEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN);
  this.facade.disableEvent(ORCHESTRATOR.EVENTS.KEYDOWN);
}, disableReadOnlyMode:function() {
  this.facade.enableEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN);
  this.facade.enableEvent(ORCHESTRATOR.EVENTS.KEYDOWN);
}, doLayout:function(shapes) {
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.LAYOUT, shapes:shapes});
}, layoutEdges:function(node, allEdges, offset) {
  if (!this.facade.isExecutingCommands()) {
    return;
  }
  var Command = ORYX.Core.Command.extend({construct:function(edges, node, offset, plugin) {
    this.edges = edges;
    this.node = node;
    this.plugin = plugin;
    this.offset = offset;
    var center = node.absoluteXY();
    this.ulo = {x:center.x - offset.x, y:center.y - offset.y};
  }, execute:function() {
    if (this.changes) {
      this.executeAgain();
      return;
    } else {
      this.changes = [];
      this.edges.each(function(edge) {
        this.changes.push({edge:edge, oldDockerPositions:edge.dockers.map(function(r) {
          return r.bounds.center();
        })});
      }.bind(this));
    }
    this.edges.findAll(function(r) {
      return r.dockers.length > 2;
    }.bind(this)).each(function(edge) {
      if (edge.dockers[0].getDockedShape() === this.node) {
        var second = edge.dockers[1];
        if (this.align(second.bounds, edge.dockers[0])) {
          second.update();
        }
      } else {
        if (edge.dockers.last().getDockedShape() === this.node) {
          var beforeLast = edge.dockers[edge.dockers.length - 2];
          if (this.align(beforeLast.bounds, edge.dockers.last())) {
            beforeLast.update();
          }
        }
      }
      edge._update(true);
      edge.removeUnusedDockers();
      if (this.isBendPointIncluded(edge)) {
        this.plugin.doLayout(edge);
        return;
      }
    }.bind(this));
    this.edges.each(function(edge) {
      if (edge.dockers.length == 2) {
        var p1 = edge.dockers[0].getAbsoluteReferencePoint() || edge.dockers[0].bounds.center();
        var p2 = edge.dockers.last().getAbsoluteReferencePoint() || edge.dockers[0].bounds.center();
        if (Math.abs(-Math.abs(p1.x - p2.x) + Math.abs(this.offset.x)) < 2 || Math.abs(-Math.abs(p1.y - p2.y) + Math.abs(this.offset.y)) < 2) {
          this.plugin.doLayout(edge);
        }
      }
    }.bind(this));
    this.edges.each(function(edge, i) {
      this.changes[i].dockerPositions = edge.dockers.map(function(r) {
        return r.bounds.center();
      });
    }.bind(this));
  }, align:function(bounds, refDocker) {
    var abRef = refDocker.getAbsoluteReferencePoint() || refDocker.bounds.center();
    var xdif = bounds.center().x - abRef.x;
    var ydif = bounds.center().y - abRef.y;
    if (Math.abs(-Math.abs(xdif) + Math.abs(this.offset.x)) < 3 && this.offset.xs === undefined) {
      bounds.moveBy({x:-xdif, y:0});
    }
    if (Math.abs(-Math.abs(ydif) + Math.abs(this.offset.y)) < 3 && this.offset.ys === undefined) {
      bounds.moveBy({y:-ydif, x:0});
    }
    if (this.offset.xs !== undefined || this.offset.ys !== undefined) {
      var absPXY = refDocker.getDockedShape().absoluteXY();
      xdif = bounds.center().x - (absPXY.x + (abRef.x - absPXY.x) / this.offset.xs);
      ydif = bounds.center().y - (absPXY.y + (abRef.y - absPXY.y) / this.offset.ys);
      if (Math.abs(-Math.abs(xdif) + Math.abs(this.offset.x)) < 3) {
        bounds.moveBy({x:-(bounds.center().x - abRef.x), y:0});
      }
      if (Math.abs(-Math.abs(ydif) + Math.abs(this.offset.y)) < 3) {
        bounds.moveBy({y:-(bounds.center().y - abRef.y), x:0});
      }
    }
  }, isBendPointIncluded:function(edge) {
    var ab = edge.dockers[0].getDockedShape();
    var bb = edge.dockers.last().getDockedShape();
    if (ab) {
      ab = ab.absoluteBounds();
      ab.widen(5);
    }
    if (bb) {
      bb = bb.absoluteBounds();
      bb.widen(20);
    }
    return edge.dockers.any(function(docker, i) {
      var c = docker.bounds.center();
      return i != 0 && (i != edge.dockers.length - 1 && (ab && ab.isIncluded(c) || bb && bb.isIncluded(c)));
    });
  }, removeAllDocker:function(edge) {
    edge.dockers.slice(1, edge.dockers.length - 1).each(function(docker) {
      edge.removeDocker(docker);
    });
  }, executeAgain:function() {
    this.changes.each(function(change) {
      this.removeAllDocker(change.edge);
      change.dockerPositions.each(function(pos, i) {
        if (i == 0 || i == change.dockerPositions.length - 1) {
          return;
        }
        var docker = change.edge.createDocker(undefined, pos);
        docker.bounds.centerMoveTo(pos);
        docker.update();
      }.bind(this));
      change.edge._update(true);
    }.bind(this));
  }, rollback:function() {
    this.changes.each(function(change) {
      this.removeAllDocker(change.edge);
      change.oldDockerPositions.each(function(pos, i) {
        if (i == 0 || i == change.oldDockerPositions.length - 1) {
          return;
        }
        var docker = change.edge.createDocker(undefined, pos);
        docker.bounds.centerMoveTo(pos);
        docker.update();
      }.bind(this));
      change.edge._update(true);
    }.bind(this));
  }});
  this.facade.executeCommands([new Command(allEdges, node, offset, this)]);
}};
ORYX.Plugins.AbstractPlugin = Clazz.extend(ORYX.Plugins.AbstractPlugin);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Controls) {
  ORYX.Core.Controls = {};
}
ORYX.Core.Controls.Control = {toString:function() {
  return "Control " + this.id;
}};
ORYX.Core.Controls.Control = ORYX.Core.UIObject.extend(ORYX.Core.Controls.Control);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.AbstractLayouter = {construct:function(facade) {
  arguments.callee.$.construct.apply(this, arguments);
  this.layouted = [];
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.LAYOUT, this._initLayout.bind(this));
}, isIncludedInLayout:function(shape) {
  if (!(this.layouted instanceof Array)) {
    this.layouted = [this.layouted].compact();
  }
  if (this.layouted.length <= 0) {
    return true;
  }
  return this.layouted.any(function(s) {
    if (typeof s == "string") {
      return shape.getStencil().id().include(s);
    } else {
      return shape instanceof s;
    }
  });
}, _initLayout:function(event) {
  var shapes = [event.shapes].flatten().compact();
  var toLayout = shapes.findAll(function(shape) {
    return this.isIncludedInLayout(shape);
  }.bind(this));
  if (toLayout.length > 0) {
    this.layout(toLayout);
  }
}, layout:function(shapes) {
  throw new Error("Layouter has to implement the layout function.");
}};
ORYX.Plugins.AbstractLayouter = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.AbstractLayouter);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.AbstractShape = {construct:function(options, stencil) {
  arguments.callee.$.construct.apply(this, arguments);
  this.resourceId = ORYX.Editor.prototype.provideId();
  this._stencil = stencil;
  if (this._stencil._jsonStencil.superId) {
    stencilId = this._stencil.id();
    superStencilId = stencilId.substring(0, stencilId.indexOf("#") + 1) + stencil._jsonStencil.superId;
    stencilSet = this._stencil.stencilSet();
    this._stencil = stencilSet.stencil(superStencilId);
  }
  this.properties = new ORYX.Hash;
  this.propertiesChanged = new ORYX.Hash;
  this.hiddenProperties = new ORYX.Hash;
  this._stencil.properties().each(function(property) {
    var key = property.id();
    this.properties.set(key, property.value());
    this.propertiesChanged.set(key, true);
  }.bind(this));
  if (stencil._jsonStencil.superId) {
    stencil.properties().each(function(property) {
      var key = property.id();
      var value = property.value();
      var oldValue = this.properties.get(key);
      this.properties.set(key, value);
      this.propertiesChanged.set(key, true);
      this._delegateEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_CHANGED, name:key, value:value, oldValue:oldValue});
    }.bind(this));
  }
}, layout:function() {
}, getStencil:function() {
  return this._stencil;
}, __stripHashes:function(s) {
  return s && s.substring(0, 1) == "#" ? s.substring(1, s.length) : s;
}, getChildShapeByResourceId:function(resourceId) {
  resourceId = this.__stripHashes(resourceId);
  return this.getChildShapes(true).find(function(shape) {
    return shape.resourceId == resourceId;
  });
}, getChildShapes:function(deep, iterator) {
  var result = [];
  this.children.each(function(uiObject) {
    if (uiObject instanceof ORYX.Core.Shape && uiObject.isVisible) {
      if (iterator) {
        iterator(uiObject);
      }
      result.push(uiObject);
      if (deep) {
        result = result.concat(uiObject.getChildShapes(deep, iterator));
      }
    }
  });
  return result;
}, hasChildShape:function(shape) {
  return this.getChildShapes().any(function(child) {
    return child === shape || child.hasChildShape(shape);
  });
}, getChildNodes:function(deep, iterator) {
  var result = [];
  this.children.each(function(uiObject) {
    if (uiObject instanceof ORYX.Core.Node && uiObject.isVisible) {
      if (iterator) {
        iterator(uiObject);
      }
      result.push(uiObject);
    }
    if (uiObject instanceof ORYX.Core.Shape) {
      if (deep) {
        result = result.concat(uiObject.getChildNodes(deep, iterator));
      }
    }
  });
  return result;
}, getChildEdges:function(deep, iterator) {
  var result = [];
  this.children.each(function(uiObject) {
    if (uiObject instanceof ORYX.Core.Edge && uiObject.isVisible) {
      if (iterator) {
        iterator(uiObject);
      }
      result.push(uiObject);
    }
    if (uiObject instanceof ORYX.Core.Shape) {
      if (deep) {
        result = result.concat(uiObject.getChildEdges(deep, iterator));
      }
    }
  });
  return result;
}, getAbstractShapesAtPosition:function() {
  var x, y;
  switch(arguments.length) {
    case 1:
      x = arguments[0].x;
      y = arguments[0].y;
      break;
    case 2:
      x = arguments[0];
      y = arguments[1];
      break;
    default:
      throw "getAbstractShapesAtPosition needs 1 or 2 arguments!";;
  }
  if (this.isPointIncluded(x, y)) {
    var result = [];
    result.push(this);
    var childNodes = this.getChildNodes();
    var childEdges = this.getChildEdges();
    [childNodes, childEdges].each(function(ne) {
      var nodesAtPosition = new ORYX.Hash;
      ne.each(function(node) {
        if (!node.isVisible) {
          return;
        }
        var candidates = node.getAbstractShapesAtPosition(x, y);
        if (candidates.length > 0) {
          var nodesInZOrder = $A(node.parent.getChildNodes());
          var zOrderIndex = nodesInZOrder.indexOf(node);
          nodesAtPosition.set(zOrderIndex, candidates);
        }
      });
      nodesAtPosition.keys().sort().each(function(key) {
        result = result.concat(nodesAtPosition.get(key));
      });
    });
    return result;
  } else {
    return[];
  }
}, setProperty:function(key, value, force) {
  var oldValue = this.properties.get(key);
  if (oldValue !== value || force === true) {
    this.properties.set(key, value);
    this.propertiesChanged.set(key, true);
    this._changed();
    if (!this._isInSetProperty) {
      this._isInSetProperty = true;
      this._delegateEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_CHANGED, elements:[this], name:key, value:value, oldValue:oldValue});
      delete this._isInSetProperty;
    }
  }
}, isPropertyChanged:function() {
  return this.propertiesChanged.any(function(property) {
    return property.value;
  });
}, setHiddenProperty:function(key, value) {
  if (value === undefined) {
    this.hiddenProperties.unset(key);
    return;
  }
  var oldValue = this.hiddenProperties.get(key);
  if (oldValue !== value) {
    this.hiddenProperties.set(key, value);
  }
}, isPointIncluded:function(pointX, pointY, absoluteBounds) {
  var absBounds = absoluteBounds ? absoluteBounds : this.absoluteBounds();
  return absBounds.isIncluded(pointX, pointY);
}, serialize:function() {
  var serializedObject = [];
  serializedObject.push({name:"type", value:this.getStencil().id(), type:"literal"});
  this.hiddenProperties.each(function(prop) {
    serializedObject.push({name:prop.key, value:prop.value, type:"literal"});
  }.bind(this));
  this.getStencil().properties().each(function(property) {
    var name = property.id();
    serializedObject.push({name:name, value:this.properties.get(name), type:"literal"});
  }.bind(this));
  return serializedObject;
}, deserialize:function(serialize) {
  var initializedDocker = 0;
  serialize = serialize.sort(function(a, b) {
    a = Number(this.properties.keys().member(a.name));
    b = Number(this.properties.keys().member(b.name));
    return a > b ? 1 : a < b ? -1 : 0;
  }.bind(this));
  serialize.each(function(obj) {
    var name = obj.name;
    var value = obj.value;
    if (ORYX.type(value) === "object") {
      value = Object.toJSON(value);
    }
    switch(name) {
      case "parent":
        if (!this.parent) {
          break;
        }
        var parent = this.getCanvas().getChildShapeByResourceId(value);
        if (parent) {
          parent.add(this);
        }
        break;
      default:
        var prop = this.getStencil().property(name);
        if (prop && (prop.isList() && typeof value === "string")) {
          if ((value || "").strip() && (!value.startsWith("[") && !value.startsWith("]"))) {
            value = '["' + value.strip() + '"]';
          }
          value = ((value || "").strip() || "[]").evalJSON();
        }
        if (this.properties.keys().member(name)) {
          this.setProperty(name, value);
        } else {
          if (!(name === "bounds" || (name === "parent" || (name === "target" || (name === "dockers" || (name === "docker" || (name === "outgoing" || name === "incoming"))))))) {
            this.setHiddenProperty(name, value);
          }
        }
      ;
    }
  }.bind(this));
}, JSONHelper:{eachChild:function(iterator, deep, modify) {
  if (!this.childShapes) {
    return;
  }
  var newChildShapes = [];
  this.childShapes.each(function(shape) {
    if (!(shape.eachChild instanceof Function)) {
      ORYX.apply(shape, ORYX.Core.AbstractShape.JSONHelper);
    }
    var res = iterator(shape, this);
    if (res) {
      newChildShapes.push(res);
    }
    if (deep) {
      shape.eachChild(iterator, deep, modify);
    }
  }.bind(this));
  if (modify) {
    this.childShapes = newChildShapes;
  }
}, getShape:function() {
  return null;
}, getChildShapes:function(deep) {
  var allShapes = this.childShapes;
  if (deep) {
    this.eachChild(function(shape) {
      if (!(shape.getChildShapes instanceof Function)) {
        ORYX.apply(shape, ORYX.Core.AbstractShape.JSONHelper);
      }
      allShapes = allShapes.concat(shape.getChildShapes(deep));
    }, true);
  }
  return allShapes;
}, serialize:function() {
  return Object.toJSON(this);
}}, toString:function() {
  return "ORYX.Core.AbstractShape " + this.id;
}, toJSON:function() {
  var json = {resourceId:this.resourceId, properties:ORYX.apply({}, this.properties, this.hiddenProperties).inject({}, function(props, prop) {
    var key = prop[0];
    var value = prop[1];
    if (this.getStencil().property(key) && (this.getStencil().property(key).type() === ORCHESTRATOR.TYPES.COMPLEX && ORYX.type(value) === "string")) {
      try {
        value = eval("(" + value + ")");
      } catch (error) {
      }
    } else {
      if (value instanceof Date && this.getStencil().property(key)) {
        try {
          value = value.format(this.getStencil().property(key).dateFormat());
        } catch (e) {
        }
      }
    }
    props[key] = value;
    return props;
  }.bind(this)), stencil:{id:this.getStencil().idWithoutNs()}, childShapes:this.getChildShapes().map(function(shape) {
    return shape.toJSON();
  })};
  if (this.getOutgoingShapes) {
    json.outgoing = this.getOutgoingShapes().map(function(shape) {
      return{resourceId:shape.resourceId};
    });
  }
  if (this.bounds) {
    json.bounds = {lowerRight:this.bounds.lowerRight(), upperLeft:this.bounds.upperLeft()};
  }
  if (this.dockers) {
    json.dockers = this.dockers.map(function(docker) {
      var d = docker.getDockedShape() && docker.referencePoint ? docker.referencePoint : docker.bounds.center();
      d.getDocker = function() {
        return docker;
      };
      return d;
    });
  }
  ORYX.apply(json, ORYX.Core.AbstractShape.prototype.JSONHelper);
  json.getShape = function() {
    return this;
  }.bind(this);
  return json;
}};
ORYX.Core.AbstractShape = ORYX.Core.UIObject.extend(ORYX.Core.AbstractShape);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Canvas = {construct:function(options) {
  arguments.callee.$.construct.apply(this, arguments);
  this.paper = options.paper;
  this.screenCTM = {e:0, f:0};
  if (!options.parentNode) {
    options.parentNode = document.documentElement;
  }
  this.root = options.parentNode;
  this.resourceId = options.id;
  this.addEventHandlers(this.root);
  this.root.oncontextmenu = function() {
    return false;
  };
  this.node = this.paper.canvas;
  this.bbox = new ORYX.Core.Bounds(0, 0, 0, 0);
  this.nodes = [];
  this.edges = [];
  this.bounds.set(0, 0, 0, 0);
}, update:function() {
  this.nodes.each(function(node) {
    this._traverseForUpdate(node);
  }.bind(this));
  var layoutEvents = this.getStencil().layout();
  if (layoutEvents) {
    layoutEvents.each(function(event) {
      event.shape = this;
      event.forceExecution = true;
      event.target = this.node;
      this._delegateEvent(event);
    }.bind(this));
  }
  this.nodes.invoke("_update");
  this.edges.invoke("_update", true);
}, _traverseForUpdate:function(shape) {
  var childRet = shape.isChanged;
  shape.getChildNodes(false, function(child) {
    if (this._traverseForUpdate(child)) {
      childRet = true;
    }
  }.bind(this));
  if (childRet) {
    shape.layout();
    return true;
  } else {
    return false;
  }
}, layout:function() {
}, getChildNodes:function(deep, iterator) {
  if (!deep && !iterator) {
    return this.nodes.clone();
  } else {
    var result = [];
    this.nodes.each(function(uiObject) {
      if (iterator) {
        iterator(uiObject);
      }
      result.push(uiObject);
      if (deep && uiObject instanceof ORYX.Core.Shape) {
        result = result.concat(uiObject.getChildNodes(deep, iterator));
      }
    });
    return result;
  }
}, add:function(uiObject, index, silent) {
  if (uiObject instanceof ORYX.Core.UIObject) {
    if (!this.children.member(uiObject)) {
      if (uiObject.parent) {
        uiObject.parent.remove(uiObject, true);
      }
      if (index != undefined) {
        this.children.splice(index, 0, uiObject);
      } else {
        this.children.push(uiObject);
      }
      uiObject.setParent(this);
      if (uiObject instanceof ORYX.Core.Shape) {
        if (uiObject instanceof ORYX.Core.Edge) {
          this.edges.push(uiObject);
        } else {
          this.nodes.push(uiObject);
        }
      } else {
        ORYX.Log.warn("adding unknown obj:" + uiObject);
      }
      uiObject.bounds.registerCallback(this._changedCallback);
      uiObject.show();
      if (this.eventHandlerCallback && silent !== true) {
        this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEADDED, shape:uiObject});
      }
    } else {
      ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
    }
  } else {
    ORYX.Log.fatal("add: Parameter is not of type ORYX.Core.UIObject.");
  }
}, remove:function(uiObject, silent) {
  if (this.children.member(uiObject)) {
    uiObject.hide();
    var parent = uiObject.parent;
    this.children = this.children.without(uiObject);
    uiObject.setParent(undefined);
    if (uiObject instanceof ORYX.Core.Shape) {
      if (uiObject instanceof ORYX.Core.Edge) {
        this.edges = this.edges.without(uiObject);
      } else {
        this.nodes = this.nodes.without(uiObject);
      }
    } else {
      ORYX.Log.warn("removing unknown obj: " + UIObject);
    }
    if (this.eventHandlerCallback && silent !== true) {
      this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEREMOVED, shape:uiObject, parent:parent});
    }
    uiObject.bounds.unregisterCallback(this._changedCallback);
  } else {
    ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
  }
}, addShapeObjects:function(shapeObjects, eventHandler) {
  if (!shapeObjects) {
    return;
  }
  var addShape = function(shape, parent) {
    var stencil = this.getStencil().stencilSet().stencil(shape.stencil.id);
    var ShapeClass = stencil.type() == "node" ? ORYX.Core.Node : ORYX.Core.Edge;
    var newShape = new ShapeClass({"eventHandlerCallback":eventHandler, "paper":this.paper, "bounds":shape.bounds}, stencil);
    newShape.resourceId = shape.resourceId;
    shape.parent = "#" + (shape.parent && shape.parent.resourceId || parent.resourceId);
    this.add(newShape);
    return{json:shape, object:newShape};
  }.bind(this);
  var addChildShapesRecursively = function(shape) {
    var addedShapes = [];
    shape.childShapes.each(function(childShape) {
      try {
        addedShapes.push(addShape(childShape, shape));
        addedShapes = addedShapes.concat(addChildShapesRecursively(childShape));
      } catch (e) {
        ORYX.Log.debug("failed to create shape: %0", childShape.stencil.id);
        if (e.stack) {
          ORYX.Log.debug(" Exception: " + e.stack);
        } else {
          ORYX.Log.debug(" Exception: " + e);
        }
      }
    });
    return addedShapes;
  }.bind(this);
  var shapes = addChildShapesRecursively({childShapes:shapeObjects, resourceId:this.resourceId});
  shapes.each(function(shape) {
    var properties = [];
    for (field in shape.json.properties) {
      properties.push({name:field, value:shape.json.properties[field]});
    }
    shape.json.outgoing.each(function(out) {
      properties.push({name:"outgoing", value:"#" + out.resourceId});
    });
    if (shape.object instanceof ORYX.Core.Edge) {
      var target = shape.json.target || shape.json.outgoing[0];
      if (target) {
        properties.push({name:"target", value:"#" + target.resourceId});
      }
    }
    if (shape.json.bounds) {
      properties.push({name:"bounds", value:shape.json.bounds.upperLeft.x + "," + shape.json.bounds.upperLeft.y + "," + shape.json.bounds.lowerRight.x + "," + shape.json.bounds.lowerRight.y});
    }
    if (shape.json.dockers) {
      properties.push({name:"dockers", value:shape.json.dockers.inject("", function(dockersStr, docker) {
        return dockersStr + docker.x + " " + docker.y + " ";
      }) + " #"});
    }
    properties.push({name:"parent", value:shape.json.parent});
    shape.__properties = properties;
  }.bind(this));
  shapes.each(function(shape) {
    if (shape.object instanceof ORYX.Core.Node) {
      shape.object.deserialize(shape.__properties, shape.json);
    }
  });
  shapes.each(function(shape) {
    if (shape.object instanceof ORYX.Core.Edge) {
      shape.object.deserialize(shape.__properties, shape.json);
      shape.object._oldBounds = shape.object.bounds.clone();
      shape.object._update();
    }
  });
  this.updateSize();
  return shapes.pluck("object");
}, updateSize:function(keepBounary) {
  var maxX = 0;
  var maxY = 0;
  if (!keepBounary) {
    var minX = null;
    var minY = null;
    this.getChildShapes(true, function(shape) {
      var a = shape.absoluteBounds().upperLeft();
      var b = shape.absoluteBounds().lowerRight();
      maxX = Math.max(maxX, b.x);
      maxY = Math.max(maxY, b.y);
      if (!minX) {
        minX = a.x;
        minY = a.y;
      } else {
        minX = Math.min(minX, a.x);
        minY = Math.min(minY, a.y);
      }
    });
    this.bbox.set(minX, minY, maxX, maxY);
  } else {
    var b = this.bbox.lowerRight();
    maxX = b.x;
    maxY = b.y;
  }
  this.setSize();
}, getScreenCTM:function() {
  if (this.node.getScreenCTM) {
    var a = this.node.getScreenCTM();
    this.screenCTM.e = a.e;
    this.screenCTM.f = a.f;
  } else {
    var root = this.root;
    var scroll = Element.cumulativeScrollOffset(root);
    var upperX = root.offsetLeft + root.clientLeft;
    var upperY = root.offsetTop + root.clientTop;
    this.screenCTM.e = upperX - scroll.left;
    this.screenCTM.f = upperY - scroll.top;
  }
  return this.screenCTM;
}, getDimensions:function() {
  return Element.getDimensions(this.node);
}, getShapesWithSharedParent:function(elements) {
  if (!elements || elements.length < 1) {
    return[];
  }
  if (elements.length == 1) {
    return elements;
  }
  return elements.findAll(function(value) {
    var parentShape = value.parent;
    while (parentShape) {
      if (elements.member(parentShape)) {
        return false;
      }
      parentShape = parentShape.parent;
    }
    return true;
  });
}, setSize:function(size, callback) {
  var dimensions = size;
  if (!size) {
    var b = this.bounds.lowerRight();
    dimensions = {width:b.x, height:b.y};
  }
  var b = this.bbox.lowerRight();
  if (dimensions.width < b.x + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE) {
    dimensions.width = b.x + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE;
  }
  if (dimensions.height < b.y + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE) {
    dimensions.height = b.y + ORCHESTRATOR.CONFIG.BOUNDARY_SPACE;
  }
  var minX = this.root.clientWidth;
  var minY = this.root.clientHeight - 5;
  if (dimensions.width > minX) {
    minY = minY - ORCHESTRATOR.CONFIG.SCROLLBAR_WIDTH;
  }
  if (dimensions.width < minX) {
    dimensions.width = minX;
  }
  if (dimensions.height < minY) {
    dimensions.height = minY;
  }
  this.paper.setSize(1, 1);
  window.setTimeout(function() {
    this.paper.setSize(dimensions.width, dimensions.height);
    if (callback) {
      callback.apply();
    }
  }.bind(this), 100);
  this.bounds.set({a:{x:0, y:0}, b:{x:dimensions.width, y:dimensions.height}});
}, moveBy:function(x, y) {
  this.getChildNodes(false, function(shape) {
    shape.bounds.moveBy(x, y);
  });
  var edges = this.getChildEdges().findAll(function(edge) {
    return edge.getAllDockedShapes().length > 0;
  });
  var dockers = edges.collect(function(edge) {
    return edge.dockers.findAll(function(docker) {
      return!docker.getDockedShape();
    });
  }).flatten();
  dockers.each(function(docker) {
    docker.bounds.moveBy(x, y);
  });
  this.update();
  this.bbox.moveBy(x, y);
}, _delegateEvent:function(event) {
  if (this.eventHandlerCallback && (event.target == this.node || event.target == this.node.parentNode)) {
    this.eventHandlerCallback(event, this);
  }
}, toString:function() {
  return "Canvas " + this.id;
}, toJSON:function() {
  var json = arguments.callee.$.toJSON.apply(this, arguments);
  json.stencilset = {url:this.getStencil().stencilSet().source(), namespace:this.getStencil().stencilSet().namespace()};
  return json;
}};
ORYX.Core.Canvas = ORYX.Core.AbstractShape.extend(ORYX.Core.Canvas);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Shape = {construct:function(options, stencil) {
  arguments.callee.$.construct.apply(this, arguments);
  this.dockers = [];
  this.magnets = [];
  this.incoming = [];
  this.outgoing = [];
  this.nodes = [];
  this._dockerChangedCallback = this._dockerChanged.bind(this);
  this._labels = new ORYX.Hash;
}, update:function() {
}, _update:function() {
}, refresh:function() {
  arguments.callee.$.refresh.apply(this, arguments);
  var me = this;
  this.propertiesChanged.each(function(propChanged) {
    if (propChanged.value) {
      var prop = this.properties.get(propChanged.key);
      var property = this.getStencil().property(propChanged.key);
      if (property != undefined) {
        this.propertiesChanged.set(propChanged.key, false);
        if (property.type() == ORCHESTRATOR.TYPES.CHOICE) {
          property.refToView().each(function(ref) {
            if (ref !== "") {
              var label = this._labels.get(this.id + ref);
              if (label && property.item(prop)) {
                label.text(property.item(prop).title());
              }
            }
          }.bind(this));
        } else {
          property.refToView().each(function(ref) {
            if (ref === "") {
              return;
            }
            var refId = this.id + ref;
            if (property.complexAttributeToView()) {
              var label = this._labels.get(refId);
              if (label) {
                try {
                  propJson = prop.evalJSON();
                  var value = propJson[property.complexAttributeToView()];
                  label.text(value ? value : prop);
                } catch (e) {
                  label.text(prop);
                }
              }
            } else {
              switch(property.type()) {
                case ORCHESTRATOR.TYPES.STRING:
                ;
                case ORCHESTRATOR.TYPES.INTEGER:
                ;
                case ORCHESTRATOR.TYPES.FLOAT:
                  var label = this._labels.get(refId);
                  if (label) {
                    label.text(prop);
                  }
                  break;
              }
            }
          }.bind(this));
        }
      }
    }
  }.bind(this));
  this._labels.values().each(function(label) {
    label.update();
  });
}, layout:function() {
  var layoutEvents = this.getStencil().layout();
  if (layoutEvents) {
    layoutEvents.each(function(event) {
      event.shape = this;
      event.forceExecution = true;
      this._delegateEvent(event);
    }.bind(this));
  }
}, getLabels:function() {
  return this._labels.values();
}, getLabel:function(ref) {
  if (!ref) {
    return null;
  }
  return(this._labels.find(function(o) {
    return o.key.endsWith(ref);
  }) || {}).value || null;
}, hideLabels:function() {
  this.getLabels().invoke("hide");
}, showLabels:function() {
  var labels = this.getLabels();
  labels.invoke("show");
  labels.each(function(label) {
    label.update();
  });
}, getDockers:function() {
  return this.dockers;
}, getMagnets:function() {
  return this.magnets;
}, getDefaultMagnet:function() {
  if (this._defaultMagnet) {
    return this._defaultMagnet;
  } else {
    if (this.magnets.length > 0) {
      return this.magnets[0];
    } else {
      return undefined;
    }
  }
}, getParentShape:function() {
  return this.parent;
}, getIncomingShapes:function(iterator) {
  if (iterator) {
    this.incoming.each(iterator);
  }
  return this.incoming;
}, getIncomingNodes:function(iterator) {
  return this.incoming.select(function(incoming) {
    var isNode = incoming instanceof ORYX.Core.Node;
    if (isNode && iterator) {
      iterator(incoming);
    }
    return isNode;
  });
}, getOutgoingShapes:function(iterator) {
  if (iterator) {
    this.outgoing.each(iterator);
  }
  return this.outgoing;
}, getOutgoingNodes:function(iterator) {
  return this.outgoing.select(function(out) {
    var isNode = out instanceof ORYX.Core.Node;
    if (isNode && iterator) {
      iterator(out);
    }
    return isNode;
  });
}, getAllDockedShapes:function(iterator) {
  var result = this.incoming.concat(this.outgoing);
  if (iterator) {
    result.each(iterator);
  }
  return result;
}, getCanvas:function() {
  if (this.parent instanceof ORYX.Core.Canvas) {
    return this.parent;
  } else {
    if (this.parent instanceof ORYX.Core.Shape) {
      return this.parent.getCanvas();
    } else {
      return undefined;
    }
  }
}, getChildNodes:function(deep, iterator) {
  if (!deep && !iterator) {
    return this.nodes.clone();
  } else {
    var result = [];
    this.nodes.each(function(uiObject) {
      if (!uiObject.isVisible) {
        return;
      }
      if (iterator) {
        iterator(uiObject);
      }
      result.push(uiObject);
      if (deep && uiObject instanceof ORYX.Core.Shape) {
        result = result.concat(uiObject.getChildNodes(deep, iterator));
      }
    });
    return result;
  }
}, add:function(uiObject, index, silent) {
  if (uiObject instanceof ORYX.Core.UIObject && !(uiObject instanceof ORYX.Core.Edge)) {
    if (!this.children.member(uiObject)) {
      if (uiObject.parent) {
        uiObject.parent.remove(uiObject, true);
      }
      if (index != undefined) {
        this.children.splice(index, 0, uiObject);
      } else {
        this.children.push(uiObject);
      }
      uiObject.parent = this;
      if (uiObject instanceof ORYX.Core.Node) {
        this.nodes.push(uiObject);
        uiObject.show();
      } else {
        if (uiObject instanceof ORYX.Core.Controls.Control) {
          if (uiObject instanceof ORYX.Core.Controls.Docker) {
            if (this.dockers.length >= 2) {
              this.dockers.splice(index !== undefined ? Math.min(index, this.dockers.length - 1) : this.dockers.length - 1, 0, uiObject);
            } else {
              this.dockers.push(uiObject);
            }
          } else {
            if (uiObject instanceof ORYX.Core.Controls.Magnet) {
              this.magnets.push(uiObject);
            }
          }
        }
      }
      this._changed();
      if (this.eventHandlerCallback && silent !== true) {
        this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEADDED, shape:uiObject});
      }
    } else {
      ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
    }
  } else {
    ORYX.Log.warn("add: Parameter is not of type ORYX.Core.UIObject.");
  }
}, remove:function(uiObject, silent) {
  if (this.children.member(uiObject)) {
    var parent = uiObject.parent;
    this.children = this.children.without(uiObject);
    uiObject.parent = undefined;
    uiObject.hide();
    if (uiObject instanceof ORYX.Core.Shape) {
      if (!(uiObject instanceof ORYX.Core.Edge)) {
        this.nodes = this.nodes.without(uiObject);
      }
    } else {
      if (uiObject instanceof ORYX.Core.Controls.Control) {
        if (uiObject instanceof ORYX.Core.Controls.Docker) {
          this.dockers = this.dockers.without(uiObject);
        } else {
          if (uiObject instanceof ORYX.Core.Controls.Magnet) {
            this.magnets = this.magnets.without(uiObject);
          }
        }
      }
    }
    if (this.eventHandlerCallback && silent !== true) {
      this.eventHandlerCallback({type:ORCHESTRATOR.EVENTS.SHAPEREMOVED, shape:uiObject, parent:parent});
    }
    this._changed();
  } else {
    ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
  }
}, getIntersectionPoint:function() {
  var pointAX, pointAY, pointBX, pointBY;
  switch(arguments.length) {
    case 2:
      pointAX = arguments[0].x;
      pointAY = arguments[0].y;
      pointBX = arguments[1].x;
      pointBY = arguments[1].y;
      break;
    case 4:
      pointAX = arguments[0];
      pointAY = arguments[1];
      pointBX = arguments[2];
      pointBY = arguments[3];
      break;
    default:
      throw "getIntersectionPoints needs two or four arguments";;
  }
  var includePointX, includePointY, excludePointX, excludePointY;
  var bounds = this.absoluteBounds();
  if (this.isPointIncluded(pointAX, pointAY, bounds)) {
    includePointX = pointAX;
    includePointY = pointAY;
  } else {
    excludePointX = pointAX;
    excludePointY = pointAY;
  }
  if (this.isPointIncluded(pointBX, pointBY, bounds)) {
    includePointX = pointBX;
    includePointY = pointBY;
  } else {
    excludePointX = pointBX;
    excludePointY = pointBY;
  }
  if (!includePointX || (!includePointY || (!excludePointX || !excludePointY))) {
    return undefined;
  }
  var midPointX = 0;
  var midPointY = 0;
  var refPointX, refPointY;
  var minDifferent = 1;
  var i = 0;
  while (true) {
    var midPointX = Math.min(includePointX, excludePointX) + (Math.max(includePointX, excludePointX) - Math.min(includePointX, excludePointX)) / 2;
    var midPointY = Math.min(includePointY, excludePointY) + (Math.max(includePointY, excludePointY) - Math.min(includePointY, excludePointY)) / 2;
    if (this.isPointIncluded(midPointX, midPointY, bounds)) {
      includePointX = midPointX;
      includePointY = midPointY;
    } else {
      excludePointX = midPointX;
      excludePointY = midPointY;
    }
    var length = Math.sqrt(Math.pow(includePointX - excludePointX, 2) + Math.pow(includePointY - excludePointY, 2));
    if (length < 1) {
      refPointX = includePointX;
      refPointY = includePointY;
      break;
    }
    refPointX = includePointX + (excludePointX - includePointX) / length, refPointY = includePointY + (excludePointY - includePointY) / length;
    if (!this.isPointIncluded(refPointX, refPointY, bounds)) {
      break;
    }
  }
  return{x:refPointX, y:refPointY};
}, isPointIncluded:function() {
  return false;
}, isPointOverOffset:function() {
  return this.isPointIncluded.apply(this, arguments);
}, _dockerChanged:function() {
}, createDocker:function(index, position) {
  var docker = new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback, paper:this.paper});
  docker.bounds.registerCallback(this._dockerChangedCallback);
  if (position) {
    docker.bounds.centerMoveTo(position);
  }
  this.add(docker, index);
  return docker;
}, serialize:function() {
  var serializedObject = arguments.callee.$.serialize.apply(this);
  serializedObject.push({name:"bounds", value:this.bounds.serializeForERDF(), type:"literal"});
  this.getOutgoingShapes().each(function(followingShape) {
    serializedObject.push({name:"outgoing", value:"#" + ERDF.__stripHashes(followingShape.resourceId), type:"resource"});
  }.bind(this));
  serializedObject.push({name:"parent", value:"#" + ERDF.__stripHashes(this.parent.resourceId), type:"resource"});
  return serializedObject;
}, deserialize:function(serialize, json) {
  arguments.callee.$.deserialize.apply(this, arguments);
  var bounds = serialize.find(function(ser) {
    return "bounds" === ser.name;
  });
  if (bounds) {
    var b = bounds.value.replace(/,/g, " ").split(" ").without("");
    b[0] = parseFloat(b[0]);
    b[1] = parseFloat(b[1]);
    b[2] = parseFloat(b[2]);
    b[3] = parseFloat(b[3]);
    if (!isNaN(b[0]) && (!isNaN(b[1]) && (!isNaN(b[2]) && !isNaN(b[3])))) {
      if (this instanceof ORYX.Core.Edge) {
        if (!this.dockers[0].isChanged) {
          this.dockers[0].bounds.centerMoveTo(b[0], b[1]);
        }
        if (!this.dockers.last().isChanged) {
          this.dockers.last().bounds.centerMoveTo(b[2], b[3]);
        }
      } else {
        this.bounds.set(b[0], b[1], b[2], b[3]);
      }
    }
  }
  if (json && json.labels instanceof Array) {
    json.labels.each(function(slabel) {
      var label = this.getLabel(slabel.ref);
      if (label) {
        label.deserialize(slabel, this);
      }
    }.bind(this));
  }
}, toJSON:function() {
  var json = arguments.callee.$.toJSON.apply(this, arguments);
  var labels = [], id = this.id;
  this._labels.each(function(obj) {
    var slabel = obj.value.serialize();
    if (slabel) {
      slabel.ref = obj.key.replace(id, "");
      labels.push(slabel);
    }
  });
  if (labels.length > 0) {
    json.labels = labels;
  }
  return json;
}, _init:function() {
}, toString:function() {
  return "ORYX.Core.Shape " + this.getId();
}};
ORYX.Core.Shape = ORYX.Core.AbstractShape.extend(ORYX.Core.Shape);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Controls) {
  ORYX.Core.Controls = {};
}
ORYX.Core.Controls.Docker = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this.isMovable = true;
  this.bounds.set(0, 0, 16, 16);
  this.referencePoint = undefined;
  this._dockedShapeBounds = undefined;
  this._dockedShape = undefined;
  this._oldRefPoint1 = undefined;
  this._oldRefPoint2 = undefined;
  this._dockerNode = this.paper.circle(8, 8, 3).attr({stroke:"black", fill:"red", "stroke-width":"1"});
  this.raphael = this.paper.set().push(this._dockerNode);
  this.addEventHandlers(this._dockerNode.node);
  this.hide();
  this._updateCallback = this._changed.bind(this);
}, update:function() {
  if (this._dockedShape) {
    if (this._dockedShapeBounds && this._dockedShape instanceof ORYX.Core.Node) {
      var dswidth = this._dockedShapeBounds.width();
      var dsheight = this._dockedShapeBounds.height();
      if (!dswidth) {
        dswidth = 1;
      }
      if (!dsheight) {
        dsheight = 1;
      }
      var widthDelta = this._dockedShape.bounds.width() / dswidth;
      var heightDelta = this._dockedShape.bounds.height() / dsheight;
      if (widthDelta !== 1 || heightDelta !== 1) {
        this.referencePoint.x *= widthDelta;
        this.referencePoint.y *= heightDelta;
      }
      this._dockedShapeBounds = this._dockedShape.bounds.clone();
    }
    var dockerIndex = this.parent.dockers.indexOf(this);
    var dock1 = this;
    var dock2 = this.parent.dockers.length > 1 ? dockerIndex === 0 ? this.parent.dockers[dockerIndex + 1] : this.parent.dockers[dockerIndex - 1] : undefined;
    var absoluteReferenzPoint1 = dock1.getDockedShape() ? dock1.getAbsoluteReferencePoint() : dock1.bounds.center();
    var absoluteReferenzPoint2 = dock2 && dock2.getDockedShape() ? dock2.getAbsoluteReferencePoint() : dock2 ? dock2.bounds.center() : undefined;
    if (!absoluteReferenzPoint2) {
      var center = this._dockedShape.absoluteCenterXY();
      var distx = center.x - absoluteReferenzPoint1.x;
      var disty = center.y - absoluteReferenzPoint1.y;
      var ul = this._dockedShape.bounds.upperLeft();
      var lr = this._dockedShape.bounds.lowerRight();
      if (this._dockedShape.bounds.width() - Math.abs(distx) * 2 < this._dockedShape.bounds.height() - Math.abs(disty) * 2) {
        absoluteReferenzPoint2 = {x:distx > 0 ? ul.x - 1 : lr.x + 1, y:absoluteReferenzPoint1.y};
      } else {
        absoluteReferenzPoint2 = {x:absoluteReferenzPoint1.x, y:disty > 0 ? ul.y - 1 : lr.y + 1};
      }
    }
    var newPoint = undefined;
    newPoint = this._dockedShape.getIntersectionPoint(absoluteReferenzPoint1, absoluteReferenzPoint2);
    if (!newPoint) {
      newPoint = this.getAbsoluteReferencePoint();
    }
    if (this.parent && this.parent.parent) {
      var grandParentPos = this.parent.parent.absoluteXY();
      newPoint.x -= grandParentPos.x;
      newPoint.y -= grandParentPos.y;
    }
    this.bounds.centerMoveTo(newPoint);
    this._oldRefPoint1 = absoluteReferenzPoint1;
    this._oldRefPoint2 = absoluteReferenzPoint2;
  }
  arguments.callee.$.update.apply(this, arguments);
}, refresh:function() {
  arguments.callee.$.refresh.apply(this, arguments);
  var p = this.bounds.upperLeft();
  this.raphael.transform("t" + p.x + ", " + p.y);
  p = Object.clone(this.referencePoint);
  if (p && this._dockedShape) {
    var upL;
    if (this.parent instanceof ORYX.Core.Edge) {
      upL = this._dockedShape.absoluteXY();
    } else {
      upL = this._dockedShape.bounds.upperLeft();
    }
    p.x += upL.x;
    p.y += upL.y;
  } else {
    p = this.bounds.center();
  }
}, setReferencePoint:function(point) {
  if (this.referencePoint !== point && (!this.referencePoint || (!point || (this.referencePoint.x !== point.x || this.referencePoint.y !== point.y)))) {
    this.referencePoint = point;
    this._changed();
  }
}, getAbsoluteReferencePoint:function() {
  if (!this.referencePoint || !this._dockedShape) {
    return undefined;
  } else {
    var absUL = this._dockedShape.absoluteXY();
    return{x:this.referencePoint.x + absUL.x, y:this.referencePoint.y + absUL.y};
  }
}, setDockedShape:function(shape) {
  if (this._dockedShape) {
    this._dockedShape.bounds.unregisterCallback(this._updateCallback);
    if (this === this.parent.dockers[0]) {
      this.parent.incoming = this.parent.incoming.without(this._dockedShape);
      this._dockedShape.outgoing = this._dockedShape.outgoing.without(this.parent);
    } else {
      if (this === this.parent.dockers.last()) {
        this.parent.outgoing = this.parent.outgoing.without(this._dockedShape);
        this._dockedShape.incoming = this._dockedShape.incoming.without(this.parent);
      }
    }
  }
  this._dockedShape = shape;
  this._dockedShapeBounds = undefined;
  var referencePoint = undefined;
  if (this._dockedShape) {
    if (this === this.parent.dockers[0]) {
      this.parent.incoming.push(shape);
      shape.outgoing.push(this.parent);
    } else {
      if (this === this.parent.dockers.last()) {
        this.parent.outgoing.push(shape);
        shape.incoming.push(this.parent);
      }
    }
    var bounds = this.bounds;
    var absUL = shape.absoluteXY();
    referencePoint = {x:bounds.center().x - absUL.x, y:bounds.center().y - absUL.y};
    this._dockedShapeBounds = this._dockedShape.bounds.clone();
    this._dockedShape.bounds.registerCallback(this._updateCallback);
    this.setDockerColor(ORCHESTRATOR.CONFIG.DOCKER_DOCKED_COLOR);
  } else {
    this.setDockerColor(ORCHESTRATOR.CONFIG.DOCKER_UNDOCKED_COLOR);
  }
  this.setReferencePoint(referencePoint);
  this._changed();
}, getDockedShape:function() {
  return this._dockedShape;
}, isDocked:function() {
  return!!this._dockedShape;
}, setDockerColor:function(color) {
  this._dockerNode.attr("fill", color);
}, preventHiding:function(prevent) {
  this._preventHiding = Math.max(0, (this._preventHiding || 0) + (prevent ? 1 : -1));
}, toString:function() {
  return "Docker " + this.id;
}};
ORYX.Core.Controls.Docker = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Docker);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Controls) {
  ORYX.Core.Controls = {};
}
ORYX.Core.Controls.Magnet = {construct:function() {
  arguments.callee.$.construct.apply(this, arguments);
  this.bounds.set(0, 0, 16, 16);
  this.raphael = this.paper.set().push(this.paper.circle(8, 8, 4)).attr({stroke:"none", fill:"red", "fill-opacity":"0.3"});
  this.hide();
}, update:function() {
  arguments.callee.$.update.apply(this, arguments);
}, _update:function() {
  arguments.callee.$.update.apply(this, arguments);
}, refresh:function() {
  arguments.callee.$.refresh.apply(this, arguments);
  var p = this.absoluteBounds().upperLeft();
  this.raphael.transform("t" + p.x + ", " + p.y).toFront();
}, toString:function() {
  return "Magnet " + this.id;
}};
ORYX.Core.Controls.Magnet = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Magnet);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Controls) {
  ORYX.Core.Controls = {};
}
ORYX.Core.Controls.Icon = {construct:function(options) {
  arguments.callee.$.construct.apply(this, arguments);
  this.name = options.name;
  this.click = options.click;
  this.bounds.set(-32, -32, 0, 0);
}, redraw:function(paper) {
  this.icon = paper.path(ORCHESTRATOR.icon[this.name]).attr({fill:"#333", stroke:"none", opacity:0.5}).transform("T-32,-32");
  this.snap = paper.rect(0, 0, 32, 32).attr({fill:"#000", opacity:0}).transform("T-32,-32");
  this.raphael = paper.set().push(this.icon);
  if (this.click) {
    this.icon.click(this.click);
    this.snap.click(this.click);
  }
  this.icon.hover(this.hoverIn.bind(this), this.hoverOut.bind(this));
  this.snap.hover(this.hoverIn.bind(this), this.hoverOut.bind(this));
  this.hide();
}, hoverIn:function() {
  this.icon.attr({opacity:1});
}, hoverOut:function() {
  this.icon.attr({opacity:0.5});
}, hide:function() {
  arguments.callee.$.hide.apply(this, arguments);
  this.icon.unclick(this.click);
  this.snap.unclick(this.click);
}, show:function() {
  if (!this.isVisible) {
    arguments.callee.$.show.apply(this, arguments);
    this.icon.click(this.click);
    this.snap.click(this.click);
  }
}, update:function() {
  arguments.callee.$.update.apply(this, arguments);
}, _update:function() {
  arguments.callee.$.update.apply(this, arguments);
}, refresh:function() {
  arguments.callee.$.refresh.apply(this, arguments);
  var p = this.absoluteBounds().upperLeft();
  this.icon.transform("t" + p.x + ", " + p.y).toFront();
  this.snap.transform("t" + p.x + ", " + p.y).toFront();
}, toString:function() {
  return "Icon " + this.id;
}};
ORYX.Core.Controls.Icon = ORYX.Core.Controls.Control.extend(ORYX.Core.Controls.Icon);
ORYX.Core.Controls.Button = {construct:function(options) {
  this.facade = options.facade;
  options.eventHandlerCallback = options.eventHandlerCallback || this.facade.getEventHandler();
  arguments.callee.$.construct.apply(this, arguments);
  this.pos = options.pos;
}, redraw:function(paper) {
  this.root = this.facade.getRootNode();
  arguments.callee.$.redraw.apply(this, arguments);
}, show:function() {
  var x, y;
  var upperLeft = this.facade.eventCoordinates({clientX:this.root.clientLeft + this.root.offsetLeft, clientY:this.root.clientTop + this.root.offsetTop});
  var lowerRight = {x:upperLeft.x + this.root.clientWidth, y:upperLeft.y + this.root.clientHeight};
  var center = {x:(upperLeft.x + lowerRight.x) / 2, y:(upperLeft.y + lowerRight.y) / 2};
  if (this.pos.dirX) {
    x = center.x + this.pos.x;
    if (this.pos.y < 0) {
      y = lowerRight.y + this.pos.y;
    } else {
      y = upperLeft.y;
    }
  } else {
    if (this.pos.dirY) {
      y = center.y + this.pos.y;
      if (this.pos.x < 0) {
        x = lowerRight.x + this.pos.x;
      } else {
        x = upperLeft.x;
      }
    } else {
      if (this.pos.x < 0) {
        x = lowerRight.x + this.pos.x;
      } else {
        x = upperLeft.x;
      }
      if (this.pos.y < 0) {
        y = lowerRight.y + this.pos.y;
      } else {
        y = upperLeft.y;
      }
    }
  }
  this.bounds.moveTo(x, y);
  this.refresh();
  arguments.callee.$.show.apply(this, arguments);
}, hide:function() {
  arguments.callee.$.hide.apply(this, arguments);
}};
ORYX.Core.Controls.Button = ORYX.Core.Controls.Icon.extend(ORYX.Core.Controls.Button);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Node = {construct:function(options, stencil) {
  arguments.callee.$.construct.apply(this, arguments);
  this.isSelectable = true;
  this.isMovable = true;
  this._dockerUpdated = false;
  this._oldBounds = new ORYX.Core.Bounds;
  this._svgShapes = [];
  this.minimumSize = undefined;
  this.maximumSize = undefined;
  this.isHorizontallyResizable = false;
  this.isVerticallyResizable = false;
  this.dataId = undefined;
  try {
    this._init();
  } catch (e) {
    ORYX.Log.error("Failed to init node %0(%1)", this.resourceId, stencil._jsonStencil.id);
    ORYX.Log.exception(e);
  }
}, _update:function() {
  this.dockers.invoke("update");
  if (this.isChanged) {
    var bounds = this.bounds;
    var oldBounds = this._oldBounds;
    if (this.isResized) {
      var p = {x:0, y:0};
      if (!this.isHorizontallyResizable && bounds.width() !== oldBounds.width()) {
        p.x = oldBounds.width() - bounds.width();
      }
      if (!this.isVerticallyResizable && bounds.height() !== oldBounds.height()) {
        p.y = oldBounds.height() - bounds.height();
      }
      if (p.x !== 0 || p.y !== 0) {
        bounds.extend(p);
      }
      p = {x:0, y:0};
      var widthDifference, heightDifference;
      if (this.minimumSize) {
        ORYX.Log.trace("Shape (%0)'s min size: (%1x%2)", this, this.minimumSize.width, this.minimumSize.height);
        widthDifference = this.minimumSize.width - bounds.width();
        if (widthDifference > 0) {
          p.x += widthDifference;
        }
        heightDifference = this.minimumSize.height - bounds.height();
        if (heightDifference > 0) {
          p.y += heightDifference;
        }
      }
      if (this.maximumSize) {
        ORYX.Log.trace("Shape (%0)'s max size: (%1x%2)", this, this.maximumSize.width, this.maximumSize.height);
        widthDifference = bounds.width() - this.maximumSize.width;
        if (widthDifference > 0) {
          p.x -= widthDifference;
        }
        heightDifference = bounds.height() - this.maximumSize.height;
        if (heightDifference > 0) {
          p.y -= heightDifference;
        }
      }
      if (p.x !== 0 || p.y !== 0) {
        bounds.extend(p);
      }
      var widthDelta = bounds.width() / oldBounds.width();
      var heightDelta = bounds.height() / oldBounds.height();
      this._svgShapes.each(function(svgShape) {
        if (svgShape.isHorizontallyResizable) {
          svgShape.width = svgShape.oldWidth * widthDelta;
        }
        if (svgShape.isVerticallyResizable) {
          svgShape.height = svgShape.oldHeight * heightDelta;
        }
        var anchorOffset;
        var leftIncluded = svgShape.anchorLeft;
        var rightIncluded = svgShape.anchorRight;
        if (rightIncluded) {
          anchorOffset = oldBounds.width() - (svgShape.oldX + svgShape.oldWidth);
          if (leftIncluded) {
            svgShape.width = bounds.width() - svgShape.x - anchorOffset;
          } else {
            svgShape.x = bounds.width() - (anchorOffset + svgShape.width);
          }
        } else {
          if (!leftIncluded) {
            if (!svgShape.isHorizontallyResizable) {
              svgShape.x = svgShape.x + bounds.width() / 2 - oldBounds.width() / 2;
            } else {
              svgShape.x = widthDelta * svgShape.oldX;
            }
          }
        }
        var topIncluded = svgShape.anchorTop;
        var bottomIncluded = svgShape.anchorBottom;
        if (bottomIncluded) {
          anchorOffset = oldBounds.height() - (svgShape.oldY + svgShape.oldHeight);
          if (topIncluded) {
            svgShape.height = bounds.height() - svgShape.y - anchorOffset;
          } else {
            if (!svgShape._isYLocked) {
              svgShape.y = bounds.height() - (anchorOffset + svgShape.height);
            }
          }
        } else {
          if (!topIncluded) {
            if (!svgShape.isVerticallyResizable) {
              svgShape.y = svgShape.y + bounds.height() / 2 - oldBounds.height() / 2;
            } else {
              svgShape.y = heightDelta * svgShape.oldY;
            }
          }
        }
      });
      var widthDelta = bounds.width() / oldBounds.width();
      var heightDelta = bounds.height() / oldBounds.height();
      var leftIncluded, rightIncluded, topIncluded, bottomIncluded, center, newX, newY;
      this.magnets.each(function(magnet) {
        leftIncluded = magnet.anchorLeft;
        rightIncluded = magnet.anchorRight;
        topIncluded = magnet.anchorTop;
        bottomIncluded = magnet.anchorBottom;
        center = magnet.bounds.center();
        if (leftIncluded) {
          newX = center.x;
        } else {
          if (rightIncluded) {
            newX = bounds.width() - (oldBounds.width() - center.x);
          } else {
            newX = center.x * widthDelta;
          }
        }
        if (topIncluded) {
          newY = center.y;
        } else {
          if (bottomIncluded) {
            newY = bounds.height() - (oldBounds.height() - center.y);
          } else {
            newY = center.y * heightDelta;
          }
        }
        if (center.x !== newX || center.y !== newY) {
          magnet.bounds.centerMoveTo(newX, newY);
        }
      });
      this.getLabels().each(function(label) {
        if (!label.isAnchorLeft()) {
          if (label.isAnchorRight()) {
            label.setX(bounds.width() - (oldBounds.width() - label.oldX));
          } else {
            label.setX((label.position ? label.position.x : label.x) * widthDelta);
          }
        }
        if (!label.isAnchorTop()) {
          if (label.isAnchorBottom()) {
            label.setY(bounds.height() - (oldBounds.height() - label.oldY));
          } else {
            label.setY((label.position ? label.position.y : label.y) * heightDelta);
          }
        }
        if (label.position) {
          if (!label.isOriginAnchorLeft()) {
            if (label.isOriginAnchorRight()) {
              label.setOriginX(bounds.width() - (oldBounds.width() - label.oldX));
            } else {
              label.setOriginX(label.x * widthDelta);
            }
          }
          if (!label.isOriginAnchorTop()) {
            if (label.isOriginAnchorBottom()) {
              label.setOriginY(bounds.height() - (oldBounds.height() - label.oldY));
            } else {
              label.setOriginY(label.y * heightDelta);
            }
          }
        }
      });
      var docker = this.dockers[0];
      if (docker) {
        docker.bounds.unregisterCallback(this._dockerChangedCallback);
        if (!this._dockerUpdated) {
          docker.bounds.centerMoveTo(this.bounds.center());
          this._dockerUpdated = false;
        }
        docker.update();
        docker.bounds.registerCallback(this._dockerChangedCallback);
      }
      this.isResized = false;
    }
    this.refresh();
    this.isChanged = false;
    this._oldBounds = this.bounds.clone();
  }
  this.children.each(function(value) {
    if (!(value instanceof ORYX.Core.Controls.Docker)) {
      value._update();
    }
  });
  if (this.dockers.length > 0 && !this.dockers[0].getDockedShape()) {
    this.dockers.each(function(docker) {
      docker.bounds.centerMoveTo(this.bounds.center());
    }.bind(this));
  }
}, refresh:function(options) {
  if (!this.raphael) {
    return;
  }
  this._svgShapes.each(function(svgShape) {
    svgShape.refresh(options);
  });
  var p = this.absoluteBounds().upperLeft();
  this.raphael.forEach(function(el) {
    el.transform("t" + p.x + ", " + p.y).toFront();
  });
  arguments.callee.$.refresh.apply(this, arguments);
  this.outgoing.each(function(obj) {
    obj.refresh();
  });
}, _dockerChanged:function() {
  var docker = this.dockers[0];
  this.bounds.centerMoveTo(docker.bounds.center());
  this._dockerUpdated = true;
}, _initSVGShapes:function() {
  var svgShapes = [];
  this.raphael.forEach(function(svgNode) {
    try {
      var svgShape = new ORYX.Core.SVG.SVGShape(svgNode);
      svgShapes.push(svgShape);
    } catch (e) {
    }
  });
  return svgShapes;
}, isPointIncluded:function(pointX, pointY, absoluteBounds) {
  var absBounds = absoluteBounds && absoluteBounds instanceof ORYX.Core.Bounds ? absoluteBounds : this.absoluteBounds();
  if (!absBounds.isIncluded(pointX, pointY)) {
    return false;
  } else {
  }
  var ul = absBounds.upperLeft();
  var x = pointX - ul.x;
  var y = pointY - ul.y;
  var i = 0;
  do {
    var isPointIncluded = this._svgShapes[i++].isPointIncluded(x, y)
  } while (!isPointIncluded && i < this._svgShapes.length);
  return isPointIncluded;
}, isPointOverOffset:function(pointX, pointY) {
  var isOverEl = arguments.callee.$.isPointOverOffset.apply(this, arguments);
  if (isOverEl) {
    var absBounds = this.absoluteBounds();
    absBounds.widen(-ORCHESTRATOR.CONFIG.BORDER_OFFSET);
    if (!absBounds.isIncluded(pointX, pointY)) {
      return true;
    }
  }
  return false;
}, serialize:function() {
  var result = arguments.callee.$.serialize.apply(this);
  this.dockers.each(function(docker) {
    if (docker.getDockedShape()) {
      var center = docker.referencePoint;
      center = center ? center : docker.bounds.center();
      result.push({name:"docker", value:$H(center).values().join(","), type:"literal"});
    }
  }.bind(this));
  try {
    var serializeEvent = this.getStencil().serialize();
    if (serializeEvent.type) {
      serializeEvent.shape = this;
      serializeEvent.data = result;
      serializeEvent.result = undefined;
      serializeEvent.forceExecution = true;
      this._delegateEvent(serializeEvent);
      if (serializeEvent.result) {
        result = serializeEvent.result;
      }
    }
  } catch (e) {
  }
  return result;
}, deserialize:function(data) {
  arguments.callee.$.deserialize.apply(this, arguments);
  try {
    var deserializeEvent = this.getStencil().deserialize();
    if (deserializeEvent.type) {
      deserializeEvent.shape = this;
      deserializeEvent.data = data;
      deserializeEvent.result = undefined;
      deserializeEvent.forceExecution = true;
      this._delegateEvent(deserializeEvent);
      if (deserializeEvent.result) {
        data = deserializeEvent.result;
      }
    }
  } catch (e) {
  }
  var outgoing = data.findAll(function(ser) {
    return ser.name == "outgoing";
  });
  outgoing.each(function(obj) {
    if (!this.parent) {
      return;
    }
    var next = this.getCanvas().getChildShapeByResourceId(obj.value);
    if (next) {
      if (next instanceof ORYX.Core.Edge) {
        next.dockers[0].setDockedShape(this);
        next.dockers[0].setReferencePoint(next.dockers[0].bounds.center());
      } else {
        if (next.dockers.length > 0) {
          next.dockers[0].setDockedShape(this);
        }
      }
    }
  }.bind(this));
  if (this.dockers.length === 1) {
    var dockerPos;
    dockerPos = data.find(function(entry) {
      return entry.name === "dockers";
    });
    if (dockerPos) {
      var points = dockerPos.value.replace(/,/g, " ").split(" ").without("").without("#");
      x = parseFloat(points[0]);
      y = parseFloat(points[1]);
      if (!isNaN(x) && !isNaN(y)) {
        if (points.length === 2 && this.dockers[0].getDockedShape()) {
          this.dockers[0].setReferencePoint({x:x, y:y});
        } else {
          this.dockers[0].bounds.centerMoveTo(x, y);
        }
      }
    }
  }
}, _init:function() {
  arguments.callee.$._init.apply(this, arguments);
  var me = this;
  this.raphael = this._stencil._jsonStencil.raphael(this.paper);
  this.raphael.forEach(function(el) {
    me.addEventHandlers(el.node);
  });
  if (this._stencil._jsonStencil.minimumSize) {
    this.minimumSize = this._stencil._jsonStencil.minimumSize;
  }
  if (this._stencil._jsonStencil.maximumSize) {
    this.maximumSize = this._stencil._jsonStencil.maximumSize;
  }
  if (this.minimumSize && (this.maximumSize && (this.minimumSize.width > this.maximumSize.width || this.minimumSize.height > this.maximumSize.height))) {
    throw this + ": Minimum Size must be greater than maxiumSize.";
  }
  this._svgShapes = this._initSVGShapes();
  var upperLeft = {x:undefined, y:undefined};
  var lowerRight = {x:undefined, y:undefined};
  this._svgShapes.each(function(svgShape) {
    upperLeft.x = upperLeft.x !== undefined ? Math.min(upperLeft.x, svgShape.x) : svgShape.x;
    upperLeft.y = upperLeft.y !== undefined ? Math.min(upperLeft.y, svgShape.y) : svgShape.y;
    lowerRight.x = lowerRight.x !== undefined ? Math.max(lowerRight.x, svgShape.x + svgShape.width) : svgShape.x + svgShape.width;
    lowerRight.y = lowerRight.y !== undefined ? Math.max(lowerRight.y, svgShape.y + svgShape.height) : svgShape.y + svgShape.height;
    if (svgShape.isHorizontallyResizable) {
      me.isHorizontallyResizable = true;
      me.isResizable = true;
    }
    if (svgShape.isVerticallyResizable) {
      me.isVerticallyResizable = true;
      me.isResizable = true;
    }
    if (svgShape.anchorTop && svgShape.anchorBottom) {
      me.isVerticallyResizable = true;
      me.isResizable = true;
    }
    if (svgShape.anchorLeft && svgShape.anchorRight) {
      me.isHorizontallyResizable = true;
      me.isResizable = true;
    }
  });
  this._svgShapes.each(function(svgShape) {
    svgShape.x -= upperLeft.x;
    svgShape.y -= upperLeft.y;
    svgShape.refresh();
  });
  var offsetX = upperLeft.x;
  var offsetY = upperLeft.y;
  lowerRight.x -= offsetX;
  lowerRight.y -= offsetY;
  upperLeft.x = 0;
  upperLeft.y = 0;
  if (lowerRight.x === 0) {
    lowerRight.x = 1;
  }
  if (lowerRight.y === 0) {
    lowerRight.y = 1;
  }
  this._oldBounds.set(upperLeft, lowerRight);
  this.bounds.set(upperLeft, lowerRight);
  magnets = this._stencil._jsonStencil.magnets;
  if (magnets) {
    magnets.each(function(magnetElem) {
      var magnet = new ORYX.Core.Controls.Magnet({eventHandlerCallback:me.eventHandlerCallback, paper:me.paper});
      magnet.bounds.centerMoveTo({x:magnetElem.cx - offsetX, y:magnetElem.cy - offsetY});
      if (magnetElem.anchors) {
        var anchors = magnetElem.anchors.replace("/,/g", " ");
        anchors = anchors.split(" ").without("");
        for (var i = 0;i < anchors.length;i++) {
          switch(anchors[i].toLowerCase()) {
            case "left":
              magnet.anchorLeft = true;
              break;
            case "right":
              magnet.anchorRight = true;
              break;
            case "top":
              magnet.anchorTop = true;
              break;
            case "bottom":
              magnet.anchorBottom = true;
              break;
          }
        }
      }
      me.add(magnet);
      if (!this._defaultMagnet) {
        if (magnetElem.defaultAnchor && magnetElem.defaultAnchor.toLowerCase() === "yes") {
          me._defaultMagnet = magnet;
        }
      }
    });
  } else {
    var magnet = new ORYX.Core.Controls.Magnet({eventHandlerCallback:me.eventHandlerCallback, paper:me.paper});
    magnet.bounds.centerMoveTo(this.bounds.width() / 2, this.bounds.height() / 2);
    this.add(magnet);
  }
  dockerElem = this._stencil._jsonStencil.docker;
  if (dockerElem) {
    var docker = this.createDocker();
    docker.bounds.centerMoveTo({x:dockerElem.cx - offsetX, y:dockerElem.cy - offsetY});
    if (dockerElem.anchors) {
      var anchors = dockerElem.anchors.replace("/,/g", " ");
      anchors = anchors.split(" ").without("");
      for (var i = 0;i < anchors.length;i++) {
        switch(anchors[i].toLowerCase()) {
          case "left":
            docker.anchorLeft = true;
            break;
          case "right":
            docker.anchorRight = true;
            break;
          case "top":
            docker.anchorTop = true;
            break;
          case "bottom":
            docker.anchorBottom = true;
            break;
        }
      }
    }
  }
  this.raphael.forEach(function(el) {
    if (el.type != "text") {
      return;
    }
    var label = new ORYX.Core.SVG.Label({textElement:el, shapeId:me.id});
    label.x -= offsetX;
    label.y -= offsetY;
    me._labels.set(label.id, label);
    label.registerOnChange(me.layout.bind(me));
  });
}, createDocker:function() {
  var docker = new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback, paper:this.paper});
  docker.bounds.registerCallback(this._dockerChangedCallback);
  this.dockers.push(docker);
  docker.parent = this;
  docker.bounds.registerCallback(this._changedCallback);
  return docker;
}, toString:function() {
  return this._stencil.title() + " " + this.id;
}};
ORYX.Core.Node = ORYX.Core.Shape.extend(ORYX.Core.Node);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
ORYX.Core.Edge = {construct:function(options, stencil) {
  arguments.callee.$.construct.apply(this, arguments);
  this.isMovable = true;
  this.isSelectable = true;
  this._dockerUpdated = false;
  this._paths = [];
  this._snaps = [];
  this._markers = [];
  this._dockersByPath = new ORYX.Hash;
  this.attachedNodePositionData = new ORYX.Hash;
  this._init();
}, _update:function(force) {
  if (this._dockerUpdated || (this.isChanged || force)) {
    this.dockers.invoke("update");
    var upL = this.bounds.upperLeft();
    var oldUpL = this._oldBounds.upperLeft();
    var oldWidth = this._oldBounds.width() === 0 ? this.bounds.width() : this._oldBounds.width();
    var oldHeight = this._oldBounds.height() === 0 ? this.bounds.height() : this._oldBounds.height();
    var diffX = upL.x - oldUpL.x;
    var diffY = upL.y - oldUpL.y;
    var diffWidth = this.bounds.width() / oldWidth || 1;
    var diffHeight = this.bounds.height() / oldHeight || 1;
    this.dockers.each(function(docker) {
      docker.bounds.unregisterCallback(this._dockerChangedCallback);
      if (!this._dockerUpdated) {
        docker.bounds.moveBy(diffX, diffY);
        if (diffWidth !== 1 || diffHeight !== 1) {
          var relX = docker.bounds.upperLeft().x - upL.x;
          var relY = docker.bounds.upperLeft().y - upL.y;
          docker.bounds.moveTo(upL.x + relX * diffWidth, upL.y + relY * diffHeight);
        }
      }
      docker.update();
      docker.bounds.registerCallback(this._dockerChangedCallback);
    }.bind(this));
    if (this._dockerUpdated) {
      var a = this.dockers[0].bounds.center();
      var b = this.dockers[0].bounds.center();
      this.dockers.each(function(docker) {
        var center = docker.bounds.center();
        a.x = Math.min(a.x, center.x);
        a.y = Math.min(a.y, center.y);
        b.x = Math.max(b.x, center.x);
        b.y = Math.max(b.y, center.y);
      }.bind(this));
      this.bounds.set(Object.clone(a), Object.clone(b));
    }
    upL = this.bounds.upperLeft();
    oldUpL = this._oldBounds.upperLeft();
    diffWidth = this.bounds.width() / (oldWidth || this.bounds.width());
    diffHeight = this.bounds.height() / (oldHeight || this.bounds.height());
    diffX = upL.x - oldUpL.x;
    diffY = upL.y - oldUpL.y;
    this.getLabels().each(function(label) {
      if (label.getReferencePoint()) {
        var ref = label.getReferencePoint();
        var from = ref.segment.from, to = ref.segment.to;
        if (!from || (!from.parent || (!to || !to.parent))) {
          return;
        }
        var fromPosition = from.bounds.center(), toPosition = to.bounds.center();
        if (fromPosition.x === ref.segment.fromPosition.x && (fromPosition.y === ref.segment.fromPosition.y && (toPosition.x === ref.segment.toPosition.x && (toPosition.y === ref.segment.toPosition.y && !ref.dirty)))) {
          return;
        }
        if (!this.parent.initializingShapes) {
          var oldDistance = ORYX.Core.Math.getDistanceBetweenTwoPoints(ref.segment.fromPosition, ref.segment.toPosition, ref.intersection);
          var newIntersection = ORYX.Core.Math.getPointBetweenTwoPoints(fromPosition, toPosition, isNaN(oldDistance) ? 0.5 : oldDistance);
          var oiv = ORYX.Core.Math.getOrthogonalIdentityVector(fromPosition, toPosition);
          var isHor = Math.abs(oiv.y) === 1, isVer = Math.abs(oiv.x) === 1;
          oiv.x *= ref.distance;
          oiv.y *= ref.distance;
          oiv.x += newIntersection.x;
          oiv.y += newIntersection.y;
          var mx = isHor && (ref.orientation && (ref.iorientation || ref.orientation).endsWith("r")) ? -label.getWidth() : 0;
          var my = isVer && (ref.orientation && (ref.iorientation || ref.orientation).startsWith("l")) ? -label.getHeight() + 2 : 0;
          label.setX(oiv.x + mx);
          label.setY(oiv.y + my);
          this.updateReferencePointOfLabel(label, newIntersection, from, to);
        } else {
          var oiv = ORYX.Core.Math.getOrthogonalIdentityVector(fromPosition, toPosition);
          oiv.x *= ref.distance;
          oiv.y *= ref.distance;
          oiv.x += ref.intersection.x;
          oiv.y += ref.intersection.y;
          label.setX(oiv.x);
          label.setY(oiv.y);
          ref.segment.fromPosition = fromPosition;
          ref.segment.toPosition = toPosition;
        }
        return;
      }
      if (label.position && !this.parent.initializingShapes) {
        var x = label.position.x + diffX * (diffWidth || 1);
        if (x > this.bounds.lowerRight().x) {
          x += this.bounds.width() - this.bounds.width() / (diffWidth || 1);
        }
        var y = label.position.y + diffY * (diffHeight || 1);
        if (y > this.bounds.lowerRight().y) {
          y += this.bounds.height() - this.bounds.height() / (diffHeight || 1);
        }
        label.setX(x);
        label.setY(y);
        return;
      }
      switch(label.getEdgePosition()) {
        case "starttop":
          var angle = this._getAngle(this.dockers[0], this.dockers[1]);
          var pos = this.dockers[0].bounds.center();
          if (angle <= 90 || angle > 270) {
            label.horizontalAlign("left");
            label.verticalAlign("bottom");
            label.x = pos.x + label.getOffsetTop();
            label.y = pos.y - label.getOffsetTop();
            label.rotate(360 - angle, pos);
          } else {
            label.horizontalAlign("right");
            label.verticalAlign("bottom");
            label.x = pos.x - label.getOffsetTop();
            label.y = pos.y - label.getOffsetTop();
            label.rotate(180 - angle, pos);
          }
          break;
        case "startmiddle":
          var angle = this._getAngle(this.dockers[0], this.dockers[1]);
          var pos = this.dockers[0].bounds.center();
          if (angle <= 90 || angle > 270) {
            label.horizontalAlign("left");
            label.verticalAlign("bottom");
            label.x = pos.x + 2;
            label.y = pos.y + 4;
            label.rotate(360 - angle, pos);
          } else {
            label.horizontalAlign("right");
            label.verticalAlign("bottom");
            label.x = pos.x + 1;
            label.y = pos.y + 4;
            label.rotate(180 - angle, pos);
          }
          break;
        case "startbottom":
          var angle = this._getAngle(this.dockers[0], this.dockers[1]);
          var pos = this.dockers[0].bounds.center();
          if (angle <= 90 || angle > 270) {
            label.horizontalAlign("left");
            label.verticalAlign("top");
            label.x = pos.x + label.getOffsetBottom();
            label.y = pos.y + label.getOffsetBottom();
            label.rotate(360 - angle, pos);
          } else {
            label.horizontalAlign("right");
            label.verticalAlign("top");
            label.x = pos.x - label.getOffsetBottom();
            label.y = pos.y + label.getOffsetBottom();
            label.rotate(180 - angle, pos);
          }
          break;
        case "midtop":
          var numOfDockers = this.dockers.length;
          if (numOfDockers % 2 == 0) {
            var angle = this._getAngle(this.dockers[numOfDockers / 2 - 1], this.dockers[numOfDockers / 2]);
            var pos1 = this.dockers[numOfDockers / 2 - 1].bounds.center();
            var pos2 = this.dockers[numOfDockers / 2].bounds.center();
            var pos = {x:(pos1.x + pos2.x) / 2, y:(pos1.y + pos2.y) / 2};
            label.horizontalAlign("center");
            label.verticalAlign("bottom");
            label.x = pos.x;
            label.y = pos.y - label.getOffsetTop();
            if (angle <= 90 || angle > 270) {
              label.rotate(360 - angle, pos);
            } else {
              label.rotate(180 - angle, pos);
            }
          } else {
            var index = parseInt(numOfDockers / 2);
            var angle = this._getAngle(this.dockers[index], this.dockers[index + 1]);
            var pos = this.dockers[index].bounds.center();
            if (angle <= 90 || angle > 270) {
              label.horizontalAlign("left");
              label.verticalAlign("bottom");
              label.x = pos.x + label.getOffsetTop();
              label.y = pos.y - label.getOffsetTop();
              label.rotate(360 - angle, pos);
            } else {
              label.horizontalAlign("right");
              label.verticalAlign("bottom");
              label.x = pos.x - label.getOffsetTop();
              label.y = pos.y - label.getOffsetTop();
              label.rotate(180 - angle, pos);
            }
          }
          break;
        case "midbottom":
          var numOfDockers = this.dockers.length;
          if (numOfDockers % 2 == 0) {
            var angle = this._getAngle(this.dockers[numOfDockers / 2 - 1], this.dockers[numOfDockers / 2]);
            var pos1 = this.dockers[numOfDockers / 2 - 1].bounds.center();
            var pos2 = this.dockers[numOfDockers / 2].bounds.center();
            var pos = {x:(pos1.x + pos2.x) / 2, y:(pos1.y + pos2.y) / 2};
            label.horizontalAlign("center");
            label.verticalAlign("top");
            label.x = pos.x;
            label.y = pos.y + label.getOffsetTop();
            if (angle <= 90 || angle > 270) {
              label.rotate(360 - angle, pos);
            } else {
              label.rotate(180 - angle, pos);
            }
          } else {
            var index = parseInt(numOfDockers / 2);
            var angle = this._getAngle(this.dockers[index], this.dockers[index + 1]);
            var pos = this.dockers[index].bounds.center();
            if (angle <= 90 || angle > 270) {
              label.horizontalAlign("left");
              label.verticalAlign("top");
              label.x = pos.x + label.getOffsetBottom();
              label.y = pos.y + label.getOffsetBottom();
              label.rotate(360 - angle, pos);
            } else {
              label.horizontalAlign("right");
              label.verticalAlign("top");
              label.x = pos.x - label.getOffsetBottom();
              label.y = pos.y + label.getOffsetBottom();
              label.rotate(180 - angle, pos);
            }
          }
          break;
        case "endtop":
          var length = this.dockers.length;
          var angle = this._getAngle(this.dockers[length - 2], this.dockers[length - 1]);
          var pos = this.dockers.last().bounds.center();
          if (angle <= 90 || angle > 270) {
            label.horizontalAlign("right");
            label.verticalAlign("bottom");
            label.x = pos.x - label.getOffsetTop();
            label.y = pos.y - label.getOffsetTop();
            label.rotate(360 - angle, pos);
          } else {
            label.horizontalAlign("left");
            label.verticalAlign("bottom");
            label.x = pos.x + label.getOffsetTop();
            label.y = pos.y - label.getOffsetTop();
            label.rotate(180 - angle, pos);
          }
          break;
        case "endbottom":
          var length = this.dockers.length;
          var angle = this._getAngle(this.dockers[length - 2], this.dockers[length - 1]);
          var pos = this.dockers.last().bounds.center();
          if (angle <= 90 || angle > 270) {
            label.horizontalAlign("right");
            label.verticalAlign("top");
            label.x = pos.x - label.getOffsetBottom();
            label.y = pos.y + label.getOffsetBottom();
            label.rotate(360 - angle, pos);
          } else {
            label.horizontalAlign("left");
            label.verticalAlign("top");
            label.x = pos.x + label.getOffsetBottom();
            label.y = pos.y + label.getOffsetBottom();
            label.rotate(180 - angle, pos);
          }
          break;
      }
    }.bind(this));
    this.children.each(function(value) {
      if (value instanceof ORYX.Core.Node) {
        this.calculatePositionOfAttachedChildNode.call(this, value);
      }
    }.bind(this));
    this.refreshAttachedNodes();
    this.refresh();
    this.isChanged = false;
    this._dockerUpdated = false;
    this._oldBounds = this.bounds.clone();
  }
}, movePointToUpperLeftOfNode:function(point, bounds) {
  point.x -= bounds.width() / 2;
  point.y -= bounds.height() / 2;
}, refreshAttachedNodes:function() {
  this.attachedNodePositionData.values().each(function(nodeData) {
    var startPoint = nodeData.segment.docker1.bounds.center();
    var endPoint = nodeData.segment.docker2.bounds.center();
    this.relativizePoint(startPoint);
    this.relativizePoint(endPoint);
    var newNodePosition = new Object;
    newNodePosition.x = startPoint.x + nodeData.relativDistanceFromDocker1 * (endPoint.x - startPoint.x);
    newNodePosition.y = startPoint.y + nodeData.relativDistanceFromDocker1 * (endPoint.y - startPoint.y);
    this.movePointToUpperLeftOfNode(newNodePosition, nodeData.node.bounds);
    nodeData.node.bounds.moveTo(newNodePosition);
    nodeData.node._update();
  }.bind(this));
}, calculatePositionOfAttachedChildNode:function(node) {
  var position = new Object;
  position.x = 0;
  position.y = 0;
  if (!this.attachedNodePositionData.get(node.getId())) {
    this.attachedNodePositionData.set(node.getId(), new Object);
    this.attachedNodePositionData.get(node.getId()).relativDistanceFromDocker1 = 0;
    this.attachedNodePositionData.get(node.getId()).node = node;
    this.attachedNodePositionData.get(node.getId()).segment = new Object;
    this.findEdgeSegmentForNode(node);
  } else {
    if (node.isChanged) {
      this.findEdgeSegmentForNode(node);
    }
  }
}, findEdgeSegmentForNode:function(node) {
  var length = this.dockers.length;
  var smallestDistance = undefined;
  for (i = 1;i < length;i++) {
    var lineP1 = this.dockers[i - 1].bounds.center();
    var lineP2 = this.dockers[i].bounds.center();
    this.relativizePoint(lineP1);
    this.relativizePoint(lineP2);
    var nodeCenterPoint = node.bounds.center();
    var distance = ORYX.Core.Math.distancePointLinie(lineP1, lineP2, nodeCenterPoint, true);
    if ((distance || distance == 0) && (!smallestDistance && smallestDistance != 0 || distance < smallestDistance)) {
      smallestDistance = distance;
      this.attachedNodePositionData.get(node.getId()).segment.docker1 = this.dockers[i - 1];
      this.attachedNodePositionData.get(node.getId()).segment.docker2 = this.dockers[i];
    }
    if (!distance && (!smallestDistance && smallestDistance != 0)) {
      ORYX.Core.Math.getDistancePointToPoint(nodeCenterPoint, lineP1) < ORYX.Core.Math.getDistancePointToPoint(nodeCenterPoint, lineP2) ? this.attachedNodePositionData.get(node.getId()).relativDistanceFromDocker1 = 0 : this.attachedNodePositionData.get(node.getId()).relativDistanceFromDocker1 = 1;
      this.attachedNodePositionData.get(node.getId()).segment.docker1 = this.dockers[i - 1];
      this.attachedNodePositionData.get(node.getId()).segment.docker2 = this.dockers[i];
    }
  }
  if (smallestDistance || smallestDistance == 0) {
    this.attachedNodePositionData.get(node.getId()).relativDistanceFromDocker1 = this.getLineParameterForPosition(this.attachedNodePositionData.get(node.getId()).segment.docker1, this.attachedNodePositionData.get(node.getId()).segment.docker2, node);
  }
}, findSegment:function(node) {
  var length = this.dockers.length;
  var result;
  var nodeCenterPoint = node instanceof ORYX.Core.UIObject ? node.bounds.center() : node;
  for (i = 1;i < length;i++) {
    var lineP1 = this.dockers[i - 1].bounds.center();
    var lineP2 = this.dockers[i].bounds.center();
    var distance = ORYX.Core.Math.distancePointLinie(lineP1, lineP2, nodeCenterPoint, true);
    if (typeof distance == "number" && (result === undefined || distance < result.distance)) {
      result = {distance:distance, fromDocker:this.dockers[i - 1], toDocker:this.dockers[i]};
    }
  }
  return result;
}, getLineParameterForPosition:function(docker1, docker2, node) {
  var dockerPoint1 = docker1.bounds.center();
  var dockerPoint2 = docker2.bounds.center();
  this.relativizePoint(dockerPoint1);
  this.relativizePoint(dockerPoint2);
  var intersectionPoint = ORYX.Core.Math.getPointOfIntersectionPointLine(dockerPoint1, dockerPoint2, node.bounds.center(), true);
  if (!intersectionPoint) {
    return 0;
  }
  var relativeDistance = ORYX.Core.Math.getDistancePointToPoint(intersectionPoint, dockerPoint1) / ORYX.Core.Math.getDistancePointToPoint(dockerPoint1, dockerPoint2);
  return relativeDistance;
}, relativizePoint:function(point) {
  point.x -= this.bounds.upperLeft().x;
  point.y -= this.bounds.upperLeft().y;
}, optimizedUpdate:function() {
  var updateDocker = function(docker) {
    if (!docker._dockedShape || !docker._dockedShapeBounds) {
      return;
    }
    var off = {x:docker._dockedShape.bounds.a.x - docker._dockedShapeBounds.a.x, y:docker._dockedShape.bounds.a.y - docker._dockedShapeBounds.a.y};
    docker.bounds.moveBy(off);
    docker._dockedShapeBounds.moveBy(off);
  };
  updateDocker(this.dockers[0]);
  updateDocker(this.dockers.last());
  this.refresh();
}, refresh:function(options) {
  arguments.callee.$.refresh.apply(this, arguments);
  var lastPoint;
  this._paths.each(function(path, index) {
    var dockers = this._dockersByPath.get(path.data("id"));
    var c = undefined;
    var d = undefined;
    if (lastPoint) {
      d = "M" + lastPoint.x + " " + lastPoint.y;
    } else {
      c = dockers[0].bounds.center();
      lastPoint = c;
      d = "M" + c.x + " " + c.y;
      marker_start = path.data("marker-start");
      if (marker_start) {
        var angle = this._getAngle(this.dockers[0], this.dockers[1]);
        marker_start.transform("r" + angle + ",0,0T" + lastPoint.x + "," + lastPoint.y).toFront();
        this._resetElement(marker_start, options);
      }
    }
    for (var i = 1;i < dockers.length;i++) {
      c = dockers[i].bounds.center();
      d = d + "L" + c.x + " " + c.y + " ";
      lastPoint = c;
    }
    marker_end = path.data("marker-end");
    if (marker_end) {
      var angle = this._getAngle(this.dockers[dockers.length - 2], this.dockers[dockers.length - 1]);
      marker_end.transform("r" + (360 - angle) + ",0,0T" + lastPoint.x + "," + lastPoint.y).toFront();
      this._resetElement(marker_end, options);
    }
    path.attr("path", d).toFront();
    this._resetElement(path, options);
    this._snaps[index].attr("path", d).toFront();
  }.bind(this));
}, _resetElement:function(obj, options) {
  if (options) {
    options.color && obj.attr({stroke:options.color});
    options.width && obj.attr("stroke-width", options.width);
  }
}, getIntersectionPoint:function() {
  var length = Math.floor(this.dockers.length / 2);
  return ORYX.Core.Math.midPoint(this.dockers[length - 1].bounds.center(), this.dockers[length].bounds.center());
}, isBoundsIncluded:function(bounds) {
  var dockers = this.dockers, size = dockers.length;
  return dockers.any(function(docker, i) {
    if (i == size - 1) {
      return false;
    }
    var a = docker.bounds.center();
    var b = dockers[i + 1].bounds.center();
    return ORYX.Core.Math.isRectOverLine(a.x, a.y, b.x, b.y, bounds.a.x, bounds.a.y, bounds.b.x, bounds.b.y);
  });
}, isPointIncluded:function(pointX, pointY) {
  var isbetweenAB = this.absoluteBounds().isIncluded(pointX, pointY, ORCHESTRATOR.CONFIG.OFFSET_BOUNDS);
  var isPointIncluded = undefined;
  if (isbetweenAB && this.dockers.length > 0) {
    var i = 0;
    var point1, point2;
    do {
      point1 = this.dockers[i].bounds.center();
      point2 = this.dockers[++i].bounds.center();
      isPointIncluded = ORYX.Core.Math.isPointInLine(pointX, pointY, point1.x, point1.y, point2.x, point2.y, ORCHESTRATOR.CONFIG.OFFSET_BOUNDS);
    } while (!isPointIncluded && i < this.dockers.length - 1);
  }
  return isPointIncluded;
}, isPointOverOffset:function() {
  return false;
}, _getAngle:function(docker1, docker2) {
  var p1 = docker1 instanceof ORYX.Core.Controls.Docker ? docker1.absoluteCenterXY() : docker1;
  var p2 = docker2 instanceof ORYX.Core.Controls.Docker ? docker2.absoluteCenterXY() : docker2;
  return ORYX.Core.Math.getAngle(p1, p2);
}, alignDockers:function() {
  this._update(true);
  var firstPoint = this.dockers[0].bounds.center();
  var lastPoint = this.dockers.last().bounds.center();
  var deltaX = lastPoint.x - firstPoint.x;
  var deltaY = lastPoint.y - firstPoint.y;
  var numOfDockers = this.dockers.length - 1;
  this.dockers.each(function(docker, index) {
    var part = index / numOfDockers;
    docker.bounds.unregisterCallback(this._dockerChangedCallback);
    docker.bounds.moveTo(firstPoint.x + part * deltaX, firstPoint.y + part * deltaY);
    docker.bounds.registerCallback(this._dockerChangedCallback);
  }.bind(this));
  this._dockerChanged();
}, add:function(shape) {
  arguments.callee.$.add.apply(this, arguments);
  if (shape instanceof ORYX.Core.Controls.Docker && this.dockers.include(shape)) {
    var pathArray = this._dockersByPath.values()[0];
    if (pathArray) {
      pathArray.splice(this.dockers.indexOf(shape), 0, shape);
    }
    this.handleChildShapesAfterAddDocker(shape);
  }
}, handleChildShapesAfterAddDocker:function(docker) {
  if (!docker instanceof ORYX.Core.Controls.Docker) {
    return undefined;
  }
  var index = this.dockers.indexOf(docker);
  if (!(0 < index && index < this.dockers.length - 1)) {
    return undefined;
  }
  var startDocker = this.dockers[index - 1];
  var endDocker = this.dockers[index + 1];
  var segmentElements = this.getAttachedNodePositionDataForSegment(startDocker, endDocker);
  var lengthSegmentPart1 = ORYX.Core.Math.getDistancePointToPoint(startDocker.bounds.center(), docker.bounds.center());
  var lengthSegmentPart2 = ORYX.Core.Math.getDistancePointToPoint(endDocker.bounds.center(), docker.bounds.center());
  if (!(lengthSegmentPart1 + lengthSegmentPart2)) {
    return;
  }
  var relativDockerPosition = lengthSegmentPart1 / (lengthSegmentPart1 + lengthSegmentPart2);
  segmentElements.each(function(nodePositionData) {
    if (nodePositionData.value.relativDistanceFromDocker1 < relativDockerPosition) {
      nodePositionData.value.segment.docker2 = docker;
      nodePositionData.value.relativDistanceFromDocker1 = nodePositionData.value.relativDistanceFromDocker1 / relativDockerPosition;
    } else {
      nodePositionData.value.segment.docker1 = docker;
      var newFullDistance = 1 - relativDockerPosition;
      var relativPartOfSegment = nodePositionData.value.relativDistanceFromDocker1 - relativDockerPosition;
      nodePositionData.value.relativDistanceFromDocker1 = relativPartOfSegment / newFullDistance;
    }
  });
  this.getLabels().each(function(label) {
    var ref = label.getReferencePoint();
    if (!ref) {
      return;
    }
    var index = this.dockers.indexOf(docker);
    if (index >= ref.segment.fromIndex && index <= ref.segment.toIndex) {
      var segment = this.findSegment(ref.intersection);
      if (!segment) {
        segment.fromDocker = ref.segment.fromIndex >= this.dockers.length / 2 ? this.dockers[0] : this.dockers[this.dockers.length - 2];
        segment.toDocker = this.dockers[this.dockers.indexOf(from) + 1];
      }
      var fromPosition = segment.fromDocker.bounds.center(), toPosition = segment.toDocker.bounds.center();
      var intersection = ORYX.Core.Math.getPointOfIntersectionPointLine(fromPosition, toPosition, ref.intersection, true);
      this.updateReferencePointOfLabel(label, intersection, segment.fromDocker, segment.toDocker, true);
    }
  }.bind(this));
  this.refreshAttachedNodes();
}, getAttachedNodePositionDataForSegment:function(startDocker, endDocker) {
  if (!(startDocker instanceof ORYX.Core.Controls.Docker && endDocker instanceof ORYX.Core.Controls.Docker)) {
    return[];
  }
  var elementsOfSegment = this.attachedNodePositionData.each(function(nodePositionData) {
    return nodePositionData.value.segment.docker1 === startDocker && nodePositionData.value.segment.docker2 === endDocker;
  });
  if (!elementsOfSegment) {
    return[];
  }
  return elementsOfSegment;
}, remove:function(shape) {
  arguments.callee.$.remove.apply(this, arguments);
  if (this.attachedNodePositionData.get(shape.getId())) {
    this.attachedNodePositionData.unset(shape.getId());
  }
  if (shape instanceof ORYX.Core.Controls.Docker) {
    this.handleChildShapesAfterRemoveDocker(shape);
  }
}, updateReferencePointOfLabel:function(label, intersection, from, to, dirty) {
  if (!label.getReferencePoint() || !label.isVisible) {
    return;
  }
  var ref = label.getReferencePoint();
  if (ref.orientation && ref.orientation !== "ce") {
    var angle = this._getAngle(from, to);
    if (ref.distance >= 0) {
      if (angle == 0) {
        label.horizontalAlign("left");
        label.verticalAlign("bottom");
      } else {
        if (angle > 0 && angle < 90) {
          label.horizontalAlign("right");
          label.verticalAlign("bottom");
        } else {
          if (angle == 90) {
            label.horizontalAlign("right");
            label.verticalAlign("top");
          } else {
            if (angle > 90 && angle < 180) {
              label.horizontalAlign("right");
              label.verticalAlign("top");
            } else {
              if (angle == 180) {
                label.horizontalAlign("left");
                label.verticalAlign("top");
              } else {
                if (angle > 180 && angle < 270) {
                  label.horizontalAlign("left");
                  label.verticalAlign("top");
                } else {
                  if (angle == 270) {
                    label.horizontalAlign("left");
                    label.verticalAlign("top");
                  } else {
                    if (angle > 270 && angle <= 360) {
                      label.horizontalAlign("left");
                      label.verticalAlign("bottom");
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      if (angle == 0) {
        label.horizontalAlign("left");
        label.verticalAlign("top");
      } else {
        if (angle > 0 && angle < 90) {
          label.horizontalAlign("left");
          label.verticalAlign("top");
        } else {
          if (angle == 90) {
            label.horizontalAlign("left");
            label.verticalAlign("top");
          } else {
            if (angle > 90 && angle < 180) {
              label.horizontalAlign("left");
              label.verticalAlign("bottom");
            } else {
              if (angle == 180) {
                label.horizontalAlign("left");
                label.verticalAlign("bottom");
              } else {
                if (angle > 180 && angle < 270) {
                  label.horizontalAlign("right");
                  label.verticalAlign("bottom");
                } else {
                  if (angle == 270) {
                    label.horizontalAlign("right");
                    label.verticalAlign("top");
                  } else {
                    if (angle > 270 && angle <= 360) {
                      label.horizontalAlign("right");
                      label.verticalAlign("top");
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    ref.iorientation = ref.iorientation || ref.orientation;
    ref.orientation = (label.verticalAlign() == "top" ? "u" : "l") + (label.horizontalAlign() == "left" ? "l" : "r");
  }
  label.setReferencePoint(ORYX.apply({}, {intersection:intersection, segment:{from:from, fromIndex:this.dockers.indexOf(from), fromPosition:from.bounds.center(), to:to, toIndex:this.dockers.indexOf(to), toPosition:to.bounds.center()}, dirty:dirty || false}, ref));
}, handleChildShapesAfterRemoveDocker:function(docker) {
  if (!(docker instanceof ORYX.Core.Controls.Docker)) {
    return;
  }
  this.attachedNodePositionData.each(function(nodePositionData) {
    if (nodePositionData.value.segment.docker1 === docker) {
      var index = this.dockers.indexOf(nodePositionData.value.segment.docker2);
      if (index == -1) {
        return;
      }
      nodePositionData.value.segment.docker1 = this.dockers[index - 1];
    } else {
      if (nodePositionData.value.segment.docker2 === docker) {
        var index = this.dockers.indexOf(nodePositionData.value.segment.docker1);
        if (index == -1) {
          return;
        }
        nodePositionData.value.segment.docker2 = this.dockers[index + 1];
      }
    }
  }.bind(this));
  this.getLabels().each(function(label) {
    var ref = label.getReferencePoint();
    if (!ref) {
      return;
    }
    var from = ref.segment.from;
    var to = ref.segment.to;
    if (from !== docker && to !== docker) {
      return;
    }
    var segment = this.findSegment(ref.intersection);
    if (!segment) {
      from = segment.fromDocker;
      to = segment.toDocker;
    } else {
      from = from === docker ? this.dockers[this.dockers.indexOf(to) - 1] : from;
      to = this.dockers[this.dockers.indexOf(from) + 1];
    }
    var intersection = ORYX.Core.Math.getPointOfIntersectionPointLine(from.bounds.center(), to.bounds.center(), ref.intersection, true);
    this.updateReferencePointOfLabel(label, intersection, from, to, true);
  }.bind(this));
  this.refreshAttachedNodes();
}, addDocker:function(position, exDocker) {
  var lastDocker;
  var result;
  this._dockersByPath.any(function(pair) {
    return pair.value.any(function(docker, index) {
      if (!lastDocker) {
        lastDocker = docker;
        return false;
      } else {
        var point1 = lastDocker.bounds.center();
        var point2 = docker.bounds.center();
        if (ORYX.Core.Math.isPointInLine(position.x, position.y, point1.x, point1.y, point2.x, point2.y, 10)) {
          var path = this._paths.find(function(path) {
            return path.data("id") === pair.key;
          });
          var newDocker = exDocker ? exDocker : this.createDocker(this.dockers.indexOf(lastDocker) + 1, position);
          newDocker.bounds.centerMoveTo(position);
          if (exDocker) {
            this.add(newDocker, this.dockers.indexOf(lastDocker) + 1);
          }
          result = newDocker;
          return true;
        } else {
          lastDocker = docker;
          return false;
        }
      }
    }.bind(this));
  }.bind(this));
  return result;
}, removeDocker:function(docker) {
  if (this.dockers.length > 2 && !(this.dockers[0] === docker)) {
    this._dockersByPath.any(function(pair) {
      if (pair.value.member(docker)) {
        if (docker === pair.value.last()) {
          return true;
        } else {
          this.remove(docker);
          this._dockersByPath.set(pair.key, pair.value.without(docker));
          this.isChanged = true;
          this._dockerChanged();
          return true;
        }
      }
      return false;
    }.bind(this));
  }
}, removeUnusedDockers:function() {
  var marked = $H({});
  this.dockers.each(function(docker, i) {
    if (i == 0 || i == this.dockers.length - 1) {
      return;
    }
    var previous = this.dockers[i - 1];
    if (marked.values().indexOf(previous) != -1 && this.dockers[i - 2]) {
      previous = this.dockers[i - 2];
    }
    var next = this.dockers[i + 1];
    var cp = previous.getDockedShape() && previous.referencePoint ? previous.getAbsoluteReferencePoint() : previous.bounds.center();
    var cn = next.getDockedShape() && next.referencePoint ? next.getAbsoluteReferencePoint() : next.bounds.center();
    var cd = docker.bounds.center();
    if (ORYX.Core.Math.isPointInLine(cd.x, cd.y, cp.x, cp.y, cn.x, cn.y, 1)) {
      marked[i] = docker;
    }
  }.bind(this));
  marked.each(function(docker) {
    this.removeDocker(docker.value);
  }.bind(this));
  if (marked.values().length > 0) {
    this._update(true);
  }
  return marked;
}, _init:function() {
  arguments.callee.$._init.apply(this, arguments);
  path = this._stencil._jsonStencil.raphael(this.paper);
  snap = path.clone().attr({"stroke-width":10, "stroke-dasharray":null, "stroke":"black", "opacity":0});
  marker_start = path.data("marker-start");
  marker_end = path.data("marker-end");
  if (marker_start) {
    this._markers.push(marker_start);
  }
  if (marker_end) {
    this._markers.push(marker_end);
  }
  this.raphael = this.paper.set().push(path, snap, marker_start, marker_end);
  var pathId = this.id + "_1";
  this._dockersByPath.set(pathId, []);
  path.data("id", pathId);
  this._paths.push(path);
  this._snaps.push(snap);
  this._paths.each(function(item) {
    this.addEventHandlers(item.node);
  }.bind(this));
  this._snaps.each(function(item) {
    this.addEventHandlers(item.node);
  }.bind(this));
  this._markers.each(function(item) {
    this.addEventHandlers(item.node);
  }.bind(this));
  this._paths.reverse();
  this._snaps.reverse();
  this._markers.reverse();
  var bound = this.raphael.getBBox();
  for (var i = 0;i < 2;i++) {
    switch(i) {
      case 0:
        x = bound.x;
        y = bound.y;
        break;
      default:
        x = bound.x2;
        y = bound.y2;
        break;
    }
    var docker = new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback, paper:this.paper});
    docker.bounds.centerMoveTo(x, y);
    docker.bounds.registerCallback(this._dockerChangedCallback);
    this.add(docker, this.dockers.length);
  }
  this.bounds.set(bound.x, bound.y, bound.x2, bound.y2);
  this._oldBounds = this.bounds.clone();
  this.propertiesChanged.each(function(pair) {
    pair.value = true;
  });
}, _dockerChanged:function() {
  this._dockerUpdated = true;
}, serialize:function() {
  var result = arguments.callee.$.serialize.apply(this);
  var value = "";
  this._dockersByPath.each(function(pair) {
    pair.value.each(function(docker) {
      var position = docker.getDockedShape() && docker.referencePoint ? docker.referencePoint : docker.bounds.center();
      value = value.concat(position.x + " " + position.y + " ");
    });
    value += " # ";
  }.bind(this));
  result.push({name:"dockers", value:value, type:"literal"});
  var lastDocker = this.dockers.last();
  var target = lastDocker.getDockedShape();
  if (target) {
    result.push({name:"target", value:"#" + ERDF.__stripHashes(target.resourceId), type:"resource"});
  }
  try {
    var serializeEvent = this.getStencil().serialize();
    if (serializeEvent.type) {
      serializeEvent.shape = this;
      serializeEvent.data = result;
      serializeEvent.result = undefined;
      serializeEvent.forceExecution = true;
      this._delegateEvent(serializeEvent);
      if (serializeEvent.result) {
        result = serializeEvent.result;
      }
    }
  } catch (e) {
  }
  return result;
}, deserialize:function(data) {
  try {
    var deserializeEvent = this.getStencil().deserialize();
    if (deserializeEvent.type) {
      deserializeEvent.shape = this;
      deserializeEvent.data = data;
      deserializeEvent.result = undefined;
      deserializeEvent.forceExecution = true;
      this._delegateEvent(deserializeEvent);
      if (deserializeEvent.result) {
        data = deserializeEvent.result;
      }
    }
  } catch (e) {
  }
  var target = data.find(function(ser) {
    return ser.name == "target";
  });
  var targetShape;
  if (target) {
    targetShape = this.getCanvas().getChildShapeByResourceId(target.value);
  }
  var outgoing = data.findAll(function(ser) {
    return ser.name == "outgoing";
  });
  outgoing.each(function(obj) {
    if (!this.parent) {
      return;
    }
    var next = this.getCanvas().getChildShapeByResourceId(obj.value);
    if (next) {
      if (next == targetShape) {
        this.dockers.last().setDockedShape(next);
        this.dockers.last().setReferencePoint({x:next.bounds.width() / 2, y:next.bounds.height() / 2});
      } else {
        if (next instanceof ORYX.Core.Edge) {
          next.dockers[0].setDockedShape(this);
        }
      }
    }
  }.bind(this));
  var oryxDockers = data.find(function(obj) {
    return obj.name === "dockers";
  });
  if (oryxDockers) {
    var dataByPath = oryxDockers.value.split("#").without("").without(" ");
    dataByPath.each(function(data, index) {
      var values = data.replace(/,/g, " ").split(" ").without("");
      if (values.length % 2 === 0) {
        var path = this._paths[index];
        if (path) {
          if (index === 0) {
            while (this._dockersByPath.get(path.data("id")).length > 2) {
              this.removeDocker(this._dockersByPath.get(path.data("id"))[1]);
            }
          } else {
            while (this._dockersByPath.get(path.data("id")).length > 1) {
              this.removeDocker(this._dockersByPath.get(path.data("id"))[0]);
            }
          }
          var dockersByPath = this._dockersByPath.get(path.data("id"));
          if (index === 0) {
            var x = parseFloat(values.shift());
            var y = parseFloat(values.shift());
            if (dockersByPath[0].getDockedShape()) {
              dockersByPath[0].setReferencePoint({x:x, y:y});
            } else {
              dockersByPath[0].bounds.centerMoveTo(x, y);
            }
          }
          y = parseFloat(values.pop());
          x = parseFloat(values.pop());
          if (dockersByPath.last().getDockedShape()) {
            dockersByPath.last().setReferencePoint({x:x, y:y});
          } else {
            dockersByPath.last().bounds.centerMoveTo(x, y);
          }
          for (var i = 0;i < values.length;i++) {
            x = parseFloat(values[i]);
            y = parseFloat(values[++i]);
            var newDocker = this.createDocker();
            newDocker.bounds.centerMoveTo(x, y);
          }
        }
      }
    }.bind(this));
  } else {
    this.alignDockers();
  }
  arguments.callee.$.deserialize.apply(this, arguments);
  this._changed();
}, toString:function() {
  return this.getStencil().title() + " " + this.id;
}, getTarget:function() {
  return this.dockers.last() ? this.dockers.last().getDockedShape() : null;
}, getSource:function() {
  return this.dockers[0] ? this.dockers[0].getDockedShape() : null;
}, isDocked:function() {
  var isDocked = false;
  this.dockers.each(function(docker) {
    if (docker.isDocked()) {
      isDocked = true;
      throw ORYX.Hash.$break;
    }
  });
  return isDocked;
}, toJSON:function() {
  var json = arguments.callee.$.toJSON.apply(this, arguments);
  if (this.getTarget()) {
    json.target = {resourceId:this.getTarget().resourceId};
  }
  return json;
}};
ORYX.Core.Edge = ORYX.Core.Shape.extend(ORYX.Core.Edge);
if (!ORYX) {
  var ORYX = {}
}
ORYX.Editor = {construct:function(parent, options) {
  if (!options) {
    var vars = window.location.search.substring(1).split("&");
    var query_string = {};
    for (var i = 0;i < vars.length;i++) {
      var pair = vars[i].split("=");
      query_string[pair[0]] = pair[1];
    }
    options = {};
    options.processDefinition = query_string["processDefinition"];
    options.processInstanceId = query_string["processInstanceId"];
    options.editMode = query_string["editMode"];
  }
  if (options.no_plugins) {
      ORCHESTRATOR.DISABLE_PLUGINS = true;
  }
  if (options.processDefinition) {
    ORCHESTRATOR.api.getProcessDefinitionModel(options.processDefinition, function(meta) {
      meta.instance = options.processInstanceId;
      this.init(meta, parent);
      if (options.editMode == "false") {
        this.enableReadOnlyMode();
      }
    }.bind(this));
  } else {
    this.init(options.meta, parent);
  }
}, init:function(meta, parent) {
  this._eventsQueue = [];
  this.loadedPlugins = [];
  this.pluginsData = [];
  this.focus = true;
  this.DOMEventListeners = new ORYX.Hash;
  this.selection = [];
  if (parent) {
    this.parent = Object.isString(parent) ? document.getElementById(parent) : parent;
    ORYX.observe(this.parent, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));
  }
  this._eventHandler = this.raiseEvent.bind(this);
  this._elementsObserved = [];
  this.registerOnEvent(ORCHESTRATOR.EVENTS.REGISTERED, this._registerElement.bind(this));
  this.stencilset = new ORYX.Core.StencilSet.StencilSet;
  this.rules = new ORYX.Core.StencilSet.Rules;
  this.rules.initializeRules(this.stencilset);
  this._initEventListener();
  this.loadPlugins();
  this.load(meta);
}, hide:function() {
  this.raiseEvent({type:ORCHESTRATOR.EVENTS.CANVAS_HIDE, forceExecution:true});
  this.focus = false;
}, show:function() {
  this.focus = true;
  this.raiseEvent({type:ORCHESTRATOR.EVENTS.CANVAS_SHOW});
}, clear:function(options) {
  options = options || {};
  var callback = function() {
    this.unregisterOnEvent(ORCHESTRATOR.EVENTS.DISCARDED, callback);
    this._elementsObserved.each(function(el) {
      ORYX.stopObserving(el);
    });
    this._elementsObserved = [];
    this._canvas = null;
    if (this.paper) {
      this.paper.remove();
    }
    callback = null;
    this.raiseEvent({type:ORCHESTRATOR.EVENTS.CLEAR, force:options.force});
    if (options.callback) {
      options.callback.call();
    }
  }.bind(this);
  this.registerOnEvent(ORCHESTRATOR.EVENTS.DISCARDED, callback);
  this.raiseEvent({type:ORCHESTRATOR.EVENTS.BEFORECLEAR, force:options.force});
}, load:function(meta, parent) {
  if (parent) {
    this.parent = Object.isString(parent) ? document.getElementById(parent) : parent;
    ORYX.observe(this.parent, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));
  } else {
    if (!meta) {
      return;
    }
  }
  this.modelMetaData = meta;
  if (this._canvas) {
    this.clear({callback:this._load.bind(this)});
  } else {
    this._load();
  }
}, _load:function() {
  var meta = this.modelMetaData || {};
  var model = meta.model || meta;
  if (model.properties) {
    model.properties.deployment = meta.deployment;
  }
  if (meta.instance) {
    this.enableReadOnlyMode();
  }
  var canvasStencil = this.stencilset.stencil("BPMNDiagram");
  if (!canvasStencil) {
    ORYX.Log.error("Failed to get canvas stecil...");
    return;
  }
  this.paper = Raphael(this.parent, 1, 1);
  this._canvas = new ORYX.Core.Canvas({id:model.resourceId || (model.id || ORYX.Editor.prototype.provideId()), "eventHandlerCallback":this.getEventHandler(), parentNode:this.parent, paper:this.paper}, canvasStencil);
  this.loadedPlugins.each(function(plugin) {
    if (plugin.redraw) {
      plugin.redraw(this.paper);
    }
  }.bind(this));
  setTimeout(function() {
    if (this._canvas) {
      this._canvas.addShapeObjects(model.childShapes, this.getEventHandler());
      if (model.properties) {
        for (key in model.properties) {
          var value = model.properties[key];
          var prop = this._canvas.getStencil().property(key);
          if (!(typeof value === "string") && (!prop || !prop.isList())) {
            value = Object.toJSON(value);
          }
          this._canvas.setProperty(key, value);
        }
      }
      this._canvas.update();
      this._canvas.updateSize(true);
      this.setSelection(null, null, true);
      this.raiseEvent({type:ORCHESTRATOR.EVENTS.LOADED});
      if (meta.instance) {
        this.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT, instance:meta.instance});
      }
    }
  }.bind(this), 0);
  Element.setStyle(this.parent, {"-webkit-user-select":"none"});
}, _registerElement:function(options) {
  this._elementsObserved.push(options.element);
}, _initEventListener:function() {
  ORYX.observe(document.documentElement, ORCHESTRATOR.EVENTS.KEYDOWN, this.catchKeyDownEvents.bind(this));
  ORYX.observe(document.documentElement, ORCHESTRATOR.EVENTS.KEYUP, this.catchKeyUpEvents.bind(this));
  ORYX.observe(window, ORCHESTRATOR.EVENTS.RESIZE, this.handleResize.bind(this));
  this._keydownEnabled = true;
  this._keyupEnabled = true;
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEDOWN, []);
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEUP, []);
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEOVER, []);
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEOUT, []);
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.SELECTION_CHANGED, []);
  this.DOMEventListeners.set(ORCHESTRATOR.EVENTS.MOUSEMOVE, []);
}, loadPlugins:function() {
  var me = this;
  var facade = this._getPluginFacade();
  if(!ORCHESTRATOR.DISABLE_PLUGINS) {
	  ORCHESTRATOR.availablePlugins.each(function(value) {
	    try {
	      var className = eval(value.name);
	      if (className) {
	        ORYX.Log.debug("Initializing plugin '%0'", value.name);
	        me.loadedPlugins.push(new className(facade, value));
	      }
	    } catch (e) {
	      ORYX.Log.warn("Plugin %0 is not available", value.name);
	      ORYX.Log.exception(e);
	    }
	  });
  }
  this.loadedPlugins.each(function(value) {
    if (value.registryChanged) {
      value.registryChanged(me.pluginsData);
    }
    if (value.onSelectionChanged) {
      me.registerOnEvent(ORCHESTRATOR.EVENTS.SELECTION_CHANGED, value.onSelectionChanged.bind(value));
    }
  });
  this.registerPluginsOnKeyEvents();
}, _getPluginFacade:function() {
  if (!this._pluginFacade) {
    this._pluginFacade = {offer:this.offer.bind(this), getRules:this.getRules.bind(this), createShape:this.createShape.bind(this), deleteShape:this.deleteShape.bind(this), getSelection:this.getSelection.bind(this), setSelection:this.setSelection.bind(this), updateSelection:this.updateSelection.bind(this), getCanvas:this.getCanvas.bind(this), getRootNode:this.getRootNode.bind(this), getStencilset:this.getStencilset.bind(this), getPaper:this.getPaper.bind(this), setPaper:this.setPaper.bind(this), load:this.load.bind(this), 
    show:this.show.bind(this), hide:this.hide.bind(this), clear:this.clear.bind(this), get:this.get.bind(this), importJSON:this.importJSON.bind(this), getJSON:this.getJSON.bind(this), executeCommands:this.executeCommands.bind(this), isExecutingCommands:this.isExecutingCommands.bind(this), getEventHandler:this.getEventHandler.bind(this), registerOnEvent:this.registerOnEvent.bind(this), unregisterOnEvent:this.unregisterOnEvent.bind(this), raiseEvent:this.raiseEvent.bind(this), enableEvent:this.enableEvent.bind(this), 
    disableEvent:this.disableEvent.bind(this), enableReadOnlyMode:this.enableReadOnlyMode.bind(this), disableReadOnlyMode:this.disableReadOnlyMode.bind(this), eventCoordinates:this.eventCoordinates.bind(this), getModelMetaData:this.getModelMetaData.bind(this)};
  }
  return this._pluginFacade;
}, get:function(name) {
  return Element.retrieve(this.parent, name);
}, getPaper:function() {
  return this.paper;
}, setPaper:function(paper) {
  this.paper = paper;
  this.loadedPlugins.each(function(plugin) {
    if (plugin.redraw) {
      plugin.redraw(this.paper);
    }
  }.bind(this));
}, isExecutingCommands:function() {
  return!!this.commandExecuting;
}, executeCommands:function(commands) {
  if (!this.commandStack) {
    this.commandStack = [];
  }
  if (!this.commandStackExecuted) {
    this.commandStackExecuted = [];
  }
  this.commandStack = [].concat(this.commandStack).concat(commands);
  if (this.commandExecuting) {
    return;
  }
  this.commandExecuting = true;
  while (this.commandStack.length > 0) {
    var command = this.commandStack.shift();
    try {
      command.execute();
    } catch (e) {
      ORYX.Log.exception(e);
    }
    this.commandStackExecuted.push(command);
  }
  this.raiseEvent({type:ORCHESTRATOR.EVENTS.EXECUTE_COMMANDS, commands:this.commandStackExecuted});
  delete this.commandStack;
  delete this.commandStackExecuted;
  delete this.commandExecuting;
  this.updateSelection();
}, getJSON:function() {
  return this.getCanvas().toJSON();
}, importJSON:function(jsonObject, noSelectionAfterImport) {
  try {
    jsonObject = this.renewResourceIds(jsonObject);
  } catch (error) {
    throw error;
  }
  if (jsonObject.stencilset.namespace && jsonObject.stencilset.namespace !== this.getCanvas().getStencil().stencilSet().namespace()) {
    alert(String.format(ORCHESTRATOR.Save.IMPORT_MISMATCH, jsonObject.stencilset.namespace, this.getCanvas().getStencil().stencilSet().namespace()));
    return null;
  } else {
    var commandClass = ORYX.Core.Command.extend({construct:function(jsonObject, loadSerializedCB, noSelectionAfterImport, facade) {
      this.jsonObject = jsonObject;
      this.noSelection = noSelectionAfterImport;
      this.facade = facade;
      this.connections = [];
      this.parents = new ORYX.Hash;
      this.selection = this.facade.getSelection();
      this.loadSerialized = loadSerializedCB;
    }, execute:function() {
      if (!this.shapes) {
        this.shapes = this.loadSerialized(this.jsonObject);
        this.shapes.each(function(shape) {
          if (shape.getDockers) {
            var dockers = shape.getDockers();
            if (dockers) {
              if (dockers.length > 0) {
                this.connections.push([dockers[0], dockers[0].getDockedShape(), dockers[0].referencePoint]);
              }
              if (dockers.length > 1) {
                this.connections.push([dockers.last(), dockers.last().getDockedShape(), dockers.last().referencePoint]);
              }
            }
          }
          this.parents.set(shape.id, shape.parent);
        }.bind(this));
      } else {
        this.shapes.each(function(shape) {
          this.parents.get(shape.id).add(shape);
        }.bind(this));
        this.connections.each(function(con) {
          con[0].setDockedShape(con[1]);
          con[0].setReferencePoint(con[2]);
          con[0].update();
        });
      }
      this.facade.getCanvas().update();
      if (!this.noSelection) {
        this.facade.setSelection(this.shapes);
      } else {
        this.facade.updateSelection();
      }
      this.facade.getCanvas().updateSize();
    }, rollback:function() {
      var selection = this.facade.getSelection();
      this.shapes.each(function(shape) {
        selection = selection.without(shape);
        this.facade.deleteShape(shape);
      }.bind(this));
      this.facade.getCanvas().update();
      this.facade.setSelection(selection);
    }});
    var command = new commandClass(jsonObject, this.loadSerialized.bind(this), noSelectionAfterImport, this._getPluginFacade());
    this.executeCommands([command]);
    return command.shapes.clone();
  }
}, renewResourceIds:function(jsonObject) {
  if (ORYX.type(jsonObject) === "string") {
    try {
      var serJsonObject = jsonObject;
      jsonObject = eval("(" + jsonObject + ")");
    } catch (error) {
      throw new SyntaxError(error.message);
    }
  } else {
    var serJsonObject = Object.toJSON(jsonObject)
  }
  var collectResourceIds = function(shapes) {
    if (!shapes) {
      return[];
    }
    return shapes.map(function(shape) {
      return collectResourceIds(shape.childShapes).concat(shape.resourceId);
    }).flatten();
  };
  var resourceIds = collectResourceIds(jsonObject.childShapes);
  resourceIds.each(function(oldResourceId) {
    var newResourceId = ORYX.Editor.prototype.provideId();
    serJsonObject = serJsonObject.gsub('"' + oldResourceId + '"', '"' + newResourceId + '"');
  });
  return eval("(" + serJsonObject + ")");
}, loadSerialized:function(model, requestMeta) {
  var canvas = this.getCanvas();
  var shapes = this.getCanvas().addShapeObjects(model.childShapes, this.raiseEvent.bind(this));
  if (model.properties) {
    for (key in model.properties) {
      var value = model.properties[key];
      var prop = this.getCanvas().getStencil().property(key);
      if (!(typeof value === "string") && (!prop || !prop.isList())) {
        value = Object.toJSON(value);
      }
      this.getCanvas().setProperty(key, value);
    }
  }
  this.getCanvas().updateSize();
  this.selection = [null];
  this.setSelection([]);
  return shapes;
}, disableEvent:function(eventType) {
  if (!eventType) {
    this._keydownEnabled = false;
    this._keyupEnabled = false;
    this.DOMEventListeners.each(function(pair) {
      var value = this.DOMEventListeners.unset(pair.key);
      this.DOMEventListeners.set("disable_" + pair.key, pair.value);
    }.bind(this));
  } else {
    if (eventType == ORCHESTRATOR.EVENTS.KEYDOWN) {
      this._keydownEnabled = false;
    }
    if (eventType == ORCHESTRATOR.EVENTS.KEYUP) {
      this._keyupEnabled = false;
    }
    if (this.DOMEventListeners.keys().member(eventType)) {
      var value = this.DOMEventListeners.unset(eventType);
      this.DOMEventListeners.set("disable_" + eventType, value);
    }
  }
}, enableEvent:function(eventType) {
  if (eventType == ORCHESTRATOR.EVENTS.KEYDOWN) {
    this._keydownEnabled = true;
  } else {
    if (eventType == ORCHESTRATOR.EVENTS.KEYUP) {
      this._keyupEnabled = true;
    }
  }
  if (this.DOMEventListeners.keys().member("disable_" + eventType)) {
    var value = this.DOMEventListeners.unset("disable_" + eventType);
    this.DOMEventListeners.set(eventType, value);
  }
}, enableReadOnlyMode:function() {
  this.loadedPlugins.each(function(plugin) {
    if (plugin.enableReadOnlyMode) {
      plugin.enableReadOnlyMode();
    }
  });
}, disableReadOnlyMode:function() {
  this.loadedPlugins.each(function(plugin) {
    if (plugin.disableReadOnlyMode) {
      plugin.disableReadOnlyMode();
    }
  });
}, getEventHandler:function() {
  return this._eventHandler;
}, registerOnEvent:function(eventType, callback) {
  if (!this.DOMEventListeners.keys().member(eventType)) {
    if (this.DOMEventListeners.keys().member("disable_" + eventType)) {
      eventType = "disable_" + eventType;
    } else {
      this.DOMEventListeners.set(eventType, []);
    }
  }
  this.DOMEventListeners.get(eventType).push(callback);
}, unregisterOnEvent:function(eventType, callback) {
  if (!this.DOMEventListeners.keys().member(eventType)) {
    if (this.DOMEventListeners.keys().member("disable_" + eventType)) {
      eventType = "disable_" + eventType;
    } else {
      ORYX.Log.warn(eventType + " not found, unregister ignored.");
      return;
    }
  }
  this.DOMEventListeners.set(eventType, this.DOMEventListeners.get(eventType).without(callback));
}, getSelection:function() {
  return this.selection || [];
}, getRules:function() {
  return this.rules;
}, offer:function(pluginData) {
  if (!this.pluginsData.member(pluginData)) {
    this.pluginsData.push(pluginData);
  }
}, registerPluginsOnKeyEvents:function() {
  this.pluginsData.each(function(pluginData) {
    if (pluginData.keyCodes) {
      pluginData.keyCodes.each(function(keyComb) {
        var eventName = "key.event";
        eventName += "." + keyComb.keyAction;
        if (keyComb.metaKeys) {
          if (keyComb.metaKeys.indexOf(ORCHESTRATOR.CONST.META_KEY_META_CTRL) > -1) {
            eventName += "." + ORCHESTRATOR.CONST.META_KEY_META_CTRL;
          }
          if (keyComb.metaKeys.indexOf(ORCHESTRATOR.CONST.META_KEY_ALT) > -1) {
            eventName += "." + ORCHESTRATOR.CONST.META_KEY_ALT;
          }
          if (keyComb.metaKeys.indexOf(ORCHESTRATOR.CONST.META_KEY_SHIFT) > -1) {
            eventName += "." + ORCHESTRATOR.CONST.META_KEY_SHIFT;
          }
        }
        if (keyComb.keyCode) {
          eventName += "." + keyComb.keyCode;
        }
        ORYX.Log.debug("Register Plugin on Key Event: %0", eventName);
        if (pluginData.toggle === true && pluginData.buttonInstance) {
          this.registerOnEvent(eventName, function() {
            pluginData.buttonInstance.toggle(!pluginData.buttonInstance.pressed);
            pluginData.functionality.call(pluginData, pluginData.buttonInstance, pluginData.buttonInstance.pressed);
          });
        } else {
          this.registerOnEvent(eventName, pluginData.functionality);
        }
      }.bind(this));
    }
  }.bind(this));
}, isEqual:function(a, b) {
  return a === b || a.length === b.length && a.all(function(r) {
    return b.include(r);
  });
}, isDirty:function(a) {
  return a.any(function(shape) {
    return shape.isPropertyChanged();
  });
}, setSelection:function(elements, subSelectionElement, force) {
  if (!elements) {
    elements = [];
  }
  if (!(elements instanceof Array)) {
    elements = [elements];
  }
  elements = elements.findAll(function(n) {
    return n && n instanceof ORYX.Core.Shape;
  });
  if (elements[0] instanceof ORYX.Core.Canvas) {
    elements = [];
  }
  if (!force && (this.isEqual(this.selection, elements) && !this.isDirty(elements))) {
    return;
  }
  this.selection = elements;
  this._subSelection = subSelectionElement;
  this.raiseEvent({type:ORCHESTRATOR.EVENTS.SELECTION_CHANGED, elements:elements, subSelection:subSelectionElement, force:!!force});
}, updateSelection:function(check) {
  this.setSelection(this.selection, this._subSelection, !check);
}, getCanvas:function() {
  return this._canvas;
}, getRootNode:function() {
  return this.parent;
}, getStencilset:function() {
  return this.stencilset;
}, createShape:function(option) {
  if (option && (option.serialize && option.serialize instanceof Array)) {
    var type = option.serialize.find(function(obj) {
      return obj.name == "type";
    });
    var stencil = this.stencilset.stencil(type.value);
    if (stencil.type() == "node") {
      var newShapeObject = new ORYX.Core.Node({"eventHandlerCallback":this.raiseEvent.bind(this), "paper":option.paper}, stencil)
    } else {
      var newShapeObject = new ORYX.Core.Edge({"eventHandlerCallback":this.raiseEvent.bind(this), "paper":option.paper}, stencil)
    }
    this.getCanvas().add(newShapeObject);
    newShapeObject.deserialize(option.serialize);
    return newShapeObject;
  }
  if (!option || !option.type) {
    throw "To create a new shape you have to give an argument with type";
  }
  var canvas = this.getCanvas();
  var newShapeObject;
  var shapetype = option.type;
  var sset = this.stencilset;
  if (sset.stencil(shapetype).type() == "node") {
    newShapeObject = new ORYX.Core.Node({"eventHandlerCallback":this.raiseEvent.bind(this), "paper":option.paper}, sset.stencil(shapetype));
  } else {
    newShapeObject = new ORYX.Core.Edge({"eventHandlerCallback":this.raiseEvent.bind(this), "paper":option.paper}, sset.stencil(shapetype));
  }
  if (option.template) {
    newShapeObject._jsonStencil.properties = option.template._jsonStencil.properties;
    newShapeObject.postProcessProperties();
  }
  if (!option.parent || !(newShapeObject instanceof ORYX.Core.Node)) {
    option.parent = canvas;
  }
  option.parent.add(newShapeObject);
  if (option.properties) {
    var properties = [];
    for (field in option.properties) {
      properties.push({name:field, value:option.properties[field]});
    }
    properties.push({name:"parent", value:option.parent});
    newShapeObject.deserialize(properties);
  }
  var point = option.position ? option.position : {x:100, y:200};
  var parentUL = option.parent.absoluteXY();
  point.x -= parentUL.x;
  point.y -= parentUL.y;
  var con;
  if (option.connectingType && (option.connectedShape && !(newShapeObject instanceof ORYX.Core.Edge))) {
    con = new ORYX.Core.Edge({"eventHandlerCallback":this.raiseEvent.bind(this), "paper":paper}, sset.stencil(option.connectingType));
    con.dockers[0].setDockedShape(option.connectedShape);
    var magnet = option.connectedShape.getDefaultMagnet();
    var cPoint = magnet ? magnet.bounds.center() : option.connectedShape.bounds.midPoint();
    con.dockers[0].setReferencePoint(cPoint);
    con.dockers.last().setDockedShape(newShapeObject);
    con.dockers.last().setReferencePoint(newShapeObject.getDefaultMagnet().bounds.center());
    canvas.add(con);
  }
  if (newShapeObject instanceof ORYX.Core.Edge && option.connectedShape) {
    newShapeObject.dockers[0].setDockedShape(option.connectedShape);
    if (option.connectedShape instanceof ORYX.Core.Node) {
      newShapeObject.dockers[0].setReferencePoint(option.connectedShape.getDefaultMagnet().bounds.center());
      newShapeObject.dockers.last().bounds.centerMoveTo(point);
    } else {
      newShapeObject.dockers[0].setReferencePoint(option.connectedShape.bounds.midPoint());
    }
  } else {
    var b = newShapeObject.bounds;
    if (newShapeObject instanceof ORYX.Core.Node && newShapeObject.dockers.length == 1) {
      b = newShapeObject.dockers[0].bounds;
    }
    b.centerMoveTo(point);
    var upL = b.upperLeft();
    b.moveBy(-Math.min(upL.x, 0), -Math.min(upL.y, 0));
    var lwR = b.lowerRight();
    b.moveBy(-Math.max(lwR.x - canvas.bounds.width(), 0), -Math.max(lwR.y - canvas.bounds.height(), 0));
  }
  if (newShapeObject instanceof ORYX.Core.Edge) {
    newShapeObject._update(false);
  }
  if (!(newShapeObject instanceof ORYX.Core.Edge) && !option.dontUpdateSelection) {
    this.setSelection([newShapeObject]);
  }
  if (con && con.alignDockers) {
    con.alignDockers();
  }
  if (newShapeObject.alignDockers) {
    newShapeObject.alignDockers();
  }
  return newShapeObject;
}, deleteShape:function(shape) {
  if (!shape || !shape.parent) {
    return;
  }
  shape.parent.remove(shape);
  shape.getOutgoingShapes().each(function(os) {
    var docker = os.getDockers()[0];
    if (docker && docker.getDockedShape() == shape) {
      docker.setDockedShape(undefined);
    }
  });
  shape.getIncomingShapes().each(function(is) {
    var docker = is.getDockers().last();
    if (docker && docker.getDockedShape() == shape) {
      docker.setDockedShape(undefined);
    }
  });
  shape.getDockers().each(function(docker) {
    docker.setDockedShape(undefined);
  });
}, getModelMetaData:function() {
  return this.modelMetaData;
}, _executeEventImmediately:function(eventObj) {
  if (this.DOMEventListeners.keys().member(eventObj.event.type)) {
    try {
      this.DOMEventListeners.get(eventObj.event.type).each(function(value) {
        value(eventObj.event, eventObj.arg);
      }.bind(this));
    } catch (e) {
      ORYX.Log.debug(eventObj.event.type + ":" + this.DOMEventListeners.get(eventObj.event.type));
      ORYX.Log.exception(e);
    }
  }
}, _executeEvents:function() {
  this._queueRunning = true;
  while (this._eventsQueue.length > 0) {
    var val = this._eventsQueue.shift();
    this._executeEventImmediately(val);
  }
  this._queueRunning = false;
}, raiseEvent:function(event, uiObj) {
  if (!this.focus) {
    return;
  }
  ORYX.Log.trace("Dispatching event type %0 on %1", event.type, uiObj);
  switch(event.type) {
    case ORCHESTRATOR.EVENTS.MOUSEDOWN:
      this._handleMouseDown(event, uiObj);
      break;
    case ORCHESTRATOR.EVENTS.MOUSEMOVE:
      this._handleMouseMove(event, uiObj);
      break;
    case ORCHESTRATOR.EVENTS.MOUSEUP:
      this._handleMouseUp(event, uiObj);
      break;
    case ORCHESTRATOR.EVENTS.MOUSEOVER:
      this._handleMouseHover(event, uiObj);
      break;
    case ORCHESTRATOR.EVENTS.MOUSEOUT:
      this._handleMouseOut(event, uiObj);
      break;
  }
  if (event.forceExecution) {
    this._executeEventImmediately({event:event, arg:uiObj});
  } else {
    this._eventsQueue.push({event:event, arg:uiObj});
  }
  if (!this._queueRunning) {
    this._executeEvents();
  }
  return false;
}, isValidEvent:function(e) {
  try {
    var isInput = ["INPUT", "TEXTAREA"].include(e.target.tagName.toUpperCase());
    return!isInput;
  } catch (e) {
    return false;
  }
}, handleResize:function(event) {
  if (this._canvas) {
    this._canvas.updateSize(true);
  }
}, catchKeyUpEvents:function(event) {
  if (!this._keyupEnabled) {
    return;
  }
  if (!event) {
    event = window.event;
  }
  if (!this.isValidEvent(event)) {
    return;
  }
  var keyUpEvent = this.createKeyCombEvent(event, ORCHESTRATOR.CONST.KEY_ACTION_UP);
  ORYX.Log.trace("Key Event to handle: %0", keyUpEvent);
  this.raiseEvent({type:keyUpEvent, event:event});
}, catchKeyDownEvents:function(event) {
  if (!this._keydownEnabled) {
    return;
  }
  if (!event) {
    event = window.event;
  }
  if (!this.isValidEvent(event)) {
    return;
  }
  var keyDownEvent = this.createKeyCombEvent(event, ORCHESTRATOR.CONST.KEY_ACTION_DOWN);
  ORYX.Log.trace("Key Event to handle: %0", keyDownEvent);
  this.raiseEvent({type:keyDownEvent, event:event});
}, createKeyCombEvent:function(keyEvent, keyAction) {
  var pressedKey = keyEvent.which || keyEvent.keyCode;
  var eventName = "key.event";
  if (keyAction) {
    eventName += "." + keyAction;
  }
  if (keyEvent.ctrlKey || keyEvent.metaKey) {
    eventName += "." + ORCHESTRATOR.CONST.META_KEY_META_CTRL;
  }
  if (keyEvent.altKey) {
    eventName += "." + ORCHESTRATOR.CONST.META_KEY_ALT;
  }
  if (keyEvent.shiftKey) {
    eventName += "." + ORCHESTRATOR.CONST.META_KEY_SHIFT;
  }
  return eventName + "." + pressedKey;
}, _handleMouseDown:function(event, uiObj) {
  var canvas = this.getCanvas();
  var elementController = uiObj;
  var currentIsSelectable = elementController !== null && (elementController !== undefined && elementController.isSelectable);
  var currentIsMovable = elementController !== null && (elementController !== undefined && elementController.isMovable);
  var modifierKeyPressed = event.shiftKey || event.ctrlKey;
  var noObjectsSelected = this.selection.length === 0;
  var currentIsSelected = this.selection.member(elementController);
  if (currentIsSelectable && noObjectsSelected) {
    this.setSelection([elementController]);
    ORYX.Log.trace("Rule #1 applied for mouse down on %0", uiObj);
  } else {
    if (currentIsSelectable && (!noObjectsSelected && (!modifierKeyPressed && !currentIsSelected))) {
      this.setSelection([elementController]);
      ORYX.Log.trace("Rule #3 applied for mouse down on %0", uiObj);
    } else {
      if (currentIsSelectable && (modifierKeyPressed && !currentIsSelected)) {
        var newSelection = this.selection.clone();
        newSelection.push(elementController);
        this.setSelection(newSelection);
        ORYX.Log.trace("Rule #4 applied for mouse down on %0", uiObj);
      } else {
        if (!currentIsSelectable && !currentIsMovable) {
          this.setSelection([]);
          ORYX.Log.trace("Rule #2 applied for mouse down on %0", uiObj);
          return;
        } else {
          if (!currentIsSelectable && (currentIsMovable && !(elementController instanceof ORYX.Core.Controls.Docker))) {
            ORYX.Log.trace("Rule #7 applied for mouse down on %0", uiObj);
          } else {
            if (currentIsSelectable && (currentIsSelected && !modifierKeyPressed)) {
              this._subSelection = this._subSelection != elementController ? elementController : undefined;
              this.setSelection(this.selection, this._subSelection);
              ORYX.Log.trace("Rule #8 applied for mouse down on %0", uiObj);
            }
          }
        }
      }
    }
  }
  return;
}, _handleMouseMove:function(event, uiObj) {
}, _handleMouseUp:function(event, uiObj) {
}, _handleMouseHover:function(event, uiObj) {
}, _handleMouseOut:function(event, uiObj) {
}, provideId:function() {
  var res = [], hex = "0123456789ABCDEF";
  for (var i = 0;i < 36;i++) {
    res[i] = Math.floor(Math.random() * 16);
  }
  res[14] = 4;
  res[19] = res[19] & 3 | 8;
  for (var i = 0;i < 36;i++) {
    res[i] = hex[res[i]];
  }
  res[8] = res[13] = res[18] = res[23] = "-";
  return "rid_" + res.join("");
}, eventCoordinates:function(event) {
  var a = this._canvas.getScreenCTM();
  return{x:event.clientX - a.e, y:event.clientY - a.f};
}};
ORYX.Editor = Clazz.extend(ORYX.Editor);
modeler = function(parent, options) {
  return(new ORYX.Editor(parent, options))._getPluginFacade();
};
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.Undo = {construct:function(facade) {
  this.facade = facade;
  this.undoStack = [];
  this.redoStack = [];
  this.facade.offer({functionality:this.doUndo.bind(this), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:90, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.offer({functionality:this.doRedo.bind(this), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:89, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.EXECUTE_COMMANDS, this.handleExecuteCommands.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DISCARDED, this.handleDiscard.bind(this));
}, handleDiscard:function() {
  this.undoStack = [];
  this.redoStack = [];
}, handleExecuteCommands:function(evt) {
  if (!evt.commands) {
    return;
  }
  this.undoStack.push(evt.commands);
  this.redoStack = [];
}, doUndo:function() {
  var lastCommands = this.undoStack.pop();
  if (lastCommands) {
    this.redoStack.push(lastCommands);
    for (var i = lastCommands.length - 1;i >= 0;--i) {
      lastCommands[i].rollback();
    }
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.UNDO_ROLLBACK, commands:lastCommands});
    this.facade.getCanvas().update();
    this.facade.updateSelection();
  }
}, doRedo:function() {
  var lastCommands = this.redoStack.pop();
  if (lastCommands) {
    this.undoStack.push(lastCommands);
    lastCommands.each(function(command) {
      command.execute();
    });
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.UNDO_EXECUTE, commands:lastCommands});
    this.facade.getCanvas().update();
    this.facade.updateSelection();
  }
}};
ORYX.Plugins.Undo = Clazz.extend(ORYX.Plugins.Undo);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.Save = {construct:function(facade) {
  this.facade = facade;
  this.facade.offer({functionality:this.save.bind(this), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:83, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.SAVE, this.save.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.LOAD, this.load.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.BEFORECLEAR, this.clear.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT, this.highlight.bind(this));
  window.onbeforeunload = this.onUnLoad.bind(this);
  window.onunload = this.onLeave.bind(this);
  this.changeDifference = 0;
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.UNDO_EXECUTE, function() {
    this.changeDifference++;
    this.updateTitle();
  }.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.EXECUTE_COMMANDS, function() {
    this.changeDifference++;
    this.updateTitle();
  }.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.UNDO_ROLLBACK, function() {
    this.changeDifference--;
    this.updateTitle();
  }.bind(this));
}, updateTitle:function() {
  if (ORCHESTRATOR.CONFIG.FULLSCREEN) {
    var value = window.document.title || document.getElementsByTagName("title")[0].childNodes[0].nodeValue;
    if (this.changeDifference === 0 && value.startsWith(ORCHESTRATOR.CONFIG.CHANGE_SYMBOL)) {
      window.document.title = value.slice(1);
    } else {
      if (this.changeDifference !== 0 && !value.startsWith(ORCHESTRATOR.CONFIG.CHANGE_SYMBOL)) {
        window.document.title = ORCHESTRATOR.CONFIG.CHANGE_SYMBOL + value;
      }
    }
  }
  Element.store(this.facade.getRootNode(), ORCHESTRATOR.DATA.MODIFY_FLAG, this.changeDifference !== 0);
}, onLeave:function() {
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.LEAVE});
}, onUnLoad:function() {
  if (this.changeDifference !== 0) {
    return ORCHESTRATOR.Save.UNSAVED_DATA;
  }
}, clear:function(options) {
  if (!options.force) {
    var msg = this.onUnLoad();
    if (msg && !confirm(msg)) {
      return;
    }
  }
  this.changeDifference = 0;
  this.updateTitle();
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DISCARDED});
}, load:function(options) {
  if (!options.force) {
    var msg = this.onUnLoad();
    if (msg && !confirm(msg)) {
      return;
    }
  }
  this.changeDifference = 0;
  this.updateTitle();
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DISCARDED});
  if (options.url) {
    ORCHESTRATOR.api.request(options.src, function(meta) {
      this.facade.load(meta);
      if (options.editMode == "false") {
        this.facade.enableReadOnlyMode();
      }
    }.bind(this));
  } else {
    if (options.forceNew) {
      meta = {};
      meta.key = options.processDefinition;
      if (options.properties) {
        meta.name = options.properties.name;
        meta.description = options.properties.description;
        meta.model = {};
        meta.model.properties = {};
        meta.model.properties.process_id = options.processDefinition;
        meta.model.properties.deployment = options.properties.deployment;
        meta.model.properties.category = options.properties.category;
        meta.model.properties.name = options.properties.name;
      }
      this.facade.load(meta, options.parent);
    } else {
      ORCHESTRATOR.api.getProcessDefinitionModel(options.processDefinition, function(meta) {
        meta.instance = options.processInstanceId;
        meta.history = options.processHistoryId;
        this.facade.load(meta, options.parent);
        if (options.editMode == "false") {
          this.facade.enableReadOnlyMode();
        }
      }.bind(this));
    }
  }
}, highlight:function(options) {
  ORCHESTRATOR.api.getInstanceHighlight(options.instance, function(info) {
    var canvas = this.facade.getCanvas();
    this.highlights = [];
    info.activities && info.activities.each(function(id) {
      this.highlights.push(canvas.getChildShapeByResourceId(id));
    }.bind(this));
    info.flows && info.flows.each(function(id) {
      this.highlights.push(canvas.getChildShapeByResourceId(id));
    }.bind(this));
    this.highlights.each(function(element) {
      element.refresh({color:options.color || ORCHESTRATOR.CONFIG.HIGHLIGHT_COLOR, width:options.strokewidth || ORCHESTRATOR.CONFIG.HIGHLIGHT_STROKE});
    });
  }.bind(this));
}, saveSynchronously:function(meta) {
  if (!meta) {
    return;
  }
  var json = this.facade.getJSON();
  meta.model.properties.deployment = json.properties.deployment;
  json = Object.toJSON(json);
  var params = {id:meta.key, json_xml:json, name:meta.name || "", type:this.facade.getCanvas().getStencil().stencilSet().title(), parent:meta.parent, deployment:meta.model.properties.deployment, description:meta.description || ""};
  this.saving = false;
  ORCHESTRATOR.api.putProcessDefinitionModel(params.id, params, function(success, transport) {
    if (success) {
      this.changeDifference = 0;
      this.updateTitle();
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.SAVED});
    } else {
      alert("Something went wrong when trying to save your diagram. Please try again.");
    }
  }.bind(this));
}, save:function(event) {
  if (event.event) {
    ORYX.stop(event.event);
  }
  if (this.saving) {
    return true;
  }
  this.saving = true;
  try {
    this.saveSynchronously(this.facade.getModelMetaData());
  } catch (e) {
    this.saving = false;
    ORYX.Log.exception(e);
  }
  return true;
}};
ORYX.Plugins.Save = Clazz.extend(ORYX.Plugins.Save);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.Properties = {construct:function(facade) {
  this.facade = facade;
  this.visible = false;
  this.commited = true;
  this.shapeSelection = {};
  this.shapeSelection.commonProperties = new Array;
  this.shapeSelection.commonPropertiesValues = new ORYX.Hash;
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.PROPERTY_UPDATE, this.onchange.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.PROPERTY_WINDOW, this.onvisible.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.CLICK, this.handleMouseDown.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.CLEAR, this.clear.bind(this));
}, clear:function() {
  this.instance = -1;
  this.history = -1;
}, onvisible:function(options) {
  this.visible = options.visible;
  if (this.visible) {
    this.onSelectionChanged(options.event);
  }
}, handleMouseDown:function(event, uiObj) {
  if (event.ctrlKey && (uiObj instanceof ORYX.Core.Node && uiObj.getStencil().id() === "CallActivity")) {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.JUMP, activity:uiObj.properties.get("callactivitycalledelement")});
  }
}, onSelectionChanged:function(event) {
  if (!this.visible || !this.commited) {
    return;
  }
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_BLUR, forceExecution:true});
  var canvas = this.facade.getCanvas();
  if (!event || (!event.elements || event.elements.length == 0)) {
    if (canvas) {
      this.shapeSelection.shapes = [canvas];
    }
  } else {
    this.shapeSelection.shapes = event.elements;
    if (!this.shapeSelection.shapes.first().getStencil) {
      this.shapeSelection.shapes = [canvas];
    }
  }
  if (event && event.subSelection) {
    this.shapeSelection.shapes = [event.subSelection];
  }
  if (this.instance == -1) {
    this.instance = this.facade.getModelMetaData().instance;
  }
  if (this.history == -1) {
    this.history = this.facade.getModelMetaData().history;
  }
  if (this.shapeSelection.shapes) {
    if (this.instance) {
      if (this.shapeSelection.shapes.length == 1) {
        var self = this;
        var id = this.shapeSelection.shapes[0] === canvas ? null : this.shapeSelection.shapes[0].resourceId;
        ORCHESTRATOR.api.getInstanceVars(this.instance, id, function(json) {
          var props = id ? json.formProperties : json;
          if (!props && json.data) {
            props = [];
            json.data.each(function(data) {
              props.push({name:data.variable.name, value:data.variable.value, type:data.variable.type});
            });
          }
          self.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:self.shapeSelection.shapes, id:json.taskId, properties:props});
        });
      } else {
        this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:this.shapeSelection.shapes});
      }
    } else {
      if (this.history) {
        if (this.shapeSelection.shapes.length == 1) {
          var self = this;
          var id = this.shapeSelection.shapes[0] === canvas ? null : this.shapeSelection.shapes[0].resourceId;
          ORCHESTRATOR.api.getHistoryVars(this.history, id, function(json) {
            var props = [];
            var taskid = null;
            if (json.data) {
              json.data.each(function(data) {
                if (!id && !data.taskId || id) {
                  props.push({name:data.variable.name, value:data.variable.value, type:data.variable.type});
                }
              });
              if (id && json.data.length > 0) {
                taskid = json.data[0].taskId;
              }
            }
            self.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:self.shapeSelection.shapes, id:taskid, properties:props});
          });
        } else {
          this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.TASK_SELECT, shapes:this.shapeSelection.shapes});
        }
      } else {
        this.createProperties();
        this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.PROPERTY_SELECT, shapes:this.shapeSelection.shapes, properties:this.properties});
      }
    }
  }
}, identifyCommonProperties:function() {
  this.shapeSelection.commonProperties.clear();
  var stencils = this.getStencilSetOfSelection();
  var firstStencil = stencils.values().first();
  var comparingStencils = stencils.values().without(firstStencil);
  if (comparingStencils.length == 0) {
    this.shapeSelection.commonProperties = firstStencil.properties();
  } else {
    var properties = new ORYX.Hash;
    firstStencil.properties().each(function(property) {
      properties.set(property.id() + "-" + property.type(), property);
    });
    comparingStencils.each(function(stencil) {
      var intersection = new ORYX.Hash;
      stencil.properties().each(function(property) {
        if (properties.get(property.id() + "-" + property.type())) {
          intersection.set(property.id() + "-" + property.type(), property);
        }
      });
      properties = intersection;
    });
    this.shapeSelection.commonProperties = properties.values();
  }
}, setCommonPropertiesValues:function() {
  this.shapeSelection.commonPropertiesValues = new ORYX.Hash;
  this.shapeSelection.commonProperties.each(function(property) {
    var key = property.id();
    var emptyValue = false;
    var firstShape = this.shapeSelection.shapes.first();
    this.shapeSelection.shapes.each(function(shape) {
      if (firstShape.properties.get(key) != shape.properties.get(key)) {
        emptyValue = true;
      }
    }.bind(this));
    if (!emptyValue) {
      this.shapeSelection.commonPropertiesValues.set(key, firstShape.properties.get(key));
    }
  }.bind(this));
}, createProperties:function() {
  this.identifyCommonProperties();
  this.setCommonPropertiesValues();
  this.properties = [];
  if (this.shapeSelection.commonProperties) {
    this.shapeSelection.commonProperties.each(function(pair, index) {
      if (pair.visible()) {
        if (pair.popular()) {
          pair.setPopular();
        }
        var key = pair.id();
        var attribute = this.shapeSelection.commonPropertiesValues.get(key);
        this.properties.push({popular:pair.popular(), name:pair.title(), value:attribute, readonly:pair.readonly(), gridProperties:{propId:key, type:pair.type(), tooltip:pair.description()}, pair:pair});
      }
    }.bind(this));
  }
}, onchange:function(options) {
  var record = this.properties[options.row];
  var selectedElements = this.shapeSelection.shapes;
  var key = record.gridProperties.propId;
  var oldValue = record.value;
  var newValue = options.value;
  var facade = this.facade;
  var commandClass = ORYX.Core.Command.extend({construct:function() {
    this.key = key;
    this.selectedElements = selectedElements;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.facade = facade;
  }, execute:function() {
    this.selectedElements.each(function(shape) {
      if (!shape.getStencil().property(this.key).readonly()) {
        shape.setProperty(this.key, this.newValue);
      }
    }.bind(this));
    this.facade.setSelection(this.selectedElements);
    this.facade.getCanvas().update();
    this.facade.updateSelection(true);
  }, rollback:function() {
    this.selectedElements.each(function(shape) {
      shape.setProperty(this.key, this.oldValue);
    }.bind(this));
    this.facade.setSelection(this.selectedElements);
    this.facade.getCanvas().update();
    this.facade.updateSelection(true);
  }});
  var command = new commandClass;
  this.commited = false;
  this.facade.executeCommands([command]);
  this.commited = true;
}, getStencilSetOfSelection:function() {
  var stencils = new ORYX.Hash;
  this.shapeSelection.shapes.each(function(shape) {
    stencils.set(shape.getStencil().id(), shape.getStencil());
  });
  return stencils;
}};
ORYX.Plugins.Properties = Clazz.extend(ORYX.Plugins.Properties);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.DragDocker = {construct:function(facade) {
  this.facade = facade;
  this.VALIDCOLOR = ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR;
  this.INVALIDCOLOR = ORCHESTRATOR.CONFIG.SELECTION_INVALID_COLOR;
  this.shapeSelection = undefined;
  this.docker = undefined;
  this.dockerParent = undefined;
  this.dockerSource = undefined;
  this.dockerTarget = undefined;
  this.lastUIObj = undefined;
  this.isStartDocker = undefined;
  this.isEndDocker = undefined;
  this.undockTreshold = 10;
  this.initialDockerPosition = undefined;
  this.outerDockerNotMoved = undefined;
  this.isValid = false;
  this.uiObj = null;
  this.dragging = false;
  this.dragEnable = false;
  this.callbackMouseMove = this.handleMouseMove.bind(this);
  this.callbackMouseUp = this.handleMouseUp.bind(this);
  this.callbackMouseOver = this.handleMouseOver.bind(this);
  this.callbackMouseDown = this.handleMouseDown.bind(this);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.callbackMouseDown);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEOVER, this.callbackMouseOver);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEOUT, this.handleMouseOut.bind(this));
}, enableReadOnlyMode:function() {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.callbackMouseDown);
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEOVER, this.callbackMouseOver);
}, disableReadOnlyMode:function() {
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.callbackMouseDown);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEOVER, this.callbackMouseOver);
}, handleMouseOut:function(event, uiObj) {
  if (!this.dragging && this.uiObj instanceof ORYX.Core.Controls.Docker) {
    this.uiObj.hide();
    this.uiObj = null;
  } else {
    if (!this.dragging && this.uiObj instanceof ORYX.Core.Edge) {
      this.uiObj.dockers.each(function(docker) {
        docker.hide();
      });
      this.uiObj = null;
    }
  }
}, handleMouseOver:function(event, uiObj) {
  if (!this.dragging && uiObj instanceof ORYX.Core.Controls.Docker) {
    uiObj.show();
    this.uiObj = uiObj;
  } else {
    if (!this.dragging && uiObj instanceof ORYX.Core.Edge) {
      uiObj.dockers.each(function(docker) {
        docker.show();
      });
      this.uiObj = uiObj;
    } else {
      if (!this.dragging && this.uiObj instanceof ORYX.Core.Controls.Docker) {
        this.uiObj.hide();
        this.uiObj = null;
      } else {
        if (!this.dragging && this.uiObj instanceof ORYX.Core.Edge) {
          this.uiObj.dockers.each(function(docker) {
            docker.hide();
          });
          this.uiObj = null;
        }
      }
    }
  }
}, handleMouseDown:function(event, uiObj) {
  if (uiObj instanceof ORYX.Core.Controls.Docker && (uiObj.isMovable && !this.dragging)) {
    this.dragEnable = false;
    this.shapeSelection = this.facade.getSelection();
    this.facade.setSelection();
    this.docker = uiObj;
    this.initialDockerPosition = this.docker.bounds.center();
    this.outerDockerNotMoved = false;
    this.dockerParent = uiObj.parent;
    this._commandArg = {docker:uiObj, dockedShape:uiObj.getDockedShape(), refPoint:uiObj.referencePoint || uiObj.bounds.center()};
    if (uiObj.parent instanceof ORYX.Core.Edge && (uiObj.parent.dockers[0] == uiObj || uiObj.parent.dockers.last() == uiObj)) {
      if (uiObj.parent.dockers[0] == uiObj && uiObj.parent.dockers.last().getDockedShape()) {
        this.dockerTarget = uiObj.parent.dockers.last().getDockedShape();
      } else {
        if (uiObj.parent.dockers.last() == uiObj && uiObj.parent.dockers[0].getDockedShape()) {
          this.dockerSource = uiObj.parent.dockers[0].getDockedShape();
        }
      }
    } else {
      this.dockerSource = undefined;
      this.dockerTarget = undefined;
    }
    this.dragging = true;
    this.isStartDocker = this.docker.parent.dockers[0] === this.docker;
    this.isEndDocker = this.docker.parent.dockers.last() === this.docker;
    this.docker.parent.getLabels().each(function(label) {
      label.hide();
    });
    if ((this.isStartDocker || this.isEndDocker) && this.docker.isDocked()) {
      this.outerDockerNotMoved = true;
    }
    this.scrollNode = uiObj.paper.canvas.parentNode;
    var upL = uiObj.bounds.upperLeft();
    this.offSetPosition = {x:ORYX.pointerX(event) - upL.x, y:ORYX.pointerY(event) - upL.y};
    this.offsetScroll = {x:this.scrollNode.scrollLeft, y:this.scrollNode.scrollTop};
    this.uiObj = uiObj;
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
    window.setTimeout(function() {
      this.dragEnable = true;
    }.bind(this), 150);
  }
}, handleMouseMove:function(event, uiObj) {
  if (!this.dragEnable) {
    return;
  }
  if (!ORYX.isLeftClick(event)) {
    return this.handleMouseUp(event);
  }
  var position = {x:ORYX.pointerX(event) - this.offSetPosition.x, y:ORYX.pointerY(event) - this.offSetPosition.y};
  position.x -= this.offsetScroll.x - this.scrollNode.scrollLeft;
  position.y -= this.offsetScroll.y - this.scrollNode.scrollTop;
  this.uiObj.bounds.moveTo(position);
  this.dockerMoved(event);
}, handleMouseUp:function(event, uiObj) {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  if (this.dragEnable) {
    this.dockerMovedFinished(event);
    this.dragEnable = false;
  }
  this.dragging = false;
}, dockerMoved:function(event) {
  this.outerDockerNotMoved = false;
  var snapToMagnet = undefined;
  if (this.docker.parent) {
    if (this.isStartDocker || this.isEndDocker) {
      var evPos = this.facade.eventCoordinates(event);
      if (this.docker.isDocked()) {
        var distanceDockerPointer = ORYX.Core.Math.getDistancePointToPoint(evPos, this.initialDockerPosition);
        if (distanceDockerPointer < this.undockTreshold) {
          this.outerDockerNotMoved = true;
          return;
        }
        this.docker.setDockedShape(undefined);
        this.dockerParent._update();
      }
      var shapes = this.facade.getCanvas().getAbstractShapesAtPosition(evPos);
      var uiObj = shapes.pop();
      if (this.docker.parent === uiObj) {
        uiObj = shapes.pop();
      }
      if (this.lastUIObj == uiObj) {
      } else {
        if (uiObj instanceof ORYX.Core.Shape) {
          var sset = this.docker.parent.getStencil().stencilSet();
          if (this.docker.parent instanceof ORYX.Core.Edge) {
            var highestParent = this.getHighestParentBeforeCanvas(uiObj);
            if (highestParent instanceof ORYX.Core.Edge && this.docker.parent === highestParent) {
              this.isValid = false;
              this.dockerParent._update();
              return;
            }
            this.isValid = false;
            var curObj = uiObj, orgObj = uiObj;
            while (!this.isValid && (curObj && !(curObj instanceof ORYX.Core.Canvas))) {
              uiObj = curObj;
              this.isValid = this.facade.getRules().canConnect({sourceShape:this.dockerSource ? this.dockerSource : this.isStartDocker ? uiObj : undefined, edgeShape:this.docker.parent, targetShape:this.dockerTarget ? this.dockerTarget : this.isEndDocker ? uiObj : undefined});
              curObj = curObj.parent;
            }
            if (!this.isValid) {
              uiObj = orgObj;
            }
          } else {
            this.isValid = this.facade.getRules().canConnect({sourceShape:uiObj, edgeShape:this.docker.parent, targetShape:this.docker.parent});
          }
          if (this.lastUIObj) {
            this.hideMagnets(this.lastUIObj);
          }
          if (this.isValid) {
            this.showMagnets(uiObj);
          }
          this.showHighlight(uiObj, this.isValid ? this.VALIDCOLOR : this.INVALIDCOLOR);
          this.lastUIObj = uiObj;
        } else {
          this.hideHighlight();
          if (this.lastUIObj) {
            this.hideMagnets(this.lastUIObj);
          }
          this.lastUIObj = undefined;
          this.isValid = false;
        }
      }
      if (this.lastUIObj && (this.isValid && !(event.shiftKey || event.ctrlKey))) {
        snapToMagnet = this.lastUIObj.magnets.find(function(magnet) {
          return magnet.absoluteBounds().isIncluded(evPos);
        });
        if (snapToMagnet) {
          this.docker.bounds.centerMoveTo(snapToMagnet.absoluteCenterXY());
        }
      }
    }
  }
  if (!(event.shiftKey || event.ctrlKey) && !snapToMagnet) {
    var minOffset = ORCHESTRATOR.CONFIG.DOCKER_SNAP_OFFSET;
    var nearestX = minOffset + 1;
    var nearestY = minOffset + 1;
    var dockerCenter = this.docker.bounds.center();
    if (this.docker.parent) {
      this.docker.parent.dockers.each(function(docker) {
        if (this.docker == docker) {
          return;
        }
        var center = docker.referencePoint ? docker.getAbsoluteReferencePoint() : docker.bounds.center();
        nearestX = Math.abs(nearestX) > Math.abs(center.x - dockerCenter.x) ? center.x - dockerCenter.x : nearestX;
        nearestY = Math.abs(nearestY) > Math.abs(center.y - dockerCenter.y) ? center.y - dockerCenter.y : nearestY;
      }.bind(this));
      if (Math.abs(nearestX) < minOffset || Math.abs(nearestY) < minOffset) {
        nearestX = Math.abs(nearestX) < minOffset ? nearestX : 0;
        nearestY = Math.abs(nearestY) < minOffset ? nearestY : 0;
        this.docker.bounds.centerMoveTo(dockerCenter.x + nearestX, dockerCenter.y + nearestY);
      } else {
        var previous = this.docker.parent.dockers[Math.max(this.docker.parent.dockers.indexOf(this.docker) - 1, 0)];
        var next = this.docker.parent.dockers[Math.min(this.docker.parent.dockers.indexOf(this.docker) + 1, this.docker.parent.dockers.length - 1)];
        if (previous && (next && (previous !== this.docker && next !== this.docker))) {
          var cp = previous.bounds.center();
          var cn = next.bounds.center();
          var cd = this.docker.bounds.center();
          if (ORYX.Core.Math.isPointInLine(cd.x, cd.y, cp.x, cp.y, cn.x, cn.y, 10)) {
            var raise = (Number(cn.y) - Number(cp.y)) / (Number(cn.x) - Number(cp.x));
            var intersecX = (cp.y - cp.x * raise - (cd.y - cd.x * -Math.pow(raise, -1))) / (-Math.pow(raise, -1) - raise);
            var intersecY = cp.y - cp.x * raise + raise * intersecX;
            if (isNaN(intersecX) || isNaN(intersecY)) {
              return;
            }
            this.docker.bounds.centerMoveTo(intersecX, intersecY);
          }
        }
      }
    }
  }
  this.dockerParent._update();
}, dockerMovedFinished:function(event) {
  this.facade.setSelection(this.shapeSelection);
  this.hideHighlight();
  this.dockerParent.getLabels().each(function(label) {
    label.show();
  });
  if (this.lastUIObj && (this.isStartDocker || this.isEndDocker)) {
    if (this.isValid) {
      this.docker.setDockedShape(this.lastUIObj);
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DRAGDOCKER_DOCKED, docker:this.docker, parent:this.docker.parent, target:this.lastUIObj});
    }
    this.hideMagnets(this.lastUIObj);
  }
  this.docker.hide();
  if (this.outerDockerNotMoved) {
    var evPos = this.facade.eventCoordinates(event);
    var shapes = this.facade.getCanvas().getAbstractShapesAtPosition(evPos);
    var shapeWithoutEdges = shapes.findAll(function(node) {
      return node instanceof ORYX.Core.Node;
    });
    shapes = shapeWithoutEdges.length ? shapeWithoutEdges : shapes;
    this.facade.setSelection(shapes);
  } else {
    var dragDockerCommand = ORYX.Core.Command.extend({construct:function(docker, newPos, oldPos, newDockedShape, oldDockedShape, facade) {
      this.docker = docker;
      this.index = docker.parent.dockers.indexOf(docker);
      this.newPosition = newPos;
      this.newDockedShape = newDockedShape;
      this.oldPosition = oldPos;
      this.oldDockedShape = oldDockedShape;
      this.facade = facade;
      this.index = docker.parent.dockers.indexOf(docker);
      this.shape = docker.parent;
    }, execute:function() {
      if (!this.docker.parent) {
        this.docker = this.shape.dockers[this.index];
      }
      this.dock(this.newDockedShape, this.newPosition);
      this.removedDockers = this.shape.removeUnusedDockers();
      this.facade.updateSelection();
    }, rollback:function() {
      this.dock(this.oldDockedShape, this.oldPosition);
      (this.removedDockers || $H({})).each(function(d) {
        this.shape.add(d.value, Number(d.key));
        this.shape._update(true);
      }.bind(this));
      this.facade.updateSelection();
    }, dock:function(toDockShape, pos) {
      this.docker.setDockedShape(undefined);
      if (toDockShape) {
        this.docker.setDockedShape(toDockShape);
        this.docker.setReferencePoint(pos);
      } else {
        this.docker.bounds.centerMoveTo(pos);
      }
      this.facade.getCanvas().update();
    }});
    if (this.docker.parent) {
      var command = new dragDockerCommand(this.docker, this.docker.getDockedShape() ? this.docker.referencePoint : this.docker.bounds.center(), this._commandArg.refPoint, this.docker.getDockedShape(), this._commandArg.dockedShape, this.facade);
      this.facade.executeCommands([command]);
    }
  }
  this.docker = undefined;
  this.dockerParent = undefined;
  this.dockerSource = undefined;
  this.dockerTarget = undefined;
  this.lastUIObj = undefined;
}, hideHighlight:function() {
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"validDockedShape"});
}, showHighlight:function(uiObj, color) {
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"validDockedShape", elements:[uiObj], color:color});
}, showMagnets:function(uiObj) {
  uiObj.magnets.each(function(magnet) {
    magnet.show();
  });
}, hideMagnets:function(uiObj) {
  uiObj.magnets.each(function(magnet) {
    magnet.hide();
  });
}, getHighestParentBeforeCanvas:function(shape) {
  if (!(shape instanceof ORYX.Core.Shape)) {
    return undefined;
  }
  var parent = shape.parent;
  while (parent && !(parent.parent instanceof ORYX.Core.Canvas)) {
    parent = parent.parent;
  }
  return parent;
}};
ORYX.Plugins.DragDocker = Clazz.extend(ORYX.Plugins.DragDocker);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.AddDocker = {construct:function(facade) {
  this.facade = facade;
  this.callbackMouseDown = this.handleMouseDown.bind(this);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
}, enableReadOnlyMode:function() {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
}, disableReadOnlyMode:function() {
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.DBLCLICK, this.callbackMouseDown);
}, handleMouseDown:function(event, uiObj) {
  if (uiObj instanceof ORYX.Core.Controls.Docker && uiObj.parent instanceof ORYX.Core.Edge) {
    this.newDockerCommand({adding:false, edge:uiObj.parent, docker:uiObj});
  } else {
    if (uiObj instanceof ORYX.Core.Edge) {
      this.newDockerCommand({adding:true, edge:uiObj, position:this.facade.eventCoordinates(event)});
    }
  }
}, newDockerCommand:function(options) {
  if (!options.edge) {
    return;
  }
  var commandClass = ORYX.Core.Command.extend({construct:function(addEnabled, deleteEnabled, edge, docker, pos, facade) {
    this.addEnabled = addEnabled;
    this.deleteEnabled = deleteEnabled;
    this.edge = edge;
    this.docker = docker;
    this.pos = pos;
    this.facade = facade;
  }, execute:function() {
    if (this.addEnabled) {
      if (!this.docker) {
        this.docker = this.edge.addDocker(this.pos);
        this.index = this.edge.dockers.indexOf(this.docker);
      } else {
        this.edge.add(this.docker, this.index);
      }
    } else {
      if (this.deleteEnabled) {
        this.index = this.edge.dockers.indexOf(this.docker);
        this.pos = this.docker.bounds.center();
        this.edge.removeDocker(this.docker);
      }
    }
    this.edge.getLabels().invoke("show");
    this.facade.getCanvas().update();
    this.facade.updateSelection();
    if (this.addEnabled) {
      this.docker.show();
    }
  }, rollback:function() {
    if (this.addEnabled) {
      if (this.docker instanceof ORYX.Core.Controls.Docker) {
        this.edge.removeDocker(this.docker);
      }
    } else {
      if (this.deleteEnabled) {
        this.edge.add(this.docker, this.index);
      }
    }
    this.edge.getLabels().invoke("show");
    this.facade.getCanvas().update();
    this.facade.updateSelection();
  }});
  var command = new commandClass(options.adding, !options.adding, options.edge, options.docker, options.position, this.facade);
  try {
    this.facade.executeCommands([command]);
  } catch (e) {
    ORYX.Log.exception(e);
  }
}};
ORYX.Plugins.AddDocker = Clazz.extend(ORYX.Plugins.AddDocker);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.SelectionFrame = {construct:function(facade) {
  arguments.callee.$.construct.apply(this, arguments);
  this.facade = facade;
  this.start = {x:0, y:0};
  this.stop = {x:0, y:0};
  this.dragging = false;
  this.callbackMouseMove = this.handleMouseMove.bind(this);
  this.callbackMouseUp = this.handleMouseUp.bind(this);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));
}, redraw:function(paper) {
  this.raphael = paper.rect(0, 0, 0, 0).attr({stroke:"#777777", fill:"none", "stroke-dasharray":"- "});
  this.eventHandlerCallback = this.facade.getEventHandler();
  this.addEventHandlers(this.raphael.node);
  this.hide();
}, handleMouseDown:function(event, uiObj) {
  if (uiObj instanceof ORYX.Core.Canvas || event.shiftKey) {
    this.start = this.facade.eventCoordinates(event);
    this.stop = this.start;
    this.resize();
    this.show();
    this.dragging = true;
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  }
}, handleMouseUp:function(event) {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  if (this.dragging) {
    this.hide();
    var tmp;
    if (this.stop.x < this.start.x) {
      tmp = this.start.x;
      this.start.x = this.stop.x;
      this.stop.x = tmp;
    }
    if (this.stop.y < this.start.y) {
      tmp = this.start.y;
      this.start.y = this.stop.y;
      this.stop.y = tmp;
    }
    var elements = this.facade.getCanvas().getChildShapes(true).findAll(function(value) {
      var absBounds = value.absoluteBounds();
      var bA = absBounds.upperLeft();
      var bB = absBounds.lowerRight();
      if (bA.x >= this.start.x && (bA.y >= this.start.y && (bB.x <= this.stop.x && bB.y <= this.stop.y))) {
        return true;
      }
      return false;
    }.bind(this));
    this.facade.setSelection(elements);
  }
  this.dragging = false;
}, handleMouseMove:function(event) {
  if (!this.dragging) {
    return;
  }
  if (!ORYX.isLeftClick(event)) {
    return this.handleMouseUp(event);
  }
  this.stop = this.facade.eventCoordinates(event);
  this.resize();
}, resize:function() {
  width = this.stop.x - this.start.x;
  height = this.stop.y - this.start.y;
  if (width < 0) {
    x = this.stop.x;
    width = -width;
  } else {
    x = this.start.x;
  }
  if (height < 0) {
    y = this.stop.y;
    height = -height;
  } else {
    y = this.start.y;
  }
  this.raphael.transform("t" + x + "," + y).attr({width:width, height:height});
}, toString:function() {
  return "SelectionFrame " + this.id;
}, hide:function() {
  this.raphael.node.style.display = "none";
}, show:function() {
  this.raphael.node.style.display = "";
  this.raphael.toFront();
}};
ORYX.Plugins.SelectionFrame = ORYX.Core.UIObject.extend(ORYX.Plugins.SelectionFrame);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.ShapeHighlighting = {construct:function(facade) {
  arguments.callee.$.construct.apply(this, arguments);
  this.eventHandlerCallback = facade.getEventHandler();
  this.highlightNodes = {};
  facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, this.setHighlight.bind(this));
  facade.registerOnEvent(ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, this.hideHighlight.bind(this));
}, redraw:function(paper) {
  this.paper = paper;
  this.highlightNodes = {};
}, setHighlight:function(options) {
  if (options && options.highlightId) {
    var obj = this.highlightNodes[options.highlightId];
    if (!obj) {
      obj = this.paper.path("").attr({"stroke-width":2});
      this.addEventHandlers(obj.node);
      this.highlightNodes[options.highlightId] = obj;
    }
    if (options.elements && options.elements.length > 0) {
      this.setAttributesByStyle(obj, options);
      this.show(obj);
    } else {
      this.hide(obj);
    }
  }
}, hideHighlight:function(options) {
  if (options && options.highlightId) {
    obj = this.highlightNodes[options.highlightId];
    if (obj) {
      this.hide(obj);
    }
  }
}, hide:function(obj) {
  obj.node.style.display = "none";
}, show:function(obj) {
  obj.node.style.display = "";
  obj.toFront();
}, setAttributesByStyle:function(obj, options) {
  if (options.style && options.style == ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE) {
    var bo = options.elements[0].absoluteBounds();
    var strWidth = options.strokewidth ? options.strokewidth : ORCHESTRATOR.CONFIG.BORDER_OFFSET;
    obj.attr({path:this.getPathRectangle(bo.a, bo.b, strWidth), stroke:options.color ? options.color : ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR, "stroke-opacity":options.opacity ? options.opacity : 0.2, "stroke-width":strWidth});
  } else {
    if (options.elements.length == 1 && (options.elements[0] instanceof ORYX.Core.Edge && options.highlightId != "selection")) {
      obj.attr({path:this.getPathEdge(options.elements[0].dockers), stroke:options.color ? options.color : ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR, "stroke-opacity":options.opacity ? options.opacity : 0.2, "stroke-width":ORCHESTRATOR.CONFIG.OFFSET_BOUNDS});
    } else {
      obj.attr({path:this.getPathByElements(options.elements), stroke:options.color ? options.color : ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR, "stroke-opacity":options.opacity ? options.opacity : 1, "stroke-width":options.strokewidth ? options.strokewidth : 2});
    }
  }
}, getPathByElements:function(elements) {
  if (!elements || elements.length <= 0) {
    return undefined;
  }
  var padding = ORCHESTRATOR.CONFIG.SELECTED_AREA_PADDING;
  var path = "";
  elements.each(function(element) {
    if (!element) {
      return;
    }
    var bounds = element.absoluteBounds();
    bounds.widen(padding);
    var a = bounds.upperLeft();
    var b = bounds.lowerRight();
    path = path + this.getPath(a, b);
  }.bind(this));
  return path;
}, getPath:function(a, b) {
  return this.getPathCorners(a, b);
}, getPathCorners:function(a, b) {
  var size = ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_SIZE;
  var path = "";
  path = path + "M" + a.x + " " + (a.y + size) + " l0 -" + size + " l" + size + " 0 ";
  path = path + "M" + a.x + " " + (b.y - size) + " l0 " + size + " l" + size + " 0 ";
  path = path + "M" + b.x + " " + (b.y - size) + " l0 " + size + " l-" + size + " 0 ";
  path = path + "M" + b.x + " " + (a.y + size) + " l0 -" + size + " l-" + size + " 0 ";
  return path;
}, getPathRectangle:function(a, b, strokeWidth) {
  var size = ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_SIZE;
  var path = "";
  var offset = strokeWidth / 2;
  path = path + "M" + (a.x + offset) + " " + a.y;
  path = path + " L" + (a.x + offset) + " " + (b.y - offset);
  path = path + " L" + (b.x - offset) + " " + (b.y - offset);
  path = path + " L" + (b.x - offset) + " " + (a.y + offset);
  path = path + " L" + (a.x + offset) + " " + (a.y + offset);
  return path;
}, toString:function() {
  return "highlight " + this.id;
}, getPathEdge:function(edgeDockers) {
  var length = edgeDockers.length;
  var path = "M" + edgeDockers[0].bounds.center().x + " " + edgeDockers[0].bounds.center().y;
  for (i = 1;i < length;i++) {
    var dockerPoint = edgeDockers[i].bounds.center();
    path = path + " L" + dockerPoint.x + " " + dockerPoint.y;
  }
  return path;
}};
ORYX.Plugins.ShapeHighlighting = ORYX.Core.UIObject.extend(ORYX.Plugins.ShapeHighlighting);
ORYX.Plugins.HighlightingSelectedShapes = {construct:function(facade) {
  this.facade = facade;
  this.opacityFull = 0.9;
  this.opacityLow = 0.4;
}, onSelectionChanged:function(event) {
  if (event.elements && event.elements.length > 1) {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"selection", elements:event.elements.without(event.subSelection), color:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR, opacity:!event.subSelection ? this.opacityFull : this.opacityLow});
    if (event.subSelection) {
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"subselection", elements:[event.subSelection], color:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_COLOR, opacity:this.opacityFull});
    } else {
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"subselection"});
    }
  } else {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"selection"});
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"subselection"});
  }
}};
ORYX.Plugins.HighlightingSelectedShapes = Clazz.extend(ORYX.Plugins.HighlightingSelectedShapes);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.ShapeRepository = {construct:function(facade) {
  this.facade = facade;
  this._canContain = undefined;
  this._canAttach = undefined;
  facade.registerOnEvent(ORCHESTRATOR.EVENTS.DRAGDROP_OVER, this.over.bind(this));
  facade.registerOnEvent(ORCHESTRATOR.EVENTS.DRAGDROP_DROP, this.drop.bind(this));
}, drop:function(options) {
  this._lastOverElement = undefined;
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.added"});
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.attached"});
  if (!this._currentParent) {
    return;
  }
  var position = this.facade.eventCoordinates(options.event);
  var myoption = options.option;
  if (myoption.offset) {
    position.x -= myoption.offset.x;
    position.y -= myoption.offset.y;
  }
  if (this._canAttach && this._currentParent instanceof ORYX.Core.Node) {
    myoption["parent"] = undefined;
  } else {
    myoption["parent"] = this._currentParent;
  }
  myoption.paper = this.facade.getPaper();
  myoption.position = position;
  var commandClass = ORYX.Core.Command.extend({construct:function(option, currentParent, canAttach, position, facade) {
    this.option = option;
    this.currentParent = currentParent;
    this.canAttach = canAttach;
    this.position = position;
    this.facade = facade;
    this.selection = this.facade.getSelection();
  }, execute:function() {
    if (!this.shape) {
      this.shape = this.facade.createShape(this.option);
      this.parent = this.shape.parent;
    } else {
      this.parent.add(this.shape);
    }
    if (this.canAttach && (this.currentParent instanceof ORYX.Core.Node && this.shape.dockers.length > 0)) {
      var docker = this.shape.dockers[0];
      if (this.currentParent.parent instanceof ORYX.Core.Node) {
        this.currentParent.parent.add(docker.parent);
      }
      docker.bounds.centerMoveTo(this.position);
      docker.setDockedShape(this.currentParent);
    }
    this.facade.getCanvas().update();
    this.facade.updateSelection();
  }, rollback:function() {
    this.facade.deleteShape(this.shape);
    this.facade.setSelection(this.selection.without(this.shape));
    this.facade.getCanvas().update();
    this.facade.updateSelection();
  }});
  var command = new commandClass(myoption, this._currentParent, this._canAttach, position, this.facade);
  this.facade.executeCommands([command]);
  this._currentParent = undefined;
}, over:function(options) {
  var coord = this.facade.eventCoordinates(options.event);
  var myoption = options.option;
  if (myoption.offset) {
    coord.x -= myoption.offset.x;
    coord.y -= myoption.offset.y;
  }
  var aShapes = this.facade.getCanvas().getAbstractShapesAtPosition(coord);
  if (aShapes.length <= 0) {
    return false;
  }
  if (aShapes.length == 1 && aShapes[0] instanceof ORYX.Core.Canvas) {
    this._currentParent = this.facade.getCanvas();
    return false;
  }
  var stencilSet = this.facade.getStencilset();
  var stencil = stencilSet.stencil(myoption.type);
  if (stencil.type() === "node") {
    var parentCandidate = aShapes.reverse().find(function(candidate) {
      return candidate instanceof ORYX.Core.Canvas || (candidate instanceof ORYX.Core.Node || candidate instanceof ORYX.Core.Edge);
    });
    if (parentCandidate !== this._lastOverElement) {
      this._canAttach = undefined;
      this._canContain = undefined;
    }
    if (parentCandidate) {
      if (!(parentCandidate instanceof ORYX.Core.Canvas) && (parentCandidate.isPointOverOffset(coord.x, coord.y) && this._canAttach == undefined)) {
        this._canAttach = this.facade.getRules().canConnect({sourceShape:parentCandidate, edgeStencil:stencil, targetStencil:stencil});
        if (this._canAttach) {
          this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"shapeRepo.attached", elements:[parentCandidate], style:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE, color:ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR});
          this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.added"});
          this._canContain = undefined;
        }
      }
      if (!(parentCandidate instanceof ORYX.Core.Canvas) && !parentCandidate.isPointOverOffset(coord.x, coord.y)) {
        this._canAttach = this._canAttach == false ? this._canAttach : undefined;
      }
      if (this._canContain == undefined && !this._canAttach) {
        this._canContain = this.facade.getRules().canContain({containingShape:parentCandidate, containedStencil:stencil});
        this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"shapeRepo.added", elements:[parentCandidate], color:this._canContain ? ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR : ORCHESTRATOR.CONFIG.SELECTION_INVALID_COLOR});
        this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"shapeRepo.attached"});
      }
      this._currentParent = this._canContain || this._canAttach ? parentCandidate : undefined;
      this._lastOverElement = parentCandidate;
    }
  } else {
    this._currentParent = this.facade.getCanvas();
  }
  return false;
}};
ORYX.Plugins.ShapeRepository = Clazz.extend(ORYX.Plugins.ShapeRepository);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.DragDropResize = {construct:function(facade) {
  this.facade = facade;
  this.currentShapes = [];
  this.toMoveShapes = [];
  this.distPoints = [];
  this.isResizing = false;
  this.dragEnable = false;
  this.dragIntialized = false;
  this.edgesMovable = true;
  this.isAddingAllowed = false;
  this.isAttachingAllowed = false;
  this.callbackMouseMove = this.handleMouseMove.bind(this);
  this.callbackMouseUp = this.handleMouseUp.bind(this);
  this.selectedRect = new ORYX.Plugins.SelectedRect;
  if (ORCHESTRATOR.CONFIG.SHOW_GRIDLINE) {
    this.vLine = new ORYX.Plugins.GridLine({eventHandlerCallback:this.facade.getEventHandler()}, "ver");
    this.hLine = new ORYX.Plugins.GridLine({eventHandlerCallback:this.facade.getEventHandler()}, "hor");
  }
  this.resizerSE = new ORYX.Plugins.Resizer({eventHandlerCallback:this.facade.getEventHandler(), orientation:"southeast", facade:this.facade});
  this.resizerSE.registerOnResize(this.onResize.bind(this));
  this.resizerSE.registerOnResizeEnd(this.onResizeEnd.bind(this));
  this.resizerSE.registerOnResizeStart(this.onResizeStart.bind(this));
  this.resizerNW = new ORYX.Plugins.Resizer({eventHandlerCallback:this.facade.getEventHandler(), orientation:"northwest", facade:this.facade});
  this.resizerNW.registerOnResize(this.onResize.bind(this));
  this.resizerNW.registerOnResizeEnd(this.onResizeEnd.bind(this));
  this.resizerNW.registerOnResizeStart(this.onResizeStart.bind(this));
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));
}, redraw:function(paper) {
  this.selectedRect.redraw(paper);
  this.resizerSE.redraw(paper);
  this.resizerNW.redraw(paper);
  if (ORCHESTRATOR.CONFIG.SHOW_GRIDLINE) {
    this.vLine.redraw(paper);
    this.hLine.redraw(paper);
  }
}, handleMouseDown:function(event, uiObj) {
  if (event.shiftKey) {
    return;
  }
  if (!this.dragBounds || (!this.currentShapes.member(uiObj) || !this.toMoveShapes.length)) {
    return;
  }
  this.dragEnable = true;
  this.dragIntialized = true;
  this.edgesMovable = true;
  var center = this.dragBounds.center();
  this.offset = this.facade.eventCoordinates(event);
  this.offset.x -= center.x;
  this.offset.y -= center.y;
  cx = this.dragBounds.width() / 2;
  cy = this.dragBounds.height() / 2;
  this.ul = this.facade.getCanvas().bounds.upperLeft();
  this.ul.x += cx;
  this.ul.y += cy;
  this.lr = this.facade.getCanvas().bounds.lowerRight();
  this.lr.x -= cx;
  this.lr.y -= cy;
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
}, handleMouseUp:function(event) {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.contain"});
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.attached"});
  if (this.dragEnable) {
    if (!this.dragIntialized) {
      this.afterDrag();
      if (this.isAttachingAllowed && (this.toMoveShapes.length == 1 && (this.toMoveShapes[0] instanceof ORYX.Core.Node && this.toMoveShapes[0].dockers.length > 0))) {
        var position = this.facade.eventCoordinates(event);
        position.x -= this.offset.x;
        position.y -= this.offset.y;
        if (ORCHESTRATOR.CONFIG.GRID_ENABLED) {
          position = this.snapToGrid(position);
        }
        var docker = this.toMoveShapes[0].dockers[0];
        var dockCommand = ORYX.Core.Command.extend({construct:function(docker, position, newDockedShape, facade) {
          this.docker = docker;
          this.newPosition = position;
          this.newDockedShape = newDockedShape;
          this.newParent = newDockedShape.parent || facade.getCanvas();
          this.oldPosition = docker.parent.bounds.center();
          this.oldDockedShape = docker.getDockedShape();
          this.oldParent = docker.parent.parent || facade.getCanvas();
          this.facade = facade;
          if (this.oldDockedShape) {
            this.oldPosition = docker.parent.absoluteBounds().center();
          }
        }, execute:function() {
          this.dock(this.newDockedShape, this.newParent, this.newPosition);
          this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.ARRANGEMENT_TOP, excludeCommand:true});
        }, rollback:function() {
          this.dock(this.oldDockedShape, this.oldParent, this.oldPosition);
        }, dock:function(toDockShape, parent, pos) {
          parent.add(this.docker.parent);
          this.docker.setDockedShape(undefined);
          this.docker.bounds.centerMoveTo(pos);
          this.docker.setDockedShape(toDockShape);
          this.facade.setSelection([this.docker.parent]);
          this.facade.getCanvas().update();
          this.facade.updateSelection();
        }});
        var commands = [new dockCommand(docker, position, this.containmentParentNode, this.facade)];
        this.facade.executeCommands(commands);
      } else {
        if (this.isAddingAllowed) {
          this.refreshSelectedShapes();
        }
      }
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DRAGDROP_END});
    }
    this.facade.updateSelection();
    if (this.vLine) {
      this.vLine.hide();
    }
    if (this.hLine) {
      this.hLine.hide();
    }
  }
  this.dragEnable = false;
}, handleMouseMove:function(event) {
  if (!this.dragEnable) {
    return;
  }
  if (!ORYX.isLeftClick(event)) {
    return this.handleMouseUp(event);
  }
  if (this.dragIntialized) {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.DRAGDROP_START});
    this.dragIntialized = false;
    this.resizerSE.hide();
    this.resizerNW.hide();
    this._onlyEdges = this.currentShapes.all(function(currentShape) {
      return currentShape instanceof ORYX.Core.Edge;
    });
    this.beforeDrag();
    this._currentUnderlyingNodes = [];
  }
  var position = this.facade.eventCoordinates(event);
  position.x -= this.offset.x;
  position.y -= this.offset.y;
  if (ORCHESTRATOR.CONFIG.GRID_ENABLED) {
    position = this.snapToGrid(position);
  } else {
    if (this.vLine) {
      this.vLine.hide();
    }
    if (this.hLine) {
      this.hLine.hide();
    }
  }
  position.x = Math.max(this.ul.x, position.x);
  position.y = Math.max(this.ul.y, position.y);
  var lr = this.facade.getCanvas().bounds.lowerRight();
  position.x = Math.min(this.lr.x, position.x);
  position.y = Math.min(this.lr.y, position.y);
  this.dragBounds.centerMoveTo(position);
  this.selectedRect.resize(this.dragBounds);
  this.isAttachingAllowed = false;
  var underlyingNodes = $A(this.facade.getCanvas().getAbstractShapesAtPosition(this.facade.eventCoordinates(event)));
  var checkIfAttachable = this.toMoveShapes.length == 1 && (this.toMoveShapes[0] instanceof ORYX.Core.Node && this.toMoveShapes[0].dockers.length > 0);
  checkIfAttachable = checkIfAttachable && underlyingNodes.length != 1;
  if (!checkIfAttachable && (underlyingNodes.length === this._currentUnderlyingNodes.length && underlyingNodes.all(function(node, index) {
    return this._currentUnderlyingNodes[index] === node;
  }.bind(this)))) {
    return;
  } else {
    if (this._onlyEdges) {
      this.isAddingAllowed = true;
      this.containmentParentNode = this.facade.getCanvas();
    } else {
      var options = {event:event, underlyingNodes:underlyingNodes, checkIfAttachable:checkIfAttachable};
      this.checkRules(options);
    }
  }
  this._currentUnderlyingNodes = underlyingNodes.reverse();
  if (this.isAttachingAllowed) {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"dragdropresize.attached", elements:[this.containmentParentNode], style:ORCHESTRATOR.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE, color:ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR});
  } else {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.attached"});
  }
  if (!this.isAttachingAllowed) {
    if (this.isAddingAllowed) {
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"dragdropresize.contain", elements:[this.containmentParentNode], color:ORCHESTRATOR.CONFIG.SELECTION_VALID_COLOR});
    } else {
      this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_SHOW, highlightId:"dragdropresize.contain", elements:[this.containmentParentNode], color:ORCHESTRATOR.CONFIG.SELECTION_INVALID_COLOR});
    }
  } else {
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.HIGHLIGHT_HIDE, highlightId:"dragdropresize.contain"});
  }
}, checkRules:function(options) {
  var event = options.event;
  var underlyingNodes = options.underlyingNodes;
  var checkIfAttachable = options.checkIfAttachable;
  var noEdges = options.noEdges;
  this.containmentParentNode = underlyingNodes.reverse().find(function(node) {
    return node instanceof ORYX.Core.Canvas || (node instanceof ORYX.Core.Node || node instanceof ORYX.Core.Edge && !noEdges) && !(this.currentShapes.member(node) || this.currentShapes.any(function(shape) {
      return shape.children.length > 0 && shape.getChildNodes(true).member(node);
    }));
  }.bind(this));
  if (checkIfAttachable) {
    this.isAttachingAllowed = this.facade.getRules().canConnect({sourceShape:this.containmentParentNode, edgeShape:this.toMoveShapes[0], targetShape:this.toMoveShapes[0]});
    if (this.isAttachingAllowed) {
      var point = this.facade.eventCoordinates(event);
      this.isAttachingAllowed = this.containmentParentNode.isPointOverOffset(point.x, point.y);
    }
  }
  if (!this.isAttachingAllowed) {
    this.isAddingAllowed = this.toMoveShapes.all(function(currentShape) {
      if (currentShape instanceof ORYX.Core.Edge || (currentShape instanceof ORYX.Core.Controls.Docker || this.containmentParentNode === currentShape.parent)) {
        return true;
      } else {
        if (this.containmentParentNode !== currentShape) {
          if (!(this.containmentParentNode instanceof ORYX.Core.Edge) || !noEdges) {
            if (this.facade.getRules().canContain({containingShape:this.containmentParentNode, containedShape:currentShape})) {
              return true;
            }
          }
        }
      }
      return false;
    }.bind(this));
  }
  if (!this.isAttachingAllowed && (!this.isAddingAllowed && this.containmentParentNode instanceof ORYX.Core.Edge)) {
    options.noEdges = true;
    options.underlyingNodes.reverse();
    this.checkRules(options);
  }
}, refreshSelectedShapes:function() {
  if (!this.dragBounds) {
    return;
  }
  var upL = this.dragBounds.upperLeft();
  var oldUpL = this.oldDragBounds.upperLeft();
  var offset = {x:upL.x - oldUpL.x, y:upL.y - oldUpL.y};
  var commands = [new ORYX.Core.Command.Move(this.toMoveShapes, offset, this.containmentParentNode, this.currentShapes, this)];
  if (this._undockedEdgesCommand instanceof ORYX.Core.Command) {
    commands.unshift(this._undockedEdgesCommand);
  }
  this.facade.executeCommands(commands);
  if (this.dragBounds) {
    this.oldDragBounds = this.dragBounds.clone();
  }
}, onResize:function(bounds) {
  if (!this.dragBounds) {
    return;
  }
  this.dragBounds = bounds;
  this.isResizing = true;
  this.selectedRect.resize(this.dragBounds);
}, onResizeStart:function() {
  this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.RESIZE_START});
}, onResizeEnd:function() {
  if (!(this.currentShapes instanceof Array) || this.currentShapes.length <= 0) {
    return;
  }
  if (this.isResizing) {
    var commandClass = ORYX.Core.Command.extend({construct:function(shape, newBounds, plugin) {
      this.shape = shape;
      this.oldBounds = shape.bounds.clone();
      this.newBounds = newBounds;
      this.plugin = plugin;
    }, execute:function() {
      this.shape.bounds.set(this.newBounds.a, this.newBounds.b);
      this.update(this.getOffset(this.oldBounds, this.newBounds));
    }, rollback:function() {
      this.shape.bounds.set(this.oldBounds.a, this.oldBounds.b);
      this.update(this.getOffset(this.newBounds, this.oldBounds));
    }, getOffset:function(b1, b2) {
      return{x:b2.a.x - b1.a.x, y:b2.a.y - b1.a.y, xs:b2.width() / b1.width(), ys:b2.height() / b1.height()};
    }, update:function(offset) {
      this.shape.getLabels().each(function(label) {
        label.changed();
      });
      var allEdges = [].concat(this.shape.getIncomingShapes()).concat(this.shape.getOutgoingShapes()).findAll(function(r) {
        return r instanceof ORYX.Core.Edge;
      }.bind(this));
      this.plugin.layoutEdges(this.shape, allEdges, offset);
      this.plugin.facade.setSelection([this.shape]);
      this.plugin.facade.getCanvas().update();
      this.plugin.facade.updateSelection();
    }});
    var bounds = this.dragBounds.clone();
    var shape = this.currentShapes[0];
    if (shape.parent) {
      var parentPosition = shape.parent.absoluteXY();
      bounds.moveBy(-parentPosition.x, -parentPosition.y);
    }
    var command = new commandClass(shape, bounds, this);
    this.facade.executeCommands([command]);
    this.isResizing = false;
    this.facade.raiseEvent({type:ORCHESTRATOR.EVENTS.RESIZE_END});
  }
}, beforeDrag:function() {
  var undockEdgeCommand = ORYX.Core.Command.extend({construct:function(moveShapes) {
    this.dockers = moveShapes.collect(function(shape) {
      return shape instanceof ORYX.Core.Controls.Docker ? {docker:shape, dockedShape:shape.getDockedShape(), refPoint:shape.referencePoint} : undefined;
    }).compact();
  }, execute:function() {
    this.dockers.each(function(el) {
      el.docker.setDockedShape(undefined);
    });
  }, rollback:function() {
    this.dockers.each(function(el) {
      el.docker.setDockedShape(el.dockedShape);
      el.docker.setReferencePoint(el.refPoint);
    });
  }});
  this._undockedEdgesCommand = new undockEdgeCommand(this.toMoveShapes);
  this._undockedEdgesCommand.execute();
}, hideAllLabels:function(shape) {
  shape.getLabels().each(function(label) {
    label.hide();
  });
  shape.getAllDockedShapes().each(function(dockedShape) {
    var labels = dockedShape.getLabels();
    if (labels.length > 0) {
      labels.each(function(label) {
        label.hide();
      });
    }
  });
  shape.getChildren().each(function(value) {
    if (value instanceof ORYX.Core.Shape) {
      this.hideAllLabels(value);
    }
  }.bind(this));
}, afterDrag:function() {
}, showAllLabels:function(shape) {
  for (var i = 0;i < shape.length;i++) {
    var label = shape[i];
    label.show();
  }
  var allDockedShapes = shape.getAllDockedShapes();
  for (var i = 0;i < allDockedShapes.length;i++) {
    var dockedShape = allDockedShapes[i];
    var labels = dockedShape.getLabels();
    if (labels.length > 0) {
      labels.each(function(label) {
        label.show();
      });
    }
  }
  for (var i = 0;i < shape.children.length;i++) {
    var value = shape.children[i];
    if (value instanceof ORYX.Core.Shape) {
      this.showAllLabels(value);
    }
  }
}, onSelectionChanged:function(event) {
  var elements = event.elements;
  this.dragEnable = false;
  this.dragIntialized = false;
  this.resizerSE.hide();
  this.resizerNW.hide();
  if (!elements || elements.length == 0) {
    this.selectedRect.hide();
    this.currentShapes = [];
    this.toMoveShapes = [];
    this.dragBounds = undefined;
    this.oldDragBounds = undefined;
  } else {
    this.currentShapes = elements;
    var topLevelElements = this.facade.getCanvas().getShapesWithSharedParent(elements);
    this.toMoveShapes = topLevelElements;
    this.toMoveShapes = this.toMoveShapes.findAll(function(shape) {
      return shape instanceof ORYX.Core.Node && (shape.dockers.length === 0 || !elements.member(shape.dockers[0].getDockedShape()));
    });
    elements.each(function(shape) {
      if (!(shape instanceof ORYX.Core.Edge)) {
        return;
      }
      var dks = shape.getDockers();
      var hasF = elements.member(dks[0].getDockedShape());
      var hasL = elements.member(dks.last().getDockedShape());
      if (!hasF && !hasL) {
        var isUndocked = !dks[0].getDockedShape() && !dks.last().getDockedShape();
        if (isUndocked) {
          this.toMoveShapes = this.toMoveShapes.concat(dks);
        }
      }
      if (shape.dockers.length > 2 && (hasF && hasL)) {
        this.toMoveShapes = this.toMoveShapes.concat(dks.findAll(function(el, index) {
          return index > 0 && index < dks.length - 1;
        }));
      }
    }.bind(this));
    var newBounds = undefined;
    this.toMoveShapes.each(function(value) {
      var shape = value;
      if (value instanceof ORYX.Core.Controls.Docker) {
        shape = value.parent;
      }
      if (!newBounds) {
        newBounds = shape.absoluteBounds();
      } else {
        newBounds.include(shape.absoluteBounds());
      }
    }.bind(this));
    if (!newBounds) {
      elements.each(function(value) {
        if (!newBounds) {
          newBounds = value.absoluteBounds();
        } else {
          newBounds.include(value.absoluteBounds());
        }
      });
    }
    this.dragBounds = newBounds;
    this.oldDragBounds = newBounds.clone();
    this.selectedRect.resize(newBounds);
    this.selectedRect.show();
    if (elements.length == 1 && elements[0].isResizable) {
      var aspectRatio = elements[0].getStencil().fixedAspectRatio() ? elements[0].bounds.width() / elements[0].bounds.height() : undefined;
      this.resizerSE.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
      this.resizerSE.show();
      this.resizerNW.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
      this.resizerNW.show();
    } else {
      this.resizerSE.setBounds(undefined);
      this.resizerNW.setBounds(undefined);
    }
    if (ORCHESTRATOR.CONFIG.GRID_ENABLED) {
      this.distPoints = [];
      if (this.distPointTimeout) {
        window.clearTimeout(this.distPointTimeout);
      }
      this.distPointTimeout = window.setTimeout(function() {
        var distShapes = this.facade.getCanvas().getChildShapes(true).findAll(function(value) {
          var parentShape = value.parent;
          while (parentShape) {
            if (elements.member(parentShape)) {
              return false;
            }
            parentShape = parentShape.parent;
          }
          return true;
        });
        distShapes.each(function(value) {
          if (!(value instanceof ORYX.Core.Edge)) {
            var ul = value.absoluteXY();
            var width = value.bounds.width();
            var height = value.bounds.height();
            this.distPoints.push({ul:{x:ul.x, y:ul.y}, c:{x:ul.x + width / 2, y:ul.y + height / 2}, lr:{x:ul.x + width, y:ul.y + height}});
          }
        }.bind(this));
      }.bind(this), 10);
    }
  }
}, snapToGrid:function(position) {
  var cThres = 10;
  var c = {x:position.x, y:position.y};
  var offsetX, offsetY;
  var gridX, gridY;
  this.distPoints.each(function(value) {
    var x, y, gx, gy;
    if (Math.abs(value.c.x - c.x) < cThres) {
      x = value.c.x - c.x;
      gx = value.c.x;
    }
    if (Math.abs(value.c.y - c.y) < cThres) {
      y = value.c.y - c.y;
      gy = value.c.y;
    }
    if (x !== undefined) {
      offsetX = offsetX === undefined ? x : Math.abs(x) < Math.abs(offsetX) ? x : offsetX;
      if (offsetX === x) {
        gridX = gx;
      }
    }
    if (y !== undefined) {
      offsetY = offsetY === undefined ? y : Math.abs(y) < Math.abs(offsetY) ? y : offsetY;
      if (offsetY === y) {
        gridY = gy;
      }
    }
  });
  if (offsetX !== undefined) {
    c.x += offsetX;
    if (this.vLine && gridX) {
      this.vLine.update(gridX);
    }
  } else {
    c.x = position.x - position.x % (ORCHESTRATOR.CONFIG.GRID_DISTANCE / 2);
    if (this.vLine) {
      this.vLine.hide();
    }
  }
  if (offsetY !== undefined) {
    c.y += offsetY;
    if (this.hLine && gridY) {
      this.hLine.update(gridY);
    }
  } else {
    c.y = position.y - position.y % (ORCHESTRATOR.CONFIG.GRID_DISTANCE / 2);
    if (this.hLine) {
      this.hLine.hide();
    }
  }
  return c;
}};
ORYX.Plugins.DragDropResize = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.DragDropResize);
ORYX.Plugins.SelectedRect = {construct:function() {
}, redraw:function(paper) {
  this.raphael = paper.rect(0, 0, 0, 0).attr({stroke:"#777777", fill:"none", "stroke-dasharray":"-"});
  this.hide();
}, hide:function() {
  this.raphael.node.style.display = "none";
}, show:function() {
  this.raphael.node.style.display = "";
  this.raphael.toFront();
}, resize:function(bounds) {
  var upL = bounds.upperLeft();
  this.raphael.attr({width:bounds.width() + 8, height:bounds.height() + 8});
  this.raphael.transform("t" + (upL.x - 4) + ", " + (upL.y - 4));
}};
ORYX.Plugins.SelectedRect = Clazz.extend(ORYX.Plugins.SelectedRect);
ORYX.Plugins.GridLine = {construct:function(options, direction) {
  if ("hor" !== direction && "ver" !== direction) {
    direction = "hor";
  }
  this.direction = direction;
  arguments.callee.$.construct.apply(this, arguments);
}, redraw:function(paper) {
  this.raphael = paper.set().push(paper.path().attr({stroke:"silver", fill:"none", "stroke-dasharray":"- "}));
  this.raphael.forEach(function(el) {
    this.addEventHandlers(el.node);
  }.bind(this));
  this.hide();
}, toString:function() {
  return "GridLine " + this.id;
}, update:function(pos) {
  if (this.direction === "hor") {
    var y = pos instanceof Object ? pos.y : pos;
    var cWidth = Element.getWidth(this.raphael.paper.canvas);
    this.raphael.attr("path", "M 0 " + y + " L " + cWidth + " " + y);
  } else {
    var x = pos instanceof Object ? pos.x : pos;
    var cHeight = Element.getHeight(this.raphael.paper.canvas);
    this.raphael.attr("path", "M" + x + " 0 L " + x + " " + cHeight);
  }
  this.show();
}};
ORYX.Plugins.GridLine = ORYX.Core.UIObject.extend(ORYX.Plugins.GridLine);
ORYX.Plugins.Resizer = {construct:function(options) {
  arguments.callee.$.construct.apply(this, arguments);
  this.isMovable = true;
  this.orientation = options.orientation;
  this.facade = options.facade;
  this.callbackMouseMove = this.handleMouseMove.bind(this);
  this.callbackMouseUp = this.handleMouseUp.bind(this);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEDOWN, this.handleMouseDown.bind(this));
  this.dragEnable = false;
  this.offSetPosition = {x:0, y:0};
  this.bounds = undefined;
  this.canvasNode = this.facade.getCanvas();
  this.minSize = undefined;
  this.maxSize = undefined;
  this.aspectRatio = undefined;
  this.resizeCallbacks = [];
  this.resizeStartCallbacks = [];
  this.resizeEndCallbacks = [];
}, redraw:function(paper) {
  this.scrollNode = this.facade.getRootNode();
  if (this.orientation === "northwest") {
    this.raphael = paper.set(paper.path("M10,5l-5,0l0,5").attr("stroke-width", 2), paper.rect(0, 0, 10, 10).attr({fill:"white", "opacity":0}));
  } else {
    this.raphael = paper.set(paper.path("M0,5l5,0l0,-5").attr("stroke-width", 2), paper.rect(0, 0, 10, 10).attr({fill:"white", "opacity":0}));
  }
  var me = this;
  this.raphael.forEach(function(el) {
    me.addEventHandlers(el.node);
  });
  this.hide();
}, handleMouseDown:function(event, uiObj) {
  if (uiObj instanceof ORYX.Plugins.Resizer && uiObj.orientation === this.orientation) {
    this.dragEnable = true;
    this.offsetScroll = {x:this.scrollNode.scrollLeft, y:this.scrollNode.scrollTop};
    this.offSetPosition = {x:ORYX.pointerX(event) - this.position.x, y:ORYX.pointerY(event) - this.position.y};
    this.resizeStartCallbacks.each(function(value) {
      value(this.bounds);
    }.bind(this));
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
    this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  }
}, handleMouseUp:function(event, uiObj) {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEUP, this.callbackMouseUp);
  if (this.dragEnable) {
    this.containmentParentNode = null;
    this.resizeEndCallbacks.each(function(value) {
      value(this.bounds);
    }.bind(this));
  }
  this.dragEnable = false;
}, handleMouseMove:function(event, uiObj) {
  if (!this.dragEnable) {
    return;
  }
  if (!ORYX.isLeftClick(event)) {
    return this.handleMouseUp(event);
  }
  if (event.shiftKey || event.ctrlKey) {
    this.aspectRatio = this.bounds.width() / this.bounds.height();
  } else {
    this.aspectRatio = undefined;
  }
  var position = {x:ORYX.pointerX(event) - this.offSetPosition.x, y:ORYX.pointerY(event) - this.offSetPosition.y};
  position.x -= this.offsetScroll.x - this.scrollNode.scrollLeft;
  position.y -= this.offsetScroll.y - this.scrollNode.scrollTop;
  position.x = Math.min(position.x, this.facade.getCanvas().bounds.width());
  position.y = Math.min(position.y, this.facade.getCanvas().bounds.height());
  var offset = {x:position.x - this.position.x, y:position.y - this.position.y};
  if (this.aspectRatio) {
    newAspectRatio = (this.bounds.width() + offset.x) / (this.bounds.height() + offset.y);
    if (newAspectRatio > this.aspectRatio) {
      offset.x = this.aspectRatio * (this.bounds.height() + offset.y) - this.bounds.width();
    } else {
      if (newAspectRatio < this.aspectRatio) {
        offset.y = (this.bounds.width() + offset.x) / this.aspectRatio - this.bounds.height();
      }
    }
  }
  if (this.orientation === "northwest") {
    if (this.bounds.width() - offset.x > this.maxSize.width) {
      offset.x = -(this.maxSize.width - this.bounds.width());
      if (this.aspectRatio) {
        offset.y = this.aspectRatio * offset.x;
      }
    }
    if (this.bounds.width() - offset.x < this.minSize.width) {
      offset.x = -(this.minSize.width - this.bounds.width());
      if (this.aspectRatio) {
        offset.y = this.aspectRatio * offset.x;
      }
    }
    if (this.bounds.height() - offset.y > this.maxSize.height) {
      offset.y = -(this.maxSize.height - this.bounds.height());
      if (this.aspectRatio) {
        offset.x = offset.y / this.aspectRatio;
      }
    }
    if (this.bounds.height() - offset.y < this.minSize.height) {
      offset.y = -(this.minSize.height - this.bounds.height());
      if (this.aspectRatio) {
        offset.x = offset.y / this.aspectRatio;
      }
    }
  } else {
    if (this.bounds.width() + offset.x > this.maxSize.width) {
      offset.x = this.maxSize.width - this.bounds.width();
      if (this.aspectRatio) {
        offset.y = this.aspectRatio * offset.x;
      }
    }
    if (this.bounds.width() + offset.x < this.minSize.width) {
      offset.x = this.minSize.width - this.bounds.width();
      if (this.aspectRatio) {
        offset.y = this.aspectRatio * offset.x;
      }
    }
    if (this.bounds.height() + offset.y > this.maxSize.height) {
      offset.y = this.maxSize.height - this.bounds.height();
      if (this.aspectRatio) {
        offset.x = offset.y / this.aspectRatio;
      }
    }
    if (this.bounds.height() + offset.y < this.minSize.height) {
      offset.y = this.minSize.height - this.bounds.height();
      if (this.aspectRatio) {
        offset.x = offset.y / this.aspectRatio;
      }
    }
  }
  if (this.orientation === "northwest") {
    var oldLR = {x:this.bounds.lowerRight().x, y:this.bounds.lowerRight().y};
    this.bounds.extend({x:-offset.x, y:-offset.y});
    this.bounds.moveBy(offset);
  } else {
    this.bounds.extend(offset);
  }
  this.update();
  this.resizeCallbacks.each(function(value) {
    value(this.bounds);
  }.bind(this));
}, registerOnResizeStart:function(callback) {
  if (!this.resizeStartCallbacks.member(callback)) {
    this.resizeStartCallbacks.push(callback);
  }
}, unregisterOnResizeStart:function(callback) {
  if (this.resizeStartCallbacks.member(callback)) {
    this.resizeStartCallbacks = this.resizeStartCallbacks.without(callback);
  }
}, registerOnResizeEnd:function(callback) {
  if (!this.resizeEndCallbacks.member(callback)) {
    this.resizeEndCallbacks.push(callback);
  }
}, unregisterOnResizeEnd:function(callback) {
  if (this.resizeEndCallbacks.member(callback)) {
    this.resizeEndCallbacks = this.resizeEndCallbacks.without(callback);
  }
}, registerOnResize:function(callback) {
  if (!this.resizeCallbacks.member(callback)) {
    this.resizeCallbacks.push(callback);
  }
}, unregisterOnResize:function(callback) {
  if (this.resizeCallbacks.member(callback)) {
    this.resizeCallbacks = this.resizeCallbacks.without(callback);
  }
}, hide:function() {
  this.raphael.forEach(function(obj) {
    obj.node.style.display = "none";
  });
}, show:function() {
  if (this.bounds) {
    this.raphael.forEach(function(obj) {
      obj.node.style.display = "";
      obj.toFront();
    });
  }
}, setBounds:function(bounds, min, max, aspectRatio) {
  this.bounds = bounds;
  if (!min) {
    min = {width:ORCHESTRATOR.CONFIG.MINIMUM_SIZE, height:ORCHESTRATOR.CONFIG.MINIMUM_SIZE};
  }
  if (!max) {
    max = {width:ORCHESTRATOR.CONFIG.MAXIMUM_SIZE, height:ORCHESTRATOR.CONFIG.MAXIMUM_SIZE};
  }
  this.minSize = min;
  this.maxSize = max;
  this.aspectRatio = aspectRatio;
  this.update();
}, toString:function() {
  return "Resizer " + this.id;
}, update:function() {
  if (!this.bounds) {
    return;
  }
  var upL = this.bounds.upperLeft();
  if (this.bounds.width() < this.minSize.width) {
    this.bounds.set(upL.x, upL.y, upL.x + this.minSize.width, upL.y + this.bounds.height());
  }
  if (this.bounds.height() < this.minSize.height) {
    this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.minSize.height);
  }
  if (this.bounds.width() > this.maxSize.width) {
    this.bounds.set(upL.x, upL.y, upL.x + this.maxSize.width, upL.y + this.bounds.height());
  }
  if (this.bounds.height() > this.maxSize.height) {
    this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.maxSize.height);
  }
  if (this.orientation === "northwest") {
    upL.x -= 13;
    upL.y -= 13;
  } else {
    upL.x += this.bounds.width() + 3;
    upL.y += this.bounds.height() + 3;
  }
  this.position = upL;
  this.raphael.forEach(function(obj) {
    obj.transform("t" + this.position.x + "," + this.position.y);
  }.bind(this));
}};
ORYX.Plugins.Resizer = ORYX.Core.UIObject.extend(ORYX.Plugins.Resizer);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Core) {
  ORYX.Core = {};
}
if (!ORYX.Core.Command) {
  ORYX.Core.Command = {};
}
ORYX.Core.Command.Move = {construct:function(moveShapes, offset, parent, selectedShapes, plugin) {
  this.moveShapes = moveShapes;
  this.selectedShapes = selectedShapes;
  this.offset = offset;
  this.plugin = plugin;
  this.newParents = moveShapes.collect(function(t) {
    return parent || t.parent;
  });
  this.oldParents = moveShapes.collect(function(shape) {
    return shape.parent;
  });
  this.dockedNodes = moveShapes.findAll(function(shape) {
    return shape instanceof ORYX.Core.Node && shape.dockers.length == 1;
  }).collect(function(shape) {
    return{docker:shape.dockers[0], dockedShape:shape.dockers[0].getDockedShape(), refPoint:shape.dockers[0].referencePoint};
  });
}, execute:function() {
  this.dockAllShapes();
  this.move(this.offset);
  this.addShapeToParent(this.newParents);
  this.selectCurrentShapes();
  this.plugin.facade.getCanvas().update();
  this.plugin.facade.updateSelection();
}, rollback:function() {
  var offset = {x:-this.offset.x, y:-this.offset.y};
  this.move(offset);
  this.addShapeToParent(this.oldParents);
  this.dockAllShapes(true);
  this.selectCurrentShapes();
  this.plugin.facade.getCanvas().update();
  this.plugin.facade.updateSelection();
}, move:function(offset, doLayout) {
  for (var i = 0;i < this.moveShapes.length;i++) {
    var value = this.moveShapes[i];
    value.bounds.moveBy(offset);
    if (value instanceof ORYX.Core.Node) {
      (value.dockers || []).each(function(d) {
        d.bounds.moveBy(offset);
      });
      var childShapesNodes = value.getChildShapes(true).findAll(function(shape) {
        return shape instanceof ORYX.Core.Node;
      });
      var childDockedShapes = childShapesNodes.collect(function(shape) {
        return shape.getAllDockedShapes();
      }).flatten().uniq();
      var childDockedEdge = childDockedShapes.findAll(function(shape) {
        return shape instanceof ORYX.Core.Edge;
      });
      childDockedEdge = childDockedEdge.findAll(function(shape) {
        return shape.getAllDockedShapes().all(function(dsh) {
          return childShapesNodes.include(dsh);
        });
      });
      var childDockedDockers = childDockedEdge.collect(function(shape) {
        return shape.dockers;
      }).flatten();
      for (var j = 0;j < childDockedDockers.length;j++) {
        var docker = childDockedDockers[j];
        if (!docker.getDockedShape() && !this.moveShapes.include(docker)) {
          docker.bounds.moveBy(offset);
          docker.update();
        }
      }
      var allEdges = [].concat(value.getIncomingShapes()).concat(value.getOutgoingShapes()).findAll(function(r) {
        return r instanceof ORYX.Core.Edge && !this.moveShapes.any(function(d) {
          return d == r || d instanceof ORYX.Core.Controls.Docker && d.parent == r;
        });
      }.bind(this)).findAll(function(r) {
        return(r.dockers[0].getDockedShape() == value || !this.moveShapes.include(r.dockers[0].getDockedShape())) && (r.dockers.last().getDockedShape() == value || !this.moveShapes.include(r.dockers.last().getDockedShape()));
      }.bind(this));
      this.plugin.layoutEdges(value, allEdges, offset);
      var allSameEdges = [].concat(value.getIncomingShapes()).concat(value.getOutgoingShapes()).findAll(function(r) {
        return r instanceof ORYX.Core.Edge && (r.dockers[0].isDocked() && (r.dockers.last().isDocked() && (!this.moveShapes.include(r) && !this.moveShapes.any(function(d) {
          return d == r || d instanceof ORYX.Core.Controls.Docker && d.parent == r;
        }))));
      }.bind(this)).findAll(function(r) {
        return this.moveShapes.indexOf(r.dockers[0].getDockedShape()) > i || this.moveShapes.indexOf(r.dockers.last().getDockedShape()) > i;
      }.bind(this));
      for (var j = 0;j < allSameEdges.length;j++) {
        for (var k = 1;k < allSameEdges[j].dockers.length - 1;k++) {
          var docker = allSameEdges[j].dockers[k];
          if (!docker.getDockedShape() && !this.moveShapes.include(docker)) {
            docker.bounds.moveBy(offset);
          }
        }
      }
    }
  }
}, dockAllShapes:function(shouldDocked) {
  for (var i = 0;i < this.dockedNodes.length;i++) {
    var docker = this.dockedNodes[i].docker;
    docker.setDockedShape(shouldDocked ? this.dockedNodes[i].dockedShape : undefined);
    if (docker.getDockedShape()) {
      docker.setReferencePoint(this.dockedNodes[i].refPoint);
    }
  }
}, addShapeToParent:function(parents) {
  for (var i = 0;i < this.moveShapes.length;i++) {
    var currentShape = this.moveShapes[i];
    if (currentShape instanceof ORYX.Core.Node && currentShape.parent !== parents[i]) {
      var unul = parents[i].absoluteXY();
      var csul = currentShape.absoluteXY();
      var x = csul.x - unul.x;
      var y = csul.y - unul.y;
      parents[i].add(currentShape);
      currentShape.getOutgoingShapes(function(shape) {
        if (shape instanceof ORYX.Core.Node && !this.moveShapes.member(shape)) {
          parents[i].add(shape);
        }
      }.bind(this));
      if (currentShape instanceof ORYX.Core.Node && currentShape.dockers.length == 1) {
        var b = currentShape.bounds;
        x += b.width() / 2;
        y += b.height() / 2;
        currentShape.dockers[0].bounds.centerMoveTo(x, y);
      } else {
        currentShape.bounds.moveTo(x, y);
      }
    }
  }
}, selectCurrentShapes:function() {
  this.plugin.facade.setSelection(this.selectedShapes);
}};
ORYX.Core.Command.Move = ORYX.Core.Command.extend(ORYX.Core.Command.Move);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.Edit = {construct:function(facade) {
  this.facade = facade;
  this.clipboard = new ORYX.Plugins.Edit.ClipBoard;
  this.facade.offer({functionality:this.callEdit.bind(this, this.editCut), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:88, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.offer({functionality:this.callEdit.bind(this, this.editCopy, [true, false]), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:67, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.offer({functionality:this.callEdit.bind(this, this.editPaste), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:86, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
  this.facade.offer({functionality:this.callEdit.bind(this, this.editDelete), keyCodes:[{metaKeys:[ORCHESTRATOR.CONST.META_KEY_META_CTRL], keyCode:8, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}, {keyCode:46, keyAction:ORCHESTRATOR.CONST.KEY_ACTION_DOWN}]});
}, callEdit:function(fn, args) {
  window.setTimeout(function() {
    fn.apply(this, args instanceof Array ? args : []);
  }.bind(this), 1);
}, handleMouseDown:function(event, uiObj) {
  if (!(uiObj instanceof ORYX.Core.Canvas) && event.ctrlKey) {
    this.editCopy();
    this.editPaste();
  }
}, getAllShapesToConsider:function(shapes) {
  var shapesToConsider = [];
  var childShapesToConsider = [];
  shapes.each(function(shape) {
    isChildShapeOfAnother = shapes.any(function(s2) {
      return s2.hasChildShape(shape);
    });
    if (isChildShapeOfAnother) {
      return;
    }
    shapesToConsider.push(shape);
    if (shape instanceof ORYX.Core.Node) {
      var attached = shape.getOutgoingNodes();
      attached = attached.findAll(function(a) {
        return!shapes.include(a);
      });
      shapesToConsider = shapesToConsider.concat(attached);
    }
    childShapesToConsider = childShapesToConsider.concat(shape.getChildShapes(true));
  }.bind(this));
  var edgesToConsider = this.facade.getCanvas().getChildEdges().select(function(edge) {
    if (shapesToConsider.include(edge)) {
      return false;
    }
    if (edge.getAllDockedShapes().size() === 0) {
      return false;
    }
    return edge.getAllDockedShapes().all(function(shape) {
      return shape instanceof ORYX.Core.Edge || childShapesToConsider.include(shape);
    });
  });
  shapesToConsider = shapesToConsider.concat(edgesToConsider);
  return shapesToConsider;
}, editCut:function() {
  this.editCopy(false, true);
  this.editDelete(true);
  return false;
}, editCopy:function(will_update, useNoOffset) {
  var selection = this.facade.getSelection();
  if (selection.length == 0) {
    return;
  }
  this.clipboard.refresh(selection, this.getAllShapesToConsider(selection), this.facade.getCanvas().getStencil().stencilSet().namespace(), useNoOffset);
  if (will_update) {
    this.facade.updateSelection();
  }
}, editPaste:function() {
  var canvas = {childShapes:this.clipboard.shapesAsJson, stencilset:{namespace:this.clipboard.SSnamespace}};
  ORYX.apply(canvas, ORYX.Core.AbstractShape.prototype.JSONHelper);
  var childShapeResourceIds = canvas.getChildShapes(true).pluck("resourceId");
  var outgoings = {};
  canvas.eachChild(function(shape, parent) {
    shape.outgoing = shape.outgoing.select(function(out) {
      return childShapeResourceIds.include(out.resourceId);
    });
    shape.outgoing.each(function(out) {
      if (!outgoings[out.resourceId]) {
        outgoings[out.resourceId] = [];
      }
      outgoings[out.resourceId].push(shape);
    });
    return shape;
  }.bind(this), true, true);
  canvas.eachChild(function(shape, parent) {
    if (shape.target && !childShapeResourceIds.include(shape.target.resourceId)) {
      shape.target = undefined;
      shape.targetRemoved = true;
    }
    if (shape.dockers && (shape.dockers.length >= 1 && (shape.dockers[0].getDocker && (shape.dockers[0].getDocker().getDockedShape() && !childShapeResourceIds.include(shape.dockers[0].getDocker().getDockedShape().resourceId) || !shape.getShape().dockers[0].getDockedShape() && !outgoings[shape.resourceId])))) {
      shape.sourceRemoved = true;
    }
    return shape;
  }.bind(this), true, true);
  canvas.eachChild(function(shape, parent) {
    if (this.clipboard.useOffset) {
      shape.bounds = {lowerRight:{x:shape.bounds.lowerRight.x + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, y:shape.bounds.lowerRight.y + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET}, upperLeft:{x:shape.bounds.upperLeft.x + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, y:shape.bounds.upperLeft.y + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET}};
    }
    if (shape.dockers) {
      shape.dockers = shape.dockers.map(function(docker, i) {
        if (shape.targetRemoved === true && (i == shape.dockers.length - 1 && docker.getDocker) || shape.sourceRemoved === true && (i == 0 && docker.getDocker)) {
          docker = docker.getDocker().bounds.center();
        }
        if (i == 0 && (docker.getDocker instanceof Function && (shape.sourceRemoved !== true && (docker.getDocker().getDockedShape() || (outgoings[shape.resourceId] || []).length > 0 && (!(shape.getShape() instanceof ORYX.Core.Node) || outgoings[shape.resourceId][0].getShape() instanceof ORYX.Core.Node)))) || i == shape.dockers.length - 1 && (docker.getDocker instanceof Function && (shape.targetRemoved !== true && (docker.getDocker().getDockedShape() || shape.target)))) {
          return{x:docker.x, y:docker.y, getDocker:docker.getDocker};
        } else {
          if (this.clipboard.useOffset) {
            return{x:docker.x + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, y:docker.y + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, getDocker:docker.getDocker};
          } else {
            return{x:docker.x, y:docker.y, getDocker:docker.getDocker};
          }
        }
      }.bind(this));
    } else {
      if (shape.getShape() instanceof ORYX.Core.Node && (shape.dockers && (shape.dockers.length > 0 && (!shape.dockers[0].getDocker || (shape.sourceRemoved === true || !(shape.dockers[0].getDocker().getDockedShape() || outgoings[shape.resourceId])))))) {
        shape.dockers = shape.dockers.map(function(docker, i) {
          if (shape.sourceRemoved === true && (i == 0 && docker.getDocker)) {
            docker = docker.getDocker().bounds.center();
          }
          if (this.clipboard.useOffset) {
            return{x:docker.x + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, y:docker.y + ORCHESTRATOR.CONFIG.COPY_MOVE_OFFSET, getDocker:docker.getDocker};
          } else {
            return{x:docker.x, y:docker.y, getDocker:docker.getDocker};
          }
        }.bind(this));
      }
    }
    return shape;
  }.bind(this), false, true);
  this.clipboard.useOffset = true;
  this.facade.importJSON(canvas);
}, editDelete:function() {
  var selection = this.facade.getSelection();
  var clipboard = new ORYX.Plugins.Edit.ClipBoard;
  clipboard.refresh(selection, this.getAllShapesToConsider(selection));
  var command = new ORYX.Plugins.Edit.DeleteCommand(clipboard, this.facade);
  this.facade.executeCommands([command]);
}};
ORYX.Plugins.Edit = Clazz.extend(ORYX.Plugins.Edit);
ORYX.Plugins.Edit.ClipBoard = {construct:function() {
  this.shapesAsJson = [];
  this.selection = [];
  this.SSnamespace = "";
  this.useOffset = true;
}, isOccupied:function() {
  return this.shapesAsJson.length > 0;
}, refresh:function(selection, shapes, namespace, useNoOffset) {
  this.selection = selection;
  this.SSnamespace = namespace;
  this.outgoings = {};
  this.parents = {};
  this.targets = {};
  this.useOffset = useNoOffset !== true;
  this.shapesAsJson = shapes.map(function(shape) {
    var s = shape.toJSON();
    s.parent = {resourceId:shape.getParentShape().resourceId};
    s.parentIndex = shape.getParentShape().getChildShapes().indexOf(shape);
    return s;
  });
}};
ORYX.Plugins.Edit.ClipBoard = Clazz.extend(ORYX.Plugins.Edit.ClipBoard);
ORYX.Plugins.Edit.DeleteCommand = {construct:function(clipboard, facade) {
  this.clipboard = clipboard;
  this.shapesAsJson = clipboard.shapesAsJson;
  this.facade = facade;
  this.dockers = this.shapesAsJson.map(function(shapeAsJson) {
    var shape = shapeAsJson.getShape();
    var incomingDockers = shape.getIncomingShapes().map(function(s) {
      return s.getDockers().last();
    });
    var outgoingDockers = shape.getOutgoingShapes().map(function(s) {
      return s.getDockers()[0];
    });
    var dockers = shape.getDockers().concat(incomingDockers, outgoingDockers).compact().map(function(docker) {
      return{object:docker, referencePoint:docker.referencePoint, dockedShape:docker.getDockedShape()};
    });
    return dockers;
  }).flatten();
}, execute:function() {
  this.shapesAsJson.each(function(shapeAsJson) {
    this.facade.deleteShape(shapeAsJson.getShape());
  }.bind(this));
  this.facade.setSelection([]);
  this.facade.getCanvas().update();
  this.facade.updateSelection();
}, rollback:function() {
  this.shapesAsJson.each(function(shapeAsJson) {
    var shape = shapeAsJson.getShape();
    var parent = this.facade.getCanvas().getChildShapeByResourceId(shapeAsJson.parent.resourceId) || this.facade.getCanvas();
    parent.add(shape, shape.parentIndex);
  }.bind(this));
  this.dockers.each(function(d) {
    d.object.setDockedShape(d.dockedShape);
    d.object.setReferencePoint(d.referencePoint);
  }.bind(this));
  this.facade.setSelection(this.selectedShapes);
  this.facade.getCanvas().update();
  this.facade.updateSelection();
}};
ORYX.Plugins.Edit.DeleteCommand = ORYX.Core.Command.extend(ORYX.Plugins.Edit.DeleteCommand);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
ORYX.Plugins.CanvasResize = {construct:function(facade) {
  this.facade = facade;
  var delta = ORCHESTRATOR.CONFIG.ICON_SIZE / 2;
  this.north_g = new ORYX.Core.Controls.Button({name:"arrowup", click:this.resize.bind(this, "N", ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:-delta, y:0, dirX:true}});
  this.north_s = new ORYX.Core.Controls.Button({name:"arrowdown", click:this.resize.bind(this, "N", -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:delta, y:0, dirX:true}});
  this.south_g = new ORYX.Core.Controls.Button({name:"arrowdown", click:this.resize.bind(this, "S", ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:-delta, y:-2 * delta, dirX:true}});
  this.south_s = new ORYX.Core.Controls.Button({name:"arrowup", click:this.resize.bind(this, "S", -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:delta, y:-2 * delta, dirX:true}});
  this.west_g = new ORYX.Core.Controls.Button({name:"arrowleft", click:this.resize.bind(this, "W", ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:0, y:-delta, dirY:true}});
  this.west_s = new ORYX.Core.Controls.Button({name:"arrowright", click:this.resize.bind(this, "W", -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:0, y:delta, dirY:true}});
  this.east_g = new ORYX.Core.Controls.Button({name:"arrowright", click:this.resize.bind(this, "E", ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:-2 * delta, y:-delta, dirY:true}});
  this.east_s = new ORYX.Core.Controls.Button({name:"arrowleft", click:this.resize.bind(this, "E", -ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL), facade:this.facade, pos:{x:-2 * delta, y:delta, dirY:true}});
  this.callbackMouseMove = this.handleMouseMove.bind(this);
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
}, enableReadOnlyMode:function() {
  this.facade.unregisterOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
  this.hide();
}, disableReadOnlyMode:function() {
  this.facade.registerOnEvent(ORCHESTRATOR.EVENTS.MOUSEMOVE, this.callbackMouseMove);
}, hide:function() {
  if (this.canvas) {
    this.west_g.hide();
    this.west_s.hide();
    this.north_g.hide();
    this.north_s.hide();
    this.east_g.hide();
    this.east_s.hide();
    this.south_g.hide();
    this.south_s.hide();
  }
}, redraw:function(paper) {
  this.canvas = this.facade.getCanvas();
  this.root = this.facade.getRootNode();
  this.north_g.redraw(paper);
  this.north_s.redraw(paper);
  this.south_g.redraw(paper);
  this.south_s.redraw(paper);
  this.west_g.redraw(paper);
  this.west_s.redraw(paper);
  this.east_g.redraw(paper);
  this.east_s.redraw(paper);
}, resize:function(direction, size) {
  var b = this.canvas.bounds;
  switch(direction) {
    case "N":
      this.canvas.moveBy(0, size);
      this.canvas.setSize({width:b.width(), height:b.height() + size}, function() {
        this.showNorth();
      }.bind(this));
      this.facade.updateSelection();
      break;
    case "S":
      var last = this.root.scrollTop;
      this.canvas.setSize({width:b.width(), height:b.height() + size}, function() {
        this.root.scrollTop = last + size;
        this.showSouth();
      }.bind(this));
      break;
    case "W":
      this.canvas.moveBy(size, 0);
      this.canvas.setSize({width:b.width() + size, height:b.height()}, function() {
        this.showWest();
      }.bind(this));
      this.facade.updateSelection();
      break;
    default:
      var last = this.root.scrollLeft;
      this.canvas.setSize({width:b.width() + size, height:b.height()}, function() {
        this.root.scrollLeft = last + size;
        this.showEast();
      }.bind(this));
      break;
  }
}, showNorth:function() {
  this.north_g.show();
  if (this.canvas.bbox.upperLeft().y > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
    this.north_s.show();
  } else {
    this.north_s.hide();
  }
}, showSouth:function() {
  this.south_g.show();
  if (this.root.clientWidth != this.root.offsetWidth && this.canvas.paper.height - this.canvas.bbox.lowerRight().y > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
    this.south_s.show();
  } else {
    this.south_s.hide();
  }
}, showWest:function() {
  this.west_g.show();
  if (this.canvas.bbox.upperLeft().x > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
    this.west_s.show();
  } else {
    this.west_s.hide();
  }
}, showEast:function() {
  this.east_g.show();
  if (this.root.clientHeight != this.root.offsetHeight && this.canvas.paper.width - this.canvas.bbox.lowerRight().x > ORCHESTRATOR.CONFIG.CANVAS_RESIZE_INTERVAL) {
    this.east_s.show();
  } else {
    this.east_s.hide();
  }
}, handleMouseMove:function(event, uiObj) {
  var scroll = Element.cumulativeScrollOffset(this.root);
  posX = event.clientX - this.root.offsetLeft + scroll.left;
  posY = event.clientY - this.root.offsetTop + scroll.top;
  this.hide();
  if (posX < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
    this.showWest();
  } else {
    if (posY < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
      this.showNorth();
    } else {
      var cwidth = this.canvas.paper.width;
      var cheight = this.canvas.paper.height;
      if (cwidth - posX < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
        var width = parseFloat(this.root.style.width);
        if (cwidth < width) {
          this.canvas.setSize({width:width, height:parseFloat(this.root.style.height) - 5});
        }
        this.showEast();
      }
      if (cheight - posY < ORCHESTRATOR.CONFIG.RESIZE_BORDER) {
        var height = parseFloat(this.root.style.height) - 5;
        if (cheight < height) {
          this.canvas.setSize({width:parseFloat(this.root.style.width), height:height});
        }
        this.showSouth();
      }
    }
  }
}};
ORYX.Plugins.CanvasResize = Clazz.extend(ORYX.Plugins.CanvasResize);
if (!ORYX) {
  var ORYX = {}
}
if (!ORYX.Plugins) {
  ORYX.Plugins = {};
}
if (!ORYX.Plugins.Layouter) {
  ORYX.Plugins.Layouter = {};
}
ORYX.Plugins.Layouter.EdgeLayouter = {layouted:["http://b3mn.org/stencilset/bpmn1.1#SequenceFlow", "http://b3mn.org/stencilset/bpmn1.1#MessageFlow", "http://b3mn.org/stencilset/timjpdl3#SequenceFlow", "http://b3mn.org/stencilset/jbpm4#SequenceFlow", "http://b3mn.org/stencilset/bpmn2.0#MessageFlow", "http://b3mn.org/stencilset/bpmn2.0#SequenceFlow", "http://b3mn.org/stencilset/bpmn2.0choreography#MessageFlow", "http://b3mn.org/stencilset/bpmn2.0choreography#SequenceFlow", "http://b3mn.org/stencilset/bpmn2.0conversation#ConversationLink", 
"http://b3mn.org/stencilset/epc#ControlFlow", "http://www.signavio.com/stencilsets/processmap#ProcessLink", "http://www.signavio.com/stencilsets/organigram#connection"], layout:function(edges) {
  edges.each(function(edge) {
    this.doLayout(edge);
  }.bind(this));
}, doLayout:function(edge) {
  var from = edge.getIncomingNodes()[0];
  var to = edge.getOutgoingNodes()[0];
  if (!from || !to) {
    return;
  }
  var positions = this.getPositions(from, to, edge);
  if (positions.length > 0) {
    this.setDockers(edge, positions[0].a, positions[0].b);
  }
}, getPositions:function(from, to, edge) {
  var ab = from.absoluteBounds();
  var bb = to.absoluteBounds();
  var a = ab.center();
  var b = bb.center();
  var am = ab.midPoint();
  var bm = bb.midPoint();
  var first = Object.clone(edge.dockers[0].referencePoint);
  var last = Object.clone(edge.dockers.last().referencePoint);
  var aFirst = edge.dockers[0].getAbsoluteReferencePoint();
  var aLast = edge.dockers.last().getAbsoluteReferencePoint();
  if (Math.abs(aFirst.x - aLast.x) < 1 || Math.abs(aFirst.y - aLast.y) < 1) {
    return[];
  }
  var m = {};
  m.x = a.x < b.x ? (b.x - bb.width() / 2 - (a.x + ab.width() / 2)) / 2 + (a.x + ab.width() / 2) : (a.x - ab.width() / 2 - (b.x + bb.width() / 2)) / 2 + (b.x + bb.width() / 2);
  m.y = a.y < b.y ? (b.y - bb.height() / 2 - (a.y + ab.height() / 2)) / 2 + (a.y + ab.height() / 2) : (a.y - ab.height() / 2 - (b.y + bb.height() / 2)) / 2 + (b.y + bb.height() / 2);
  ab.widen(5);
  bb.widen(20);
  var positions = [];
  var off = this.getOffset.bind(this);
  if (!ab.isIncluded(b.x, a.y) && !bb.isIncluded(b.x, a.y)) {
    positions.push({a:{x:b.x + off(last, bm, "x"), y:a.y + off(first, am, "y")}, z:this.getWeight(from, a.x < b.x ? "r" : "l", to, a.y < b.y ? "t" : "b", edge)});
  }
  if (!ab.isIncluded(a.x, b.y) && !bb.isIncluded(a.x, b.y)) {
    positions.push({a:{x:a.x + off(first, am, "x"), y:b.y + off(last, bm, "y")}, z:this.getWeight(from, a.y < b.y ? "b" : "t", to, a.x < b.x ? "l" : "r", edge)});
  }
  if (!ab.isIncluded(m.x, a.y) && !bb.isIncluded(m.x, b.y)) {
    positions.push({a:{x:m.x, y:a.y + off(first, am, "y")}, b:{x:m.x, y:b.y + off(last, bm, "y")}, z:this.getWeight(from, "r", to, "l", edge, a.x > b.x)});
  }
  if (!ab.isIncluded(a.x, m.y) && !bb.isIncluded(b.x, m.y)) {
    positions.push({a:{x:a.x + off(first, am, "x"), y:m.y}, b:{x:b.x + off(last, bm, "x"), y:m.y}, z:this.getWeight(from, "b", to, "t", edge, a.y > b.y)});
  }
  return positions.sort(function(a, b) {
    return a.z < b.z ? 1 : a.z == b.z ? -1 : -1;
  });
}, getOffset:function(pos, pos2, dir) {
  return pos[dir] - pos2[dir];
}, getWeight:function(from, d1, to, d2, edge, reverse) {
  d1 = (d1 || "").toLowerCase();
  d2 = (d2 || "").toLowerCase();
  if (!["t", "r", "b", "l"].include(d1)) {
    d1 = "r";
  }
  if (!["t", "r", "b", "l"].include(d2)) {
    d1 = "l";
  }
  if (reverse) {
    d1 = d1 == "t" ? "b" : d1 == "r" ? "l" : d1 == "b" ? "t" : d1 == "l" ? "r" : "r";
    d2 = d2 == "t" ? "b" : d2 == "r" ? "l" : d2 == "b" ? "t" : d2 == "l" ? "r" : "r";
  }
  var weight = 0;
  var dr1 = this.facade.getRules().getLayoutingRules(from, edge)["out"];
  var dr2 = this.facade.getRules().getLayoutingRules(to, edge)["in"];
  var fromWeight = dr1[d1];
  var toWeight = dr2[d2];
  var sameDirection = function(direction, center1, center2) {
    switch(direction) {
      case "t":
        return Math.abs(center1.x - center2.x) < 2 && center1.y < center2.y;
      case "r":
        return center1.x > center2.x && Math.abs(center1.y - center2.y) < 2;
      case "b":
        return Math.abs(center1.x - center2.x) < 2 && center1.y > center2.y;
      case "l":
        return center1.x < center2.x && Math.abs(center1.y - center2.y) < 2;
      default:
        return false;
    }
  };
  var sameIncomingFrom = from.getIncomingShapes().findAll(function(a) {
    return a instanceof ORYX.Core.Edge;
  }).any(function(e) {
    return sameDirection(d1, e.dockers[e.dockers.length - 2].bounds.center(), e.dockers.last().bounds.center());
  });
  var sameOutgoingTo = to.getOutgoingShapes().findAll(function(a) {
    return a instanceof ORYX.Core.Edge;
  }).any(function(e) {
    return sameDirection(d2, e.dockers[1].bounds.center(), e.dockers[0].bounds.center());
  });
  return sameIncomingFrom || sameOutgoingTo ? 0 : fromWeight + toWeight;
}, setDockers:function(edge, a, b) {
  if (!edge) {
    return;
  }
  edge.dockers.each(function(r) {
    edge.removeDocker(r);
  });
  [a, b].compact().each(function(pos) {
    var docker = edge.createDocker(undefined, pos);
    docker.bounds.centerMoveTo(pos);
  });
  edge.dockers.each(function(docker) {
    docker.update();
  });
  edge._update(true);
}};
ORYX.Plugins.Layouter.EdgeLayouter = ORYX.Plugins.AbstractLayouter.extend(ORYX.Plugins.Layouter.EdgeLayouter);

