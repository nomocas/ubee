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
