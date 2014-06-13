/**
 * @jsx React.DOM
 */
module.exports = (function (React, objectMap) {

	// Body of function only very slightly changed from https://raw.github.com/tastejs/todomvc/gh-pages/labs/architecture-examples/react/js/app.jsx

	// Note: Router Removed

	'use strict';

	return React.createClass({

		handleDeleteClick: function(evt) {
			evt.preventDefault();
			this.props.onDeleteClick(evt.target.dataset.datasetName);
		},

		handleMailtoClick: function(evt) {
			evt.preventDefault();
			this.props.onMailtoClick(evt.target.dataset.datasetName);
		},

		handleRenameClick: function(evt) {
			evt.preventDefault();
			this.props.onRenameClick(evt.target.dataset.datasetName);
		},

		render: function () {

			var lis = objectMap(this.props.lists, function (name, key) {
				var url = '/list#/' + key;
				return ( <li>
					<a href={url}>{name !== null ? name : key}</a>&nbsp;
					<a href="#" className="todolistlist__rename" data-dataset-name={key} onClick={this.handleRenameClick}>[rename]</a>&nbsp;
					<a href="#" className="todolistlist__delete" data-dataset-name={key} onClick={this.handleDeleteClick}>[delete]</a>&nbsp;
					<a href="#" className="todolistlist__mailto" data-dataset-name={key} onClick={this.handleMailtoClick}>[mailto]</a>&nbsp;
				</li> );
			}, this);

			return ( <ul>{lis}</ul> );

		}
	});

}(React, require('mout/object/map')));
