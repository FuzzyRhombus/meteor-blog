
var blogPostSchema = new SimpleSchema({
	published: {
		type: Boolean
	},
	archived: {
		type: Boolean
	},
	title: {
		type: String,
		index: 1,
		unique: true
	},
	summary: {
		type: String,
		defaultValue: 'Summary goes here'
	},
	content: {
		type: String,
		defaultValue: 'Content goes here'
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
	shortId: {
		type: String
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
