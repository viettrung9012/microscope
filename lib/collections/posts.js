Posts = new Mongo.Collection('posts');

Posts.allow({
    remove: function(userId, post) {
        return ownsDocument(userId, post);
    }
});

validatePost = function (post) {
	var errors = {};

	if (!post.title)
		errors.title = "Please fill in a headline";

	if (!post.url)
		errors.url = "Please fill in a URL";

	return errors;
}

Meteor.methods({
    postInsert: function(postAttributes) {
        check(Meteor.userId(), String);
        check(postAttributes, {
            title: String,
            url: String
        });

        var errors = validatePost(postAttributes);
        if (errors.title || errors.url)
        	throw new Meteor.Error('invalid-post', "You must set a title and URL for your post");

        var postWithSameLink = Posts.findOne({
            url: postAttributes.url
        });
        if (postWithSameLink) {
            return {
                postExists: true,
                _id: postWithSameLink._id
            }
        }

        var user = Meteor.user();
        var post = _.extend(postAttributes, {
            userId: user._id,
            author: user.username,
            submitted: new Date(),
            commentsCount: 0,
            upvoters: [],
            votes: 0
        });

        var postId = Posts.insert(post);

        return {
            _id: postId
        };
    },
    postUpdate: function(currentPostId, postAttributes) {
        check(Meteor.userId(), String);
        check(postAttributes, {
            title: String,
            url: String
        });

        var errors = validatePost(postAttributes);
        if (errors.title || errors.url)
        	throw new Meteor.Error('invalid-post', "You must set a title and URL for your post");

        var postProperties = _.omit(postAttributes, function(value, key, object) {
            return _.without(keys(postAttributes), 'url', 'title');
        });

        var postWithSameLink = Posts.findOne({
            url: postProperties.url
        });
        if (postWithSameLink) {
            return {
                postExists: true,
                _id: postWithSameLink._id
            }
        }

        var currentPost = Posts.findOne({
            _id: currentPostId
        });
        if (!ownsDocument(Meteor.userId(), currentPost)) {
            return {
                isUnauthorized: true,
                _id: currentPostId
            }
        }

        Posts.update(currentPostId, {
            $set: postProperties
        });

        return {
            _id: currentPostId
        };
    },
    upvote: function(postId) {
        check(this.userId, String);
        check(postId, String);

        var affected = Posts.update({
            _id: postId,
            upvoters: {$ne: this.userId}
        }, {
            $addToSet: {upvoters: this.userId},
            $inc: {votes: 1}
        });

        if (! affected)
            throw new Meteor.Error('invalid', "You weren't able to upvote that post");
    }
});
