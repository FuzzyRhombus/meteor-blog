insertImage = function (cb) {
	var callback = cb || function () {};
	return function (event, template) {
		var files = event.originalEvent.dataTransfer.files;
		if (!(files && files.length)) return;
		var file = files[0];
		// Validate and resize
		var config = Blog.config('pictures');
		if (file.size >  config.maxSize || !mime2ext(file.type).length) return;
		var post = this;
		processImage(file, config.maxWidth, config.maxHeight, function (b64) {
			var buffer = b64ToBuffer(b64.substring(b64.indexOf(',') + 1));
			var fd = {
				name: file.name,
				type: file.type,
				size: buffer.length,
				originalSize: file.size,
				buffer: buffer
			};
			(Blog.config('pictures.storage') ? uploadPictureLocal : uploadPictureCloud).call(post, fd, callback);
		});
	}
};

function b64ToBuffer (data) {
	data = atob(data);
	var length = data.length;
	var buffer = new Uint8Array(length);
	for (var i=0;i<data.length;++i) buffer[i] = data.charCodeAt(i);
	return buffer;
}

function uploadPictureLocal (file, callback) {
	var post = this;
	file.buffer = EJSON.toJSONValue(file.buffer);
	Meteor.call('uploadBlogPicture', file, function (err, res) { callback.call(post, err, res); });
}

function uploadPictureCloud (file, callback) {
	var config = Blog.config('pictures.cloud'),
		post = this;
	if (!config) callback.call(this, true);
	var uploader = new Slingshot.Upload(config);
	uploader.send(file, function (err, res) { callback.call(post, err, res); });
}
