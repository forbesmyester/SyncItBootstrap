/**
 * @jsx React.DOM
 */
module.exports = (function (React) {

	return {

		getDefaultProps: function() {
			return {
				shown: false,
			};
		},

		_show: function() {
			this.setProps({shown: true});
		},

		_hide: function() {
			this.setProps({shown: false});
		},

		getPopupWrapper: function(dom, extraClasses) {
			classes = extraClasses.concat(["popup-holder"]);
			if ( this.props.shown ) { classes.push('shown'); }
			return (
				<div className={ classes.join(' ') }>
					<div className="popup-holder__mask">
						<div className="popup-holder__body">{ dom }</div>
					</div>
				</div>
			);
		}

	};

}(React));
