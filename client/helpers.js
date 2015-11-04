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

Template.registerHelper('formatDate', function (date) {
	momentLocaleDep.depend();
	return moment(date).calendar();
});

Template.registerHelper('authorName', function (userId) {
	var user = Meteor.users.findOne(userId);
	if (!user) return 'Unknown';
	var name = user.profile.first_name + ' ' + user.profile.last_name;
	return (user.profile.display_name || name || user.profile.name || 'Unknown').trim();
});

Template.registerHelper('isEdited', function () {
	return this.published && this.updated_at && this.updated_at > this.date;
});

Template.registerHelper('authorLoggedIn', function () {
	var user = Meteor.user();
	if (!user) return false;
	var roles = Blog.config('roles');
	return Roles.userIsInRole(user, roles.admin) || (Roles.userIsInRole(user, roles.author) && (!this.created_by || user._id === this.created_by));
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
