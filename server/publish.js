(function () {
	'use strict';

	Meteor.publish('blog.posts', function () {
		if (Roles.userIsInRole(this.userId, [Blog.config('roles.admin'), Blog.config('roles.author')])) {
			return [
				BlogPosts.find(),
				Meteor.users.find({
					roles: { $in: _.map(Blog.config('roles'), function (r) { return r; }) }
				}, { fields: {
					profile: 1
				}})
			];
		} else {
			return [
				BlogPosts.find({published: true}),
				Meteor.users.find({
					roles: { $in: _.map(Blog.config('roles'), function (r) { return r; }) }
				}, { fields: {
					profile: 1
				}})
			];
		}
	});

});