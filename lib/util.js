//'use strict';

if (!String.prototype.capitalizeFirstLetter) {
	String.prototype.capitalizeFirstLetter = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
}

getDateRange = function (year, month) {
	if (!year) return null;
	var addMonth = !!month;
	year = parseInt(year);
	month = parseInt(month || 1);

	if (year < 0) year = -year;
	if (month < 0) month = -month;
	if (month > 12) month = 1;

	return {
		$gte: new Date(year + '-' + month),
		$lt: new Date((year+!addMonth) + '-' + ((month+addMonth)%12 || 12))
	};
};

var imageTypes = {
	'image/jpeg': ['jpg', 'jpeg'],
	'image/png': 'png',
	'image/gif': 'gif'
};

ext2mime = function (ext) {
	return _.chain(imageTypes)
		.map(function (type, key) {
	        if (_.isArray(type)) return _.map(type, function (t) { return { ext: t, mime: key }; });
			return { ext: type, mime: key };
        })
		.flatten()
		.filter(function (map) { return map.ext === ext.toLowerCase(); })
		.map(function (map) { return map.mime; })
		.value();
};

mime2ext = function (mime) {
	return imageTypes[mime.toLowerCase()] || '';
};
