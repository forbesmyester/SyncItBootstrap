/**
 * Module dependencies.
 */
var express = require('express'),
	path = require('path'),
	app = express(),
	generateNewDatasetName = require('./lib/generateNewDatasetName'),
	fs = require('fs'),
	appConfig = require('ini').parse(fs.readFileSync('./config.ini', 'utf-8')),
	browserify = require('browserify-middleware'),
	mongoskin = require('mongoskin'),
	SseCommunication = require('sse-communication/Simple'),
	ReferenceServer = require('syncit-server/ReferenceServer'),
	ServerPersistMongodb = require('syncit-server/ServerPersist/Mongodb'),
	fixNoFlightCorsRequestBody = require('./lib/fixNoFlightCorsRequestBody'),
	generateRandomString = require('./lib/generateRandomString.js'),
	ServerPersistMemoryAsync = require('syncit-server/ServerPersist/MemoryAsync'),
	http = require('http'),
	https = require('https'),
	sseCommunication = new SseCommunication(),
	syncItServerPersist = (function() {
		"use strict";
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
	),
	allowCors = function(req, res, next) {
		"use strict";
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,POST');
		if (req.method == 'OPTIONS') {
			return res.send(200);
		}
		next();
	};

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
	app.use(allowCors);
	app.use(app.router);

	if ( mode !== 'production') {
		app.get(
			'/js/App.js',
			browserify(
				'./public/js/App.js',
				{
					transform: require('reactify'),
					standalone: 'app'
				}
			)
		);
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

var getStandardTemplateData = function() {
	"use strict";
	return {
		title: 'Express',
		production: ( app.get('env') === 'production' ? true : false),
		persistData: parseInt(appConfig.syncit.persist_data, 10) ? true : false
	};
};

app.get('/', function(req, res) {
	"use strict";
	res.render('front', getStandardTemplateData());
});

app.get('/list', function(req, res) {
	"use strict";
	res.render('list', getStandardTemplateData());
});

app.post('/syncit/:deviceId', fixNoFlightCorsRequestBody, setDeviceIdMiddleware, function(req, res, next) {
	"use strict";
	referenceServer.push(req, function(err, status, data) {
		if (err) { return next(err); }
		res.json(getStatusCode(status), data);
	});
});

var isDatasetInvalidOrAlreadyUsed = function(dataset, next) {
	"use strict";
	if (dataset.match(/^[0-9]/)) { return next(null, true); }
	syncItServerPersist.getQueueitems(dataset, null, function(err, status, queueitems) {
		if (err) { return next(err); }
		next(null, queueitems.length > 0 ? true : false);
	});
};

app.post('/', function(req, res, next) {
	"use strict";
	generateNewDatasetName(generateRandomString.bind(this, 12), isDatasetInvalidOrAlreadyUsed, function(e, listId) {
		if (e) { return next(e); }
		res.redirect('/list#/' + listId);
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

app.get('/offline.manifest.appcache', function(req, res) {
	"use strict";
	if (app.get('env') != 'production') {
		return res.send("CACHE MANIFEST\nNETWORK:\n*");
	}
	res.set('Content-Type', 'text/cache-manifest');
	var data = [
		'CACHE MANIFEST',
		'# 201406011136',
		'CACHE:',
		'/',
		'/list',
		'/css/main.css',
		'/css/front.css',
		'/css/list.css',
		'/vendor-bower/todomvc-common/base.css',
		'/vendor-bower/todomvc-common/bg.png',
		'/vendor-bower/react/react-with-addons.min.js',
		'/js/App.bin.js',
		'',
		'NETWORK:',
		'*'
	];
	res.send(data.join("\n"));
});

var serverHttp = null,
	serverHttps = null;

if (app.get('env') === 'production') {
	serverHttps = https.createServer(
		{
			key: fs.readFileSync(appConfig.https.key),
			cert: fs.readFileSync(appConfig.https.cert),
		},
		app
	);
	serverHttps.listen(appConfig.https.port, function(){
		"use strict";
		/* global console: false */
		console.log('Express HTTPS server listening on port ' + appConfig.https.port);
	});
}
serverHttp = http.createServer(app);
serverHttp.listen(appConfig.http.port, function(){
	"use strict";
	/* global console: false */
	console.log('Express HTTP server listening on port ' + appConfig.http.port);
});
