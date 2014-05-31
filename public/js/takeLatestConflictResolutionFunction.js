module.exports = function(
	dataset,
	datakey,
	storedrecord,
	localChanges,
	remoteChanges,
	resolved
) {
	"use strict";

	var lastRemoteTs = null,
		lastLocalTs = null;
	
	remoteChanges.map(function(c) { lastRemoteTs = c.t; });
	localChanges.map(function(c) { lastLocalTs = c.t; });
	
	if (lastLocalTs > lastRemoteTs) {
		return resolved(true, localChanges);
	}
	
	return resolved(true,[]);
};
