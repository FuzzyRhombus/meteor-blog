Template.blogControls.onRendered(function () {
	var self = this;
	$(document).ready(function(){
		$('.blog-post .tooltipped').tooltip({ delay: 100 });
		self.$('.modal-trigger').leanModal({});
	});
	var minDate = moment().add(-moment().zone(), 'm').set('s', 0).set('ms', 0);
	Session.set('post-schedule-date', minDate.toDate());
	$('input.schedule').attr('min', minDate.toISOString().replace('Z','')).val(minDate.toISOString().replace('Z',''));
});

Template.blogControls.onCreated(function () {
	if (!this.data) return;
	var postWrapper = this.findParent('blogPostWrapper');
	this.data._param = this.data._param || getPostParamId;
	if (postWrapper) postWrapper._mdDep = new Tracker.Dependency();
	Session.set(this.data._param('controls'), !!postWrapper);
	Session.set(this.data._param('modified'), false);
});

Template.blogControls.helpers({
	isScheduled: function () {
		return !this.published && this.published_at > new Date();
	},
	scheduleDateValid: function () {
		return (Session.get('post-schedule-date') < new Date() ? 'disabled' : '');
	},
	noticeColor: function () {
		if (this.published) return 'orange';
		if (this.published_at > new Date()) return 'blue';
		return 'green';
	},
	modifiedClass: function () {
		return Session.get(this._param('modified')) && !Template.instance().findParent('blogList') ? '' : 'hide-collapse';
	},
	showControls: function () {
		return Session.get(this._param('controls')) ? '' : 'hide-collapse';
	}
});

function onPublish (err, date) {
	if (!err && date && FlowRouter.current().route.name !== 'blogBase') {
		var slug = FlowRouter.getParam('slug'),
			newSlug = this.slug;
		if (FlowRouter.getParam('month') !== date.month || FlowRouter.getParam('year') !== date.year || (newSlug && newSlug !== slug))
			FlowRouter.withReplaceState(function () {
				FlowRouter.setParams({year: date.year, month: date.month, slug: newSlug || slug});
			});
	}
}

Template.blogControls.events({
	'click .rydm-publish': function (event) {
		var publish = !this.published;
		var date = publish && event.currentTarget.id === 'schedulePostBtn' && Session.get('post-schedule-date');
		publish = (event.currentTarget.id === 'cancelScheduleBtn') ? false : publish;
		//if (date && date < new Date()) date = null;
		var opts = {_id:this._id, publish: publish, date: date};
		// If this post has been modified, save changes first
		if (publish && Session.get(this._param('modified'))) {
			Meteor.call('updateBlogPost', this, function (err, post) {
				if (!err && post)
					Meteor.call('setPostPublished', opts, function (e, d) { onPublish.call(post, e, d); });
			});
		}
		else Meteor.call('setPostPublished', opts, onPublish);
	},
	'click #deleteConfirmBtn': function () {
		Meteor.call('deleteBlogPost', this, function (err) {
			if (!err && FlowRouter.current().route.name !== 'blogBase') FlowRouter.go('blogBase');
		});
	},
	'change input.schedule': function (e, t) {
		var date = moment($(e.currentTarget).val()).set('s', 0).set('ms', 0);
		Session.set('post-schedule-date', date.toDate());
	},
	'click #saveBtn': function () {
		var paramId = this._param('modified');
		if (Session.get(paramId)) {
			Meteor.call('updateBlogPost', this, function (err, post) {
				if (!err && post) {
					Session.set(paramId, false);
					if (FlowRouter.getParam('slug') !== post.slug)
						FlowRouter.withReplaceState(function () {
							FlowRouter.setParams({slug: post.slug});
						});
				}
			});
		}
	},
	'click #showControls': function () {
		var paramId = this._param('controls');
		var show = !Session.get(paramId);
		$('.blog-post .tooltipped').tooltip(show ? '' : 'remove');
		Session.set(paramId, show);
	}
});
