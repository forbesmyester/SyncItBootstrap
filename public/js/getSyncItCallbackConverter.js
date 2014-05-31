module.exports = (function() {
	
	"use strict";

	return function(hash, callback, self) {
		return function(err) {
			var args = Array.prototype.slice.call(arguments);
			if (
				!hash.hasOwnProperty('_' + err) || 
				!hash['_' + err].hasOwnProperty('err')
			) {
				return callback.apply(self, args);
			}
			if (!hash['_' + err].hasOwnProperty('res')) {
				return callback.apply(self, [hash['_' + err].err].concat(args.slice(1)));
			}
			return callback.apply(self, [hash['_' + err].err].concat(hash['_' + err].res));
		};
	};
	
}());
