let moveAnimationLastTimeLimit = 3600 * 24 * 7;
const cursorSet = 1;
const cursorBackgroundSet = 2;
const iconSet = 4;
const iconBackgroundSet = 8;
const auto = 'auto';
const none = 'none';
let cursorColor = '#000280';

let markerType = 0;
let cache = { // Images elements for canvas
    cars: {},
    statuses: {}
};

function InitMap(id, maxClusterRadius, defaultView) {
    if (!!parm.Settings['CursorBackgroundPath'])
        markerType |= cursorBackgroundSet;
    if (!!parm.Settings['CursorPath'])
        markerType |= cursorSet;
    if (!!parm.Settings['IconBackgroundPath'])
        markerType |= iconBackgroundSet;
    if (!!parm.Settings['IconPath'])
        markerType |= iconSet;

    let coords = [0, 0];
    if (!!defaultView) {
        let splitCoords = defaultView.split(',');
        if (splitCoords.length > 1) {
            coords[0] = parseFloat(splitCoords[0]);
            coords[1] = parseFloat(splitCoords[1]);
        }
    }
    let mapObject = Object();
    mapObject.map = L.map(id, {
        preferCanvas: true,
    }).setView(coords, 13);

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
    return new Promise(async (resolve) => {
        let info = formatMarkerInfo(item);
        item.Alias = info;
        item.showLabel = false;
        let canvasElement = document.createElement('canvas');
        let image = await getMarkerImage(canvasElement, item);
        let marker = L.marker([item.LastPosition.Lat, item.LastPosition.Lng], {
            icon: L.icon({
                iconUrl: image.image,
                iconAnchor: [image.anchorX, image.anchorY],
            })
        });
        marker.bindTooltip(info);
        resolve(marker);
    });
}

function updateMarker(item) {
    return new Promise(async (resolve) => {
        let info = formatMarkerInfo(item);
        item.Alias = info;
        item.showLabel = false;
        let canvasElement = document.createElement('canvas');
        let image = await getMarkerImage(canvasElement, item);
        item.Marker.setIcon(L.icon({
            iconUrl: image.image,
            iconAnchor: [image.anchorX, image.anchorY],
        }));
        item.Marker.bindTooltip(info);
        item.Marker.setLatLng([item.LastPosition.Lat, item.LastPosition.Lng]);
        resolve(item.Marker);
    });
}

function formatMarkerInfo(item) {
    return item.Name + " " + item.Plate + "<br>Скорость: " + round(item.Speed, 2) + "км/ч<br>Состояние: " + getStateName(item.Speed) + "<br>Последняя активность: " + getTimeDifferenceString(item.LastTime);
}

function getMarkerImage(canvasElement, car) {
    return new Promise(async (resolve) => {
        canvasElement.width = 48;
        canvasElement.height = 96;
        let context = canvasElement.getContext('2d');
        let xPos = canvasElement.width / 2;
        let yPos = canvasElement.height / 4 * 3;
        if (markerType == 0) {
            let anchor = await drawDefaultCursor(canvasElement, context, car);
            xPos = anchor[0];
            yPos = anchor[1];
        } else {

            await new Promise(async (resolve) => {
                let anchor = await drawCursorIcon(canvasElement, context, car);
                await drawCursorBackground(canvasElement, context, car);
                await drawIconBackground(canvasElement, context);
                await drawIcon(canvasElement, context, car);
                if (anchor) {
                    xPos = anchor[0];
                    yPos = anchor[1];
                }
                resolve();
            });
        }
        resolve({image: canvasElement.toDataURL(), anchorX: xPos, anchorY: yPos});
    });
}

function drawDefaultCursor(canvasElement, context, car) {
    let xPos = 0;
    let yPos = 0;
    return new Promise(async (resolve) => {
        let image = await getDefaultArrowCursor(canvasElement.width, car, cursorColor);
        context.drawImage(image.image, 0, canvasElement.height / 2);
        xPos = image.anchorX;
        yPos = image.anchorY + canvasElement.height / 2;
        let imageCar = await getIcon(canvasElement.width, car.IconPath);
        context.drawImage(imageCar, 0, canvasElement.height / 2);
        resolve([xPos, yPos]);
    });
}

function drawCursorIcon(canvasElement, context, car) {
    let xPos = 0;
    let yPos = 0;
    return new Promise(async (resolve) => {
        if (flagIsSet(cursorSet) && parm.Settings['CursorPath'] != none) {
            let cursorCanvasElement;
            if (parm.Settings['CursorPath'] == auto) {
                let defaultCursor = await getDefaultArrowCursor(canvasElement.width, car, cursorColor);
                xPos = defaultCursor.anchorX;
                yPos = defaultCursor.anchorY + canvasElement.height / 2;
                cursorCanvasElement = defaultCursor.image;
            } else {
                let image = await getImage(parm.Urls.Content + parm.Settings['CursorPath']);
                xPos = canvasElement.width / 2;
                yPos = canvasElement.height * 3 / 4;
                cursorCanvasElement = getRotatedCursor(image, canvasElement.width, canvasElement.height / 2, car.Course);
            }
            context.drawImage(cursorCanvasElement, 0, canvasElement.height / 2, canvasElement.width, canvasElement.height / 2);
            resolve([xPos, yPos]);
        } else
            resolve();
    });
}

function drawCursorBackground(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        if (flagIsSet(cursorBackgroundSet) && parm.Settings['CursorBackgroundPath'] != none) {
            let image;
            if (parm.Settings['CursorBackgroundPath'] == auto)
                image = await getIcon(canvasElement.width, car.IconPath);
            else
                image = await getImage(parm.Urls.Content + parm.Settings['CursorBackgroundPath']);
            context.drawImage(image, 0, canvasElement.height / 2, canvasElement.width, canvasElement.height / 2);
            resolve();
        } else
            resolve();
    });
}

function drawIconBackground(canvasElement, context) {
    return new Promise(async (resolve) => {
        if (flagIsSet(iconBackgroundSet) && parm.Settings['IconBackgroundPath'] != none) {
            if (parm.Settings['IconBackgroundPath'] == auto) {
                let background = await getDefaultIconBackground(canvasElement.width);
                context.drawImage(background, canvasElement.width * 0.175, 0, canvasElement.width, canvasElement.height / 2);
            } else {
                let image = await getImage(parm.Urls.Content + parm.Settings['IconBackgroundPath']);
                context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height / 2);
            }
            resolve();
        } else
            resolve();
    });
}

function drawIcon(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        if (flagIsSet(iconSet) && parm.Settings['IconPath'] != none) {
            let image;
            if (parm.Settings['IconPath'] == auto) {
                image = await getIcon(canvasElement.width, car.IconPath, 3)
            } else
                image = await getImage(parm.Urls.Content + parm.Settings['IconPath']);
            context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height / 2);
            resolve();
        } else
            resolve();
    });
}

function getRotatedCursor(image, width, height, angle) {
    let cursorCanvasElement = document.createElement('canvas');
    cursorCanvasElement.width = width;
    cursorCanvasElement.height = height;
    let offsetWidth = cursorCanvasElement.width / 2;
    let offsetHeight = cursorCanvasElement.height / 2;
    let cursorContext = cursorCanvasElement.getContext('2d');
    cursorContext.translate(offsetWidth, offsetHeight);
    cursorContext.rotate(calculateRadian(angle));
    cursorContext.drawImage(image, -offsetWidth, -offsetHeight, cursorCanvasElement.width, cursorCanvasElement.height);
    return cursorCanvasElement;
}

function flagIsSet(flag) {
    if ((markerType & flag) == flag)
        return true;
    return false;
}

function drawBorder(ctx, width, height, roundSize, pipkaSize) {
    let PI2 = Math.PI * 2,
        icSizeMPSize = width - pipkaSize;

    ctx.moveTo(roundSize, 0);
    ctx.lineTo(width - roundSize, 0); // horz
    ctx.arc(width - roundSize, roundSize, roundSize, -PI2 / 4, 0); // right top corner
    ctx.lineTo(width, width - roundSize); // right vertical
    ctx.arc(width - roundSize, height - roundSize, roundSize, 0, PI2 / 4); // right bottom corner
    if (pipkaSize) {
        ctx.lineTo(width - (icSizeMPSize) / 2, width); // right pipka horz
        ctx.lineTo(width / 2, width + width / 2); // right pipka leg
        ctx.lineTo((icSizeMPSize) / 2, height); // left pipka leg
    }
    ctx.lineTo(roundSize, height); // left pipka horz
    ctx.arc(roundSize, height - roundSize, roundSize, PI2 / 4, PI2 / 2); // left bottom corner
    ctx.lineTo(0, roundSize); // left vertical
    ctx.arc(roundSize, roundSize, roundSize, PI2 / 2, -PI2 / 4); // left top corner
}

function getIcon(sideSize, iconPath, marginY) {
    return new Promise((resolve) => {
        let canvas = document.createElement('canvas');
        canvas.width = canvas.height = sideSize;
        let context = canvas.getContext('2d');
        let margin = sideSize * 0.25;
        let size = sideSize * 0.5;
        getImage(iconPath).then(function (image) {
            context.drawImage(image, margin, marginY !== undefined ? marginY : margin, size, size);
            resolve(canvas);
        });
    });
}

function getDefaultIconBackground(boubleWidth) {
    return new Promise((resolve) => {
        let canvas = document.createElement('canvas');
        canvas.width = boubleWidth;
        canvas.height = boubleWidth;
        let context = canvas.getContext('2d');
        let xStart = 0,
            boubleRoundSize = 4,
            boubleArrowSize = 36 / 2.5,
            boubleBg = "rgba(255,255,255,.75)",
            borderColor = "#cccccc",
            borderWidth = 1;
        let size = boubleWidth * 0.65;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.translate(xStart, 0);
        context.beginPath();
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        context.fillStyle = boubleBg;
        drawBorder(context, size, size, boubleRoundSize, boubleArrowSize);
        context.fill();
        drawBorder(context, size, size, boubleRoundSize, boubleArrowSize);
        context.stroke();
        resolve(canvas);
    });
}

function getDefaultArrowCursor(sideSize, car, cursorColor) {
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

        resolve({image: resultCanvas, anchorX: centerPoint, anchorY: centerPoint});
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