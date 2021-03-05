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
    mapObject.devicesLayer = L.markerClusterGroup({maxClusterRadius: maxClusterRadius}).addTo(mapObject.map);
    return mapObject;
}

//установка маркера на карту leaflet
function setDeviceMarker(marker, deviceInfo) {
    marker.addTo(mapObject.devicesLayer);
    marker.bindPopup(deviceInfo);
}