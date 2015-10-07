(function () {
  'use strict';

  var blogSub = Meteor.subscribe('blog.posts');

  Router.map(function () {
    this.route('blogList', {
      path: getBaseBlogPath(),
      layoutTemplate: 'blogListLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogList');
      },
      data: function () {
        var sort = Blog.config('sortBy');
        return BlogPosts.find({archived: false}, {sort: sort ? sort : {date: -1}});
      }
    });

    this.route('blogListArchive', {
      path: getBaseArchivePath(),
      layoutTemplate: 'blogListLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogList');
      },
      data: function () {
        var sort = Blog.config('sortBy');
        return BlogPosts.find({archived: true}, {sort: sort ? sort : {date: -1}});
      }
    });

    this.route('blogPost', {
      path: getBlogPostPath(':shortId', ':slug'),
      layoutTemplate: 'blogPostLayout',
      action: function () {
        this.wait(blogSub);
        this.render('blogPost');
      },
      data: function () {
        if (this.ready()) {
          var blog  = BlogPosts.findOne({slug: this.params.slug});
          if (blog) {
            blog.loaded = true;
            return blog;
          }
          this.render('not-found')
        }
      }
    });

  });
})();
