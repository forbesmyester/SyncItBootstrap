/**
 * @jsx React.DOM
 */
module.exports = (function (React, React_Mixin_Popup) {

	return React.createClass({

		mixins: [React_Mixin_Popup],

		getDefaultProps: function() {
			return {
				current: 0,
				stepCount: 1
			};
		},

		show: function(messageText, stepCount) {
			this.setProps({
				messageText: messageText,
				stepCount: stepCount
			});
			this._show();
		},

		hide: function() {
			this._hide();
		},

		setProgress: function(current) {
			if (!this.props.shown) { return; }
			this.setProps({current: current});
		},

		increment: function() {
			this.setProps({current: this.props.current + 1});
		},

		render: function() {
			var progress = (<div className="unknown"></div>),
				percentage = Math.round((this.props.current / this.props.stepCount) * 100);

			if (percentage < 3) { percentage = 3 }

			if (this.props.stepCount > 1) {
				progress = [
					<div className="known">
						<div className="done" style={ {width: percentage + '%' } } />
					</div>,
					<div className="percent-message">{ percentage }%</div>
				];
			}
			return this.getPopupWrapper(
				<div>
					<p>{ this.props.messageText }</p>
					<div className="progress">
						{ progress }
					</div>
				</div>,
				['reactMixinPopup__loading']
			);
		}
	});

}(React, require('./React_Mixin_Popup')));
