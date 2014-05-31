/*jshint smarttabs:true */
(function (root, factory) {
	
	"use strict";
	
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../public/js/getSyncItCallbackConverter.js')
		);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(
			[
				'../public/js/getSyncItCallbackConverter.js'
			],
			factory.bind(this, expect)
		);
	} else {
		// Browser globals (root is window)
		root.returnExports = factory(
			root.expect,
			root.getSyncItCallbackConverter
		);
	}
})(this, function (
	expect,
	getSyncItCallbackConverter
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('convertSyncItCallback',function() {
	
	it('will give the result back as is if not in the hash', function() {
		getSyncItCallbackConverter(
			{_9: {err: null}},
			function(err) {
				expect(err).to.equal(3);
			}
		)(3);
	});
	
	it('will alter the err arg if the err matches but no fake params', function() {
		getSyncItCallbackConverter(
			{_9: {err: null}},
			function(err, res1, res2) {
				expect(err).to.equal(null);
				expect(res1).to.equal('frogs');
				expect(res2).to.equal('cats');
			}
		)(9, 'frogs', 'cats');
	});
	
	it('will alter the err arg and issue fake params', function() {
		getSyncItCallbackConverter(
			{_9: {err: null, res:[[], 1]}},
			function(err, res1, res2) {
				expect(err).to.equal(null);
				expect(res1).to.eql([]);
				expect(res2).to.equal(1);
			}
		)(9, 'frogs');
	});
});

});
