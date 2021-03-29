const cursorIconSet = 1;
const cursorBackgroundSet = 2;
const iconSet = 4;
const iconBackgroundSet = 8;
const auto = 'auto';
const none = 'none';
const defaultColor = 'ff0000';

function getMarkerImage(car) {
    return new Promise(async (resolve) => {
        let defaultSize = 0;
        let resultCanvasElement = document.createElement('canvas');
        resultCanvasElement.width = defaultSize;
        resultCanvasElement.height = defaultSize * 2;
        let context = resultCanvasElement.getContext('2d');

        let iconCanvasElement = document.createElement('canvas');
        iconCanvasElement.width = defaultSize;
        iconCanvasElement.height = defaultSize;
        let iconContext = iconCanvasElement.getContext('2d');

        let cursorCanvasElement = document.createElement('canvas');
        cursorCanvasElement.width = defaultSize;
        cursorCanvasElement.height = defaultSize;
        let cursorContext = cursorCanvasElement.getContext('2d');

        let anchorX = 0;
        let anchorY = 0;
        if (markerType == 0) {
            let anchor = await drawDefaultCursor(resultCanvasElement, context, car);
            anchorX = anchor[0];
            anchorY = anchor[1];
        } else {
            await new Promise(async (resolve) => {
                let label = getLabel(car.Name + ' ' + car.Plate);
                let iconAdditionalMargin = 0;
                iconAdditionalMargin = await drawIconWithBackground(iconCanvasElement, iconContext, car);
                let cursor = await drawCursorWithBackground(cursorCanvasElement, cursorContext, car);
                let canvasWidth = Math.max(iconCanvasElement.width, cursorCanvasElement.width);
                if (!label) {
                    label = Object();
                    label.width = label.height = 0;
                }
                let canvasHeight = label.height + iconCanvasElement.height + cursorCanvasElement.height;
                let iconMargin = 0;
                let cursorMargin = (canvasWidth - cursorCanvasElement.width) / 2;
                resultCanvasElement.width = Math.max(iconMargin + label.width + iconAdditionalMargin, canvasWidth);
                resultCanvasElement.height = canvasHeight;
                if (cursor) {
                    anchorX = cursorMargin + cursor.anchorX;
                    anchorY = label.height + iconCanvasElement.height + cursor.anchorY;
                }
                if (iconCanvasElement.width > 0)
                    iconMargin = (anchorX) - iconCanvasElement.width / 2;
                let iconOffset = 0.35;
                /*if (parm.Settings['IconBackgroundPath'] == auto)
                    iconOffset = 0.35;*/

                if (label.width != 0 && label.height != 0)
                    context.drawImage(label, iconMargin + iconAdditionalMargin, iconCanvasElement.height * iconOffset);
                if (iconCanvasElement.width != 0 && iconCanvasElement.height != 0)
                    context.drawImage(iconCanvasElement, iconMargin, label.height + iconCanvasElement.height * iconOffset);
                if (cursorCanvasElement.width != 0 && cursorCanvasElement.height != 0)
                    context.drawImage(cursorCanvasElement, cursorMargin, label.height + iconCanvasElement.height);
                resolve();
            });
        }
        resolve({image: resultCanvasElement.toDataURL(), anchorX: anchorX, anchorY: anchorY});
    });
}

function drawDefaultCursor(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        let image = await getDefaultArrowCursor(48, car);
        context.drawImage(image.image, 0, 0);
        resolve([image.anchorX, image.anchorY]);
    });
}

function drawCursorWithBackground(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        let anchorX = 0;
        let anchorY = 0;
        let backgroundCanvas = document.createElement('canvas');
        let ctxBackground = backgroundCanvas.getContext('2d');
        let iconCanvas = document.createElement('canvas');
        let ctxIcon = iconCanvas.getContext('2d');
        if (flagIsSet(cursorIconSet) && parm.Settings['CursorBackgroundPath'] != none) {
            if (parm.Settings['CursorBackgroundPath'] == auto) {
                let defaultCursor = await getDefaultArrowCursor(48, car);
                backgroundCanvas.width = defaultCursor.image.width;
                backgroundCanvas.height = defaultCursor.image.height;
                backgroundCanvas = defaultCursor.image;
                anchorX = defaultCursor.anchorX;
                anchorY = defaultCursor.anchorY;
            } else {
                let image = await getImage(parm.Urls.Content + parm.Settings['CursorBackgroundPath']);
                backgroundCanvas.width = image.width;
                backgroundCanvas.height = image.height;
                anchorX = backgroundCanvas.width / 2;
                anchorY = backgroundCanvas.height / 2;
                backgroundCanvas = getRotatedCursor(image, car.Course);
            }
            ctxBackground.drawImage(backgroundCanvas, 0, 0);
        }
        if (flagIsSet(cursorBackgroundSet) && parm.Settings['CursorIconPath'] != none) {
            let image;
            if (parm.Settings['CursorIconPath'] !== auto) {
                image = await getImage(parm.Urls.Content + parm.Settings['CursorIconPath']);
            } else {
                if (parm.Settings['CursorBackgroundPath'] != auto)
                    image = await getImage(car.IconPath);
            }
            if (image) {
                iconCanvas.width = image.width;
                iconCanvas.height = image.height;
                ctxIcon.drawImage(image, 0, 0);
            }
        }
        drawBackgroundAndIcon(canvasElement, context, backgroundCanvas, iconCanvas, true);
        resolve({anchorX: anchorX, anchorY: anchorY});
    });
}

function drawBackgroundAndIcon(canvasElement, context, backgroundCanvas, iconCanvas, isCursor) {
    if (backgroundCanvas.width != 0 && backgroundCanvas.height != 0) {
        canvasElement.width = backgroundCanvas.width;
        canvasElement.height = backgroundCanvas.height;
    } else {
        canvasElement.width = iconCanvas.width;
        canvasElement.height = iconCanvas.height;
    }
    let margin = 2;
    let multiplier = 1;
    let marginX = 0;
    let marginY = 0;
    if (backgroundCanvas.width != 0 && backgroundCanvas.height != 0) {
        context.drawImage(backgroundCanvas, 0, 0);
        if (iconCanvas.width > backgroundCanvas.width || iconCanvas.height > backgroundCanvas.height) {
            multiplier = iconCanvas.width > iconCanvas.height ? backgroundCanvas.width / iconCanvas.width : backgroundCanvas.height / iconCanvas.height;
        }
        marginX = (backgroundCanvas.width - iconCanvas.width * multiplier) / 2;
    }
    if (iconCanvas.width != 0 && iconCanvas.height != 0) {
        if (isCursor)
            marginY = (backgroundCanvas.height - iconCanvas.height * multiplier) / 2;
        context.drawImage(iconCanvas, marginX + margin, marginY + margin, iconCanvas.width * multiplier - margin * 2, iconCanvas.height * multiplier - margin * 2);
    }
}

function drawIconWithBackground(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        let backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = backgroundCanvas.height = 0;
        let ctxBackground = backgroundCanvas.getContext('2d');
        let iconCanvas = document.createElement('canvas');
        iconCanvas.width = iconCanvas.height = backgroundCanvas.width = backgroundCanvas.height = 0;
        let ctxIcon = iconCanvas.getContext('2d');
        let iconMargin = 0;
        let width = undefined;
        let defaultWidth = 48;
        if (flagIsSet(iconBackgroundSet) && parm.Settings['IconBackgroundPath'] != none) {
            let image;
            let result;
            if (parm.Settings['IconBackgroundPath'] == auto) {
                result = await getDefaultIconBackground();
                image = result.image;
                iconMargin = result.margin;
                width = result.width;
            } else {
                image = await getImage(parm.Urls.Content + parm.Settings['IconBackgroundPath']);
            }
            backgroundCanvas.width = image.width;
            backgroundCanvas.height = image.height;
            ctxBackground.drawImage(image, 0, 0);
        }

        if (flagIsSet(iconSet) && parm.Settings['IconPath'] != none) {
            let image;
            if (parm.Settings['IconPath'] == auto) {
                if (width)
                    image = await getIcon(width, car.IconPath);
                else {
                    if (backgroundCanvas.width == 0)
                        backgroundCanvas.width = defaultWidth;
                    image = await getIcon(backgroundCanvas.width, car.IconPath);
                }
            } else {
                image = await getImage(parm.Urls.Content + parm.Settings['IconPath']);
            }
            iconCanvas.width = image.width;
            iconCanvas.height = image.height;
            ctxIcon.drawImage(image, 0, 0);
        }
        drawBackgroundAndIcon(canvasElement, context, backgroundCanvas, iconCanvas);
        resolve(iconMargin);
    });
}

function getLabel(alias) {
    if (parm.Settings['DrawLabel'] == 'true') {
        let xStart = 0,
            boubleRoundSize = 4,
            labelFontSize = window.devicePixelRatio > 1 ? 12 : 11,
            labelFont = labelFontSize + "px " + "'Roboto Condensed'",//getComputedStyle(document.body).fontFamily,
            labelMargin = 1,
            labelPadding = 4,
            labelItemsCount = 1,
            labelSpace = 1,
            labelWidth = 0,
            labelHeight = labelItemsCount * labelFontSize + labelPadding + labelPadding / 2 + (labelItemsCount - 1) * labelSpace,
            labelColor = "#222222",
            labelBg = "#ffffff";

        // --- Label: calc size
        let canvasLabel = document.createElement('canvas');
        canvasLabel.style['margin-bottom'] = labelMargin + "px";
        let ctxLabel = canvasLabel.getContext('2d');
        ctxLabel.imageSmoothingEnabled = ctxLabel.mozImageSmoothingEnabled = ctxLabel.webkitImageSmoothingEnabled = true;
        ctxLabel.font = labelFont;
        labelWidth = ctxLabel.measureText(alias).width;
        labelWidth += xStart + labelPadding * 2;
        canvasLabel.width = labelWidth;
        canvasLabel.height = labelHeight;
        // --- Label: draw

        ctxLabel.translate(xStart, 0);
        ctxLabel.font = labelFont;
        ctxLabel.textBaseline = "bottom";

        ctxLabel.fillStyle = labelBg;
        this.drawBorder(ctxLabel, labelWidth - xStart, labelHeight, boubleRoundSize - 1, 0);
        ctxLabel.fill();

        ctxLabel.translate(labelPadding, labelPadding + labelFontSize);

        ctxLabel.fillStyle = labelColor;
        ctxLabel.fillText(alias, 0, 0);
        return canvasLabel;
    }
}

function getRotatedCursor(image, angle) {
    let cursorCanvasElement = document.createElement('canvas');
    cursorCanvasElement.width = image.width;
    cursorCanvasElement.height = image.height;
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

function getIcon(width, iconPath) {
    return new Promise((resolve) => {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        getImage(iconPath).then(function (image) {
            //context.imageSmoothingEnabled = context.mozImageSmoothingEnabled = context.webkitImageSmoothingEnabled = true;
            let multiplier = 1;
            if (image.width > width || image.height > width) {
                multiplier = image.width > image.height ? width / image.width : width / image.height;
            }
            canvas.width = image.width * multiplier;
            canvas.height = image.height * multiplier;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas);
        });
    });
}

function getDefaultIconBackground() {
    return new Promise((resolve) => {
        let carImageSize = window.devicePixelRatio > 1 ? 40 : 32,
            boubleWidth = carImageSize + 6,
            boubleHeight = boubleWidth * 1.5,
            boubleRoundSize = 4,
            boubleArrowSize = carImageSize / 2.5,
            boubleBg = "rgba(255,255,255,.75)",
            borderColor = "#cccccc",
            borderWidth = 1;
        let size = boubleWidth;
        let canvas = document.createElement('canvas');
        canvas.width = boubleWidth + borderWidth * 2;
        canvas.height = boubleHeight;
        let context = canvas.getContext('2d');

        let xStart = borderWidth / 2;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.translate(xStart, 0);
        context.beginPath();
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        context.fillStyle = boubleBg;
        drawBorder(context, size, size, boubleRoundSize, boubleArrowSize);
        context.fill();
        //drawBorder(context, size, size, boubleRoundSize, boubleArrowSize);
        context.stroke();
        let resultCanvas = document.createElement('canvas');
        resultCanvas.width = Math.max(48, canvas.width);
        resultCanvas.height = Math.max(48, canvas.height);
        let margin = (resultCanvas.width - size) / 2;
        let resultCtx = resultCanvas.getContext('2d');
        resultCtx.drawImage(canvas, margin, 0);
        resolve({image: resultCanvas, width: boubleWidth, margin: margin});
    });
}

function _getDefaultArrowCursor(sideSize, car, cursorColor) {
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
        context.strokeStyle = '#' + cursorColor;
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
            carImage.onerror = function () {
                console.log('Error download ' + iconPath);
            };
        } else {
            resolve(cache.cars[iconPath]);
        }
    });
}

function calculateRadian(degrees) {
    return degrees * Math.PI / 180;
}

function getDefaultArrowCursor(sideSize, car) {
    return new Promise((resolve) => {
        // --- Arrow
        let cursorColor = getColorFromImageLink(car.IconPath);
        let carArrowSize = 26;
        let carArrowSizeMax = Math.ceil(Math.sqrt(2 * Math.pow(carArrowSize, 2))) + 4; // Max arrow size on rotate
        let canvasElement = document.createElement('canvas');
        canvasElement.width = carArrowSizeMax;
        canvasElement.height = sideSize;
        let ctxArrow = canvasElement.getContext('2d');
        let x = sideSize / 2,
            y = sideSize / 2;

        if (car.Course == -1) {
            drawPosition(ctxArrow, x, y, carArrowSize / 2, '#' + cursorColor);
        } else {
            const borderWidth = 2;
            const size = carArrowSize - borderWidth * 2;

            ctxArrow.setTransform(1, 0, 0, 1, 0, 0);
            ctxArrow.save();
            ctxArrow.translate(x, y);
            ctxArrow.rotate(calculateRadian(car.Course));
            ctxArrow.translate(-size / 2, -size / 2);
            drawArrow(ctxArrow, size, '#' + cursorColor, borderWidth, '#000');
            ctxArrow.restore();
        }
        resolve({image: canvasElement, anchorX: x, anchorY: y});
    });
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

function drawArrow(ctx, size, color, borderWidth, borderColor) {
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

function getColorFromImageLink(link) {
    let linkLowerCase = link.toLowerCase();
    let splitString = linkLowerCase.split('/');
    for (let counter = 1; counter < splitString.length; counter++) {

        if (splitString[counter] == 'car' && splitString[counter - 1] == 'image' && splitString.length >= counter + 3) {
            if (splitString[counter + 3] == 'transparent')
                return defaultColor;
            return splitString[counter + 3];
        }
    }
    return defaultColor;
}