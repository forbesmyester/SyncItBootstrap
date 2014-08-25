module.exports = function(cloneDataFunc) {
	return function(
		dataset,
		datakey,
		storedrecord,
		localChanges,
		remoteChanges,
		resolved
	) {
		"use strict";

		var lastRemoteTs = null,
			lastLocalTs = null,
			titleEdited = false;
		
		var hasTitleBeenEdited = function(change) {
			if (
				change.hasOwnProperty('u') &&
				change.u.hasOwnProperty('$set') &&
				change.u.$set.hasOwnProperty('title')
			) {
				titleEdited = true;
			}
		};

		remoteChanges.map(hasTitleBeenEdited);
		localChanges.map(hasTitleBeenEdited);
		
		if (titleEdited) {
			localChanges.unshift({s: dataset, k: datakey, o: 'set', u: storedrecord.i });
			cloneDataFunc(localChanges);
			return resolved(true,[]);
		}

		remoteChanges.map(function(c) { lastRemoteTs = c.t; });
		localChanges.map(function(c) { lastLocalTs = c.t; });
		
		if (lastLocalTs > lastRemoteTs) {
			return resolved(true, localChanges);
		}

		return resolved(true,[]);
	};
};
