var compiler = require('../index'),
	collider = require('./collider');
require('./restrictions');

// var decompose = require('decompose');

var target = {
	foo: true,
	bar: "zoo",
	arr: [1, 2],
	hello: function() {
		console.log('hello world');
	},
	biloud: function(arg) {
		console.log('biloud !', arg);
		return arg + 2;
	}
}

var src = {
	bloupi: 12,
	foo: false,
	arr: [4, 5],
	bar: collider.up('barzoo'),
	biloud: decompose().after(function(arg) {
		console.log('after !', arg);
		return arg + 2;
	})
}

var t = compiler.compile(target, src, compiler.Disallow('hello', 'test'));

console.log('target : ', t);

t.biloud(1);
