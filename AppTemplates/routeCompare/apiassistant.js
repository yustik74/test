function initApiLists() {
    var result = Object;
    result.apiHandlersList = [];
    result.apiNamesList = [];
    result.apiHandlersList.push(new GraphhopperApi(parm));
    result.apiHandlersList.push(new AutoGraphProgorodApi(parm));

    result.apiHandlersList.forEach(function (handler) {
        result.apiNamesList.push(handler.getName);
    });
    return result;
}

function round(value, digits = 2) {
    var multiplier = 1;
    for (var counter = 0; counter < digits; counter++)
        multiplier *= 10;
    return Math.round((value) * multiplier) / multiplier;
}

function dateToUtcApiFormat(date) {
    var twoDigitMonth = ((date.getUTCMonth() + 1) >= 10) ? (date.getUTCMonth() + 1) : '0' + (date.getUTCMonth() + 1);
    var twoDigitDate = ((date.getUTCDate()) >= 10) ? (date.getUTCDate()) : '0' + (date.getUTCDate());
    var twoDigitHours = ((date.getUTCHours()) >= 10) ? (date.getUTCHours()) : '0' + (date.getUTCHours());
    var twoDigitMinutes = ((date.getUTCMinutes()) >= 10) ? (date.getUTCMinutes()) : '0' + (date.getUTCMinutes());
    return date.getUTCFullYear() + twoDigitMonth + twoDigitDate + '-' + (twoDigitHours) + twoDigitMinutes;
}

function pointToParameterFormat(point) {
    return point.Lat + ',' + point.Lng;
}

function getPointsFromTrack(carId, track)
{
    let points = [];
    for (let counter = 0; counter < track[carId][0].DT.length; counter++) {
        points.push([track[carId][0].Lat[counter], track[carId][0].Lng[counter]]);
    }
    return points;
}