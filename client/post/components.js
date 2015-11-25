var helpers = {
	authorName: getAuthorName,
	isEdited: function () {
		return this.published && this.updated_at && this.updated_at > this.date;
	},
	content: function () {
		var postWrapper = Template.instance().findParent('blogPostWrapper');
		postWrapper && postWrapper._mdDep && postWrapper._mdDep.depend();
		return this.content;
	},
	showSummary: function () {
		return Blog.config('showSummary') && (Blaze._globalHelpers.authorLoggedIn.call(this) || !!Template.instance().findParent('blogList'));
	},
	contenteditable: function () {
		if (Blaze._globalHelpers.authorLoggedIn.call(this) && !Template.instance().findParent('blogList') && Session.get(this._param('controls'))) return 'contenteditable';
		return null;
	},
	authorTip: function (label) {
		if (Blaze._globalHelpers.authorLoggedIn.call(this) && !Template.instance().findParent('blogList')) {
			return {
				class: 'tooltipped',
				'data-position': 'top',
				'data-tooltip': TAPi18n.__('label_'+label)
			};
		}
		return null;
	}
};

_.chain(Template)
	.keys()
	.filter(function (key) { return /blogPost[^Default]+/.test(key) && Blaze.isTemplate(Template[key]); })
	.map(function (key) { return Template[key]; })
	.each(function (template) {
	         template.helpers(helpers);
	});
