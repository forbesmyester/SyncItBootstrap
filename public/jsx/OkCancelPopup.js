/**
 * @jsx React.DOM
 */
module.exports = (function (React, React_Mixin_Popup) {

	return React.createClass({

		mixins: [React_Mixin_Popup],

		getDefaultProps: function() {
			return {
				dataset: ''
			};
		},

		show: function(messageText, buttonText, cancelText) {
			this.setProps({
				messageText: messageText,
				buttonText: buttonText,
				cancelText: cancelText
			});
			this._show();
		},

		hide: function() { this._hide(); },

		handleCancel: function(evt) {
			evt.preventDefault();
			if (this.props.hasOwnProperty('onCancel')) {
				this.props.onCancel();
			}
			this.hide();
		},

		handleOk: function(evt) {
			evt.preventDefault();
			if (this.props.hasOwnProperty('onOk')) {
				this.props.onOk();
			}
			this.hide();
		},

		render: function() {
			return this.getPopupWrapper(
				<div>
					<p>{ this.props.messageText }</p>
					<div className="footer">
						<a href="#" onClick={ this.handleCancel }>{ this.props.cancelText }</a>
						<button onClick={ this.handleOk }>{ this.props.buttonText }</button>
					</div>
				</div>,
				['reactMixinPopup__okCancelPopup']
			);
		}
	});

}(React, require('./React_Mixin_Popup')));
