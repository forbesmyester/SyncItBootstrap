/*jshint -W079 */
var fixNoFlightCorsRequestBody = require('../lib/fixNoFlightCorsRequestBody'),
	expect = require('expect.js');

describe('fixNoFlightCorsRequestBody says...',function() {
	"use strict";
	it('can recognise what should have been tranformed if we were not trying very hard to get around the flight',function() {
		var req = {
			body: { '{"o":"update","u":{"$set":{"title":"dd"}},"s":"sb7fFtpSK46N","k":"X6aut49t00","m":"X6auslne00","t":1398030214793,"b":1}': '' },
			zab: ['a']
		};
		fixNoFlightCorsRequestBody(req, {}, function() {
			expect(req).to.eql({
				body: {
					o: 'update',
					u: {"$set":{"title":"dd"}},
					s: "sb7fFtpSK46N",
					k: "X6aut49t00",
					m: "X6auslne00",
					t: 1398030214793,
					b: 1
				},
				zab: ['a']
			});
		});
	});
	it('will not transform given one key not starting as an object',function() {
		var req = {
			body: { 'daf': 'aa' },
			zab: ['a']
		};
		fixNoFlightCorsRequestBody(req, {}, function() {
			expect(Object.getOwnPropertyNames(req.body).length).to.eql(1);
		});
	});
	it('will not transform given one key but not fully valid JSON',function() {
		var req = {
			body: { '{"o":"update","u":{"$set":{"title":"dd}},"s":"sb7fFtpSK46N","k":"X6aut49t00","m":"X6auslne00","t":1398030214793,"b":1}': '' },
			zab: ['a']
		};
		fixNoFlightCorsRequestBody(req, {}, function() {
			expect(Object.getOwnPropertyNames(req.body).length).to.eql(1);
		});
	});
	it('will recognise that multiple keys should be joined with &\'s',function() {
		var req = {
			body: { '{"o":"set","u":{"completed":false,"editing":false,"title":"Bootstrap: Tidy ': '',
  ' Bundle"},"s":"todo-PY3EsGKVEPAi","k":"X9aesnlh00","m":"X7uhfslm00","t":1401231303564,"b":0}': '' },
			zab: ['a']
		};
		fixNoFlightCorsRequestBody(req, {}, function() {
			expect(req.body).to.eql({
				o: "set",
				u: {
					completed: false,
					editing: false,
					title: 'Bootstrap: Tidy & Bundle'
				},
				s: "todo-PY3EsGKVEPAi",
				k: "X9aesnlh00",
				m: "X7uhfslm00",
				t: 1401231303564,
				b: 0
			});
		});
	});
});
