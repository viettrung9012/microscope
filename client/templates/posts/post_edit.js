Template.postEdit.onCreated(function() {
	Session.set('postEditErrors', {});
});

Template.postEdit.helpers({
	errorMessage: function(field) {
		return Session.get('postEditErrors')[field];
	},
	errorClass: function(field) {
		return !!Session.get('postEditErrors')[field] ? 'has-error' : '';
	}
})

Template.postEdit.events({
	'submit form': function(e) {
		e.preventDefault();

		var currentPostId = this._id;

		var postProperties = {
			url: $(e.target).find('[name=url]').val(),
			title: $(e.target).find('[name=title]').val()
		}

		var errors = validatePost(postProperties);
		if (errors.title || errors.url){
			return Session.set('postEditErrors', errors);
		}

		Meteor.call('postUpdate', currentPostId, postProperties, function(error, result) {
			// display the error to the user and abort
			if (error)
				return throwError(error.reason);

			// disallow unauthorized user to edit
			if (result.isUnauthorized)
				return throwError('Access denied');

			// show this result but route anyway
			if (result.postExists)
				throwError('This link has already been existed');

			Router.go('postPage', {_id: result._id});
		});
	},

	'click .delete': function(e) {
		e.preventDefault();

		if (confirm("Delete this post?")) {
			var currentPostId = this._id;
			Posts.remove(currentPostId);
			Router.go('postsList');
		}
	}
});