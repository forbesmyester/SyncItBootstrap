/**
 * @jsx React.DOM
 */
module.exports = (function (React, Constants) {

	// Body of function only very slightly changed from https://raw.github.com/tastejs/todomvc/gh-pages/labs/architecture-examples/react/js/footer.jsx

	'use strict';

	var pluralize = function(n, s) {
		if (n != 1) { return s + "s"; }
		return s;
	};

	return React.createClass({
		render: function () {
			var activeTodoWord = pluralize(this.props.count, 'item');
			var clearButton = null;

			if (this.props.completedCount > 0) {
				clearButton = (
					<button
						id="clear-completed"
						onClick={this.props.onClearCompleted}>
						Clear completed ({this.props.completedCount})
					</button>
				);
			}

			var show = {};
			show[Constants.ALL_TODOS] = '';
			show[Constants.ACTIVE_TODOS] = '';
			show[Constants.COMPLETED_TODOS] = '';

			show[this.props.nowShowing] = 'selected';

			return (
				<footer id="footer">
					<span id="todo-count">
						<strong>{this.props.count}</strong>
						{' '}{activeTodoWord}{' '}left{''}
					</span>
					<ul id="filters">
						<li>
							<a href={'#/' + this.props.dataset} className={show[Constants.ALL_TODOS]}>All</a>
						</li>
						{' '}
						<li>
							<a href={'#/' + this.props.dataset + '/active'} className={show[Constants.ACTIVE_TODOS]}>Active</a>
						</li>
						{' '}
						<li>
							<a href={'#/' + this.props.dataset + '/completed'} className={show[Constants.COMPLETED_TODOS]}>Completed</a>
						</li>
					</ul>
					{clearButton}
				</footer>
			);
		}
	});
}(React, '../js/Constants.js'));
