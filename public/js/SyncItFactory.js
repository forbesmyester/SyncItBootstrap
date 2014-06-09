module.exports = (function(
	SyncIt,
	SyncItBuffer,
	FakeLocalStorage,
	AsyncLocalStorage,
	getTLIdEncoderDecoder,
	Path_AsyncLocalStorage,
	dontListLocallyDeletedDatakeys,
	syncItLoadAllKeysInDataset,

	SyncItControl,
	EventSourceMonitor,
	SyncLocalStorage,
	req
) {

	"use strict";
	var Factory = function(inProduction) {
		this._inProduction = inProduction;
		this._tLIdEncoderDecoder = null;
		this._theLocalStorage = null;
	};

	Factory.prototype.getTLIdEncoderDecoder = function() {
		if (this._tLIdEncoderDecoder) { return this._tLIdEncoderDecoder; }
		this._tLIdEncoderDecoder = getTLIdEncoderDecoder(new Date(2014, 1, 1, 1, 1, 1, 1).getTime(), 2);
		return this._tLIdEncoderDecoder;
	};

	Factory.prototype._getTheLocalStorage = function() {
		if (this._theLocalStorage) { return this._theLocalStorage; }
		this._theLocalStorage = window.localStorage;
		if (!this._inProduction) {
			this._theLocalStorage = new FakeLocalStorage();
		}
		return this._theLocalStorage;
	};

	Factory.prototype.getSyncIt = function(deviceId) {
		if (this._syncIt) { return this._syncIt; }

		var asyncLocalStorage = new AsyncLocalStorage(
			this._getTheLocalStorage(),
			'syncit',
			JSON.stringify,
			JSON.parse
		);

		var pathstore = new Path_AsyncLocalStorage(
			asyncLocalStorage,
			this.getTLIdEncoderDecoder()
		);

		this._syncIt = new SyncItBuffer(dontListLocallyDeletedDatakeys(new SyncIt(pathstore, deviceId)));

		return this._syncIt;
	};

	Factory.prototype.loadAllKeysInDataset = function(syncIt, dataset, next) {
		syncItLoadAllKeysInDataset(syncIt, dataset, next);
	};

	Factory.prototype.getSyncItControl = function(deviceId, conflictResolutionFunction, options) {

		if (this._syncItControl) { return this._syncItControl; }

		var baseUrl = window.location.origin;

		var getEventSourceMonitor = function() {

			var getUrl = function(datasets) {
				return baseUrl + '/sync/' + deviceId + '?' + datasets;
			};

			var factory = function(urlEncodedDatasets) {

				if (!urlEncodedDatasets.length) {
					throw new Error(
						"getConfiguredSyncItControl -> eventSourceMonitor: " +
						"Was expecting one or more datasets"
					);
				}

				return new window.EventSource(getUrl(urlEncodedDatasets));

			};

			return new EventSourceMonitor(factory);

		};

		var stateConfig = new SyncLocalStorage(
			this._getTheLocalStorage(),
			'syncit-seq',
			JSON.stringify,
			JSON.parse
		);

		var downloadDatasetFunction = function(dataset, fromSeqId, next) {
			req({
				url: baseUrl + '/syncit/sequence/' + dataset + (fromSeqId === null ? '' : '/' + fromSeqId),
				type: 'json',
				method: 'get',
				error: function(e) {
					next(e);
				},
				success: function(data) {
					next(null, data.queueitems, data.seqId);
				}
			});
		};

		if (options && options.hasOwnProperty('downloadDatasetFunction')) {
			downloadDatasetFunction = options.downloadDatasetFunction;
		}

		var uploadChangeFunction = function(queueitem, next) {
			req({
				url: baseUrl + '/syncit/' + deviceId,
				type: 'json',
				method: 'post',
				data: queueitem,
				error: function(xmlHttpRequest) {
					if (xmlHttpRequest.status == 303) {
						return next(null, null);
					}
					next(xmlHttpRequest);
				},
				success: function(resp) {
					next(null, resp.sequence.replace(/.*\//,''));
				}
			});
		};

		var controlAsyncLocalStorage = new AsyncLocalStorage(
			this._getTheLocalStorage(),
			'syncit-seq',
			JSON.stringify,
			JSON.parse
		);

		if (options && options.hasOwnProperty('uploadChangeFunction')) {
			uploadChangeFunction = options.uploadChangeFunction;
		}

		this._syncItControl = new SyncItControl(
			this.getSyncIt(),
			getEventSourceMonitor(),
			controlAsyncLocalStorage,
			uploadChangeFunction,
			conflictResolutionFunction
		);

		return this._syncItControl;

	};

	return Factory;

}(
	require('sync-it/SyncIt'),
	require('sync-it/SyncItBuffer'),
	require('sync-it/FakeLocalStorage'),
	require('sync-it/AsyncLocalStorage'),
	require('get_tlid_encoder_decoder'),
	require('sync-it/Path/AsyncLocalStorage'),
	require('sync-it/dontListLocallyDeletedDatakeys'),
	require('./syncItLoadAllKeysInDataset.js'),

	require('syncit-control/Control'),
	require('eventsource-monitor'),
	require('sync-it/SyncLocalStorage'),
	require('reqwest')
));
