function buildPostQuery() {
	var slug = FlowRouter.getParam('slug');
	var query = {
		slug: slug
	};
	if (Blog.config('enableArchive')) {
		var range = getDateRange(FlowRouter.getParam('year'), FlowRouter.getParam('month'));
		query['$or'] = [
			{ published_at: range },
			{ created_at: range}
		];
	}
	return query;
}

function isModified (post) {
	return post._draft && _.some(['title', 'content', 'summary'], function (key) { return post._draft[key] !== post[key]; });
}

Template.blogPostWrapper.onCreated(function () {
	var self = this;
	this.loaded = false;
	self.autorun(function () {
		var query = buildPostQuery();
		self.subscribe('blog.posts', query);
	});
});

Template.blogPostWrapper.onRendered(function () {
	var self = this;
	$(document).ready(function () {
		self.$('.tooltipped').tooltip();
	});
});

Template.blogPostWrapper.helpers({
	post: function () {
		var query = buildPostQuery();
		var post = BlogPosts.findOne(query);
		var instance = Template.instance();
		if (instance.subscriptionsReady() && !instance.loaded && !post) return FlowRouter.withReplaceState(function () {
			FlowRouter.go('blogBase');
		});
		if (post) {
			instance.loaded = true;
			post._draft = _.clone(post);
			post._param = getPostParamId;
			setHtmlMeta({
				title: post.title,
				description: post.summary || post.content.substr(0,180)
			});
		}
		return post;
	},
	postTemplate: function () {
		return Blog.config('templates.post') || 'blogPostDefault';
	}
});

Template.blogPostWrapper.events({
	'click [contenteditable], focus *[contenteditable]': function startEditing (event) {
		var $el = $(event.currentTarget);
		if ($el.data('editing')) return;
		$el.addClass('editing').data('editing', true).tooltip('remove');
		event.currentTarget.innerText = this[event.currentTarget.id];
	},
	'click #md-content' : function (event) {
		var $elem = $(event.currentTarget),
			$content = $('#content');
		if (Blaze._globalHelpers.authorLoggedIn.call(this) && Session.get(this._param('controls')) && !$elem.data('editing')) {
			$elem.data('editing', true).width('49%').tooltip('remove');
			$content.show().focus();
		}
	},
	'keydown [contenteditable]': function (event) {
		// Disable tabbing focus
		if (event.keyCode === 9) event.preventDefault();
	},
	'keyup [contenteditable], change [contenteditable], dropped [contenteditable]': function update (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var element = ev.currentTarget;
		if (ev.keyCode == 27)
			return $(element).blur();
		this[element.id] = element.innerText;
		if (element.id === 'content') Template.instance()._mdDep.changed();
		Session.set(this._param('modified'), isModified(this));
	},
	'blur [contenteditable]': function stopEditing (ev) {
		var element = ev.currentTarget;
		var $el = $(element);
		$el.data('editing', false).removeClass('editing').tooltip();
		if (this[element.id] !== element.innerText) Session.set(this._param('modified'), isModified(this));
		this[element.id] = element.innerText;
		if (element.id === 'content') {
			$('#md-content').data('editing', false).width('100%').tooltip();
			$el.hide();
		}
	},
	'dropped #content': insertImage(function (err, url) {
		if (!err && url) {
			var el = $('#content')[0],
				matches = this.content.replace(/\<br\/{0,1}\>/ig, '\n').match(/^\[img\d+\]:.*$/gim),
				tag = '<br/>[img' + (+(matches && matches.length) + 1) + ']: ' + url;
			this.content += tag;
			el.innerHTML += tag;
			el.focus();
			Template.instance()._mdDep.changed();
			Session.set(this._param('modified'), isModified(this));
		}
	})
});
