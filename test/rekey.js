/*jshint smarttabs:true */
(function (root, factory) {
	
	"use strict";
	
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../public/js/rekey.js')
		);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(
			[
				'../public/js/rekey.js'
			],
			factory.bind(this, expect)
		);
	} else {
		// Browser globals (root is window)
		root.returnExports = factory(
			root.expect,
			root.rekey
		);
	}
})(this, function (
	expect,
	rekey
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('rekey',function() {
	
	it('will rekey', function() {
		expect(
			rekey(['a', 'b', 'c'], [1, 2, 4])
		).to.eql({
			a: 1,
			b: 2,
			c: 4
		});
	});
	
});

});