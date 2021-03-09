function InitMap(id, maxClusterRadius) {
    let mapObject = Object();
    mapObject.map = L.map(id).setView([51.505, -0.09], 13);

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
    let carIcon;
    if (!!item.DeviceInfo.Image) {
        carIcon = L.icon({
            iconUrl: imagesPath + item.DeviceInfo.Image,
            iconSize: [32, 32],
            popupAnchor: [-3, -76],
        });
    }
    let marker = !!carIcon ? L.marker([item.LastPosition.Lat, item.LastPosition.Lng], {icon: carIcon}) : L.marker([item.LastPosition.Lat, item.LastPosition.Lng]);
    marker.bindPopup(item.Name + "<br>Скорость: " + round(item.Speed, 2) + "км/ч<br>Состояние: " + getStateName(item.State));
    return marker;
}