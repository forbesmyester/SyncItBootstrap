module.exports = function(generateRandomString, doesDatasetAlreadyExist, next) {
	"use strict";
	var attempt = function() {
		generateRandomString(function(e, possibleListId) {
			if (e) { return next(e); }
			doesDatasetAlreadyExist(possibleListId, function(e, isExisting) {
				if (e) { return next(e); }
				if (!isExisting) { return next(null, possibleListId); }
				attempt();
			});
		});
	};
	attempt();
};
