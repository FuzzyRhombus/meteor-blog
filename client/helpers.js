var momentLocaleDep = new Tracker.Dependency();

Meteor.startup(function () {
	Tracker.autorun(function () {
		var locale = Session.get('locale') || Blog.config('defaultLocale');
		if (locale) {
			if (locale !== Session.get('locale')) return Session.set('locale', locale);
			TAPi18n.setLanguage(locale)
				.fail(function (error_message) {
					      console.log('ERROR setting language: ' + error_message);
				      })
				.done(function () {

				      });
			var momentConfig = $.parseJSON(TAPi18n.__("moment"));
			moment.locale(locale, momentConfig);
			momentLocaleDep.changed();
		}
	});
});

Blaze.TemplateInstance.prototype.findParent = function (templateName) {
	var view = this.view,
		regex = new RegExp(templateName+'$');
	while (view && view.name) {
		if (regex.test(view.name)) {
			return view.templateInstance && view.templateInstance();
		}
		view = view.parentView;
	}
	return null;
};

Template.registerHelper('isChildOf', function (parent) {
	return parent && !!Template.instance().findParent(parent);
});

Template.registerHelper('prettifyDate', function (date) {
	momentLocaleDep.depend();
	return moment(date).calendar();
});

Template.registerHelper('authorLoggedIn', function () {
	var user = Meteor.user();
	if (!user) return false;
	var roles = Blog.config('roles');
	return Roles.userIsInRole(user, roles.admin) || (Roles.userIsInRole(user, roles.author) && (!this.created_by || user._id === this.created_by));
});

Template.registerHelper('blogPathFor', function (path) {
	switch (path) {
		case 'base':
			return blogPaths.base;
		default:
		case 'post':
			var post = this;
			if (!post) return '';
			if (!post._id && _.isString(post)) post = BlogPosts.findOne(post);
			return '/'+blogPaths.getPathForPost(post);
	}
});

setHtmlMeta = function (data) {
	// Will have to rely on spiderable or similar to handle requests for indexing
	if (!data || !(data.title && data.description)) throw new Meteor.Error('bad params');
	document.title = data.title;
	data.image = window.location.hostname + '/' + Blog.config('public.image');
	data.url = data.url || window.location.href;
	data.type = data.url ? 'blog' : 'article';
	_.each(data, function (val, key) {
		$('meta[name="' + key + '"]').remove();
		$('head').append('<meta name="' + key + '" content="' + val + '">');

		$('meta[property="og:' + key + '"]').remove();
		$('head').append('<meta property="og:' + key + '" content="' + val + '">');
	});
};

getPostParamId = function (param, post) {
	var id = this._id || post._id || post;
	return 'blog-' + id + '.' + param;
};
