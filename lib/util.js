//'use strict';

if (!String.prototype.capitalizeFirstLetter) {
	String.prototype.capitalizeFirstLetter = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
}

getDateRange = function (year, month) {
	if (!year) return null;
	var unit = !!month ? 'month' : 'year';
	year = parseInt(year);
	month = parseInt(month || 1);

	if (year < 0) year = -year;
	if (month < 0) month = -month;
	if (month > 12) month = 1;

	var date = moment(new Date(year+'-'+month));
	return {
		$gte: date.toDate(),
		$lt: date.clone().add(1, unit).toDate()
	};
};
