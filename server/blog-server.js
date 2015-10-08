(function () {
	'use strict';

	var insertBlogPost = function (post) {
		var date = new Date(),
			userId = this.userId;

		var dupes = BlogPosts.find({title: post.title}).count();
		if (dupes) post.title += '-' + dupes;

		post.published = post.published ? post.published : false;
		post.archived = post.archived ? post.archived : false;
		post.slug = _getSlug(post.title);

		_.extend(post, {
			_id: Random.id(),
			created_at: date,
			updated_at: date,
			published_date: null,
			created_by: userId,
			updated_by: userId
		});

		post.shortId = post._id.substring(0, 5);

		BlogPosts.insert(post);
		return post;
	};

	var updateBlogPost = function (post) {
		var id = post._id,
			userId = this.userId;

		post.updated_at = new Date();
		post.updated_by = userId;

		return BlogPosts.update({_id: id}, { $set: post });
	};

	function _sendEmail (blog) {

		var addresses = Meteor.users.find(
			{ 'emails.address': { $ne: '' } }).map(
			function (doc) { return doc.emails[0].address });

		console.info("Sending email for '" + blog.title + "' to "
		             + addresses.length + ' recipient(s):', addresses);

		var sender = Meteor.user().emails[0].address;
		Email.send({
			to: sender,
			bcc: addresses,
			from: sender,
			subject: blog.title,
			html: SSR.render('publishEmail', {
				summary: blog.summary,
				url: getBlogPostUrl(blog),
				read_more: TAPi18n.__('read_more', {}, Blog.config('defaultLocale'))
			})
		});
	}

	function _removePost (blog) { BlogPosts.remove(blog._id); }

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
		'sendEmail': ensureAuthenticated(_sendEmail),
		'deleteBlog': ensureAuthenticated(_removePost),
		'mdBlogCount': function () {
			if (Roles.userIsInRole(this.userId, _.map(Blog.config('roles'), function (r) { return r;}))) {
				return BlogPosts.find().count();
			}
			else {
				return BlogPosts.find({ published: true }).count();
			}
		}
	});

	function _getSlug (title) {

		var replace = [
			' ', '#', '%', '"', ':', '/', '?',
			'^', '`', '[', ']', '{', '}', '<', '>',
			';', '@', '&', '=', '+', '$', '|', ','
		];

		var slug = title.toLowerCase();
		for (var i = 0; i < replace.length; i++) {
			slug = _replaceAll(replace[i], '-', slug);
		}
		return slug;
	}

	function _replaceAll (find, replace, str) {
		return str.replace(new RegExp('\\' + find, 'g'), replace);
	}


	Meteor.startup(function () {
		if (!!process.env.AUTO_RESET && process.env.NODE_ENV === 'development') {
			BlogPosts.remove({});
		}
		//if (BlogPosts.find().count() === 0) {
		//	var locale = Meteor.settings.public.blog.defaultLocale;
		//	_upsertBlogPost({
		//		published: true,
		//		archived: false,
		//		title: TAPi18n.__("blog_post_setup_title", null, locale),
		//		author: TAPi18n.__("blog_post_setup_author", null, locale),
		//		date: new Date().getTime(),
		//		summary: TAPi18n.__("blog_post_setup_summary", null, locale),
		//		content: TAPi18n.__("blog_post_setup_contents", null, locale)
		//	});
		//}
	});

})();
