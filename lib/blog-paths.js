getBaseBlogPath = function () {
	return Blog.config('paths.blog');
};

getBaseArchivePath = function () {
	return Blog.config('paths.archive');
};

getBlogPostPath = function (shortId, slug) {
	var path = getBaseBlogPath();
	if (Blog.config('useUniqueBlogPostsPath')) {
		path += '/' + shortId;
	}
	path += '/' + slug;

	return sanitizePath(path);
};

getBlogPostUrl = function (post) {
	return Blog.config('paths.base') + '/'
		+ getBlogPostPath(post.shortId, post.slug);
};

/*
 * Remove any duplicate '/'
 */
sanitizePath = function (path) {
	return _.compact(path.split('/')).join('/');
};
