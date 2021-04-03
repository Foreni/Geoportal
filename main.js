let map = L.map('map', {
    dragging: true,
    minZoom: 11,
    maxZoom: 16,

}).setView([49.7821562, 22.7692634], 11);

map.setMaxBounds(map.getBounds());

L.tileLayer('https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.geoJSON(data, {
    style: function(feature) {
        return {
            color: '#a17d9d',
            fillOpacity: 0.2
        };
    }
}).addTo(map)

let radius = 50; //kilometers
let requestUrl = 'http://data.sensor.community/airrohr/v1/filter/area=49.7821562,22.7692634,' + radius.toString();
let request = new XMLHttpRequest();
request.open('GET', requestUrl);
request.responseType = 'json';

//TUTAJ WSADZAĆ KOD WYKONUJĄCY SIĘ PRZY POKAZYWANIU CZUJNIKÓW NA MAPIE
request.onload = () => {
    document.getElementById("preloader").remove();
    const response = request.response;
    sensors = {};
    sensors['type'] = 'FeatureCollection';
    sensors['features'] = [];
    let added = [];

    for (let i = 0; i < response.length; i++) {
        let omit = (added.indexOf(response[i].location.longitude) != -1);
        if (omit) continue;

        let feature = turf.point([response[i].location.longitude, response[i].location.latitude], response[i])        
        added.push(response[i].location.longitude);
        sensors['features'].push(feature);
    }

    L.geoJSON(sensors).addTo(map);
}

request.send();

var legend = L.control({position: 'bottomleft'});
function getColor(d) {
    return d > 500 ? '#800080' :
           d > 200  ? '#BD0026' :
           d > 100  ? '#E31A1C' :
           d > 50  ? '#ff3300' :
           d > 25   ? '#ffb31a' :
                      '#00ff00';
}
legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 25, 50, 100, 200, 500],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
legend.addTo(map);