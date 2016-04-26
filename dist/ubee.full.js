(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ubee = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//________________________________ Properties management with dot syntax
module.exports = {
	getProp: function(from, path) {
		var start = 0;
		if (path[0] === '$this')
			start = 1;
		var tmp = from;
		for (var i = start, len = path.length; i < len; ++i)
			if (!tmp || (tmp = tmp[path[i]]) === undefined)
				return;
		return tmp;
	},
	deleteProp: function(from, path) {
		var tmp = from,
			i = 0;
		for (len = path.length - 1; i < len; ++i)
			if (tmp && !(tmp = tmp[path[i]]))
				return;
		if (tmp)
			delete tmp[path[i]];
	},
	setProp: function(to, path, value) {
		var tmp = to,
			i = 0,
			old,
			len = path.length - 1;
		for (; i < len; ++i)
			if (tmp && !tmp[path[i]])
				tmp = tmp[path[i]] = {};
			else
				tmp = tmp[path[i]];
		if (tmp) {
			old = tmp[path[i]];
			tmp[path[i]] = value;
		}
		return old;
	},
	shallowMerge: function(src, target) {
		for (var i in src)
			target[i] = src[i];
	},
	shallowCopy: function(obj) {
		if (obj && obj.forEach)
			return obj.slice();
		if (obj && typeof obj === 'object') {
			if (obj instanceof RegExp || obj instanceof Date)
				return obj;
			var res = {};
			for (var i in obj)
				res[i] = obj[i];
			return res;
		}
		return obj;
	},
	copy: function(obj) {
		if (!obj)
			return obj;
		var res = null;
		if (typeof obj.clone === 'function')
			return obj.clone();
		if (obj.forEach) {
			res = [];
			for (var i = 0, len = obj.length; i < len; ++i)
				res.push(this.copy(obj[i]));
		} else if (obj && typeof obj === 'object') {
			if (obj instanceof RegExp || obj instanceof Date)
				return obj;
			res = {};
			for (var j in obj) {
				var v = obj[j];
				if (typeof v === 'object')
					res[j] = this.copy(v);
				else
					res[j] = v;
			}
		} else
			res = obj;
		return res;
	},
	array: {
		includes: function(arr, value) {
			return arr.some(function(item) {
				return item === value;
			});
		},
		remove: function(arr, value) {
			for (var i = 0, len = arr.length; i < len; ++i)
				if (arr[i] === value) {
					arr.splice(i, 1);
					return;
				}
		},
		randomize: function(arr) {
			if (!arr)
				return null;
			return arr.sort(function() {
				return 0.5 - Math.random();
			});
		},
		insertAfter: function(arr, ref, newItem) {
			var index = arr.indexOf(ref);
			if (ref === -1)
				throw new Error('utils.array.insertAfter : ref not found.');
			if (index === arr.length - 1)
				arr.push(newItem);
			else
				arr.splice(index + 1, 0, newItem);
		}
	}
};

},{}],2:[function(require,module,exports){
/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */

var utils = require('nomocas-utils/lib/object-utils');

function getPrimitiveType(obj) {
	if (obj && obj.forEach)
		return "array";
	return typeof obj;
}

var compiler = {};

compiler.compile = function() {
	var base = utils.copy(arguments[0]);
	var len = arguments.length;
	for (var i = 1; i < len; ++i)
		compiler.aup(arguments[i], base);
	return base;
};

compiler.aup = function(src, target) {
	if (typeof src === 'undefined')
		return target;
	if (src === null)
		return null;
	if (typeof target === 'undefined' || target === null)
		return utils.copy(src);
	if (target._ubee_compiler_) {
		target = target._up(src);
		return target;
	}
	if (src._ubee_compiler_) {
		if (src._clone)
			src = src._clone();
		return src._bottom(target);
	}
	var srcType = getPrimitiveType(src),
		targetType = getPrimitiveType(target);
	if (srcType !== targetType) {
		target = utils.copy(src);
		return target;
	}
	switch (srcType) {
		case 'array':
			target.push.apply(target, src.map(utils.copy));
			return target;
		case 'object':
			if (src instanceof RegExp || src instanceof Date)
				return src;
			for (var i in src) {
				if (typeof target[i] === 'undefined') {
					target[i] = utils.copy(src[i]);
					continue;
				}
				if (src[i] === null) {
					target[i] = null;
					continue;
				}
				if (typeof src[i] === 'object' || typeof src[i] === 'function') {
					target[i] = compiler.aup(src[i], target[i]);
				} else
					target[i] = src[i];
			}
			return target;
		default:
			return src;
	}
};

compiler.abottom = function(src, target) {
	if (src === null || typeof src === "undefined")
		return target;
	if (target === null)
		return target;
	if (typeof target === 'undefined') {
		target = utils.copy(src);
		return target;
	}
	if (target._ubee_compiler_) {
		target = target._bottom(src);
		return target;
	}
	if (src._ubee_compiler_)
		return target;

	var srcType = getPrimitiveType(src);
	var targetType = getPrimitiveType(target);
	if (srcType !== targetType)
		return target;
	switch (srcType) {
		case 'array':
			target.unshift.apply(target, src.map(utils.copy));
			return target;
		case 'object':
			for (var i in src) {
				if (src[i] !== null) {
					if (typeof target[i] === 'undefined')
						target[i] = utils.copy(src[i]);
					else if (typeof src[i] === 'object' || typeof src[i] === 'function')
						target[i] = compiler.abottom(src[i], target[i]); //, target, i);
					if (target[i] && target[i]._ubee_remover_)
						delete target[i];
				}
			}
			var copied = utils.shallowCopy(target);
			for (i in target)
				delete target[i];
			for (i in src) {
				target[i] = copied[i];
				delete copied[i];
			}
			for (i in copied)
				target[i] = copied[i];
			return target;
		default:
			return target;
	}
};

/**
 * up : merge object from up
 * @return {Dynamic}      the merged object
 */
compiler.up = function() {
	var target = arguments[0];
	for (var i = 1, len = arguments.length; i < len; i++)
		target = compiler.aup(arguments[i], target);
	return target;
};
/**
 * bottom : merge object from bottom
 * @return {Dynamic}        the merged object
 */
compiler.bottom = function() {
	var target = arguments[arguments.length - 1],
		src = arguments[0];
	for (var i = arguments.length - 2; i > 0; i--)
		target = compiler.abottom(arguments[i], target);
	return compiler.abottom(src, target);
};

module.exports = compiler;

},{"nomocas-utils/lib/object-utils":1}],3:[function(require,module,exports){
/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * layer-data-composition : inspired by (de)Compose, it offer a set of tools that permit to merge values when layer's are collided.
 *
 * As (de)Compose merge two functions by wrapping them by appropriate composition method (after, before, around),
 * layer-compose do the same by fireing a paticular merger when values are collided.
 *
 * If you know photoshop : it's an equivalent of the fusion modes between two layers (or pixel).
 */

var compiler = require('../index'),
	// utils = require('nomocas-utils/lib/object-utils'),
	collider = {};

var Collider = collider.Collider = function(fn) {
	this._collision = fn;
	this._ubee_compiler_ = true;
	this._ubee_collider_ = true;
};

Collider.prototype = {
	_wrapper: function(fn) {
		var coll = this._collision;
		return function(input) {
			return fn(coll(input));
		};
	},
	_clone: function() {
		var collider = new Collider();
		collider._collision = this._collision;
		return collider;
	},
	_up: function(obj) {
		if (!obj._ubee_collider_)
			return obj;
		this._collision = this._wrapper(obj._collision);
		return this;
	},
	_bottom: function(obj) {
		if (!obj._ubee_collider_)
			return this._collision(obj);
		this._collision = obj._wrapper(this._collision);
		return this;
	}
};

/**
 * Add new collider method
 * @param {String}   name the method name
 * @param {Function} fn   the method
 */
Collider.add = function(name, fn) {
	var handler = function() {
		var args = Array.prototype.slice.apply(arguments);
		var h = function(input) {
			args.unshift(input);
			return fn.apply({}, args);
		};
		if (!this._ubee_collider_)
			return new Collider(h);
		this._collision = this._wrapper(h);
		return this;
	};
	collider[name] = Collider.prototype[name] = handler;
	return Collider;
};

/**
 * bottom
 *
 * @example
 * var a = {
 * test:deep.collider.bottom({})
 * };
 *
 */
Collider.add("bottom", function() {
	var len = arguments.length - 1,
		base = arguments[0];
	for (; len > 0; --len)
		base = compiler.abottom(arguments[len], base);
	return base;
});

/**
 * up
 *
 * @example
 * var a = {
 * test:deep.collider.up({})
 * };
 *
 */
Collider.add("up", function() {
	var len = arguments.length,
		base = arguments[0];
	for (var count = 1; count < len; ++count)
		base = compiler.aup(arguments[count], base);
	return base;
});


/**
 * array.insertAt
 *
 * @example
 * var a = {
 * test:deep.collider.insertAt( what, index )
 * };
 *
 */
Collider.add("insertAt", function(input, what, index) {
	if (!Array.isArray(input))
		throw new Error("colliders.insertAt couldn't be applied : target is not an array.");
	var args = [index, 0].concat(what);
	input.splice.apply(input, args);
	return input;
});

/**
 * array.removeAt
 *
 * @example
 * var a = {
 * test:deep.collider.removeAt( index )
 * };
 *
 */
Collider.add("removeAt", function(input, index, howMuch) {
	if (!Array.isArray(input))
		throw new Error("collider.removeAt couldn't be applied : target is not an array.");
	if (!howMuch && howMuch !== 0)
		howMuch = 1;
	input.splice(index, howMuch);
	return input;
});

/**
 * array.push
 *
 * @example
 * var a = {
 * 	test:deep.collider.push( value )
 * };
 *
 */
Collider.add("push", function(input, value) {
	if (!Array.isArray(input))
		throw new Error("collider.push couldn't be applied : target is not an array.");
	input.push(value);
	return input;
});

/**
 * array.unshift
 *
 * @example
 * var a = {
 * 	test:deep.collider.unshift( value )
 * };
 *
 */
Collider.add("unshift", function(input, value) {
	if (!Array.isArray(input))
		throw new Error("collider.push couldn't be applied : target is not an array.");
	input.unshift(value);
	return input;
});


/**
 * map
 *
 * @example
 * var a = {
 * 	test:deep.collider.map( function(value){  return value.toUpperCase() } )
 * };
 *
 */
Collider.add("map", function(input, callback) {
	if (!Array.isArray(input))
		return callback(input);
	return input.map(callback);
});

/**
 * transform
 *
 * @example
 * var a = {
 * test:deep.collider.transform( function(input){ return input+2; } )
 * };
 *
 */
Collider.add("transform", function(input, fn) {
	return fn(input);
});

compiler.collider = collider;

module.exports = collider;

/*
compiler.bottomArray = function(src, target, mergeOn, opt) {
	if (src.length === 0)
		return target;
	var map = {};
	var len = src.length,
		val = null,
		i = 0;
	for (; i < len; ++i) {
		var a = src[i];
		if (a && mergeOn)
			val = utils.fromPath(a, mergeOn);
		else if (a && a.id)
			val = a.id;
		else
			val = String(a);
		map[val] = {
			ref: a,
			index: i
		};
	}
	Array.prototype.unshift.apply(target, src); // prepend src to target
	var elem = target[i]; // check target from target[src.length]
	while (i < target.length) // seek after collision in target, apply it, and remove given element from target
	{
		// catch current value
		if (elem && mergeOn)
			val = utils.fromPath(elem, mergeOn);
		else if (elem && elem.id)
			val = elem.id;
		else
			val = String(elem);
		if (map[val]) {
			target[map[val.index]] = compiler.aup(elem, map[val].ref, opt);
			target.splice(i, 1); // remove collided element from t
		}
		elem = target[++i];
	}
	return target;
};

compiler.upArray = function(src, target, mergeOn, opt) {
	if (src.length === 0)
		return target;
	var map = {};
	var len = target.length,
		val = null,
		i = 0;
	for (; i < len; ++i) {
		var a = target[i];
		if (a && mergeOn)
			val = utils.fromPath(a, mergeOn);
		else if (a && a.id)
			val = a.id;
		else
			val = String(a);
		map[val] = {
			ref: a,
			index: i
		};
	}
	i = 0;
	var elem = src[i],
		length = src.length; // check target from target[src.length]
	while (i < length) // seek after collision in target, apply it, and remove given element from target
	{
		// catch current value
		if (elem && mergeOn)
			val = utils.fromPath(elem, mergeOn);
		else if (elem && elem.id)
			val = elem.id;
		else
			val = String(elem);
		if (map[val])
			target[map[val.index]] = compiler.aup(elem, map[val].ref, opt);
		else
			target.push(elem);
		elem = src[++i];
	}
	return target;
};


 */

},{"../index":2}],4:[function(require,module,exports){
var compiler = require('../index'),
	collider = require('./collider');
require('./restrictions');

module.exports = compiler;

},{"../index":2,"./collider":3,"./restrictions":5}],5:[function(require,module,exports){
/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */

var compiler = require('../index');

var forbidden = function(message) {
	return function(any, options) {
		var error = new Error(message || 'forbidden method');
		error.status = 405;
		throw error;
	};
};

var Disallow = function() {
	var restrictions = {};
	for (var i in arguments)
		restrictions[arguments[i]] = forbidden();
	return restrictions;
};

var AllowOnly = function() {
	return {
		inner: {},
		allowable: Array.prototype.slice.call(arguments),
		_ubee_compiler_: true,
		_ubee_allow_only_: true,
		_up: function() { // apply arguments (up) on inner-layer : so merge
			var res = this.inner;
			for (var i = 0, len = arguments.length; i < len; ++i) {
				var argi = arguments[i];
				if (argi._ubee_allow_only_) {
					res = compiler.aup(argi.inner, res);
					this.allowable = compiler.aup(argi.allowable, this.allowable);
				} else
					res = compiler.aup(argi, res);
			}
			this.inner = res;
			return this;
		},
		_bottom: function() { // apply arguments (bottom) on this : so apply restrictions
			var res = this.inner,
				toKeep = null;
			for (var len = arguments.length - 1; len >= 0; --len) {
				var argi = arguments[len];
				if (argi._ubee_allow_only_) {
					res = compiler.abottom(argi.inner, res);
					this.allowable = compiler.aup(argi.allowable, this.allowable);
				} else
					res = compiler.abottom(argi, res);
			}
			if (res._ubee_restrictable_) {
				var toRemove = utils.removeInside(res._ubee_restrictable_.slice(), this.allowable);
				for (var j = 0, lenj = toRemove.length; j < lenj; ++j)
					res[toRemove[j]] = forbidden();
			} else {
				if (!toKeep) {
					toKeep = {};
					for (var l = 0, lenl = this.allowable.length; l < lenl; ++l)
						toKeep[this.allowable[l]] = true;
				}
				for (var k in res)
					if (typeof res[k] === 'function' && !toKeep[k]) {
						res[k] = forbidden();
					}
			}
			return res;
		}
	};
};

compiler.Disallow = Disallow;
compiler.AllowOnly = AllowOnly;
compiler.forbidden = forbidden;
module.exports = compiler;

},{"../index":2}]},{},[4])(4)
});