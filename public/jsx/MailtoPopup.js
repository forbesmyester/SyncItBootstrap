/**
 * @jsx React.DOM
 */
module.exports = (function (React, React_Mixin_Popup) {

	return React.createClass({

		mixins: [React_Mixin_Popup],

		show: function(popupBodyText, sendLinkText, doNotSendText, subjectTemplate, messageTemplate, URL) {
			this.setProps({
				popupBodyText: popupBodyText,
				doNotSendText: doNotSendText,
				sendLinkText:sendLinkText,
				messageTemplate: messageTemplate,
				subjectTemplate: subjectTemplate,
				URL: URL,
				link: 'javascript: alert("You must type an email address");'
			});
			this._show();
			var element = document.getElementById('reactMixinPopup__mailTo__emailAddr');
			if (element) {
				element.value = '';
			}
		},

		hide: function() {
			this._hide();
		},

		getLinkForEmailAddr: function(emailAddr) {
			var link = [
				'mailto:',
				encodeURIComponent(emailAddr),
				'?subject=',
				encodeURIComponent(this.props.subjectTemplate.replace('{URL}', this.props.URL)),
				'&body=',
				encodeURIComponent(this.props.messageTemplate.replace('{URL}', this.props.URL))
			];
			return link.join('');
		},

		handleNewEmailAddr: function(evt) {
			this.setProps({link: this.getLinkForEmailAddr(evt.target.value)});
		},

		handleCancel: function() { return this._hide(); },

		render: function() {
			return this.getPopupWrapper(
				<div>
					<p>Send this List to someone else:</p>
					<div>
						<label htmlFor="reactMixinPopup__mailTo__emailAddr">Email:</label>
						<input type="email" id="reactMixinPopup__mailTo__emailAddr" onChange={ this.handleNewEmailAddr }/>
					</div>
					<div className="footer">
						<a href="#" onClick={ this.handleCancel }>{ this.props.doNotSendText }</a>
						<a onClick={ this._hide } href={ this.props.link }><button>{ this.props.sendLinkText }</button></a>
					</div>
				</div>,
				['reactMixinPopup__loading']
			);
		}
	});

}(React, require('./React_Mixin_Popup')));
