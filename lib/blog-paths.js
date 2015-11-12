function getPathForPost (post) {
	if (Blog.config('enableArchive'))
		return sanitizePath([Blog.config('routes.base'), post.year, post.month, post.slug]);
	return sanitizePath([Blog.config('routes.base'), post.slug]);
}

function sanitizePath (path, leadingSlash) {
	var paths = _.isArray(path) ? path : path.split('/');
	return (leadingSlash ? '/' : '') + _.compact(paths).join('/');
}

blogPaths = {
	get base () {
		return sanitizePath(Blog.config('routes.base'), true);
	},
	get archive () {
		return {
			year: '/:year(\\d+)',
			month: '/:year(\\d+)/:month(\\d+)'
		};
	},
	get post () {
		if (Blog.config('enableArchive')) {
			return sanitizePath([':year(\\d+)', ':month(\\d+)', ':slug'], true);
		}
		return '/:slug';
	},
	getPathForPost: getPathForPost
};
