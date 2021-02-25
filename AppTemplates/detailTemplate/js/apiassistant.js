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