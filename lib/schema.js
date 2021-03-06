
var blogPostSchema = new SimpleSchema({
	published: {
		type: Boolean
	},
	title: {
		type: String,
		index: 1,
		//unique: true
	},
	summary: {
		type: String,
		defaultValue: 'summary',
		optional: true,
		max: 128
	},
	content: {
		type: String,
		defaultValue: 'content'
	},
	content_render: {
		type: String,
		defaultValue: '',
		optional: true,
		index: 1
	},
	slug: {
		type: String,
		index: 1,
		unique: true
	},
	created_by: {
		type: String,
		index: 1
	},
	updated_by: {
		type: String
	},
	created_at: {
		type: Date,
		defaultValue: new Date(),
		index: 1
	},
	updated_at: {
		type: Date,
		defaultValue: new Date(),
		index: 1
	},
	published_at: {
		type: Date,
		defaultValue: null,
		optional: true,
		index: 1
	}
});

BlogPosts.attachSchema(blogPostSchema);
