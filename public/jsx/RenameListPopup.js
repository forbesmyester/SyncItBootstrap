/**
 * @jsx React.DOM
 */
module.exports = (function (React, React_Mixin_Popup) {

	return React.createClass({

		mixins: [React.addons.LinkedStateMixin, React_Mixin_Popup],

		getDefaultProps: function() {
			return {
				dataset: ''
			};
		},

		getInitialState: function() {
			return { name: '' };
		},

		show: function(dataset, name) {
			this.setProps({dataset: dataset});
			this.setState({name: name});
			this._show();
		},

		hide: function() { this._hide(); },

		handleCancel: function(evt) {
			evt.preventDefault();
			this.hide();
		},

		handleOk: function(evt) {
			evt.preventDefault();
			this.props.onOk(this.state.name);
			this.hide();
		},

		render: function() {
			return this.getPopupWrapper(
				<div>
					<ul><li>
						<label htmlFor="rename-list-popup__input--name">Name</label>
						<input id="rename-list-popup__input--name" valueLink={this.linkState('name')}/>
						<input type="hidden" id="rename-list-popup__input-dataset" value={this.props.dataset}/>
					</li></ul>
					<div className="footer">
						<a href="#" onClick={ this.handleCancel }>Keep the Old Name</a>
						<button onClick={ this.handleOk }>Update Name</button>
					</div>
				</div>,
				['reactMixinPopup__renameListPopup']
			);
		}
	});

}(
	React,
	require('./React_Mixin_Popup')
));
