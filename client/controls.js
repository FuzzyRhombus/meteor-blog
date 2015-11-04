var scheduleDate;

Template.blogControls.helpers({
	isScheduled: function () {
		return this.published && this.published_at > new Date();
	},
	scheduleDate: function () {
		return Session.get('post-schedule-date');
	}
});

Template.blogControls.events({
	'click button.rydm-btn.rydm-publish': function (event) {
		var publish = !this.published;
		if (!confirm(TAPi18n.__('confirm_'+(publish ? 'publish' : 'unpublish')))) return;
		var date = publish && event.currentTarget.id === 'schedulePostBtn' && scheduleDate;
		debugger;
		Meteor.call('setPostPublished', {_id:this._id, publish: publish, date: date}, function (err, date) {
			if (!err && date && FlowRouter.current().route.name !== 'blogBase') {
				if (FlowRouter.getParam('month') !== date.month || FlowRouter.getParam('year') !== date.year)
					FlowRouter.withReplaceState(function () {
						FlowRouter.setParams({year: date.year, month: date.month});
					});
			}
		});
	},
	'click button#deletePostBtn': function () {
		var input = prompt(TAPi18n.__("confirm_delete"));
		if (input === TAPi18n.__("confirm_delete_YES")) {
			Meteor.call('deleteBlogPost', this, function (err) {
				if (!err && FlowRouter.current().route.name !== 'blogBase') FlowRouter.go('blogBase');
			});
		}
	},
	'blur input.sched': function (event) {
		scheduleDate = new Date(event.currentTarget.value);
		Session.set('post-schedule-date', scheduleDate);
	}
});
