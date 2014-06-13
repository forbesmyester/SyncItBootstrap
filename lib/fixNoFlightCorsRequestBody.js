var getNoFlightCorsRequestBody = function(currentBody) {
	"use strict";
	if (typeof currentBody !== 'object') { return currentBody; }
	var keys = Object.getOwnPropertyNames(currentBody);
	if (currentBody[keys[0]].substring(0, 1) == '{') { return currentBody; }
	try {
		return JSON.parse(keys.join('&'));
	} catch (e) {
		return currentBody;
	}
};

module.exports = function(req, res, next) {
	"use strict";
	req.body = getNoFlightCorsRequestBody(req.body);
	next();
};
