let moveAnimationLastTimeLimit = 3600 * 24 * 7;

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
        attributionControl: false,
    }).setView(coords, 13);
    mapObject.map.zoomControl.setPosition('bottomright');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(mapObject.map);
    if (!!!maxClusterRadius)
        maxClusterRadius = 120;
    mapObject.devicesLayer = L.markerClusterGroup({
        maxClusterRadius: maxClusterRadius,
        showCoverageOnHover: false,
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
        let image = await getMarkerImage(item);
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
        let image = await getMarkerImage(item);
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
    return "<p><b>" + item.Name + "</b>"
        //+ " " + item.Plate
        + "</p><p>Скорость: " + round(item.Speed, 2) + " км/ч<br>Состояние: " + getStateName(item.Speed)
        + "</p><p>Последняя активность: " + getTimeDifferenceString(item.LastTime) + "</p>";
}