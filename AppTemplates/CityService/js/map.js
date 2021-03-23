let moveAnimationLastTimeLimit = 3600 * 24 * 7;
const cursorSet = 1;
const cursorBackgroundSet = 2;
const iconSet = 4;
const iconBackgroundSet = 8;

let markerType = 0;
let cache = { // Images elements for canvas
    cars: {},
    statuses: {}
};

function InitMap(id, maxClusterRadius) {
    if (!!parm.Settings['CursorBackgroundPath'])
        markerType |= cursorBackgroundSet;
    if (!!parm.Settings['CursorPath'])
        markerType |= cursorSet;
    if (!!parm.Settings['IconBackgroundPath'])
        markerType |= iconBackgroundSet;
    if (!!parm.Settings['IconPath'])
        markerType |= iconSet;

    let mapObject = Object();
    mapObject.map = L.map(id, {
        preferCanvas: true,
    }).setView([55.173702, 61.383591], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
        .addTo(mapObject.map);
    if (!!!maxClusterRadius)
        maxClusterRadius = 120;
    mapObject.devicesLayer = L.markerClusterGroup({
        maxClusterRadius: maxClusterRadius,
        iconCreateFunction: function (cluster) {
            let count = cluster.getAllChildMarkers().length;
            return L.divIcon({
                html: count,
                className: 'cluster-icon',
                iconSize: L.point(45, 45)
            });
        },
    }).addTo(mapObject.map);
    return mapObject;
}

function createMarker(item) {
    return new Promise((resolve) => {
        let info = item.Name + " " + item.Plate + "<br>Скорость: " + round(item.Speed, 2) + "км/ч<br>Состояние: " + getStateName(item.Speed) + "<br>Последняя активность: " + getTimeDifferenceString(item.LastTime);
        item.Alias = info;
        item.showLabel = false;
        let canvasElement = document.createElement('canvas');
        drawCursor(canvasElement, item).then(function (image) {
            //console.log(image.image);
            let marker = L.marker([item.LastPosition.Lat, item.LastPosition.Lng], {
                icon: L.icon({
                    iconUrl: image.image,
                    iconAnchor: [image.anchorX, image.anchorY],
                })
            });
            //marker.bindPopup(info);
            marker.bindTooltip(info);
            resolve(marker);
        });
    });
}

function drawCursor(canvasElement, car) {
    let cursorColor = '#000280';
    canvasElement.width = 48;
    canvasElement.height = 96;
    let context = canvasElement.getContext('2d');
    let xPos = canvasElement.width / 2;
    let yPos = canvasElement.height / 4 * 3;
    if (markerType == 0)
        return new Promise((resolve) => {
            getArrowCursor(canvasElement.width, car, cursorColor, 2, car.IconPath).then(function (image) {
                context.drawImage(image.image, 0, canvasElement.height / 2);
                xPos = image.anchorX;
                yPos = image.anchorY + canvasElement.height / 2;
                resolve({image: canvasElement.toDataURL(), anchorX: xPos, anchorY: yPos});
            });
        });

    return new Promise((resolve) => {
        new Promise((resolve) => {
            if (flagIsSet(cursorBackgroundSet)) {
                if (parm.Settings['CursorBackgroundPath'] !== 'none') {
                    getImage(parm.Settings['CursorBackgroundPath']).then(function (image) {
                        context.drawImage(image, 0, canvasElement.height / 2);
                        resolve();
                    });
                }
            } else
                resolve();
        }).then(function () {
            return new Promise((resolve) => {
                if (flagIsSet(cursorSet)) {
                    if (parm.Settings['CursorPath'] !== 'none') {
                        if (parm.Settings['CursorPath'] == 'AutoGRAPH') {
                            getArrowCursor(canvasElement.width, car, cursorColor, 1).then(function (image) {
                                xPos = image.anchorX;
                                yPos = image.anchorY + canvasElement.height / 2;
                                context.drawImage(image.image, 0, canvasElement.height / 2);
                                resolve();
                            });
                        } else {
                            getImage(parm.Settings['CursorPath']).then(function (image) {
                                let cursorCanvasElement = document.createElement('canvas');
                                cursorCanvasElement.width = canvasElement.width;
                                cursorCanvasElement.height = canvasElement.height / 2;
                                let offsetWidth = cursorCanvasElement.width / 2;
                                let offsetHeight = cursorCanvasElement.height / 2;
                                let cursorContext = cursorCanvasElement.getContext('2d');
                                cursorContext.translate(offsetWidth, offsetHeight);
                                cursorContext.rotate(calculateRadian(car.Course));
                                cursorContext.drawImage(image, -offsetWidth, -offsetHeight, cursorCanvasElement.width, cursorCanvasElement.height);
                                //console.log(cursorCanvasElement.toDataURL());
                                context.drawImage(cursorCanvasElement, 0, canvasElement.height / 2);
                                //console.log(canvasElement.toDataURL());
                                resolve();
                            });
                        }
                    }
                } else
                    resolve();
            })
        }).then(function () {
            return new Promise((resolve) => {
                if (flagIsSet(iconBackgroundSet)) {
                    if (parm.Settings['IconBackgroundPath'] !== 'none') {
                        getImage(parm.Settings['IconBackgroundPath']).then(function (image) {
                            context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height / 2);
                            resolve();
                        });
                    }
                } else
                    resolve();
            })
        }).then(function () {
            return new Promise((resolve) => {
                if (flagIsSet(iconSet)) {
                    if (parm.Settings['IconPath'] !== 'none') {
                        getImage(parm.Settings['IconPath']).then(function (image) {
                            context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height / 2);
                            resolve();
                        });
                    }
                } else resolve();
            })
        }).then(function () {
            resolve({image: canvasElement.toDataURL(), anchorX: xPos, anchorY: yPos});
        });
    });
}

function flagIsSet(flag) {
    if ((markerType & flag) == flag)
        return true;
    return false;
}

function getCursorIcon(sideSize, iconPath) {
    return new Promise((resolve) => {
        let canvas = document.createElement('canvas');
        canvas.width = canvas.height = sideSize;
        let context = canvas.getContext('2d');
        let margin = sideSize * 0.2;
        let size = sideSize * 0.6;
        getImage(iconPath).then(function (image) {
            context.drawImage(image, margin, margin, size, size);
            resolve(canvas);
        });
    });
}

function getArrowCursor(sideSize, car, cursorColor, markerType, iconPath = null) {
    return new Promise((resolve) => {
        let resultCanvas = document.createElement('canvas');
        resultCanvas.width = sideSize;
        resultCanvas.height = sideSize;
        let r = sideSize / 4;
        let lineWidth = r / 1.5;
        let arrowLedge = r / 3 * 2.5;
        let arrowDegrees = 45;
        let degreesL = calculateRadian(270 + arrowDegrees);
        let degreesR = calculateRadian(270 - arrowDegrees);
        let centerPoint = resultCanvas.width / 2;
        let context = resultCanvas.getContext('2d');
        context.translate(centerPoint, centerPoint);
        context.rotate(calculateRadian(car.Course));

        let rightPoint = calculateCirclePoint(r, degreesL);
        let leftPoint = calculateCirclePoint(r, degreesR);

        if (markerType == 1 || markerType == 2) {
            context.beginPath();
            context.arc(0, 0, r, 0, 2 * Math.PI, false);
            context.lineWidth = lineWidth;
            context.strokeStyle = cursorColor;
            context.stroke();
            context.fillStyle = '#ffffff';
            context.fill();
            context.closePath();
            context.beginPath();
            context.fillStyle = cursorColor;
            context.lineWidth = 0;
            context.moveTo(0, -r - arrowLedge);
            context.lineTo(leftPoint.X, leftPoint.Y - lineWidth / 2);
            context.lineTo(rightPoint.X, rightPoint.Y - lineWidth / 2);
            context.lineTo(0, -r - arrowLedge);
            context.fill();
            context.closePath();
        }

        if (markerType == 0 || markerType == 2) {
            if (iconPath == null) {
                resolve({image: resultCanvas, anchorX: centerPoint, anchorY: centerPoint});
            } else
                getImage(iconPath).then(function (image) {
                    context.rotate(calculateRadian(-car.Course));
                    context.drawImage(image, leftPoint.X, leftPoint.Y, r * 1.5, r * 1.5);
                    resolve({
                        image: resultCanvas,
                        anchorX: centerPoint,
                        anchorY: (resultCanvas.height / 2) + centerPoint
                    });
                });
        } else {
            resolve({image: resultCanvas, anchorX: centerPoint, anchorY: (resultCanvas.height / 2) + centerPoint});
        }
    });
}

function calculateCirclePoint(r, angleRadian) {
    return {
        X: r * Math.cos(angleRadian),
        Y: r * Math.sin(angleRadian)
    };
}

function getImage(iconPath) {
    return new Promise((resolve) => {
        if (!cache.cars[iconPath]) {
            let carImage = new Image();
            carImage.src = iconPath;
            carImage.onload = function () {
                cache.cars[iconPath] = carImage;
                resolve(cache.cars[iconPath]);
            };
        } else {
            resolve(cache.cars[iconPath]);
        }
    });

}

function calculateRadian(degrees) {
    return degrees * Math.PI / 180;
}