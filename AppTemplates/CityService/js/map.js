let moveAnimationLastTimeLimit = 3600 * 24 * 7;
let cache = { // Images elements for canvas
    cars: {},
    statuses: {}
};

function InitMap(id, maxClusterRadius) {
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
        let markerType = 1;
        let cursorColor = 'dd0000';
        if (drawCursor & !drawIcon || (!drawCursor & !drawIcon)) {
            markerType = 1;
        }
        if (!drawCursor & drawIcon) {
            markerType = 0;
        }
        if (drawCursor & drawIcon) {
            markerType = 2;
        }
        getArrowCursor(item, cursorColor, markerType, 16).then(function (image) {
            console.log(image.image);
            let marker = L.marker([item.LastPosition.Lat, item.LastPosition.Lng], {
                icon: L.icon({
                    iconUrl: image.image,
                    iconAnchor: [image.markerSize.xPos, image.markerSize.yPos],
                })
            });
            marker.bindPopup(info);
            marker.bindTooltip(info);
            resolve(marker);
        });
    });
}

function calculateMarkerSize(markerType, borderWidth, labelHeight, labelMargin, boubleWidth, boubleHeight, carArrowSizeMax) {
    /*  car.markerType
        0 - только иконка
        1 - только курсор
        2 - иконка и курсор
        */
    if (markerType == 0) {
        markerWidth = boubleWidth + borderWidth;
        markerHeight = labelHeight + labelMargin + boubleHeight + borderWidth;

        yPos = markerHeight;

        xStart = borderWidth / 2;
    }
    if (markerType == 1) {
        markerWidth = carArrowSizeMax;
        markerHeight = labelHeight + labelMargin + carArrowSizeMax;
        boubleWidth = 0;
        boubleHeight = 0;

        yPos = markerHeight - carArrowSizeMax / 2;
    }
    if (markerType == 2) {
        markerWidth = Math.max(boubleWidth + borderWidth, carArrowSizeMax);
        markerHeight = labelHeight + labelMargin + boubleHeight + borderWidth + carArrowSizeMax / 2;

        yPos = markerHeight - carArrowSizeMax / 2;

        xStart = borderWidth / 2;

        if (boubleWidth + borderWidth < carArrowSizeMax) {
            xStart += (carArrowSizeMax - boubleWidth) / 2;
        }
    }
    let xPos = markerWidth / 2;
    return {
        xStart: xStart,
        xPos: xPos,
        yPos: yPos,
        markerWidth: markerWidth,
        markerHeight: markerHeight,
        boubleWidth: boubleWidth,
        boubleHeight: boubleHeight
    };
}

function getArrowCursor(car, cursorColor, markerType, r) {
    return new Promise((resolve) => {
        let lineWidth = r / 1.5;
        let arrowLedge = r / 3 * 2.5;
        let arrowDegrees = 45;
        let degreesL = calculateRadian(270 + arrowDegrees);
        let degreesR = calculateRadian(270 - arrowDegrees);
        let centerPoint = r + arrowLedge;
        let resultCanvas = document.createElement('canvas');
        resultCanvas.setAttribute('id', 'marker-icon-marker');
        resultCanvas.width = (r + arrowLedge) * 2;
        resultCanvas.height = (r + arrowLedge) * 2;
        let context = resultCanvas.getContext('2d');
        context.translate(centerPoint, centerPoint);
        context.rotate(calculateRadian(car.Course));
        let markerSize = {xPos: centerPoint, yPos: centerPoint};

        let rightPointR = {
            X: r * Math.cos(degreesL),
            Y: r * Math.sin(degreesL)
        };
        let leftPointR = {
            X: r * Math.cos(degreesR),
            Y: r * Math.sin(degreesR)
        };

        if (markerType == 1 || markerType == 2) {
            context.beginPath();
            context.arc(0, 0, r, 0, 2 * Math.PI, false);
            context.lineWidth = lineWidth;
            context.strokeStyle = '#000280';
            context.stroke();
            context.fillStyle = '#ffffff';
            context.fill();
            context.closePath();
            context.beginPath();
            context.fillStyle = '#000280';
            context.lineWidth = 0;
            context.moveTo(0, -r - arrowLedge);
            context.lineTo(leftPointR.X, leftPointR.Y - lineWidth / 2);
            context.lineTo(rightPointR.X, rightPointR.Y - lineWidth / 2);
            context.lineTo(0, -r - arrowLedge);
            context.fill();
            context.closePath();
        }

        if (markerType == 0 || markerType == 2) {
            new Promise((resolve, reject) => {
                if (!cache.cars[car.IconPath]) {
                    let carImage = new Image();
                    carImage.src = car.IconPath;
                    carImage.onload = function () {
                        context.rotate(calculateRadian(-car.Course));
                        context.drawImage(carImage, leftPointR.X, leftPointR.Y, r * 1.5, r * 1.5);
                        cache.cars[car.IconPath] = carImage;
                        resolve();
                    };
                } else {
                    context.rotate(calculateRadian(-car.Course));
                    context.drawImage(cache.cars[car.IconPath], leftPointR.X, leftPointR.Y, r * 1.5, r * 1.5);
                    resolve();
                }
            }).then(function () {
                resolve({image: resultCanvas.toDataURL(), markerSize: markerSize});
            });
        } else
            resolve({image: resultCanvas.toDataURL(), markerSize: markerSize});
    });
}

function drawBorder(ctx, width, height,
                    roundSize, pipkaSize) {
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

function drawPosition(ctx, x, y, size, color) {

    // --- shadow --

    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    ctx.stroke();

    // --- circle ---

    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    ctx.stroke();
}

function drawCircle(r, angle, image) {


    if (!!image) {
        context.rotate(calculateRadian(-angle));
        context.drawImage(image, leftPointR.X, leftPointR.Y, r * 1.5, r * 1.5);
    }
    return resultCanvas;
}

function calculateRadian(degrees) {
    return degrees * Math.PI / 180;
}

function drawArrow(ctx, size, color,
                   borderWidth, borderColor) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size, size);
    ctx.lineTo(size / 2, size * 0.75);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth--;
    ctx.beginPath();
    ctx.moveTo(size / 2, borderWidth);
    ctx.lineTo(size - borderWidth, size - borderWidth);
    ctx.lineTo(size / 2, size * 0.75 - borderWidth + 1);
    ctx.lineTo(borderWidth, size - borderWidth);
    ctx.closePath();
    ctx.stroke();
}