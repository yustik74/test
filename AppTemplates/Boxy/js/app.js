'use strict';

// config.Settings.serial - device serial number ([lat, lng])
// config.Settings.coord - initial map center (if no track data)

class App {
    constructor(config) {
        this.id = null;
        this.serial = config.Settings.serial;
        this.url = config.Urls.Service + '/';
        this.token = config.Token;
        this.schemaID = config.Organization.UID;

        this.currentDate = new Date();

        this.map = L.map('map', {
            preferCanvas: true,
            zoomControl: false
        });

        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        this.map.addLayer(L.tileLayer('//khm{s}.google.com/kh/v=863&hl=ru-RU&x={x}&y={y}&z={z}', { subdomains: '01' }));

        this.layerCar = L.layerGroup([], {});

        this.map.addLayer(this.layerCar);

        const initialCoord = config.Settings.coord ? JSON.parse(config.Settings.coord) : [55.5, 61.2];

        this.map.setView(initialCoord, 18);

        this.post('EnumDevices', { }, (r) => {
            const item = r.Items.find((i) => i.Serial == +this.serial);

            this.id = item.ID;

            this.changeDate();
        });

        this.initPeriod();

        if (navigator.geolocation) {
            this.initLocation(initialCoord);
        }
    }

    initPeriod() {
        const period = document.querySelector('.period');
        const periodDown = period.querySelector('.period__control--down');
        const periodUp = period.querySelector('.period__control--up');
        const periodDate = period.querySelector('.period__date');

        periodDown.addEventListener('click', () => this.onClickPeriodSlide(-1, periodDate));
        periodUp.addEventListener('click', () => this.onClickPeriodSlide(1, periodDate));
        periodDate.addEventListener('change', (e) => this.onChangePeriod(e.target.value));
        periodDate.value = this.periodDT(this.currentDate);
        periodDate.setAttribute('max', this.periodDT(new Date()));
    }

    initLocation(initialCoord) {
        const locationMarker = L.circleMarker(initialCoord, {
            weight: 8,
            opacity: 0.5,
            fillColor: '#f00',
            fillOpacity: 0.5
        });

        locationMarker.addTo(this.map);

        navigator.geolocation.watchPosition((p) => {
            locationMarker.setLatLng({ lat: p.coords.latitude, lng: p.coords.longitude });
        }, (e) => {
            locationMarker.remove();
            //this.message('location', true, e.message);
            //setTimeout(() => this.message('location', false), 5000);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0
        });
    }

    onClickPeriodSlide(d, periodDate) {
        if (this.periodDT(this.currentDate) === periodDate.getAttribute('max') && d > 0) {
            return;
        }

        this.currentDate.setDate(this.currentDate.getDate() + d);
        periodDate.value = this.periodDT(this.currentDate);
        this.changeDate();
    }

    onChangePeriod(value) {
        this.currentDate = new Date(value);
        this.changeDate();
    }

    changeDate() {
        const sd = new Date(this.currentDate.getTime());
        const ed = new Date(this.currentDate.getTime());

        sd.setHours(0,0,0,0);
        ed.setHours(23,59,59,999);

        this.layerCar.clearLayers();

        this.message('notrack', false);

        this.post('GetTrack', {
            IDs: this.id,
            SD: this.fmtDT(sd),
            ED: this.fmtDT(ed),
            tripSplitterIndex: -1
        }, (r) => {
            const track = r[this.id][0];
            const bounds = L.latLngBounds([]);

            if ( ! track || track.DT.length == 0) {
                this.message('notrack', true, 'Нет данных');
                return;
            }

            for (let i = 0; i < track.Lat.length; i++) {
                const t = Date.parse(track.DT[i]);
                const d = new Date(t);
                const coord = L.latLng(track.Lat[i], track.Lng[i]);

                this.buildBarker(coord, d, i + 1);

                bounds.extend(coord);
            }

            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [100, 100] });
            }
        });
    }

    buildBarker(coord, d, i) {
        const hh = d.getHours();
        const mi = d.getMinutes();

        L.marker(coord, {
            icon: L.divIcon({
                iconSize: [34, 18],
                className: 'marker',
                html: '<span class="marker__time">' + (hh > 9 ? '' : '0') + hh + ':' + (mi > 9 ? '' : '0') + mi + '</span>'
                    + '<span class="marker__index">' + i + '</span>'
            })
        }).addTo(this.layerCar);
    }

    message(id, show, message) {
        const m = document.querySelector('.message--' + id);

        m.classList[show ? 'add' : 'remove']('message--visible');

        m.innerHTML = message ? message : '';
    }

    periodDT(d) {
        const mm = d.getMonth() + 1;
        const dd = d.getDate();

        return [d.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
    }

    fmtDT(d) {
        const mm = d.getMonth() + 1;
        const dd = d.getDate();
        const hh = d.getHours();
        const mi = d.getMinutes();

        return d.getFullYear() + (mm > 9 ? '' : '0') + mm + (dd > 9 ? '' : '0') + dd + '-' + (hh > 9 ? '' : '0') + hh + (mi > 9 ? '' : '0') + mi;
    }

    post(method, data, callback) {
        const formData = new FormData();

        for (let key in data) {
            formData.append(key, data[key]);
        }

        formData.append('session', this.token);
        formData.append('schemaID', this.schemaID);

        fetch(this.url + method, {
            method: 'POST',
            body: formData
        })
        .then((r) => r.json().then(callback))
        .catch((r) => console.error(r));
    }
}

const app = new App(window['external-settings']);
