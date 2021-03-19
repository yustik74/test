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

const CanvasMarker = L.CircleMarker.extend({
    _updatePath() {
        if (!this.options.img.el) { //Создаем элемент IMG
            const img = document.createElement('img');
            img.src = this.options.img.url;
            this.options.img.el = img;
            img.onload = () => {
                this.redraw();  //После загрузки запускаем перерисовку
            };
        } else {
            this._renderer._updateImg(this);    //Вызываем _updateImg
        }
    },
});

function createCursor(item) {
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
        getArrowCursor(item, cursorColor, markerType).then(function (image) {
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
    let yPos = 0,
        xStart = 0;
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

function redrawMarkers() {
    currentDevices.map(a => {
        return a.Marker
    }).forEach(function (marker) {
        //marker.redraw();
    });
}

function getArrowCursor(car, cursorColor, markerType) {
    return new Promise((resolve) => {
        let carImageSize = window.devicePixelRatio > 1 ? 40 : 32,
            carArrowSize = 36 * 0.8,
            carArrowSizeMax = Math.ceil(Math.sqrt(2 * Math.pow(carArrowSize, 2))), // Max arrow size on rotate
            markerWidth = 0,
            markerHeight = 0,
            boubleWidth = carImageSize + 6,
            boubleHeight = boubleWidth * 1.5,
            boubleRoundSize = 4,
            boubleArrowSize = carImageSize / 2.5,
            boubleBg = "rgba(255,255,255,.75)",
            borderColor = "#cccccc",
            borderWidth = 1,
            labelFontSize = window.devicePixelRatio > 1 ? 12 : 11,
            labelFont = labelFontSize + "px " + "'Roboto Condensed'",//getComputedStyle(document.body).fontFamily,
            labelMargin = markerType == 1 || !car.showLabel ? 0 : 1,
            labelPadding = 4,
            labelItemsCount = 1,
            labelSpace = 1,
            labelWidth = 0,
            labelHeight = car.showLabel ? labelFontSize + labelPadding + labelPadding / 2 + (labelItemsCount - 1) * labelSpace : 0,
            labelColor = "#222222",
            labelBg = "#ffffff";
        let markerSize = calculateMarkerSize(markerType, borderWidth, labelHeight, labelMargin, boubleWidth, boubleHeight, carArrowSizeMax);

        let resultCanvas = document.createElement('canvas');
        resultCanvas.setAttribute('id', 'marker-icon-marker');
        resultCanvas.width = markerSize.markerWidth;
        resultCanvas.height = markerSize.markerHeight;
        let ctxResult = resultCanvas.getContext('2d');

        let canvasMarker = document.createElement('canvas');
        canvasMarker.setAttribute('id', 'marker-icon-marker');
        canvasMarker.width = markerSize.markerWidth;
        canvasMarker.height = markerSize.markerHeight;
        let ctxMarker = canvasMarker.getContext('2d');

        if (markerType == 1 || markerType == 2) {
            let x = Math.max(carArrowSizeMax, boubleWidth) / 2,
                y = canvasMarker.height - carArrowSizeMax / 2;

            if (car.Course == -1) {
                this.drawPosition(ctxMarker, x, y, carArrowSize / 2, '#' + cursorColor);
            } else {
                const borderWidth = 2;
                const size = carArrowSize - borderWidth * 2;

                ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                ctxMarker.save();
                ctxMarker.translate(x, y);
                ctxMarker.rotate(car.Course * Math.PI / 180);
                ctxMarker.translate(-size / 2, -size / 2);
                drawArrow(ctxMarker, size, '#' + cursorColor, borderWidth, '#000');
                ctxMarker.restore();
            }
            ctxResult.drawImage(canvasMarker, 0, 0);
        }

        if (markerType == 0 || markerType == 2) {
            new Promise((resolve, reject) => {
                let labelElement = document.createElement('canvas');
                labelElement.setAttribute('id', 'marker-icon-label');
                labelElement.width = markerSize.markerWidth;
                labelElement.height = markerSize.markerHeight;
                let ctxLabel = labelElement.getContext('2d');
                ctxLabel.setTransform(1, 0, 0, 1, 0, 0);
                ctxLabel.translate(markerSize.xStart, 0);
                ctxLabel.beginPath();
                ctxLabel.strokeStyle = borderColor;
                ctxLabel.lineWidth = borderWidth;
                ctxLabel.fillStyle = boubleBg;
                this.drawBorder(ctxLabel, boubleWidth, boubleWidth, boubleRoundSize, boubleArrowSize);
                ctxLabel.fill();
                this.drawBorder(ctxLabel, boubleWidth, boubleWidth, boubleRoundSize, boubleArrowSize);
                ctxLabel.stroke();

                if (!cache.cars[car.image]) {
                    let carImage = new Image();
                    carImage.src = car.IconPath;
                    carImage.onload = function () {
                        let width = carImageSize,
                            height = carImageSize * carImage.height / carImage.width;
                        ctxLabel.setTransform(1, 0, 0, 1, 0, 0);
                        ctxLabel.drawImage(carImage, markerSize.xStart + (boubleWidth - width) / 2, (boubleWidth - height) / 2, width, height);
                        resolve(labelElement);
                    };
                    cache.cars[car.IconPath] = carImage;
                } else {
                    let width = carImageSize,
                        height = carImageSize * cache.cars[car.IconPath].height / cache.cars[car.IconPath].width;
                    ctxLabel.setTransform(1, 0, 0, 1, 0, 0);
                    ctxLabel.drawImage(cache.cars[car.IconPath], markerSize.xStart + (boubleWidth - width) / 2, (boubleWidth - height) / 2, width, height);
                    resolve(labelElement);
                }
            }).then(function (labelElement) {
                ctxResult.drawImage(labelElement, 0, 0);
                if (markerType != 0) {
                    ctxResult.drawImage(canvasMarker, 0, 0);
                }
                console.log(resultCanvas.toDataURL());
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

function drawArrow(ctx, size, color,
                   borderWidth, borderColor) {
    /*const arrSize = size / 2.3;
    const arrSizeMaxWidth = Math.ceil(Math.sqrt(2 * Math.pow(arrSize, 2)));
    const k = arrSizeMaxWidth / 2;
    const x = size / 2;

    ctx.beginPath();

    ctx.lineCap = 'square';
    ctx.lineWidth = 10;

    [borderColor, '#fff', color].forEach((clr) => {
        ctx.strokeStyle = clr;
        ctx.lineWidth -= 2;

        ctx.moveTo(x, 0);
        ctx.lineTo(x - k, k);
        ctx.moveTo(x, 0);
        ctx.lineTo(x + k, k);
        ctx.moveTo(x, ctx.lineWidth / 2);
        ctx.lineTo(x, size);
        ctx.stroke();
    });*/
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