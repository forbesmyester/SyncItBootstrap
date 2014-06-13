/*jshint smarttabs:true */
(function (root, factory) {
	
	"use strict";
	
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../lib/generateNewDatasetName')
		);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(
			[
				'../lib/generateNewDatasetName'
			],
			factory.bind(this, expect)
		);
	} else {
		throw "Not Supported";
	}
}(this, function (
	expect,
	generateNewDatasetName
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('generateNewDatasetName',function() {
	it('can generate new list ids', function(done) {

		var attempt = 0;
		var generateRandomString = function(next) {
			return next(null, 'a' + (++attempt));
		};

		var doesDatasetAlreadyExist = function(listId, next) {
			return next(null, (listId != 'a2'));
		};
		
		generateNewDatasetName(generateRandomString, doesDatasetAlreadyExist, function(e, newListId) {
			expect(e).to.equal(null);
			expect(newListId).to.equal('a2');
			done();
		});

	});
});
	
}));
