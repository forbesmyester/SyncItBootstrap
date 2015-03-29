module.exports = (function(when, syncItCallbackToPromise, arrayMap, rekey) {
	
	"use strict";
	
	return function(syncIt, dataset, next) {
		
		syncIt.getDatakeysInDataset(dataset, function(err, datakeys) {
			if (err !== 0) {
				return next(err);
			}
			var promises = arrayMap(datakeys, function(datakey) {
				return syncItCallbackToPromise(
					syncIt,
					syncIt.get,
					[0],
					dataset,
					datakey
				);
			});
			when.all(promises).done(
				function(data) {
					next(null, rekey(datakeys, data));
				},
				function(err) {
					next(err);
				}
			);
		});
	};
	
}(require('when'), require('sync-it/syncItCallbackToPromise'), require('mout/array/map'), require('./rekey')));
