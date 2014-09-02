module.exports = (function (
	React, TodoListList,
	RenameListPopup, OkCancelPopup,
	TodoList, Constants,
	syncItLoadAllKeysInDataset, rekey,
	getDeviceId, SyncItFactory,
	objectMap, routerLib,
	browserLights, UpdateNotifierPopup,
	getChangeLog /*, FakeLocalStorage */,
	LoadingPopup, MailtoPopup,
	todomvcConflictResolutionFunction, req,
	whenCallback, when,
	arrayMap, syncItCallbackToPromise
){

/* global window: false, document: false */

"use strict";

var

	// Conflict resolution function needs this...
	todoList = null,

	// Builds manipulations to send to the UI layer.
	buildManipultionJson = function(operation, location, value) {
		var sub = {};
		sub['$' + operation] = {};
		sub['$' + operation][location] = value;
		return sub;
	},

	// Whether or not to persist data in LocalStorage, though this is fed through
	// the jade template from the appConfig variable right at the top of the
	// servers app.js
	persistData = parseInt(document.body.dataset.persistData, 10) ? true : false,

	// Whether we are in production or not. This will switch to using HTTPS for
	// API connections.
	inProduction = (function() {
		/* global document: false */
		return parseInt(document.body.dataset.inProduction, 10) ? true : false;
	}()),

	// This is the URL that is used for connections, in this case we are
	// going to do the API stuff across HTTPS but still keep the UI as
	// HTTP, so we're going to switch protocols here.
	baseUrl = (function() {
		/* global window: false */
		if (!inProduction) { return ''; }
		return 'https://' + window.location.hostname;
	}()),

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

	// This function will be used for uploading individual queueitems
	uploadChangeFunction = function(queueitem, next) {
		req({
			url: baseUrl + '/syncit/' + deviceId,
			type: 'json',
			method: 'post',
			crossOrigin: true,
			data: JSON.stringify(queueitem),
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
	},

	// This will take a url encoded set of datasets in the form
	// dataset[datasetname]=sequenceId&dataset[datasetname]=sequenceid
	// and transform it into a URL.
	getEventSourceUrl = function(urlEncodedDatasets) {
		return baseUrl + '/sync/' + deviceId + '?' + urlEncodedDatasets;
	},

	// Is fed an object with the key being a modifier, this will cause clone on
	// title edits
	editCloneFunc = function(changesToClone) {

		var processCallback = function(err, s, k, q, storedInformation) {
			if (err) { throw "SyncIt Error: " + err; }
			todoList.manip(
				false,
				buildManipultionJson(
					'set',
					'todos.' + k,
					storedInformation.i
				),
				function() {}
			);
		};

		var func = null,
			datakey = syncItFactory.getTLIdEncoderDecoder().encode();

		for (var i=0; i<changesToClone.length; i++) {

			func = syncIt[changesToClone[i].o].bind(syncIt);
			
			func(
				changesToClone[i].s,
				datakey,
				changesToClone[i].u,
				processCallback
			);
		}
	},

	// SyncItControl knows about the above instance of SyncIt and also knows
	// how to communicate with the bundled Node.JS backend through EventSource,
	// GET and POST HTTP requests. It makes using SyncIt easy but it is not
	// coupled to either. Implementing a Polling or Sockets.io version should
	// be a relatively simple job.
	syncItControl = syncItFactory.getSyncItControl(
		deviceId,
		uploadChangeFunction,
		getEventSourceUrl,
		todomvcConflictResolutionFunction(editCloneFunc)
	),

	// Get a storage area that we can use for the app.
	asyncLocalStorage = syncItFactory.getAsyncLocalStorage('syncittodomvc'),

	// For getting the dataset name we are just going to take whatever is after the
	// "#" in the URL. If there is none we set it to '' and it will disable most
	// of the functionality.
	dataset = window.location.hash.length ? window.location.hash.substr(1) : '',

	// Compares the version that the user was registered as having with the
	// one we have just loaded and displays a change log for the the user.
	changesForUser = (function() {
		var versionData = {};

		return getChangeLog(
			versionData,
			window.localStorage.getItem('_version')
		);
	}()),

	// React components...
	okCancelPopup = new OkCancelPopup(),
	loadingPopup = new LoadingPopup(),
	updateNotifierPopup = new UpdateNotifierPopup()
	;

(function() {
	/* global window: false */

	var onUpdateReady = function() {
		okCancelPopup.setProps({
			onCancel: function() {},
			onOk: function() {
				window.location.reload();
			}
		});
		okCancelPopup.show(
			'A new version of SyncItTodoMvc has been downloaded and is ready to use. What do you want to do?',
			'I want to update to the new version',
			'Continue working'
		);
	};

	window.applicationCache.addEventListener('updateready', onUpdateReady);
	if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
		onUpdateReady();
	}

}());

if (Object.getOwnPropertyNames(changesForUser).length) {
	updateNotifierPopup.setProps({
		onOk: function() {
			window.localStorage.setItem(
				'_version',
				Object.getOwnPropertyNames(changesForUser).slice(-1)
			);
		}
	});
	updateNotifierPopup.show(
		'New version downloaded, the changes are shown below',
		changesForUser,
		'Thanks for letting me know!'
	);
}

React.renderComponent(
	okCancelPopup,
	(function() {
		/* global document: false */
		return document.getElementById('okCancelPopup');
	}())
);

React.renderComponent(
	loadingPopup,
	(function() {
		/* global document: false */
		return document.getElementById('loadingPopup');
	}())
);

React.renderComponent(
	updateNotifierPopup,
	(function() {
		/* global document: false */
		return document.getElementById('updateNotifierPopup');
	}())
);


// Most of SyncItControl's code is organised like a giant state machine, this
// made it easier for me to write but it will also give you the ability to have
// some kind of knowledge about what it is doing. Note that it does not
// reconnect automatically. For more documentation see
// https://github.com/forbesmyester/SyncItControl
syncItControl.on('entered-state', function(state) {
	if (['DISCONNECTED', 'UPLOAD_ERROR'].indexOf(state) > -1) {
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

var frontApp = function() {
	var renameListPopup = new RenameListPopup(),
		mailtoPopup = new MailtoPopup(),
		lists = {},
		todoListList
		;

	React.renderComponent(
		renameListPopup,
		(function() {
			/* global document: false */
			return document.getElementById('renameListPopup');
		}())
	);

	React.renderComponent(
		mailtoPopup,
		(function() {
			/* global document: false */
			return document.getElementById('mailtoPopup');
		}())
	);

	syncItCallbackToPromise(
		syncItControl,
		syncItControl.getDatasetNamesFromSequenceData,
		[Constants.SyncIt.Error.OK]
	).then(
		function(datasets) {
			return when.all(
				arrayMap(datasets, function(dataset) {
					return whenCallback.call(
						asyncLocalStorage.getItem.bind(asyncLocalStorage),
						'_name_' + dataset
					);
				})
			).then(function(names) {
				return rekey(datasets, names);
			});
		}
	).done(
		function(newLists) {
			lists = newLists;
			todoListList.setProps({lists: lists});
		},
		function(err) {
			handleErr(err);
		}
	);

	todoListList = new TodoListList({
		onDeleteClick: function(dataset) {
			okCancelPopup.setProps({
				onCancel: function() {},
				onOk: function() {
					syncItControl.purge(dataset, function(err) {
						if (err) {
							(function() {
								/* global alert: false */
								return alert("Error deleting todo list");
							}());
						}
						delete lists[dataset];
						todoListList.setProps({ lists: lists });
						asyncLocalStorage.removeItem('_name_' + dataset, function() { });
					});
				}
			});
			okCancelPopup.show(
				'Are you sure you want to delete the ' + lists[dataset] + ' todo list?',
				'Yes I do',
				'I wish to keep it'
			);
		},
		onMailtoClick: function(dataset) {
			mailtoPopup.show(
				'Send this list to someone else...',
				'Send the list',
				'Cancel sending',
				'A new list!',
				'Click on the URL: {URL}',
				window.location.protocol +
					'//' +
					window.location.hostname + 
					'/list#/' +
					dataset
			);
		},
		onRenameClick: function(dataset) {
			renameListPopup.setProps({
				onOk: function(newName) {
					asyncLocalStorage.setItem('_name_' + dataset, newName, function() {
						lists[dataset] = newName;
						todoListList.setProps({ lists: lists });
					});
				}
			});
			renameListPopup.show(dataset, lists[dataset]);
		},
		lists: lists,
	});

	React.renderComponent(
		todoListList,
		(function() {
			/* global document: false */
			return document.getElementById('lists');
		}())
	);

};

var listApp = function() {
	var currentDataset = false,
		currentState = 'reset';


	var todoToggle = function(todo, todoKey, force) {
		var v = !todo.completed;
		if (force !== undefined) {
			v = force;
		}
		syncIt.update(
			currentDataset,
			todoKey,
			buildManipultionJson('set', 'completed', v),
			function(err) {
				if (err !== Constants.SyncIt.Error.OK) {
					throw new Error("App.todoToggle -> syncIt.update " +
						"responded with error code " + err);
				}
				todoList.manip(
					false,
					buildManipultionJson(
						'set',
						'todos.' + todoKey + '.completed',
						v
					),
					function() {}
				);
			}
		);
	};

	var todoDestroy = function(todo, todoKey) {
		syncIt.remove(
			currentDataset,
			todoKey,
			function(err, d, k) {
				if (err) { throw "SyncIt Error: " + err; }
				todoList.manip(
					false,
					buildManipultionJson('unset', 'todos.' + k, 1),
					function() {}
				);
			}
		);
	};

	syncIt.listenForFed(function(dataset, datakey, queueitem, newStoreRecord) {
		todoList.manip(
			false,
			buildManipultionJson(
				queueitem.o === 'remove' ? 'unset' : 'set',
				'todos.' + datakey,
				queueitem.o === 'remove' ? 1 : newStoreRecord.i
			),
			function() {}
		);
	});

	syncItControl.on('downloaded', function(downloadedCount) {
		loadingPopup.show('Applying Changes...', downloadedCount);
	});

	syncIt.on('fed', loadingPopup.increment);

	syncItControl.on('entered-state', function(state) {

		currentState = state;

		var colors = {
			'DISCONNECTED': 'white',
			'RESET': 'black',
			'ANALYZE': 'orange',
			'MISSING_DATASET': 'blue',
			'ALL_DATASET': 'blue',
			'ADDING_DATASET': 'pink',
			'PUSHING_DISCOVERY': 'grey',
			'PUSHING': 'green',
			'SYNCHED': 'lightgreen',
			'ERROR': 'red'
		};

		browserLights(colors[state]);

		/* global setTimeout: false */
		if (state === 'disconnected') {
			setTimeout(function() {
				syncItControl.connect();
			}, 10000);
		}

		if (!state.match(/downloading$/)) {
			loadingPopup.hide();
		}
	});
		
	todoList = new TodoList({
		nowShowing: Constants.ALL_TODOS,
		todos: [],
		onTodoToggle: function(todo, todoKey) {
			todoToggle(todo, todoKey);
		},
		onNewTodoRequest: function(newTodoData) {
			syncIt.set(
				currentDataset,
				syncItFactory.getTLIdEncoderDecoder().encode(),
				{ completed: false, editing: false, title: newTodoData.title},
				function(err, d, k, q, storedInformation) {
					if (err) { throw "SyncIt Error: " + err; }
					todoList.manip(
						false,
						buildManipultionJson(
							'set',
							'todos.' + k,
							storedInformation.i
						),
						function() {}
					);
				}
			);
		},
		onTodoUpdateTitle: function(todo, todoKey, title, next) {
			syncIt.update(
				currentDataset,
				todoKey,
				buildManipultionJson('set', 'title', title),
				function(err, d, k) {
					if (err) { throw "SyncIt Error: " + err; }
					if (err !== Constants.SyncIt.Error.OK) {
						if (err !== Constants.SyncIt.Error.OK) {
							throw new Error("App.todoToggle -> syncIt.update " +
								"responded with error code " + err);
						}
					}
					todoList.manip(
						false,
						buildManipultionJson('set', 'todos.' + k + '.title', title),
						function() {}
					);
					next();
				}
			);
		},
		onMarkAllTodo: function(checked) {
			syncItLoadAllKeysInDataset(syncIt, currentDataset, function(err, data) {
				if (err) { throw "Could not load all data in " + currentDataset; }
				objectMap(data, function(v, k) {
					todoToggle(v, k, checked);
				});
			});
		},
		onTodoDestroy: todoDestroy,
		onClearCompleted: function() {
			syncItLoadAllKeysInDataset(syncIt, currentDataset, function(err, data) {
				if (err) { throw "Could not load all data in " + currentDataset; }
				objectMap(data, function(v, k) {
					if (v.completed) {
						todoDestroy(v, k);
					}
				});
			});
		}
	});

	React.renderComponent(
		todoList,
		(function() {
			/* global document: false */
			return document.getElementById('todoapp');
		}())
	);

	var transitionToDataset = function(dataset) {
		currentDataset = false;
		todoList.setProps({
			dataset: false
		});
		
		syncItControl.connect();
		syncItControl.addDatasets([dataset], function() {
			syncItLoadAllKeysInDataset(syncIt, dataset, function(err, data) {
				if (err) { throw "Could not load all data in " + dataset; }
				currentDataset = dataset;
				todoList.setProps({dataset: dataset, todos: data});
			});
		});

	};

	var router = routerLib.Router({
		'/': function() {
				window.location = '/';
			},
		'/:dataset': function(dataset) {
				todoList.setState({nowShowing: Constants.ALL_TODOS});
				transitionToDataset(dataset);
			},
		'/:dataset/active': function(dataset) {
				todoList.setState({nowShowing: Constants.ACTIVE_TODOS});
				transitionToDataset(dataset);
			},
		'/:dataset/completed': function(dataset) {
				todoList.setState({nowShowing: Constants.COMPLETED_TODOS});
				transitionToDataset(dataset);
			}
	});

	router.init();
	router.handler();
};

return { list: listApp, front: frontApp };

}(
	React, require('../jsx/TodoListList'),
	require('../jsx/RenameListPopup'), require('../jsx/OkCancelPopup'),
	require('../jsx/TodoList'), require('./Constants'),
	require('./syncItLoadAllKeysInDataset'), require('rekey'),
	require('./getDeviceId'), require('./SyncItFactory'),
	require('mout/object/map'), require('director/build/director.js'),
	require('browser-lights'), require('../jsx/UpdateNotifierPopup'),
	require('./getChangeLog'), /* require('syncit/FakeLocalStorage'), */
	require('../jsx/LoadingPopup'), require('../jsx/MailtoPopup'),
	require('./todomvcConflictResolutionFunction'), require('reqwest'),
	require('when/callbacks'), require('when'),
	require('mout/array/map'), require('sync-it/syncItCallbackToPromise'),
	require('domready')

));
