function InitMap(id, maxClusterRadius) {
    let mapObject = Object();
    mapObject.map = L.map(id).setView([55.173702, 61.383591], 13);

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

//установка маркера на карту leaflet
function setDeviceMarker(marker, deviceInfo) {
    marker.addTo(mapObject.devicesLayer);
    marker.bindPopup(deviceInfo);
}

function createMarker(item) {
    let carIcon = L.icon({
        iconUrl: iconPath,
        iconSize: [32, 32],
        popupAnchor: [-3, -16],
    });
    let lat = item.LastPosition.Lat;
    let lng = item.LastPosition.Lng;
    let marker = L.marker([lat, lng], {
        icon: carIcon,
        rotationAngle: item.Course,
        rotationOrigin: "center center"
    });
    let info = item.Name + " " + item.Plate + "<br>Скорость: " + round(item.Speed, 2) + "км/ч<br>Состояние: " + getStateName(item.Speed) + "<br>Последняя активность: " + calculateTimeDifference(item.LastTime);
    marker.bindPopup(info);
    marker.bindTooltip(info);
    return marker;
}