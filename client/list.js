Template.blogList.onRendered(function () {
	var self = this;
	$(document).ready(function () {
		self.$('.tooltipped').tooltip({delay: 100});
	});
});

Template.blogList.onCreated(function () {
	var self = this;
	self.serverBlogCount = new ReactiveVar(false);
	self.autorun(function () {
		Meteor.call('mdBlogCount', function (err, serverBlogCount) {
			self.serverBlogCount.set(serverBlogCount);
		});
		self.subscribe('blog.posts');

	});
	self.autorun(function () {
		Session.get('locale'); // force dependency
		setHtmlMeta({
			title: TAPi18n.__("title"),
			description: TAPi18n.__("description")
		});
	});
});

Template.blogList.helpers({
	posts: function () {
		var sort = Blog.config('sortBy');
		var year = FlowRouter.getParam('year'),
			month = FlowRouter.getParam('month');
		if (!(year || month)) {
			return BlogPosts.find({}, { sort: sort ? sort : { date: -1 } });
		}
		else {
			var range = getDateRange(year, month);
			return BlogPosts.find({$or: [
				{ published: true, published_at: range },
				{ created_at: range}
			]}, { sort: sort ? sort : { date: -1 } });
		}
	},
	postTemplate: function () {
		return Blog.config('templates.listPost') || 'blogListPostDefault';
	}
});

Template.blogList.events({
	'click #newBlogPostBtn': function _new () {
		if (!(Meteor.user() && Roles.userIsInRole(Meteor.user(), _.map(Blog.config('roles'), function (r) { return r;})))) return;
		Meteor.call('insertBlogPost', { title: TAPi18n.__("new_post_title") }, function (err, id) {
			if (err || !id) return console.log('Error inserting post', err);
			var newPost = BlogPosts.findOne(id);
			FlowRouter.go('blogPost', {year: newPost.year, month: newPost.month, slug: newPost.slug});
		});
	}
});
