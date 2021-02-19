function initApiLists() {
    let result = Object;
    result.apiHandlersList = [];
    result.apiNamesList = [];
    result.apiHandlersList.push(new GraphhopperApi(parm));
    result.apiHandlersList.push(new AutoGraphProgorodApi(parm));

    result.apiHandlersList.forEach(function (handler) {
        result.apiNamesList.push(handler.getName);
    });
    return result;
}

//метод округления
function round(value, digits = 2) {
    var multiplier = 1;
    for (var counter = 0; counter < digits; counter++)
        multiplier *= 10;
    return Math.round((value) * multiplier) / multiplier;
}

//перевод UTC-даты в формат строки для API
function dateToUtcApiFormat(date) {
    if (!!date) {
        let twoDigitMonth = ((date.getUTCMonth() + 1) >= 10) ? (date.getUTCMonth() + 1) : '0' + (date.getUTCMonth() + 1);
        let twoDigitDate = ((date.getUTCDate()) >= 10) ? (date.getUTCDate()) : '0' + (date.getUTCDate());
        let twoDigitHours = ((date.getUTCHours()) >= 10) ? (date.getUTCHours()) : '0' + (date.getUTCHours());
        let twoDigitMinutes = ((date.getUTCMinutes()) >= 10) ? (date.getUTCMinutes()) : '0' + (date.getUTCMinutes());
        let twoDigitSeconds = ((date.getUTCSeconds()) >= 10) ? (date.getUTCSeconds()) : '0' + (date.getUTCSeconds());
        return date.getUTCFullYear() + twoDigitMonth + twoDigitDate + '-' + (twoDigitHours) + twoDigitMinutes + twoDigitSeconds;
    }
    return undefined;
}

//перевод даты в формат строки для API
function dateToApiFormat(date) {
    if (!!date) {
        let twoDigitMonth = ((date.getMonth() + 1) >= 10) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
        let twoDigitDate = ((date.getDate()) >= 10) ? (date.getDate()) : '0' + (date.getDate());
        let twoDigitHours = ((date.getHours()) >= 10) ? (date.getHours()) : '0' + (date.getHours());
        let twoDigitMinutes = ((date.getMinutes()) >= 10) ? (date.getMinutes()) : '0' + (date.getMinutes());
        let twoDigitSeconds = ((date.getSeconds()) >= 10) ? (date.getSeconds()) : '0' + (date.getSeconds());
        return date.getFullYear() + twoDigitMonth + twoDigitDate + '-' + (twoDigitHours) + twoDigitMinutes + twoDigitSeconds;
    }
    return undefined;
}

function pointToParameterFormat(point) {
    return point.Lat + ',' + point.Lng;
}

//получение массива точек трека из объекта трека, полученного по GetTrack
function getPointsFromTrack(carId, track) {
    let points = [];
    for (let counter = 0; counter < track[carId][0].DT.length; counter++) {
        points.push([track[carId][0].Lat[counter], track[carId][0].Lng[counter]]);
    }
    return points;
}

function setStartOfTheDay(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
}

function setEndOfTheDay(date) {
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    return date;
}