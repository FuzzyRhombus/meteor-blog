(function () {
	'use strict';

	var insertBlogPost = function (post) {
		var date = new Date(),
			userId = this.userId;

		// Ensure unique title/slug
		post.title = post.title || TAPi18n.__("new_post_title", null, Blog.config('defaultLocale'));
		post.slug = getUniqueSlug(post.title);

		return BlogPosts.insert({
			title: post.title,
			slug: post.slug,
			summary: post.summary || '',
			created_at: date,
			updated_at: date,
			published: false,
			published_at: null,
			created_by: userId,
			updated_by: userId
		});
	};

	var updateBlogPost = function (update) {
		var id = update._id,
			userId = this.userId;
		var post = BlogPosts.findOne(id);
		if (!post) throw new Meteor.Error('Could not find post');
		if (!checkUserRights(userId, post)) throw new Meteor.Error(403);

		// Only update valid fields
		var titleUpdated = update.title && update.title !== post.title;
		var fields = ['title', 'summary', 'content'];
		_.each(fields, function (key) {
			if (update[key] || !!update[key].length)
				post[key] = update[key];
		});

		// Ensure title is still unique and regen slug
		if (titleUpdated)
			post.slug = getUniqueSlug(post.title, id);

		post.updated_at = new Date();
		post.updated_by = userId;
		if (BlogPosts.update({_id: id}, {$set: post})) return post;
	};

	function deletePost (post) {
		if (checkUserRights(this.userId, post._id))
			BlogPosts.remove(post._id);
	}

	//function _sendEmail (blog) {
	//
	//	var addresses = Meteor.users.find(
	//		{ 'emails.address': { $ne: '' } }).map(
	//		function (doc) { return doc.emails[0].address });
	//
	//	console.info("Sending email for '" + blog.title + "' to "
	//	             + addresses.length + ' recipient(s):', addresses);
	//
	//	var sender = Meteor.user().emails[0].address;
	//	Email.send({
	//		to: sender,
	//		bcc: addresses,
	//		from: sender,
	//		subject: blog.title,
	//		html: SSR.render('publishEmail', {
	//			summary: blog.summary,
	//			url: getBlogPostUrl(blog),
	//			read_more: TAPi18n.__('read_more', {}, Blog.config('defaultLocale'))
	//		})
	//	});
	//}

	var toggleBlogPostPublish = function (options) {
		var id = options._id,
			userId = this.userId;
		var post = BlogPosts.findOne(id);
		if (!post) throw new Meteor.Error('Could not find post');
		if (!checkUserRights(userId, post)) throw new Meteor.Error(403);
		post.published = options.publish;
		if (post.published) {
			var now = new Date();
			post.published_at = options.date || now;
			if (post.published_at < now) post.published_at = now;
		}
		BlogPosts.update({_id: id}, {$set: { published: post.published, published_at: post.published_at }});
		if (publish) {
			var date = moment(post.published_at);
			return {
				year: date.year(),
				month: ('0' + (date.month()+1)).slice(-2)
			};
		}
	};

	var ensureAuthenticated = function (func) {
		return function (blog) {
			var userId = this.userId;
			if (!!userId && Roles.userIsInRole(userId, _.map(Blog.config('roles'), function (r) { return r;}))) {
				return func.call(this, blog);
			}
			else {
				throw new Meteor.Error(403, "Not authorized");
			}
		}
	};

	Meteor.methods({
		'insertBlogPost': ensureAuthenticated(insertBlogPost),
		'updateBlogPost': ensureAuthenticated(updateBlogPost),
		'setPostPublished': ensureAuthenticated(toggleBlogPostPublish),
		'deleteBlogPost': ensureAuthenticated(deletePost),
		'mdBlogCount': function () {
			if (Roles.userIsInRole(this.userId, _.map(Blog.config('roles'), function (r) { return r;}))) {
				return BlogPosts.find().count();
			}
			else {
				return BlogPosts.find({ published: true }).count();
			}
		}
	});

	function checkUserRights (userId, postId) {
		var post = _.isObject(postId) ? postId : BlogPosts.findOne(postId);
		return Roles.userIsInRole(userId, Blog.config('roles.admin')) || post.created_by === userId;
	}

	function getUniqueSlug(title, id) {
		var slug = getSlug(title);
		var regex = new RegExp(slug+'(-\\d+)*$', 'im');
		var dupes = BlogPosts.find({_id: {$ne: id || null}, slug: regex}, {slug: 1}).fetch();
		if (dupes.length) {
			var max = _.chain(dupes)
				.map(function (dupe) { return dupe.slug.match(/\d+$/); })
				.flatten()
				.reduce(function (max, next) { return (next > max) ? +next : max; }, 0)
				.value();
			slug += '-' + (max+1);
		}
		return slug;
	}

	function getSlug (title) {
		var replace = ' `~!@#$%^&*()[]{}=+"\':;<>,.\\/?|\t',
			slug = title.toLocaleLowerCase();
		return slug.replace(new RegExp(_.reduce(replace, function (m, c) { return m + '\\' + c; }, '[') + ']', 'gi'), '-')
			.replace(/-+$/, '');
	}

	Meteor.startup(function () {
		if (!!process.env.AUTO_RESET && process.env.NODE_ENV === 'development') {
			BlogPosts.remove({});
			BlogSettings.remove({});
		}
	});

})();
