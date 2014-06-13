module.exports = (function(objectFilter, arrayMap, objectKeys) {

	"use strict";

	var letterTrim = function(str) {
		return str.replace(/^[^0-9]*/, '').replace(/[^0-9]*$/, '');
	};

	var breakIntoParts = function(str) {
		return arrayMap(str.split('.'), letterTrim);
	};

	var partSort = function(a, b) {
		var aParts = breakIntoParts(a),
			bParts = breakIntoParts(b),
			i;

		if (bParts.length != aParts.length) {
			return bParts.length - aParts.length;
		}

		for (i=0; i<bParts.length; i++) {
			if (parseInt(aParts[i], 10) != parseInt(bParts[i], 10)) {
				return parseInt(bParts[i], 10) - parseInt(aParts[i], 10);
			}
		}

		return 0;
	};

	var objectSort = function(ob) {
		var ks = objectKeys(ob).sort(partSort),
			r = {},
			i, l;

		for (i=0, l=ks.length; i<l; i++) {
			r[ks[i]] = ob[ks[i]];
		}

		return r;
	};

	return function(versionData, fromVersion) {

		if (fromVersion === null) { return {}; }

		return objectSort(objectFilter(versionData, function(changes, version) {
			return (partSort(fromVersion, version) > 0);
		}));
	};

}(require('mout/object/filter'), require('mout/array/map'), require('mout/object/keys')));
