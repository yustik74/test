function getMarkerImage(car) {
    return new Promise(async (resolve) => {
        let resultCanvasElement = document.createElement('canvas');
        resultCanvasElement.width = 48;
        resultCanvasElement.height = 96;
        let context = resultCanvasElement.getContext('2d');

        let iconCanvasElement = document.createElement('canvas');
        iconCanvasElement.width = 48;
        iconCanvasElement.height = 48;
        let iconContext = iconCanvasElement.getContext('2d');

        let iconBackgroundCanvasElement = document.createElement('canvas');
        iconBackgroundCanvasElement.width = 48;
        iconBackgroundCanvasElement.height = 48;
        let iconBackgroundContext = iconBackgroundCanvasElement.getContext('2d');

        let cursorCanvasElement = document.createElement('canvas');
        cursorCanvasElement.width = 48;
        cursorCanvasElement.height = 48;
        let cursorContext = cursorCanvasElement.getContext('2d');

        let cursorBackgroundCanvasElement = document.createElement('canvas');
        cursorBackgroundCanvasElement.width = 48;
        cursorBackgroundCanvasElement.height = 48;
        let cursorBackgroundContext = cursorBackgroundCanvasElement.getContext('2d');

        let xPos = iconCanvasElement.width / 2;
        let yPos = iconCanvasElement.height / 4 * 3;
        if (markerType == 0) {
            let anchor = await drawDefaultCursor(resultCanvasElement, context, car);
            xPos = anchor[0];
            yPos = anchor[1];
        } else {
            await new Promise(async (resolve) => {
                let anchor = await drawCursorBackground(cursorBackgroundCanvasElement, cursorBackgroundContext, car);
                await drawCursorIcon(cursorCanvasElement, cursorContext, car);
                await drawIconBackground(iconBackgroundCanvasElement, iconBackgroundContext);
                await drawIcon(iconCanvasElement, iconContext, car);
                if (anchor) {
                    xPos = anchor[0];
                    yPos = anchor[1];
                }
                let iconWidth = Math.max(iconCanvasElement.width, iconBackgroundCanvasElement.width);
                let iconHeight = Math.max(iconCanvasElement.height, iconBackgroundCanvasElement.height);
                let cursorWidth = Math.max(cursorCanvasElement.width, cursorBackgroundCanvasElement.width);
                let cursorHeight = Math.max(cursorCanvasElement.height, cursorBackgroundCanvasElement.height)
                resultCanvasElement.width = Math.max(iconWidth, cursorWidth);
                resultCanvasElement.height = iconHeight + cursorHeight;
                xPos = cursorBackgroundCanvasElement.width / 2;
                yPos = cursorBackgroundCanvasElement.height / 2 + iconHeight;
                context.drawImage(iconBackgroundCanvasElement, 0, 0);
                context.drawImage(iconCanvasElement, 0, 0);
                context.drawImage(cursorBackgroundCanvasElement, 0, iconHeight);
                context.drawImage(cursorCanvasElement, 0, iconHeight);
                resolve();
            });
        }
        resolve({image: resultCanvasElement.toDataURL(), anchorX: xPos, anchorY: yPos});
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

function drawCursorBackground(canvasElement, context, car) {
    let xPos = 0;
    let yPos = 0;
    return new Promise(async (resolve) => {
        if (flagIsSet(cursorIconSet) && parm.Settings['CursorBackgroundPath'] != none) {
            let cursorCanvasElement;
            if (parm.Settings['CursorBackgroundPath'] == auto) {
                let defaultCursor = await getDefaultArrowCursor(48, car, cursorColor);
                canvasElement.width = defaultCursor.image.width;
                canvasElement.height = defaultCursor.image.height;
                cursorCanvasElement = defaultCursor.image;
            } else {
                let image = await getImage(parm.Urls.Content + parm.Settings['CursorBackgroundPath']);
                canvasElement.width = image.width;
                canvasElement.height = image.height;
                cursorCanvasElement = getRotatedCursor(image, car.Course);
            }
            context.drawImage(cursorCanvasElement, 0, 0);
            xPos = canvasElement.width / 2;
            yPos = canvasElement.height / 2;
            resolve([xPos, yPos]);
        } else
            resolve();
    });
}

function drawCursorIcon(canvasElement, context, car) {
    return new Promise(async (resolve) => {
        if (flagIsSet(cursorBackgroundSet) && parm.Settings['CursorIconPath'] != none) {
            let image;
            if (parm.Settings['CursorIconPath'] == auto)
                //image = await getIcon(canvasElement.width, car.IconPath);
                resolve();
            image = await getImage(parm.Urls.Content + parm.Settings['CursorIconPath']);
            canvasElement.width = Math.max(image.width, canvasElement.width);
            canvasElement.height = Math.max(image.height, canvasElement.height);
            context.drawImage(image, 0, 0);
            resolve();
        } else
            resolve();
    });
}

function drawIconBackground(canvasElement, context) {
    return new Promise(async (resolve) => {
        if (flagIsSet(iconBackgroundSet) && parm.Settings['IconBackgroundPath'] != none) {
            let image;
            if (parm.Settings['IconBackgroundPath'] == auto) {
                image = await getDefaultIconBackground(canvasElement.width);
            } else {
                image = await getImage(parm.Urls.Content + parm.Settings['IconBackgroundPath']);
            }
            canvasElement.width = Math.max(image.width, canvasElement.width);
            canvasElement.height = Math.max(image.height, canvasElement.height);
            context.drawImage(image, 0, 0);
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
            } else {
                image = await getImage(parm.Urls.Content + parm.Settings['IconPath']);
            }
            canvasElement.width = Math.max(image.width, canvasElement.width);
            canvasElement.height = Math.max(image.height, canvasElement.height);
            context.drawImage(image, 0, 0);
            resolve();
        } else
            resolve();
    });
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
        let sizeCoef = 0.65;
        let context = canvas.getContext('2d');
        let xStart = (canvas.width - canvas.width * sizeCoef) / 2,
            boubleRoundSize = 4,
            boubleArrowSize = 36 / 2.5,
            boubleBg = "rgba(255,255,255,.75)",
            borderColor = "#cccccc",
            borderWidth = 1;
        let size = boubleWidth * sizeCoef;
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