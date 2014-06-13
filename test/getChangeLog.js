/*jshint smarttabs:true */
(function (root, factory) {

	"use strict";

	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../public/js/getChangeLog.js')
		);
	} else {
		// AMD. Register as an anonymous module.
		define(
			[
				'../public/js/getChangeLog.js'
			],
			factory.bind(this, expect)
		);
	}
})(this, function (
	expect,
	getChangeLog
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('getChangeLog',function() {

	var versions = {
		'v0.12.9': ['c', 2],
		'v0.3.2': ['a', 4],
		'v1.2.4': ['d', 1],
		'v0.12.6': ['b', 3]
	};

	it('will get from null version', function() {
		expect(getChangeLog(versions, null)).to.eql({});
	});

	it('will get from a version', function() {
		var expected = {
			'v0.12.9': ['c', 2],
			'v1.2.4': ['d', 1]
		};
		expect(getChangeLog(versions, '0.12.7')).to.eql(expected);
		expect(getChangeLog(versions, 'v0.12.7')).to.eql(expected);
	});

});

});
