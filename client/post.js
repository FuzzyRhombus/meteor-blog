var mdContentDep = new Tracker.Dependency(),
	modifiedDep = new Tracker.Dependency();

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

Template.blogPost.onCreated(function () {
	var self = this;
	self.autorun(function () {
		var query = buildPostQuery();
		self.subscribe('blog.posts', query);
	});
});

Template.blogPost.onRendered(function () {
});

Template.blogPost.events({
	'click [contenteditable], focus *[contenteditable]': function startEditing (ev) {
		var $el = $(ev.currentTarget);
		if ($el.data('editing')) return;
		$el.addClass('editing');
		$el.data('editing', true);
		ev.currentTarget.innerText = this[ev.currentTarget.id];
	},
	'click #md-content' : function (event) {
		var $elem = $(event.currentTarget);
		if (Blaze._globalHelpers.authorLoggedIn.call(this) && !$elem.data('editing')) {
			$elem.data('editing', true);
			$('#content').show();
			$('#content').focus();
		}
	},
	'keyup [contenteditable]': function update (ev) {
		ev.preventDefault();
		ev.stopPropagation();
		var element = ev.currentTarget;
		if (ev.keyCode == 27) {
			$(element).blur();
			return;
		}
		this[element.id] = element.innerText;
		if (element.id === 'content') mdContentDep.changed();
		modifiedDep.changed();
	},
	'blur [contenteditable]': function stopEditing (ev) {
		var element = ev.currentTarget;
		var $el = $(element);
		$el.data('editing', false);
		$el.removeClass('editing');
		this[element.id] = element.innerText;
		if (element.id === 'content') {
			$('#md-content').data('editing', false);
			$el.hide();
		}
	},
	'dropped #content': insertImage( function (err, url) {
		if (!err && url) {
			var el = $('#content')[0];
			var matches = this.content.replace(/\<br\/{0,1}\>/ig, '\n').match(/^\[img\d+\]:.*$/gim);
			var tag = '<br/>[img' + (+(matches && matches.length) + 1) + ']: ' + url;
			this.content += tag;
			el.innerHTML += tag;
			el.focus();
			mdContentDep.changed();
			modifiedDep.changed();
		}
	}),
	'click button#saveBtn': function save () {
		if (this.published) {
			var userIsSure = confirm(TAPi18n.__("confirm_save_published"));
			if (!userIsSure) {
				return;
			}
		}
		if (_.some(['title', 'summary', 'content'], function (key) { return draft[key] !== this[key]; }, this)) {
			Meteor.call('updateBlogPost', this, function (err, post) {
				if (!err) {
					modifiedDep.changed();
					if (FlowRouter.getParam('slug') !== post.slug)
						FlowRouter.withReplaceState(function () {
							FlowRouter.setParams({slug: post.slug});
						});
				}
			});
		}
	}
});

Template.blogPost.helpers({
	post: function () {
		var query = buildPostQuery();
		var post = BlogPosts.findOne(query);
		if (Template.instance().subscriptionsReady() && !post) return FlowRouter.withReplaceState(function () {
			FlowRouter.go('blogBase');
		});
		if (post) {
			draft = _.clone(post);
			setHtmlMeta({
				title: post.title,
				description: post.summary || post.content.substr(0,180)
			});
		}
		return post;
	},
	content: function () {
		mdContentDep.depend();
		return this.content;
		//return Showdown.converter().makeHtml(this.content);
	},
	contenteditable: function () {
		return Blaze._globalHelpers.authorLoggedIn.call(this) ? 'contenteditable' : null;
	},
	modified: function () {
		modifiedDep.depend();
		return draft && _.some(['title', 'content', 'summary'], function (key) { return draft[key] !== this[key]; }, this);
	}
});