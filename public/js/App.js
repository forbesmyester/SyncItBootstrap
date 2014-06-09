module.exports = (function (
	$,
	takeLatestConflictResolutionFunction,
	getDeviceId,
	SyncItFactory
){

/* global window: false, document: false */

"use strict";

var

	// Whether or not to persist data in LocalStorage, though this is fed through
	// the jade template from the appConfig variable right at the top of the
	// servers app.js
	persistData = parseInt(document.body.dataset.persistData, 10) ? true : false,

	// This is a Factory for all things SyncIt.
	syncItFactory = new SyncItFactory(persistData),

	// The first parameter of this function should generate completely unique
	// Ids for the whole system as it should identify a unique user/device
	// combination. Therefore it probably should come from the backend of your
	// system... right now we're just hoping to be lucky!
	deviceId = getDeviceId(
		syncItFactory.getTLIdEncoderDecoder().encode,
		window.localStorage
	),

	// SyncIt is the part which runs completely locally and is basically an
	// asynchronous, version controlled LocalStorage. For more details see
	// the documentation at https://github.com/forbesmyester
	syncIt = syncItFactory.getSyncIt(deviceId),

	// SyncItControl knows about the above instance of SyncIt and also knows
	// how to communicate with the bundled Node.JS backend through EventSource,
	// GET and POST HTTP requests. It makes using SyncIt easy but it is not
	// coupled to either. Implementing a Polling or Sockets.io version should
	// be a relatively simple job.
	syncItControl = syncItFactory.getSyncItControl(
		deviceId,
		takeLatestConflictResolutionFunction
	),

	// For getting the dataset name we are just going to take whatever is after the
	// "#" in the URL. If there is none we set it to '' and it will disable most
	// of the functionality.
	dataset = window.location.hash.length ? window.location.hash.substr(1) : '';

// Most of SyncItControl's code is organised like a giant state machine, this
// made it easier for me to write but it will also give you the ability to have
// some kind of knowledge about what it is doing. Note that it does not
// reconnect automatically. For more documentation see
// https://github.com/forbesmyester/SyncItControl
syncItControl.on('entered-state', function(state) {
	if (state === 'DISCONNECTED') {
		setTimeout(function() {
			syncItControl.connect();
		}, 10000);
	}
});

// Yeh yeh.
var handleErr = function(err) {
	/* global alert: false */
	alert("An Error " + err + " occurred.");
};

// Given a datakey and a name (of an item) it will paint that item onto the
// screen. It probably should have already been added to SyncIt at that point.
var addItem = function(datakey, name) {
	var a = $('<a>').attr('href', '#').attr('class', 'remove-item').text('[remove]');
	var li = $('<li>').text(name + ' ').attr('id', 'item-' + datakey);
	li.append(a);
	$('#list').append(li);
};

// Given a datakey, it will remove that item from the screen.
var removeItem = function(datakey) {
	$('#' + 'item-' + datakey).remove();
};

// There is a list of all known lists on screen in the `#datasets` element
// (I am using SyncIt terminology here)... This will redraw that list.
var refreshListList = function() {
	var $datasets = $('#datasets');
	$datasets.html('');
	syncIt.getDatasetNames(function(err, datasets) {
		if (dataset.length && (datasets.indexOf(dataset) === -1)) {
			datasets.push(dataset);
		}
		$datasets.append($.map(datasets, function(name) {
			var a = $('<a>').attr('href', '#' + name).text(name);
			var s = $('<span>');
			s.append('[');
			s.append(a);
			s.append(']');
			return s;
		}));
	});
};

// Given a name of a dataset, load all the data from SyncIt and completely
// redraw the screen.
var loadDataset = function(newDataset) {
	dataset = newDataset;
	refreshListList();
	window.location.href = window.location.href.replace(/#.*/, '') + '#' + dataset;
	syncItControl.addDatasets([dataset]);
	syncItControl.connect();
	$('#addItemForm').show();
	$('#list').html('');
	syncItFactory.loadAllKeysInDataset(syncIt, dataset, function(err, syncItData) {
		for (var k in syncItData) {
			if (syncItData.hasOwnProperty(k)) {
				addItem(k, syncItData[k].name);
			}
		}
	});
};

// User wants a new list, generate a new dataset name, replace the URL bars
// hash and then use loadDataset to refresh the whole screen.
$('#newList').bind('click', function(evt) {
	evt.preventDefault();
	loadDataset(syncItFactory.getTLIdEncoderDecoder().encode());
});

// Clicking on remove next to an item (items are stored in Datakeys) will fire
// a syncIt.remove() call, this will mark the item as deleted and remove it
// from the screen. The item will be really deleted when SyncItControl knows
// it's been uploaded.
$('#list').delegate('.remove-item', 'click', function(evt) {
	evt.preventDefault();
	var datakey = $(evt.target).parent().attr('id').replace(/^.*\-/,'');
	syncIt.remove(dataset, datakey, function(err) {
		if (err) { return handleErr(err); }
		removeItem(datakey);
	});
});

// The form which is used for adding items will call syncIt.set with a Dataset
// and a new Datakey. Once that is processed the item will be added to the
// screen and the input emptied, ready for adding another one.
$('#addItemForm').bind('submit', function(evt) {
	evt.preventDefault();
	syncIt.set(dataset, syncItFactory.getTLIdEncoderDecoder().encode(), { name: $('#item').val() }, function(err, dataset, datakey, queueitem) {
		if (err) { return handleErr(err); }
		addItem(datakey, queueitem.u.name);
	});
	$('#item').val('');
});

// Clicking a dataset, let the normal event flow through, which will change the
// URL bar but also go and load the new data.
$('#datasets').delegate('a', 'click', function(evt) {
	loadDataset($(evt.target).attr('href').substr(1));
});

// If data arrives from another client, SyncItControl will automatically "feed"
// it into SyncIt and use the conflict resolution function (
// takeLatestConflictResolutionFunction) if neccessary. Once all this is done
// the SyncIt.listenForFed()'s callback will be fired and in this case we will
// update the screen.
syncIt.listenForFed(function(qDataset, qDatakey, queueitem /*, newStoreRecord */) {

	// It is perfectly possible that we might be monitoring multiple datasets, so
	// we need to make sure that we don't draw things on the screen that should
	// not be there.
	if (qDataset !== dataset) {
		return false;
	}

	// If the operation was remove, then remove it.
	if (queueitem.o === 'remove') {
		return removeItem(qDatakey);
	}

	// otherwise add it.
	addItem(qDatakey, queueitem.u.name);
});

syncItControl.on('entered-state', function(state) {
	// console.log("STATE: " + state);
});

// If we have a dataset load it, otherwise just give a list of datasets and the
// opportunity to create a new one.
if (dataset) {
	loadDataset(dataset);
} else {
	refreshListList();
}

}(
	$,
	require('./takeLatestConflictResolutionFunction'),
	require('./getDeviceId'),
	require('./SyncItFactory')
));
