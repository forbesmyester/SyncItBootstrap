module.exports = (function() {
	
	"use strict";
	
	return function(idGenerator, localStorage) {
		var id = localStorage.getItem('_device_id');
		if (id !== null) {
			return id;
		}
		id = idGenerator();
		localStorage.setItem('_device_id', id);
		return id;
	};
	
}());
