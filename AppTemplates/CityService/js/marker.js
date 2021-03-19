function carMarkerCreateHtml(position, className, data,
                             cursorColor, blink = false) {
    return L.marker(position,
        {
            icon: this.getCarIcon(data, className, data.Course, cursorColor, blink),
            zIndexOffset: 2000
        });
}

let CarMarkerIcon = L.Icon.extend({
    options: {
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        drawIcon: null,
        bgPos: null,
        html: false,
        className: "leaflet-carmarker-icon"
    },

    createIcon: function (oldIcon) {
        let div;

        if (oldIcon && oldIcon.tagName === 'DIV') {
            div = oldIcon;
        } else {
            let canvasLabel = L.DomUtil.create("canvas", "leaflet-carmarker-icon__label");
            let canvasMarker = L.DomUtil.create("canvas", "leaflet-carmarker-icon__marker");

            canvasLabel.width = 0;
            canvasLabel.height = 0;
            canvasMarker.width = 0;
            canvasMarker.height = 0;

            div = document.createElement('div');

            div.appendChild(canvasLabel);
            div.appendChild(canvasMarker);
        }

        this._setIconStyles(div, 'icon');

        return div;
    },

    createShadow: function () {
        return null;
    },

    _setIconStyles: function () {
        if (typeof this.options.drawIcon == 'function') {
            this.options.drawIcon.apply(this, arguments);
        }

        L.Icon.prototype['_setIconStyles'].apply(this, arguments);
    }
});

let carMarkerIcon = function (options) {
    return new CarMarkerIcon(options);
};


let moveAnimationLastTimeLimit = 3600 * 24 * 7;
let cache = { // Images elements for canvas
    cars: {},
    statuses: {}
};

function getCarIcon(car, className, cursorColor, blink, markerType = 0) {
    /*  car.markerType
    0 - только иконка
    1 - только курсор
    2 - иконка и курсор
    */

    /* car.cursorSize
        24, 32, 36
    */

    let sector = Math.ceil(car.Course / 45);

    car.sector = sector === 0 ? 1 : sector;

    // ---

    let carImageSize = window.devicePixelRatio > 1 ? 40 : 32,
        carArrowSize = car.cursorSize * 0.8,
        carArrowSizeMax = Math.ceil(Math.sqrt(2 * Math.pow(carArrowSize, 2))), // Max arrow size on rotate
        xStart = 0,
        xPos = 0,
        yPos = 0,
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
        labelMargin = markerType == "1" || !car.showLabel ? 0 : 1,
        labelPadding = 4,
        labelItemsCount = 1,
        labelSpace = 1,
        labelWidth = 0,
        labelHeight = car.showLabel ? labelItemsCount * labelFontSize + labelPadding + labelPadding / 2 + (labelItemsCount - 1) * labelSpace : 0,
        labelColor = "#222222",
        labelBg = "#ffffff",
        statusesImageSize = 12,
        statusesImageMargin = 1,
        statusesImageCropFromX = 1.5,
        statusesImageCropFromY = 1.5;

    if (markerType == "0") {
        markerWidth = boubleWidth + borderWidth;
        markerHeight = labelHeight + labelMargin + boubleHeight + borderWidth;

        yPos = markerHeight;

        xStart = borderWidth / 2;
    }
    if (markerType == "1") {
        markerWidth = carArrowSizeMax;
        markerHeight = labelHeight + labelMargin + carArrowSizeMax;
        boubleWidth = 0;
        boubleHeight = 0;

        yPos = markerHeight - carArrowSizeMax / 2;
    }
    if (markerType == "2") {
        markerWidth = Math.max(boubleWidth + borderWidth, carArrowSizeMax);
        markerHeight = labelHeight + labelMargin + boubleHeight + borderWidth + carArrowSizeMax / 2;

        yPos = markerHeight - carArrowSizeMax / 2;

        xStart = borderWidth / 2;

        if (boubleWidth + borderWidth < carArrowSizeMax) {
            xStart += (carArrowSizeMax - boubleWidth) / 2;
        }
    }

    xPos = markerWidth / 2;

    return carMarkerIcon({
        className: className + " leaflet-carmarker-icon",
        iconSize: [markerWidth, markerHeight],
        iconAnchor: [xPos, yPos],
        drawIcon: (icon) => {
            setTimeout(() => { // IE canvasLabel font hack
                let canvasLabel = $(icon).find(".leaflet-carmarker-icon__label")[0],
                    canvasMarker = $(icon).find(".leaflet-carmarker-icon__marker")[0],
                    ctxLabel = canvasLabel.getContext("2d"),
                    ctxMarker = canvasMarker.getContext("2d");

                if (blink) {
                    icon.classList.add("leaflet-carmarker-icon--blink");
                }
                if (car.speed > 0 && car.ago >= 0 && car.ago < this.moveAnimationLastTimeLimit) {
                    icon.classList.add("leaflet-carmarker-icon--move");
                }
                icon.classList.add("leaflet-carmarker-icon--type-" + markerType);
                icon.classList.add("leaflet-carmarker-icon--size-" + car.cursorSize);

                icon.style.color = "#" + car.carColor;

                // --- Label

                if (car.showLabel) {
                    ctxLabel.imageSmoothingEnabled = (ctxLabel).mozImageSmoothingEnabled = (
                        ctxLabel).webkitImageSmoothingEnabled = true;
                    ctxLabel.font = labelFont;

                    // --- Label: calc size

                    labelWidth = ctxLabel.measureText(car.Alias || car.Name).width;
                    labelWidth += xStart + labelPadding * 2;

                    canvasLabel.width = labelWidth;
                    canvasLabel.height = labelHeight;
                    canvasLabel.style['margin-bottom'] = labelMargin + "px";

                    // --- Label: draw

                    ctxLabel.translate(xStart, 0);
                    ctxLabel.font = labelFont;
                    ctxLabel.textBaseline = "bottom";

                    ctxLabel.fillStyle = labelBg;
                    this.drawBorder(ctxLabel, labelWidth - xStart, labelHeight, boubleRoundSize - 1, 0);
                    ctxLabel.fill();

                    ctxLabel.translate(labelPadding, labelPadding + labelFontSize);

                    ctxLabel.fillStyle = labelColor;
                    ctxLabel.fillText(car.Alias || car.Name, 0, 0);
                    if (!car.Alias) {
                        labelItems.forEach((txt, i) => ctxLabel.fillText(txt, 0.5, (i + 1) * labelFontSize + (i + 1 < labelItemsCount ? labelSpace : 0)));
                    }
                }

                // --- Marker

                canvasMarker.width = markerWidth;
                canvasMarker.height = markerHeight - labelHeight - labelMargin;

                ctxMarker.imageSmoothingEnabled = (
                    ctxMarker).mozImageSmoothingEnabled = (
                    ctxMarker).webkitImageSmoothingEnabled = true;

                // --- Marker: statuses
/*
                if (car.statuses && car.statuses.length > 0 && (markerType == "0" ||
                    markerType == "2")) {
                    canvasMarker.width += statusesImageSize + labelMargin;

                    let x = xStart + boubleWidth + borderWidth / 2 + labelMargin,
                        y = 0;

                    for (let i = 0, j = 3; i < j && i < car.statuses.length; i++) {
                        let item = car.statuses[i];

                        if (!item.image || (/EmptyPlace\.png/i).test(item.image)) {
                            j++;
                            continue;
                        }

                        if (!this.cache.statuses[item.image]) {
                            let yDef = y,
                                statusImage = new Image(),
                                loader = () => {
                                    ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                                    ctxMarker.drawImage(
                                        statusImage,
                                        statusesImageCropFromX,
                                        statusesImageCropFromY,
                                        statusImage.width - statusesImageCropFromX * 2,
                                        statusImage.height - statusesImageCropFromY * 2,
                                        x,
                                        yDef,
                                        statusesImageSize,
                                        statusesImageSize
                                    );

                                    statusImage.removeEventListener('load', loader, false);

                                    this.cache.statuses[item.image] = statusImage;
                                };

                            statusImage.addEventListener('load', loader, false);

                            statusImage.src = item.image;
                        } else {
                            ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                            ctxMarker.drawImage(
                                this.cache.statuses[item.image],
                                statusesImageCropFromX,
                                statusesImageCropFromY,
                                this.cache.statuses[item.image].width - statusesImageCropFromX * 2,
                                this.cache.statuses[item.image].height - statusesImageCropFromY * 2,
                                x,
                                y,
                                statusesImageSize,
                                statusesImageSize
                            );
                        }

                        y += statusesImageSize + statusesImageMargin;
                    }
                }
*/
                // --- Marker: main

                if (markerType == "0" || markerType == "2") {
                    ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                    ctxMarker.translate(xStart, 0);
                    ctxMarker.beginPath();
                    ctxMarker.strokeStyle = borderColor;
                    ctxMarker.lineWidth = borderWidth;
                    ctxMarker.fillStyle = boubleBg;
                    this.drawBorder(ctxMarker, boubleWidth, boubleWidth, boubleRoundSize, boubleArrowSize);
                    ctxMarker.fill();
                    this.drawBorder(ctxMarker, boubleWidth, boubleWidth, boubleRoundSize, boubleArrowSize);
                    ctxMarker.stroke();

                    if (!this.cache.cars[car.image]) {
                        let carImage = new Image(),
                            loader = () => {
                                let width = carImageSize,
                                    height = carImageSize * carImage.height / carImage.width;

                                ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                                ctxMarker.drawImage(carImage, xStart + (boubleWidth - width) / 2, (boubleWidth - height) / 2, width, height);

                                carImage.removeEventListener('load', loader, false);

                                this.cache.cars[car.image] = carImage;
                            };

                        carImage.addEventListener('load', loader, false);

                        carImage.src = Urls.IMG_CAR_STATE + car.image;
                    } else {
                        let width = carImageSize,
                            height = carImageSize * this.cache.cars[car.image].height / this.cache.cars[car.image].width;

                        ctxMarker.setTransform(1, 0, 0, 1, 0, 0);
                        ctxMarker.drawImage(this.cache.cars[car.image], xStart + (boubleWidth - width) / 2, (boubleWidth - height) / 2, width, height);
                    }
                }

                if (markerType == "1" || markerType == "2") {

                    // --- Arrow

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
                        this.drawArrow(ctxMarker, size, '#' + cursorColor, borderWidth, '#000');
                        ctxMarker.restore();
                    }
                }

            }, 50);
        }
    });
}

function carMarkerCreateHtml(ll, className, data,
                             cursorColor, blink = false) {
    return L.marker(ll,
        {
            icon: this.getCarIcon(data, className, data.Course, cursorColor, blink),
            zIndexOffset: 2000
        });
}

function move(marker, point, car,
              cursorColor, blink = false) {
    marker.setIcon(this.getCarIcon(car, "mapmarker", car.Course, cursorColor, blink));
    marker.setLatLng(point);
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