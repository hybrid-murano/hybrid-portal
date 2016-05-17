/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

var Lang = {
	SUBREGEX: /\{\s*([^\|\}]+?)\s*(?:\|([^\}]*))?\s*\}/g,
	UNDEFINED: 'undefined',
	isUndefined: function(o) {
		return typeof o === Lang.UNDEFINED;
	},
	sub: function(s, o) {
		return ((s.replace) ? s.replace(Lang.SUBREGEX, function(match, key) {
			return (!Lang.isUndefined(o[key])) ? o[key] : match;
		}) : s);
	}
};

if(!String.prototype.trim) {
    String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
}

if(!Array.prototype.last) {
	Array.prototype.last = function() { return this[this.length - 1]; };
}

if(!Array.prototype.findAll) {
	Array.prototype.findAll = function(iterator) {
		if (this == null || !Object.isFunction(iterator)) {
			throw new TypeError();
		}
		var object = Object(this);
		var results = [], context = arguments[1], value;
		for ( var i = 0, length = object.length >>> 0; i < length; i++) {
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

if(!Raphael.fn.polygone) {
	Raphael.fn.polygone = function (points) {
		var first = [points[0], points[1]];
		var last = first;
		var path = 'm' + points[0] + ',' + points[1];
		for ( var i = 2; i < points.length; i++) {
			path = path + 'l' + (points[i]-last[0]) + ',' + (points[i+1]-last[1]);
			last[0] = points[i];
			last[1] = points[i+1];
			i++;
		}
		path = path + 'l' + (first[0]-last[0]) + ',' + (first[1]-last[1]) + 'z';
		polygon = this.path(path);
		polygon.type = 'polygone';
		return polygon.data('points', points);
	};
}

function printf() {
	var result = arguments[0];
	for (var i=1; i<arguments.length; i++)
		result = result.replace('%' + (i-1), arguments[i]);
	return result;
}

if(!ORCHESTRATOR.CONFIG.LOGLEVEL) ORCHESTRATOR.CONFIG.LOGLEVEL = 4;

if(!ORYX) var ORYX = {};

ORYX = Object.extend(ORYX, {
	observe : function(el, evt, callback) {
		PROTOTYPE.Event.observe(el, evt, callback);
	},
	
	stopObserving : function(el) {
		PROTOTYPE.Event.stopObserving(el);
	},
	
	stop : function(event) {
		PROTOTYPE.Event.stop(event);
	},
	
	isLeftClick: function(event) {
		return PROTOTYPE.Event.isLeftClick(event);
	},
	
	pointerX : function(event) {
		var docElement = document.documentElement, body = document.body || {scrollLeft : 0};
		return event.pageX || (event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0));
	},

	pointerY : function(event) {
		var docElement = document.documentElement, body = document.body || {scrollTop : 0};
		return event.pageY || (event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0));
	},

	apply : function(o, c, defaults){
	    if(defaults){
	    	ORYX.apply(o, defaults);
	    }
	    if(o && c && typeof c == 'object'){
	        for(var p in c){
	            o[p] = c[p];
	        }
	    }
	    return o;
	},

	  /**
	   *  Object.extend(destination, source) -> Object
	   *  - destination (Object): The object to receive the new properties.
	   *  - source (Object): The object whose properties will be duplicated.
	   *
	   *  Copies all properties from the source to the destination object. Used by Prototype
	   *  to simulate inheritance (rather statically) by copying to prototypes.
	   *  
	   *  Documentation should soon become available that describes how Prototype implements
	   *  OOP, where you will find further details on how Prototype uses [[Object.extend]] and
	   *  [[Class.create]] (something that may well change in version 2.0). It will be linked
	   *  from here.
	   *  
	   *  Do not mistake this method with its quasi-namesake [[Element.extend]],
	   *  which implements Prototype's (much more complex) DOM extension mechanism.
	  **/
	extend : function(destination, source) {
		for ( var property in source)
			destination[property] = source[property];
		return destination;
	},

	// inpired by a similar function in mootools library
    /**
     * Returns the type of object that is passed in. If the object passed in is null or undefined it
     * return false otherwise it returns one of the following values:<ul>
     * <li><b>string</b>: If the object passed is a string</li>
     * <li><b>number</b>: If the object passed is a number</li>
     * <li><b>boolean</b>: If the object passed is a boolean value</li>
     * <li><b>function</b>: If the object passed is a function reference</li>
     * <li><b>object</b>: If the object passed is an object</li>
     * <li><b>array</b>: If the object passed is an array</li>
     * <li><b>regexp</b>: If the object passed is a regular expression</li>
     * <li><b>element</b>: If the object passed is a DOM Element</li>
     * <li><b>nodelist</b>: If the object passed is a DOM NodeList</li>
     * <li><b>textnode</b>: If the object passed is a DOM text node and contains something other than whitespace</li>
     * <li><b>whitespace</b>: If the object passed is a DOM text node and contains only whitespace</li>
     * @param {Mixed} object
     * @return {String}
     */
    type : function(o){
        if(o === undefined || o === null){
            return false;
        }
        if(o.htmlElement){
            return 'element';
        }
        var t = typeof o;
        if(t == 'object' && o.nodeName) {
            switch(o.nodeType) {
                case 1: return 'element';
                case 3: return (/\S/).test(o.nodeValue) ? 'textnode' : 'whitespace';
            }
        }
        if(t == 'object' || t == 'function') {
            switch(o.constructor) {
                case Array: return 'array';
                case RegExp: return 'regexp';
            }
            if(typeof o.length == 'number' && typeof o.item == 'function') {
                return 'nodelist';
            }
        }
        return t;
    },

	Log: {
		__appenders: [
			{ append: function(message) {
				try {console.log(message);} catch(e) {}
			}}
		],
		addAppender: function(appender) { ORYX.Log.__appenders.push(appender); },
		trace: function() {	if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_TRACE) { ORYX.Log.__log('TRACE', arguments); } },
		debug: function() { if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_DEBUG) { ORYX.Log.__log('DEBUG', arguments); } },
		info : function() { if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_INFO)  { ORYX.Log.__log('INFO ', arguments); } },
		warn : function() { if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_WARN)	 { ORYX.Log.__log('WARN ', arguments); } },
		error: function() { if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_ERROR) { ORYX.Log.__log('ERROR', arguments); } },
		fatal: function() { if(ORCHESTRATOR.CONFIG.LOGLEVEL >= ORCHESTRATOR.CONST.LOGLEVEL_FATAL) { ORYX.Log.__log('FATAL', arguments); } },

		exception: function(e) {
			if(e.stack) {
				ORYX.Log.error(" Exception: " + e.stack);
			} else {
				ORYX.Log.error(" Exception: " + e);
			}
		},

		__log: function(prefix, messageParts) {
			messageParts[0] = (new Date()).getTime() + " " + prefix + " " + messageParts[0];
			var message = printf.apply(null, messageParts);
			ORYX.Log.__appenders.each(function(appender) {
				appender.append(message);
			});
		}
	}
});

ORYX.Hash = {
	construct : function(object) {
		this._object = (object instanceof ORYX.Hash) ? object.toObject() : ORYX.extend({}, object);
	},
	set : function(key, value) {
		return this._object[key] = value;
	},
	get : function(key) {
		if (this._object[key] !== Object.prototype[key]) {
			return this._object[key];
		}
	},
	unset : function(key) {
		var value = this._object[key];
		delete this._object[key];
		return value;
	},
	toObject : function() {
		return Object.clone(this._object);
	},
	keys : function() {
		return this.pluck('key');
	},
	values : function() {
		return this.pluck('value');
	},
	pluck : function(property) {
		var results = [];
		this.each(function(value) {
			results.push(value[property]);
		});
		return results;
	},
	$break : function() {},
	each : function(iterator, context) {
		try {
			for ( var key in this._object) {
				var value = this._object[key], pair = [ key, value ];
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
	},
	any : function(iterator, context) {
		iterator = iterator || (function(x) { return x; });
		var result = false;
		this.each(function(value, index) {
			if (result = !!iterator.call(context, value, index, this))
				throw this.$break;
		}, this);
		return result;
	},
	inject : function(memo, iterator, context) {
		this.each(function(value, index) {
			memo = iterator.call(context, memo, value, index, this);
		}, this);
		return memo;
	},
	clone : function() {
		return new ORYX.Hash(this);
	}
};
ORYX.Hash = Clazz.extend(ORYX.Hash);
