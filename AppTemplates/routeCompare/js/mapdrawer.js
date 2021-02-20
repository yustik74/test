function drawTrack(latlngs, color = 'red', popup, layer = mapObject.mapObjectsLayer) {
    let polyline = L.polyline(latlngs, {color: color}).addTo(layer);
    polyline.bindPopup(popup);
}

function clearMapLayers() {
    mapObject.mapObjectsLayer.clearLayers();
    mapObject.calculatedRouteLayer.clearLayers();
}

//установка маркера на карту leaflet
function setDeviceMarker(point, deviceInfo) {
    mapObject.map.setView([point.Lat, point.Lng], 9);
    var marker = L.marker([point.Lat, point.Lng]).addTo(mapObject.mapObjectsLayer);
    marker.bindPopup(deviceInfo).openPopup();
}

//инициализация карты leaflet со слоями для маршрутов и маркера
function initMap(mapId)
{
    let result = Object();
    result.map = L.map(mapId).setView([55.172589, 61.406295], 10);
    result.mapObjectsLayer = L.layerGroup().addTo(result.map);
    result.calculatedRouteLayer = L.layerGroup().addTo(result.map);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy;OpenStreetMap contributors, ' +
            'Imagery ©Mapbox',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(result.map);
    return result;
}