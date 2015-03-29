module.exports = (function(
	SyncIt,
	SyncItBuffer,
	FakeLocalStorage,
	AsyncLocalStorage,
	localForage,
	SyncItLocalForage,
	getTLIdEncoderDecoder,
	Path_AsyncLocalStorage,
	dontListLocallyDeletedDatakeys,
	syncItLoadAllKeysInDataset,

	SyncItControl,
	EventSourceMonitor,
	SyncLocalStorage
) {

	"use strict";
	var Factory = function(inProduction) {
		this._inProduction = inProduction;
		this._tLIdEncoderDecoder = null;
		this._theLocalStorage = null;
		this._asyncLocalStorage = {};
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

	Factory.prototype.getAsyncLocalStorage = function(name) {
		if (['syncit', 'syncit-seq'].indexOf(name) > -1) {
			throw new Error('The names "syncit" and "syncit-seq" are restricted for internal use');
		}
		return this._getAsyncLocalStorage(name);
	};

	Factory.prototype._getAsyncLocalStorage = function(name) {
		if (!this._asyncLocalStorage.hasOwnProperty(name)) {
			this._asyncLocalStorage[name] = new AsyncLocalStorage(
				this._getTheLocalStorage(),
				name,
				JSON.stringify,
				JSON.parse
			);
		}
		return this._asyncLocalStorage[name];
	};

	Factory.prototype._getPersistance = function(storageType, name) {

		if (storageType == 'localForage') {
			return new Path_AsyncLocalStorage(
				new SyncItLocalForage(
					localForage,
					name,
					JSON.stringify,
					JSON.parse
				),
				this.getTLIdEncoderDecoder()
			);
		}

		return new Path_AsyncLocalStorage(
			this.getAsyncLocalStorage(name),
			this.getTLIdEncoderDecoder()
		);

	};

	Factory.prototype.getSyncIt = function(deviceId) {
		if (this._syncIt) { return this._syncIt; }

		var pathstore = this._getPersistance('localForage', 'siac');

		this._syncIt = new SyncItBuffer(dontListLocallyDeletedDatakeys(new SyncIt(pathstore, deviceId)));

		return this._syncIt;
	};

	Factory.prototype.loadAllKeysInDataset = function(syncIt, dataset, next) {
		syncItLoadAllKeysInDataset(syncIt, dataset, next);
	};

	Factory.prototype.getSyncItControl = function(deviceId, uploadChangeFunction, getEventSourceUrl, conflictResolutionFunction, options) {

		if (this._syncItControl) { return this._syncItControl; }

		var baseUrl = window.location.origin;

		var getEventSourceMonitor = function() {

			var factory = function(urlEncodedDatasets) {

				if (!urlEncodedDatasets.length) {
					throw new Error(
						"getConfiguredSyncItControl -> eventSourceMonitor: " +
						"Was expecting one or more datasets"
					);
				}

				return new window.EventSource(getEventSourceUrl(urlEncodedDatasets));

			};

			return new EventSourceMonitor(factory);

		};

		this._syncItControl = new SyncItControl(
			this.getSyncIt(),
			getEventSourceMonitor(),
			this._getAsyncLocalStorage('syncit-seq'),
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
	require('localforage'),
	require('sync-it/LocalForage'),
	require('get_tlid_encoder_decoder'),
	require('sync-it/Path/AsyncLocalStorage'),
	require('sync-it/dontListLocallyDeletedDatakeys'),
	require('./syncItLoadAllKeysInDataset.js'),

	require('syncit-control/Control'),
	require('eventsource-monitor'),
	require('sync-it/SyncLocalStorage')
));
