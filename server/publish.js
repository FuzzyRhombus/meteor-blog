Meteor.publish('blog.posts', function (params) {
	var authRoles = _.map(Blog.config('roles'), function (r) { return r; });
	if (Roles.userIsInRole(this.userId, authRoles)) {
		var query = Roles.userIsInRole(this.userId, Blog.config('roles.admin')) ? {} : { $or: [{published: true}, {created_by: this.userId}] };
		if (params) _.extend(query, params);
		return [
			BlogPosts.find(query),
			Meteor.users.find({
				roles: { $in: authRoles }
			}, { fields: {
				profile: 1
			}})
		];
	} else {
		return [
			BlogPosts.find(_.extend({published: true}, params)),
			Meteor.users.find({
				roles: { $in: authRoles }
			}, { fields: {
				profile: 1
			}})
		];
	}
});
