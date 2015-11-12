createBlogPost = function createBlogPost (post) {
	var date = new Date(),
		userId = this.userId;

	// Ensure unique title/slug
	post.title = post.title || TAPi18n.__("new_post_title", null, Blog.config('defaultLocale'));
	post.slug = getUniqueSlug(post.title);
	logger.log('verbose', 'Creating new blog post...', post);
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

updateBlogPost = function updateBlogPost (update) {
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
	logger.log('verbose', 'Updating blog post', post);
	if (BlogPosts.update({_id: id}, {$set: post})) return post;
};

deletePost = function deletePost (post) {
	if (checkUserRights(this.userId, post._id))
		BlogPosts.remove(post._id);
};

toggleBlogPostPublish = function toggleBlogPostPublish (options) {
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
	logger.log('verbose', 'Publishing blog post', post);
	BlogPosts.update({_id: id}, {$set: { published: post.published, published_at: post.published_at }});
	if (publish) {
		var date = moment(post.published_at);
		return {
			year: date.year(),
			month: ('0' + (date.month()+1)).slice(-2)
		};
	}
};

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
