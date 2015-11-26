Blog = (function () {

	// Default blog configuration
	var defaultSettings = {
		routes: {
			base: 'blog',
			category: 'category',
			tag: 'tag',
			author: 'author',
			pictures: 'content',
			rss: 'feed'
		},
		templates: {
			layout: '',
			layoutTarget: '',
			post: '',
			listPost: ''
		},
		roles: {
			admin: 'admin',
			author: 'blog-author'
		},
		pictures: {
			maxWidth: 800,
			maxHeight: 800,
			maxSize: 5242880,
			storage: true,
			cloud: null
		},
		server: {
			localImagePath: '.blog-images'
		},
		public: {
			image: 'packages/rydm_blog/public/blank.png'
		},
		rss: {
			limit: 20
		},
		allowScheduling: true,
		showSummary: true,
		enableArchive: true,
		defaultLocale: 'en',
		sortBy: { published_at: -1 }
	};

	function getValue (object, key) {
		var ids = key.split('.');
		var o = object && object[ids.shift()];
		_.each(ids, function(id) {
			if (!!o) o = o[id];
		});
		return o;
	}

	if (Meteor.isServer) {

		var flatten = Npm.require('flat');

		function config (key, value, swap) {
			if (swap) {
				swap = key;
				key = value;
				value = swap;
			}
			if (!key) return null;
			if (_.isObject(key)) {
				return _.each(flatten(key), config);
			}
			var settings = BlogSettings.findOne({}, {sort:{updated_at:-1}});
			var currentValue = getValue(settings, key);
			if (_.isUndefined(value)) return currentValue;
			if (!_.isUndefined(currentValue) && currentValue !== value) {
				currentValue = {
					updated_at: new Date()
				};
				currentValue[key] = value;
				BlogSettings.update({_id:settings._id}, {$set: currentValue});
			}
			return null;
		}

		Meteor.startup(function () {
			// Create default settings
			var count = BlogSettings.find().count();
			if (!count) BlogSettings.insert(_.extend({ updated_at: new Date() }, defaultSettings));
			else {
				var settings = BlogSettings.findOne({}, {sort:{updated_at:-1}});
				if (count > 1) {
					logger.warn('Duplicate blog settings found - removing all but the latest');
					BlogSettings.remove({_id: {$ne: settings._id }});
				}
				settings = _.extend(_.clone(defaultSettings), settings);
				BlogSettings.update({_id: settings._id}, settings);
				// If settings were passed through Meteor.settings, update them now
				if (Meteor.settings.blog) {
					logger.log('verbose', 'Meteor settings for blog found, applying them...');
					config(Meteor.settings.blog);
				}
			}
		});

		Meteor.publish('blog.settings', function () {
			return BlogSettings.find({}, { sort: {updated_at: -1}, limit: 1, fields: {server: 0, rss: 0}});
		});

		return {
			config: config
		};
	}

	if (Meteor.isClient) {
		Meteor.subscribe('blog.settings');

		var config = function (key) {
			if (!key) return null;
			var settings = BlogSettings.findOne();
			return getValue(settings, key);
		};

		Template.registerHelper('blogConfig', config);

		return {
			config: config
		};
	}

}());
