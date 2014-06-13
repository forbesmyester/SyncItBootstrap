/**
 * @jsx React.DOM
 */
module.exports = (function (React, React_Mixin_Popup, objectMap, arrayMap) {

	return React.createClass({

		mixins: [React_Mixin_Popup],

		show: function(messageText, newVersionData, buttonText) {
			this.setProps({
				messageText: messageText,
				newVersionData: newVersionData,
				buttonText: buttonText
			});
			this._show();
		},

		hide: function() { this._hide(); },

		handleOk: function(evt) {
			this.hide();
			this.props.onOk(null);
		},

		render: function() {

			var k,
				versionDataHtml = [],
				getChanges = function(dataInVersion) {
						console.log(dataInVersion);
						if (dataInVersion.length === 0) {
							return '';
						}
						return (<ul>{ arrayMap(dataInVersion, function(change) {
							return <li>{ change }</li>;
						}) }</ul>);
					}
				;

			versionDataHtml = objectMap(
				this.props.newVersionData,
				function(dataInVersion, versionName) {
					return [
						<li>{ [ versionName, getChanges(dataInVersion) ] }</li>,
					];
				}
			);

			return this.getPopupWrapper(
				<div>
					<p>{ this.props.messageText }</p>
					<ol>{ versionDataHtml }</ol>
					<div className="footer">
						<a href="#" onClick={ this.handleCancel }>{ this.props.cancelText }</a>
						<button onClick={ this.handleOk }>{ this.props.buttonText }</button>
					</div>
				</div>,
				['reactMixinPopup__okCancelPopup']
			);
		}
	});

}(React, require('./React_Mixin_Popup'), require('mout/object/map'), require('mout/array/map')));
