getBlogBasePath = function () {
	return sanitizePath(Blog.config('routes.base'));
};

getBlogArchivePaths = function () {
	return {
		year: '/:year(\\d+)',
		month: '/:year(\\d+)/:month(\\d+)'
	};
};

getBlogPostPath = function () {
	if (Blog.config('enableArchive')) {
		return sanitizePath([':year(\\d+)', ':month(\\d+)', ':slug']);
	}
	return '/:slug';
};

sanitizePath = function (path) {
	var paths = _.isArray(path) ? path : path.split('/');
	return '/' + _.compact(paths).join('/');
};
