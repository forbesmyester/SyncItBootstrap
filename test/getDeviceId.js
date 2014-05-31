/*jshint smarttabs:true */
(function (root, factory) {
	
	"use strict";
	
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../public/js/getDeviceId.js')
		);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(
			[
				'../public/js/getDeviceId.js'
			],
			factory.bind(this, expect)
		);
	} else {
		// Browser globals (root is window)
		root.returnExports = factory(
			root.expect,
			root.getDeviceId
		);
	}
})(this, function (
	expect,
	getDeviceId
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('getDeviceId',function() {
	
	var current = 1;
	var idGenerator = function() { return 'aaa' + current++; };
	
	it('will create and return a device Id when none existed',function() {
		var isSet = false;
		var localStorage = {
			getItem: function() {
				if (!isSet) {
					return null;
				}
				return isSet;
			},
			setItem: function(k, v) {
				isSet = v;
			}
		};
		expect(getDeviceId(idGenerator, localStorage)).to.equal('aaa1');
		expect(getDeviceId(idGenerator, localStorage)).to.equal('aaa1');
	});
	
	it('will just return a device Id when one exists',function() {
		var localStorage = {
			getItem: function() {
				return 'abc';
			},
			setItem: function() {
				expect().fail();
			}
		};
		expect(getDeviceId(idGenerator, localStorage)).to.equal('abc');
		expect(getDeviceId(idGenerator, localStorage)).to.equal('abc');
	});
});

});
