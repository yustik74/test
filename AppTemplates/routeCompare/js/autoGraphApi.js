class AutoGraphProgorodApi {

    constructor(parm) {
        this.parm = parm;
    }

    getName = 'AutoGRAPH API ProGorod';

    getRoute = function (startPoint, endPoint) {
        return new Promise((resolve, reject) => {
            get(parm.Urls.Service + '/GetRoute', {
                session: parm['Token'],
                waypoints: startPoint.Lat + ',' + startPoint.Lng + ';' + endPoint.Lat + ',' + endPoint.Lng,
                id: 1
            }, function (route) {
                var result = Object();
                result.totalDistance = round(route.Segments[0].Steps[0].Distance / 1000);
                result.points = [];
                route.Segments[0].Steps[0].Points.forEach(function (point) {
                        result.points.push([point.Lat, point.Lng]);
                    }
                );
                resolve(result);
            });
        });
    };

}