module.exports = (function (manip) {
	
	"use strict";
	
	/**
	 * # manip()
	 *
	 * A mixin for Facebook's React to add a `manip()` method which provides a
	 * somewhat clean way to update nested data within either this.props or
	 * this.state.
	 *
	 * ## Parameters
	 * * **@param {Boolean} `manipulateState`** If true this.state will be manipulated, if false this.props will be.
	 * * **@param {Object} `jsonDoc`** The manipulation to apply, see [the manip library for documentation](https://github.com/forbesmyester/manip)
	 * * **@param {Function} `callback`** Function to call when the manipulation is complete and works for both state and props.
	 */
	return {
		manip: function(manipulateState, jsonDoc, callback) {
			
			var func = (manipulateState ? this.setState : this.setProps).bind(this),
				values = manipulateState ? this.state : this.props;
			
			func(manip(values, jsonDoc), callback);
			
			if (!manipulateState) {
				callback();
			}
		}
	};
	
}(require('manip')));
