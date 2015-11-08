Blog = (function () {

	// Default blog configuration
	var defaultSettings = {
		routes: {
			base: 'blog',
			category: 'category',
			tag: 'tag',
			author: 'author',
			pictures: 'content'
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
			var settings = BlogSettings.findOne();
			var currentValue = getValue(settings, key);
			if (_.isUndefined(value)) return currentValue;
			if (!_.isUndefined(currentValue) && currentValue !== value) {
				currentValue = {};
				currentValue[key] = value;
				BlogSettings.update({_id:settings._id}, {$set: currentValue});
			}
			return null;
		}

		Meteor.startup(function () {
			// Create default settings
			if (BlogSettings.find().count() === 0) {
				BlogSettings.insert(defaultSettings);
			}
			// If settings were passed through Meteor.settings, update them now
			if (Meteor.settings.blog && BlogSettings.find().count() > 0) {
				console.log('meteor settings found');
				config(Meteor.settings.blog);
			}
		});

		Meteor.publish('blog.settings', function () {
			return BlogSettings.find({}, {fields: {
				routes: 1,
				roles: 1,
				defaultLocale: 1,
				enableArchive: 1,
				showSummary: 1,
				sortBy: 1,
				public: 1,
				pictures: 1
			}});
		});

		return {
			config: config
		}
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
