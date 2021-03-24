let moveAnimationLastTimeLimit = 3600 * 24 * 7;
const cursorIconSet = 1;
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
    if (!!parm.Settings['CursorIconPath'])
        markerType |= cursorIconSet;
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