(function () {
	'use strict';
	var fs = Npm.require('fs'),
		path = Npm.require('path'),
		mkdirp = Npm.require('mkdirp');

	var ensureAuthenticated = function (func) {
		return function (params) {
			var userId = this.userId;
			if (!!userId && Roles.userIsInRole(userId, _.map(Blog.config('roles'), function (r) { return r;}))) {
				return func.call(this, params);
			}
			else {
				logger.error('Insufficient auth requested for method', { fn: func, user: userId });
				throw new Meteor.Error(403, "Not authorized");
			}
		}
	};

	Meteor.methods({
		'insertBlogPost': ensureAuthenticated(createBlogPost),
		'updateBlogPost': ensureAuthenticated(updateBlogPost),
		'setPostPublished': ensureAuthenticated(toggleBlogPostPublish),
		'deleteBlogPost': ensureAuthenticated(deletePost),
		'uploadBlogPicture': ensureAuthenticated(uploadPicture),
		'mdBlogCount': function () {
			if (Roles.userIsInRole(this.userId, _.map(Blog.config('roles'), function (r) { return r;}))) {
				return BlogPosts.find().count();
			}
			else {
				return BlogPosts.find({ published: true }).count();
			}
		}
	});

	function staticReqHandler (func) {
		return function (req, res) {
			try {
				func.call(this, req, res);
			}
			catch (e) {
				res.statusCode = 404;
				res.end();
			}
		};
	}

	Meteor.startup(function () {
		logger.info('Initializing blog');
		if (!!process.env.AUTO_RESET && process.env.NODE_ENV === 'development') {
			logger.log('warn', 'Resetting blog posts and settings');
			BlogPosts.remove({});
			BlogSettings.remove({});
		}

		var routes = Blog.config('routes'),
			route;
		if (routes) {
			if (Blog.config('pictures.storage')) {
				try {
					var imgPath = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'));
					if (!fs.existsSync(imgPath)) logger.info('Created directory ' + imgPath, mkdirp.sync(imgPath));
				}
				catch (e) { logger.error('Could not create directoy ' + imgPath, e); }

				try {
					route = path.join('/', routes.base, routes.pictures);
					logger.info('Setting route (' + route + ') for static blog images');
					RoutePolicy.declare(route, 'network');
					WebApp.connectHandlers.use(route, staticReqHandler(getPicture));
				}
				catch (e) { logger.error('Could not set route', e); }
			}

			if (initRss()) {
				try {
					route = path.join('/', routes.base, routes.rss);
					logger.info('Setting up RSS feed at (' + route + ')');
					RoutePolicy.declare(route, 'network');
					WebApp.connectHandlers.use(route, staticReqHandler(getRssFeed));
				}
				catch (e) { logger.error('Could not set route', e); }
			}
		}
	});

})();
