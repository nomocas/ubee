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
