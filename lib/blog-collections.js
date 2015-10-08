BlogSettings = new Mongo.Collection('blog.settings');
BlogPosts = new Mongo.Collection('blog.posts', {
	transform: function (post) {
		post.date = (post.published && post.published_at) || post.created_at;
		return post;
	}
});