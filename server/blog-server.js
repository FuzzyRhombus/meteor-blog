(function () {
	'use strict';
	var fs = Npm.require('fs'),
		path = Npm.require('path'),
		mkdirp = Npm.require('mkdirp'),
		url = Npm.require('url');

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

	function uploadPicture (file) {
		// Validate it is is an image
		var config = Blog.config('pictures');
		if (!config.storage) throw new Error('Local storage is disabled');
		var types = mime2ext(file.type);
		if (!types.length) throw new Meteor.Error('invalid type');
		var buffer = EJSON.fromJSONValue(file.buffer);
		if (file.size !== buffer.length) throw new Meteor.Error('invalid size');
		// Ensure within max sizes, resize if necessary
		if (file.size > config.maxSize || file.width > config.maxWidth || file.height > config.maxHeight)
			throw new Meteor.Error('image is too large');

		var name = Random.id().toLowerCase(),
		    type = types[0],
			filename = name + '.' + type,
			savePath = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'), filename);
		fs.writeFileSync(savePath, new Buffer(buffer), 'binary');

		var routes = Blog.config('routes');
		return path.join('/', routes.base, routes.pictures, filename);
	}

	Meteor.methods({
		'insertBlogPost': ensureAuthenticated(insertBlogPost),
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

	function getPicture (req, res) {
		if (!Blog.config('pictures.storage')) return;
		var name = req.url.replace(/\/|\\|\.{1,2}\//ig, '').toLowerCase(),
			ext = path.extname(name).replace('.', ''),
			mimes = ext2mime(ext);
		// if not GET or can't find valid file, 404
		if (req.method.toUpperCase() !== 'GET' || !(name.length && ext && mimes.length)) return errorResponse(res);
		var filename = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'), name);
		fs.stat(filename, function (err, stat) {
			if (!err && stat.isFile()) {
				res.writeHead(200, {
					'Content-Type': _.isArray(mimes) ? mimes[0] : mimes,
					'Content-Disposition': 'inline;filename='+name
				});
				var stream = fs.createReadStream(filename);
				return stream.pipe(res);
			}
			errorResponse(res);
		});
	}

	function errorResponse (res) {
		res.statusCode = 404;
		res.end();
	}

	Meteor.startup(function () {
		if (!!process.env.AUTO_RESET && process.env.NODE_ENV === 'development') {
			BlogPosts.remove({});
			BlogSettings.remove({});
		}

		if (Blog.config('pictures.storage')) {
			var imgPath = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'));
			if (!fs.existsSync(imgPath)) mkdirp.sync(imgPath);

			var routes = Blog.config('routes');
			if (routes) {
				var route = path.join('/', routes.base, routes.pictures);
				RoutePolicy.declare(route, 'network');
				WebApp.connectHandlers.use(route, getPicture);
			}
		}
	});

})();
