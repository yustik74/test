class GoogleApi {

    constructor(parm) {
        this.parm = parm;
    }

    getName = 'Google API';
    //https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyAimljmR2SjJnJ-H-jPgV1p9qbbCRn-Vzg&origin=55.1871802,61.3307691&destination=55.1806810,61.3686633
    getRoute = function (startPoint, endPoint) {
        return new Promise((resolve, reject) => {
            get(parm.Settings['googleapi_url'], {
                key: parm.Settings['googleapi_key'],
                origin: pointToParameterFormat(startPoint),
                destination: pointToParameterFormat(endPoint)
            }, function (route) {
                var result = Object();
                google.maps.geometry.encoding.decodePath(path);
                result.totalDistance = round(route.paths[0].distance / 1000);
                result.points = [];
                route.paths[0].points.coordinates.forEach(function (point) {
                        result.points.push([point[1], point[0]]);
                    }
                );
                resolve(result);
            });
        });
    };
}