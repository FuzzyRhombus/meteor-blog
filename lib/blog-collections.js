BlogSettings = new Mongo.Collection('blog.settings');
BlogPosts = new Mongo.Collection('blog.posts', {
	transform: function (post) {
		post.date = (post.published && post.published_at) || post.created_at;
		var date = moment(post.date);
		post.year = date.year();
		post.month = ('0' + (date.month()+1)).slice(-2);
		return post;
	}
});
