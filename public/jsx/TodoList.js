/**
 * @jsx React.DOM
 */
module.exports = (function (React,
			React_Mixin_Manip,
			Constants,
			TodoFooter,
			TodoItem,
			objectMap,
			objectReduce,
			objectKeys,
			objectFilter) {

	// Body of function only very slightly changed from https://raw.github.com/tastejs/todomvc/gh-pages/labs/architecture-examples/react/js/app.jsx

	// Note: Router Removed

	'use strict';

	var ENTER_KEY = 13;

	return React.createClass({

		mixins: [React_Mixin_Manip],


		getInitialState: function () {
			// TOSYNCIT - var todos = Utils.store('react-todos');
			return {
				// TOSYNCIT - todos: todos,
				//
				nowShowing: Constants.ALL_TODOS,

				editing: null
			};
		},


		componentDidMount: function () {
			this.refs.newField.getDOMNode().focus();
		},


		handleNewTodoKeyDown: function (event) {
			if (event.which !== ENTER_KEY) {
				return;
			}

			this.props.onNewTodoRequest({
				title: this.refs.newField.getDOMNode().value.trim()
			});

			this.refs.newField.getDOMNode().value = '';
		},


		toggleAll: function (event) {
			this.props.onMarkAllTodo(event.target.checked);
		},


		edit: function (todo,
					  todoKey,
					  callback) {
			// refer to todoItem.js `handleEdit` for the reasoning behind the
			// callback
			this.setState({editing: todoKey},
					function () {
				callback();
			});
		},


		save: function (todoToSave,
					  key,
					  title) {
			this.props.onTodoUpdateTitle(
				todoToSave,
				key,
				title
			);
			this.setState({ editing: null });
		},


		cancel: function () {
			this.setState({editing: null});
		},


		componentDidUpdate: function () {
			// TOSYNCIT - Utils.store('react-todos',
			// this.state.todos);
		},


		render: function () {
			var footer = null;
			var main = null;

			var shownTodos = objectFilter(this.props.todos,
					function (todo) {
				switch (this.state.nowShowing) {
				case Constants.ACTIVE_TODOS:
					return !todo.completed;
				case Constants.COMPLETED_TODOS:
					return todo.completed;
				default:
					return true;
				}
			},
			this);

			var todoItems = objectMap(shownTodos,
					function (todo,
						key) {
				return (
					<TodoItem
						key={key}
						todo={todo}
						onToggle={this.props.onTodoToggle.bind(this,
							todo,
							key)}
						onDestroy={this.props.onTodoDestroy.bind(this,
							todo,
							key)}
						onEdit={this.edit.bind(this,
							todo,
							key)}
						editing={this.state.editing === key}
						onSave={this.save.bind(this,
							todo,
							key)}
						onCancel={this.cancel} />
				);
			},
						this);

			var activeTodoCount = objectReduce(
				this.props.todos,

				function(accum, todo) {
					return todo.completed ? accum : accum + 1;
				},
				0
			);

			var completedCount = objectKeys(this.props.todos).length - activeTodoCount;

			if (activeTodoCount || completedCount) {
				footer =
					<TodoFooter
						count={activeTodoCount}
						dataset={this.props.dataset}
						completedCount={completedCount}
						nowShowing={this.state.nowShowing}
						onClearCompleted={this.props.onClearCompleted} />;
			}

			if (objectKeys(this.props.todos).length) {
				main = (
					<section id="main">
						<input
							id="toggle-all"
							type="checkbox"
							onChange={this.toggleAll}
							checked={activeTodoCount === 0} />
						<ul id="todo-list">
							{todoItems}
						</ul>
					</section>
				);
			}

			return (
				<div>
					<header id="header">
						<h1>todos</h1>
						<input
							ref="newField"
							id="new-todo"
							placeholder="What needs to be done?"
							onKeyDown={this.handleNewTodoKeyDown} />
					</header>
					{main}
					{footer}
				</div>
			);
		}
	});

}(
	React,
	require('../js/React_Mixin_Manip'),
	require('../js/Constants.js'),
	require('./TodoFooter'),
	require('./TodoItem'),
	require('mout/object/map'),
	require('mout/object/reduce'),
	require('mout/object/keys'),
	require('mout/object/filter')
));
