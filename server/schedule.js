schedulePost = function (post) {
	if (!Blog.config('allowScheduling')) return;

	var jobName = 'post_'+post._id;
	if (SyncedCron.nextScheduledAtDate(jobName)) SyncedCron.remove(jobName);
	logger.log('verbose', 'Scheduling blog post', post);
	SyncedCron.add({
		name: jobName,
		schedule: function (parser) {
			return parser.recur().on(post.published_at).fullDate()
		},
		job: function () {
			BlogPosts.update({_id: post._id}, {$set: {published:true}});
		}
	});
};

unschedulePost = function (post) {
	var jobName = 'post_'+post._id;
	if (SyncedCron.nextScheduledAtDate(jobName)) {
		logger.log('verbose', 'Unscheduling blog post', post);
		SyncedCron.remove(jobName);
	}
};

Meteor.startup(function () {
	if (Blog.config('allowScheduling')) {
		// Find any posts that are currently scheduled, and cron them
		var scheduledPosts = BlogPosts.find({published: false, published_at: {$gt: new Date()}}).fetch();
		_.each(scheduledPosts, function (post) {
			schedulePost(post);
		});

		SyncedCron.config({
			logger: function (options) {
				logger.log(options.level, options.tag + ': ' + options.message);
			}
		});
		SyncedCron.start();
	}
});
