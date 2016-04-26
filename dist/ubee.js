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

},{"nomocas-utils/lib/object-utils":1}]},{},[2])(2)
});