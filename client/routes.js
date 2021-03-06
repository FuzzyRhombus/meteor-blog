(function () {
	'use strict';

	// Wait for config to be available, then setup routes
	FlowRouter.wait();
	Tracker.autorun(function (c) {
		if (!Blog.config('routes')) return;
		setupRoutes({
			base: blogPaths.base,
			archives: Blog.config('enableArchive') ? blogPaths.archive : false,
			post: blogPaths.post
		});
		FlowRouter.initialize();
		c.stop();
	});

	function setupRoutes(config) {
		var blogRoutes = FlowRouter.group({
			prefix: config.base
		});

		blogRoutes.route('/', {
			name: 'blogBase',
			action: function () {
				render('blogList');
			}
		});

		_.each(config.archives, function (path) {
			blogRoutes.route(path, {
				name: 'archive' + path.replace(/\(.+$/ig, '').replace(/[^a-z]*/ig, '').capitalizeFirstLetter(),
				action: renderBlog
			});
		});

		blogRoutes.route(config.post, {
			name: 'blogPost',
			action: renderBlog
		});

		function renderBlog (params, queryParams) {
			if (!params || !_.keys(params).length) return;
			var route = FlowRouter.getRouteName();
			// Check date params
			if (params.year) {
				var year = parseInt(params.year),
					month = parseInt(params.month);
				if (month > 12) return FlowRouter.go('archiveYear', { year: year });

				//FlowRouter.setParams({ year: year, month: month });
				//var range = getDateRange(params.year, params.month);
				//if (range) FlowRouter.setParams({date: range});
			}
			render(route === 'blogPost' && params.slug ? 'blogPostWrapper' : 'blogList');
		}

		function render(template) {
			if (Blog.config('templates.layout')) {
				var section = Blog.config('templates.layoutTarget') || 'main';
				var opts = {};
				opts[section] = template;
				BlazeLayout.render(Blog.config('templates.layout'), opts);
			}
			else BlazeLayout.render(template);
		}
	}

})();
