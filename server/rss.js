var rss = Npm.require('rss'),
	path = Npm.require('path'),
	rmMd = Npm.require('remove-markdown');

var rssFeed,
	rssXml = null;

var generateRss = function (type, post) {
	rssFeed = rssFeed || new rss({
			title: TAPi18n.__("title", null, Blog.config('defaultLocale')) || 'Blog',
			description: TAPi18n.__("description", null, Blog.config('defaultLocale')) || 'Blog',
			feed_url: Meteor.absoluteUrl(path.join(Blog.config('routes.base'), Blog.config('routes.rss'))),
			site_url: Meteor.absoluteUrl(),
			image_url: Meteor.absoluteUrl(Blog.config('public.image'))
		});

	switch (type.toLowerCase()) {
		case 'add':
			rssFeed.item({
				title: post.title,
				description: Blog.config('showSummary') ? post.summary : rmMd(post.content).substr(0, 180),
				date: post.published_at,
				author: getAuthorName(post.created_by),
				url: Meteor.absoluteUrl(blogPaths.getPathForPost(post))
			});
			rssFeed.items[rssFeed.items.length-1]._id = post._id;   // use instead of guid to preserve permalinks
			break;
		case 'remove':
			var index = rssFeed.items.indexOf(_.find(rssFeed.items, function (item) { return item._id === post._id; }) || {});
			if (index >= 0) rssFeed.items.splice(index, 1);
			break;
		case 'update':
			var item = _.find(rssFeed.items, function (item) { return item._id === post._id });
			if (item) {
				item.title = post.title;
				item.description = Blog.config('showSummary') ? post.summary : rmMd(post.content).substr(0, 180);
				item.date = post.published_at;
				item.author = getAuthorName(post.created_by);
				item.url = Meteor.absoluteUrl(blogPaths.getPathForPost(post));
			}
	}
	rssXml = rssFeed.xml({indent:'\t'});
};

getRssFeed = function (req, res) {
	if (req.method.toLowerCase() !== 'get' || req.url !== '/' || !(rssXml && rssXml.length)) throw new Error('invalid request');
	logger.log('verbose', 'Request for RSS feed');
	res.writeHead(200, {
		'Content-Type': 'application/rss+xml'
	});
	res.write(rssXml || '');
	res.end();
};

initRss = function () {
	var rssLimit = Blog.config('rss.limit');
	if (rssLimit) {
		BlogPosts.find({
				published: true,
				published_at: { $lte: new Date() }
			},
			{
				sort: { published_at: -1 },
				limit: rssLimit
			})
			.observe({
				added: function (doc) { generateRss.call(this, 'add', doc); },
				changed: function (doc) { generateRss.call(this, 'update', doc); },
				removed: function (doc) { generateRss.call(this, 'remove', doc); }
			});
	}
	return !!rssLimit;
};
