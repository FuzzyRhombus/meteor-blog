var fs = Npm.require('fs'),
	path = Npm.require('path'),
	url = Npm.require('url');

uploadPicture = function uploadPicture (file) {
	// Validate it is is an image
	var config = Blog.config('pictures');
	if (!config.storage) throw new Error('Local storage is disabled');
	var types = mime2ext(file.type);
	if (!types.length) throw new Meteor.Error('invalid type');
	var buffer = EJSON.fromJSONValue(file.buffer);
	if (file.size !== buffer.length) throw new Meteor.Error('invalid size');
	// Ensure within max sizes, resize if necessary
	if (file.size > config.maxSize || file.width > config.maxWidth || file.height > config.maxHeight)
		throw new Meteor.Error('image is too large');

	var name = Random.id().toLowerCase(),
		type = types[0],
		filename = name + '.' + type,
		savePath = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'), filename);
	fs.writeFileSync(savePath, new Buffer(buffer), 'binary');

	var routes = Blog.config('routes');
	return path.join('/', routes.base, routes.pictures, filename);
};

getPicture = function getPicture (req, res) {
	if (!Blog.config('pictures.storage')) throw new Error('disabled');
	var name = req.url.replace(/\/|\\|\.{1,2}\//ig, '').toLowerCase(),
		ext = path.extname(name).replace('.', ''),
		mimes = ext2mime(ext);
	// if not GET or can't find valid file, 404
	if (req.method.toUpperCase() !== 'GET' || !(name.length && ext && mimes.length)) throw new Error('invalid request');
	var filename = path.join(process.env.PWD || process.cwd(), Blog.config('server.localImagePath'), name);
	logger.log('verbose', 'Request for blog image', {url: req.url, filename: filename});
	var stat = fs.statSync(filename);
	if (stat && stat.isFile()) {
		res.writeHead(200, {
			'Content-Type': _.isArray(mimes) ? mimes[0] : mimes,
			'Content-Disposition': 'inline;filename='+name
		});
		var stream = fs.createReadStream(filename);
		return stream.pipe(res);
	}
	throw new Error('file not found');
};
