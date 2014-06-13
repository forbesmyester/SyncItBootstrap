/*jshint -W079 */
var generateRandomString = require('../lib/generateRandomString'),
	expect = require('expect.js');
console.log(generateRandomString);

describe('generateRandomString says...',function() {
	"use strict";
	it('will generate strings of different lengths',function(done) {
		generateRandomString(8,function(err,ap) {
			expect(ap.length).to.equal(8);
			expect(ap).to.match(/^[A-Za-z0-9]+$/);
			generateRandomString(16,function(err,ap) {
				expect(ap.length).to.equal(16);
				expect(ap).to.match(/^[A-Za-z0-9]+$/);
				generateRandomString(22,function(err,ap) {
					expect(ap.length).to.equal(22);
					expect(ap).to.match(/^[A-Za-z0-9]+$/);
					done();
				});
			});
		});
	});
});
