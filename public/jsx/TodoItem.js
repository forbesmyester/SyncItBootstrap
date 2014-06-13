/**
 * @jsx React.DOM
 */
module.exports = (function (React) {

	// Body of function only very slightly changed from https://raw.github.com/tastejs/todomvc/gh-pages/labs/architecture-examples/react/js/todoItem.jsx

	'use strict';

	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;
	var lastEmittedTitle = false;

	return React.createClass({
		handleSubmit: function () {
			var val = this.state.editText.trim();
			if (lastEmittedTitle === val) {
				return false;
			}
			if (val) {
				lastEmittedTitle = val;
				this.props.onSave(val);
				this.setState({editText: val});
			} else {
				this.props.onDestroy();
			}
			return false;
		},

		handleEdit: function (evt) {
			evt.preventDefault();
			// react optimizes renders by batching them. This means you can't call
			// parent's `onEdit` (which in this case triggeres a re-render), and
			// immediately manipulate the DOM as if the rendering's over. Put it as a
			// callback. Refer to app.js' `edit` method
			this.props.onEdit(function () {
				var node = this.refs.editField.getDOMNode();
				node.focus();
				node.setSelectionRange(node.value.length, node.value.length);
			}.bind(this));
			this.setState({editText: this.props.todo.title});
		},

		handleKeyDown: function (event) {
			if (event.keyCode === ESCAPE_KEY) {
				this.setState({editText: this.props.todo.title});
				this.props.onCancel();
			} else if (event.keyCode === ENTER_KEY) {
				this.handleSubmit();
			}
		},

		handleChange: function (event) {
			this.setState({editText: event.target.value});
		},

		getInitialState: function () {
			return {editText: this.props.todo.title};
		},

		/**
		 * This is a completely optional performance enhancement that you can implement
		 * on any React component. If you were to delete this method the app would still
		 * work correctly (and still be very performant!), we just use it as an example
		 * of how little code it takes to get an order of magnitude performance improvement.
		 */
		shouldComponentUpdate: function (nextProps, nextState) {
			// TOSYNCIT - Investigate what this is doing...
			return true;
			return (
				nextProps.key !== this.props.key ||
				nextProps.todo !== this.props.todo ||
				nextProps.editing !== this.props.editing ||
				nextState.editText !== this.state.editText
			);
		},

		render: function () {
			return (
				<li className={React.addons.classSet({
					completed: this.props.todo.completed,
					editing: this.props.editing
				})}>
					<div className="view">
						<input
							className="toggle"
							type="checkbox"
							checked={this.props.todo.completed ? 'checked' : null}
							onChange={this.props.onToggle}
						/>
						<label onContextMenu={this.handleEdit} onDoubleClick={this.handleEdit}>
							{this.props.todo.title}
						</label>
						<button className="editbtn" onClick={this.handleEdit} />
						<button className="destroy" onClick={this.props.onDestroy} />
					</div>
					<input
						ref="editField"
						className="edit"
						value={this.state.editText}
						onBlur={this.handleSubmit}
						onChange={this.handleChange}
						onKeyDown={this.handleKeyDown}
					/>
				</li>
			);
		}
	});
}(React));
