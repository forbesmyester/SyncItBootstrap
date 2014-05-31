module.exports = (function() {

	"use strict";

	var SseCommunication = function() {
		this.channels = {};
		this.eventId = 0;
	};

	SseCommunication.prototype.register = function(deviceId, channels, res) {
		for (var i=0; i<channels.length; i++) {
			if (!this.channels.hasOwnProperty(channels[i])) {
				this.channels[channels[i]] = {};
			}
			this.channels[channels[i]][deviceId] = res;
		}

		var keepAlive = function() {
			var out = [
				'id: 0',
				"data: " + JSON.stringify({ command: 'keep-alive' })
			];
			res.write(out.join("\n") + "\n\n");
		};

		(function() {
			/* global setInterval: false */
			keepAlive();
			setInterval(function() { keepAlive(); }, 1000*60);
		})();

	};

	SseCommunication.prototype.send = function(fromDeviceId, channelId, command, data) {
		if (!this.channels.hasOwnProperty(channelId)) { return 0; }
		this.eventId = this.eventId + 1;
		var oData = { command: command };
		for (var k in data) { if (data.hasOwnProperty(k)) {
			oData[k] = data[k];
		} }
		var out = [
				'id: ' + this.eventId,
				"data: " + JSON.stringify(oData)
			],
			r = 1;
		for (var deviceId in this.channels[channelId]) {
			if (this.channels[channelId].hasOwnProperty(deviceId)) {
				if (deviceId !== fromDeviceId) {
					this.channels[channelId][deviceId].write(
						out.join("\n") + "\n\n"
					);
					r = 2;
				}
			}
		}
		return 2;
	};

	return SseCommunication;

}());
