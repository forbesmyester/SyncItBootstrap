/**
 * Module dependencies.
 */
var appConfig = {
	http: { port: 3000 },
	databases: {
		main: {
			port: 27017,
			host: '192.168.24.11',
			name: 'syncitbootstrap'
		}
	},
	syncit: {
		data_collection: 'syncit'
	},
	persistData: true,
};

var express = require('express'),
	path = require('path'),
	app = express(),
	browserify = require('browserify-middleware'),
	mongoskin = require('mongoskin'),
	SseCommunication = require('./lib/SseCommunication/Simple'),
	ReferenceServer = require('syncit-server/ReferenceServer'),
	ServerPersistMongodb = require('syncit-server/ServerPersist/Mongodb'),
	ServerPersistMemoryAsync = require('syncit-server/ServerPersist/MemoryAsync'),
	http = require('http'),
	sseCommunication = new SseCommunication(),
	referenceServer = (function() {

		"use strict";

		if (!appConfig.persistData) {
			return new ReferenceServer(
				function(req) { return req.params.deviceId; },
				new ServerPersistMemoryAsync(),
				sseCommunication
			);
		}

		var mongoskinConnection = mongoskin.db(
				'mongodb://' +
					appConfig.databases.main.host + ':' +
					appConfig.databases.main.port + '/' +
					appConfig.databases.main.name,
				{w:true}
			),
			dbPersistance = new ServerPersistMongodb(
				function(v) { return JSON.parse(JSON.stringify(v)); },
				mongoskinConnection,
				mongoskin.ObjectID,
				appConfig.syncit.data_collection,
				function() {}
			);

		return new ReferenceServer(
			function(req) { return req.params.deviceId; },
			dbPersistance,
			sseCommunication
		);

	}());

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

	app.get('/js/App.js', browserify('./public/js/App.js'));

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
	res.render('front', {persistData: appConfig.persistData});
});

app.post('/syncit/:deviceId', function(req, res, next) {
	"use strict";
	referenceServer.push(req, function(err, status, data) {
		if (err) { return next(err); }
		res.json(getStatusCode(status), data);
	});
});

var isDatasetInvalidOrAlreadyUsed = function(dataset, next) {
	"use strict";
	if (dataset.match(/^[0-9]/)) { return next(null, true); }
	dbPersistance.getQueueitems(dataset, null, function(err, status, queueitems) {
		if (err) { return next(err); }
		next(null, queueitems.length > 0 ? true : false);
	});
};

app.get('/sync/:deviceId', referenceServer.sync.bind(referenceServer));

var serverHttp = null;

serverHttp = http.createServer(app);
serverHttp.listen(appConfig.http.port, function(){
	"use strict";
	/* global console: false */
	console.log('Express HTTP server listening on port ' + appConfig.http.port);
});
