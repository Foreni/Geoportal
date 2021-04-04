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

let radius = 1; //kilometers
let requestUrl = 'http://data.sensor.community/airrohr/v1/filter/area=49.7821562,22.7692634,' + radius.toString();
let request = new XMLHttpRequest();
request.open('GET', requestUrl);
request.responseType = 'json';

//TUTAJ WSADZAĆ KOD WYKONUJĄCY SIĘ PRZY POKAZYWANIU CZUJNIKÓW NA MAPIE
request.onload = () => {
    document.getElementById("preloader").remove();
    const response = request.response;
    sensors = {};
    sensors.type = 'FeatureCollection';
    sensors.features = [];

    for (let i = 0; i < response.length; i++) {

        let addNewFeature = true;

        for (let j = 0; j < sensors.features.length; j++)
        {   
            const keys = Object.keys(sensors.features[j].properties);

            if (sensors.features[j].properties[keys[0]].location.id == response[i].location.id)
            {  
                addNewFeature = false;
                if (keys.indexOf(response[i].sensor.sensor_type.name) == -1)
                {
                    sensors.features[j].properties[response[i].sensor.sensor_type.name] = response[i];
                }
                break;
            }
        }

        if (addNewFeature == true) {
            let localisation = [parseFloat(response[i].location.longitude), parseFloat(response[i].location.latitude)];
            let properties = {[response[i].sensor.sensor_type.name]: response[i]};
            let feature = turf.point(localisation, properties); 
            sensors['features'].push(feature);
        }
    }

    // let interpolation = turf.interpolate(sensors, 1, {
    //     property: 'sensordatavalues.id',
    //     gridType: 'hex'
    // });

    // L.geoJSON(interpolation, {
    //     onEachFeature: (feature, layer) => {layer.bindPopup(feature.properties.id.toString())} 
    // }).addTo(map);

    console.log(sensors.features);
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