/**
 * Module dependencies.
 */
var express = require('express'),
	path = require('path'),
	app = express(),
	fs = require('fs'),
	appConfig = require('ini').parse(fs.readFileSync('./config.ini', 'utf-8')),
	browserify = require('browserify-middleware'),
	mongoskin = require('mongoskin'),
	SseCommunication = require('sse-communication/Simple'),
	ReferenceServer = require('syncit-server/ReferenceServer'),
	syncItServerPersist = (function() {
		"use strict";

		var ServerPersistMongodb = require('syncit-server/ServerPersist/Mongodb'),
			ServerPersistMemoryAsync = require('syncit-server/ServerPersist/MemoryAsync');

		if (!parseInt(appConfig.syncit.persist_data, 10)) {
			return new ServerPersistMemoryAsync();
		}

		var mongoskinConnection = mongoskin.db(
			'mongodb://' +
				appConfig.databases.main.host + ':' +
				appConfig.databases.main.port + '/' +
				appConfig.databases.main.name,
			{w:true}
		);

		return new ServerPersistMongodb(
			function(v) { return JSON.parse(JSON.stringify(v)); },
			mongoskinConnection,
			mongoskin.ObjectID,
			appConfig.syncit.data_collection,
			function() {}
		);
	}()),
	http = require('http'),
	sseCommunication = new SseCommunication(),
	setDeviceIdMiddleware = function(req, res, next) {
		"use strict";
		req.deviceId = req.params.deviceId;
		next(null);
	},
	referenceServer = new ReferenceServer(
		function(req) {
			"use strict";
			return req.deviceId;
		},
		syncItServerPersist,
		sseCommunication
	);

// all environments
(function(mode) {
	"use strict";
	/* global __dirname: false */
	app.set('port', appConfig.http.port);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);

	if ( mode !== 'production') {
		app.get('/js/App.js', browserify('./public/js/App.js'));
	}

	app.use(express.static(path.join(__dirname, 'public')));

}(app.get('env')));

(function() {
	"use strict";
	/* global console: false */
	if ('development' == app.get('env')) {
		console.log("DEVELOPMENT MODE");
		app.use(express.errorHandler());
	}
}());

var statusCodesObj = (function(data) {
	"use strict";
	var oData = {};
	for (var i=0, l=data.length; i<l; i++) {
		oData[
			data[i].description.toLowerCase().replace(/[^a-z]/,'_')
		] = data[i].status;
	}
	return oData;
}(require('./res/http_status_codes.js')));

var getStatusCode = function(status) {
	"use strict";
	if (!statusCodesObj.hasOwnProperty(status)) {
		throw "Could not find status code for status '" + status + "'";
	}
	return statusCodesObj[status];
};

var getQueueitemSequence = function(req, res, next) {
	"use strict";
	referenceServer.getQueueitems(
		req,
		function(err, status, data) {
			if (err) { return next(err); }
			res.json(getStatusCode(status), data);
		}
	);
};

app.get('/syncit/sequence/:s/:seqId', getQueueitemSequence);
app.get('/syncit/sequence/:s', getQueueitemSequence);
app.get('/syncit/change/:s/:k/:v', function(req, res, next) {
	"use strict";
	referenceServer.getDatasetDatakeyVersion(
		req,
		function(err, status, data) {
			if (err) { return next(err); }
			res.json(getStatusCode(status), data);
		}
	);
});

app.get('/', function(req, res) {
	"use strict";
	res.render('front', {
		production: ( app.get('env') === 'production' ? true : false),
		persistData: parseInt(appConfig.syncit.persist_data, 10) ? true : false
	});
});

app.post('/syncit/:deviceId', setDeviceIdMiddleware, function(req, res, next) {
	"use strict";
	referenceServer.push(req, function(err, status, data) {
		if (err) { return next(err); }
		res.json(getStatusCode(status), data);
	});
});

app.get(
	'/sync/:deviceId',
	setDeviceIdMiddleware,
	referenceServer.sync.bind(referenceServer),
	function(req, res, next) {
		"use strict";
		referenceServer.getMultiQueueitems(req, function(err, status, data) {
			if (err) { return next(err); }
			if (status !== 'ok') {
				return res.write(SseCommunication.formatMessage(
					'status-information', status
				));
			}
			res.write(SseCommunication.formatMessage('download', data));
		});
	}
);

referenceServer.listenForFed(function(seqId, dataset, datakey, queueitem, newValue) {
	"use strict";
	var message =
		"> The data stored at `" + dataset + "." + datakey + "` has changed to:\n>\n" +
		">     " + JSON.stringify(newValue) + "\n>\n" +
		"> This change occured because the following queueitem was applied:\n>\n" +
		">     " + JSON.stringify(queueitem) + "\n>\n";
	/* global console: false */
	console.log(message);
});

var serverHttp = null;

serverHttp = http.createServer(app);
serverHttp.listen(appConfig.http.port, function(){
	"use strict";
	/* global console: false */
	console.log('Express HTTP server listening on port ' + appConfig.http.port);
});
