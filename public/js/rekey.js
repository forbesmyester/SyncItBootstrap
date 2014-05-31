module.exports = (function() {

	"use strict";
	
	return function(keys, values) {
		if (keys.length != values.length) { throw "Keys and Values are different lengthts"; }
		var r = {};
		for (var i=0, l=keys.length; i<l; i++) {
			r[keys[i]] = values[i];
		}
		return r;
	};
	
}());
