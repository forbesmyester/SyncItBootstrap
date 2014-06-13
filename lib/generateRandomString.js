module.exports = function(length, next) {
	"use strict";
	var value = '';
	var addMore = function() {
		require('crypto').randomBytes(128, function(err, buf) {
			if (err) {
				return next(err);
			}
			value = value + buf.toString('base64').replace(/\//g, '').replace(/\+/g, '');
			if ( value.length < length ) {
				return addMore();
			}
			next(null, value.substr(0, length) );
		});
	};
	addMore();
};

