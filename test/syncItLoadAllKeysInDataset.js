/*jshint smarttabs:true */
(function (root, factory) {
	
	"use strict";
	
	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('expect.js'),
			require('../public/js/syncItLoadAllKeysInDataset.js')
		);
	} else {
		// AMD. Register as an anonymous module.
		define(
			[
				'../public/js/syncItLoadAllKeysInDataset.js'
			],
			factory.bind(this, expect)
		);
	}
})(this, function (
	expect,
	syncItLoadAllKeysInDataset
) {

// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

describe('syncItLoadAllKeysInDataset',function() {
	
	var syncIt = {
		getDatakeysInDataset: function(ds, next) {
			if (ds === 'x') {
				return next(1);
			}
			if (ds === 'y') {
				return next(0, ['a', 'b', 'd']);
			}
			return next(0, ['a', 'b', 'c']);
		},
		get: function(ds, dk, next) {
			switch(dk) {
				case 'a':
					return next(0, {'let': {'tter': 'a'}});
				case 'b':
					return next(0, {'let': {'tter': 'b'}});
				case 'c':
					return next(0, {'let': {'tter': 'c'}});
			}
			return next(3);
		}
	};
	
	it('will pass on stage 1 errors', function(done) {
		syncItLoadAllKeysInDataset(syncIt, 'x', function(err) {
			expect(err).to.equal(1);
			done();
		});
	});
	
	it('will pass on stage 2 errors', function(done) {
		syncItLoadAllKeysInDataset(syncIt, 'y', function(err) {
			expect(err).to.equal(3);
			done();
		});
	});
	
	it('can work', function(done) {
		syncItLoadAllKeysInDataset(syncIt, 'z', function(err, res) {
			expect(err).to.equal(null);
			expect(res).to.eql(
				{
					a: {'let': {'tter': 'a'}},
					b: {'let': {'tter': 'b'}},
					c: {'let': {'tter': 'c'}}
				}
			);
			done();
		});
	});
	
});

});