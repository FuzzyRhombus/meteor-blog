Package.describe({
	name: 'rydm:blog',
	summary: 'A lean and highly configurable, fully featured blog that uses Markdown',
	version: '0.1.0',
	git: '',
	documentation: ''
});

Npm.depends({
	flat: '1.6.0',
	mkdirp: '0.5.1',
	rss: '1.2.0',
	'remove-markdown': '0.0.6'
});

Package.onUse(function (api) {
	api.versionsFrom('1.2');

	var clientServer = ['client', 'server'];

	api.use(['meteor-platform@1.2.0']);
	api.use(['spiderable@1.0.5']);
	api.use(['reactive-var@1.0.3'], clientServer);
	api.use(['email@1.0.5']);
	api.use(['markdown']);
	api.use(['routepolicy']);

	api.use([
		'kadira:flow-router@2.7.0',
		'kadira:blaze-layout@2.1.0',
		'arillo:flow-router-helpers@0.4.5',
		'momentjs:moment@2.0.0',
		'alanning:roles@1.2.13',
		'aldeed:collection2@2.5.0',
		'tap:i18n@1.3.1',
		'edgee:slingshot@0.4.1',
		'infinitedg:winston@0.7.3'
	], clientServer);

	api.use([
		'percolate:synced-cron@1.3.0'
	], ['server']);

	api.use([
		'simple:highlight.js@1.2.0',
		'fortawesome:fontawesome@4.2.0_2',
		'cfs:dropped-event@0.0.10',
		'ccorcos:clientside-image-manipulation@1.0.3',
	    'materialize:materialize@0.97.2',
		'fourseven:scss@3.4.1'
	], ['client']);

	// Common
	api.addFiles([
		'lib/util.js',
		'lib/blog-collections.js',
		'lib/blog.js',
		'lib/schema.js',
		'lib/blog-paths.js',
		'package-tap.i18n'  // package-tap.i18n must be loaded before the templates,
	], clientServer);

	// Server
	api.addFiles([
		'server/log.js',
		'server/publish.js',
		'server/schedule.js',
		'server/rss.js',
		'server/image.js',
		'server/admin.js',
		'server/blog-server.js'
	], 'server');

	// Client
	api.addFiles([
		'client/head.html',
		'client/templates/components.html',
		'client/templates/list.html',
	    'client/templates/post.html',
		'client/templates/controls.html',
		'client/helpers.js',
		'client/image-upload.js',
		'client/post/controls.js',
		'client/post/components.js',
		'client/post/post.js',
		'client/list.js',
		'client/routes.js',
	    'client/style.scss'
	], 'client');

	api.addAssets([
		'public/blank.png',
	    'client/style.scss' // expose for @import in scss files
	], 'client');

	// List languages files so Meteor will watch them and rebuild package as they change.
	// Languages files must be loaded after the templates
	// otherwise the templates won't have the i18n capabilities (unless
	// you'll register them with tap-i18n yourself).
	api.addFiles([
		"i18n/en.i18n.json"
	], clientServer);

	api.imply('kadira:flow-router');
	api.imply('kadira:blaze-layout');
	api.export('Blog', clientServer);
});
