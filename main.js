let activeSensorLayerID = undefined;

function getPM10Color(d) {
    if (d === undefined) return '#bfbfbf';
    return d > 150 ? '#990000' :
           d > 110  ? '#e50000' :
           d > 80  ? '#e58100' :
           d > 50  ? '#ffd911' :
           d > 20  ? '#b0dd10' : '#57b108'
}

let map = L.map('map', {
    minZoom: 11,
    maxZoom: 16,
    doubleClickZoom: false

}).setView([49.7821562, 22.7692634], 11);

map.setMaxBounds(map.getBounds());

L.tileLayer(atob("aHR0cHM6Ly97c30uYmFzZW1hcHMuY2FydG9jZG4uY29tL3Jhc3RlcnRpbGVzL2RhcmtfYWxsL3t6fS97eH0ve3l9LnBuZw=="), {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a><br>Measurements: <a href="https://sensor.community/">Sensor.Community</a> contributors.'
}).addTo(map);

let radius = 50; //kilometers
let requestUrl = 'http://data.sensor.community/airrohr/v1/filter/area=49.7821562,22.7692634,' + radius.toString();
let request = new XMLHttpRequest();
request.open('GET', requestUrl);
request.responseType = 'json';

//TUTAJ WSADZAĆ KOD WYKONUJĄCY SIĘ PRZY POKAZYWANIU CZUJNIKÓW NA MAPIE
request.onload = () => {
    document.getElementById("preloader").hidden = true;
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

    let normalRadius = 8;
    let markedRadius = 15;
    let markedStyles = {
        stroke: true
    };

    function markedSensorStyling () {
        markers._layers[activeSensorLayerID]._radius = normalRadius
    }

    markers = L.geoJSON(sensors, {
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.circleMarker(latlng, {"radius": normalRadius})
        },
        style: (feature) => {
            featureStyle = {
                stroke: false,
                color: "white",
                weight: 2,
                fillOpacity: 1,
                fillColor: '#bfbfbf'
            }

            if (feature.properties.SDS011 !== undefined)
                featureStyle.fillColor = getPM10Color(feature.properties.SDS011.sensordatavalues[0].value);
            return featureStyle;
        },
        onEachFeature: (feature, layer) => {
            layer.on('click', () => {
                if (activeSensorLayerID !== undefined) {
                    markedSensorStyling(); markers.resetStyle();
                }
                
                if (activeSensorLayerID !== layer._leaflet_id) {
                    layer._radius = markedRadius;
                    layer.setStyle(markedStyles)
                    activeSensorLayerID = layer._leaflet_id;
                }

                else {
                    activeSensorLayerID = undefined;
                }
            });
        }
    });

    markers.addTo(map);
}

request.send();

//MAP KEY BELOW

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'legend'),
    grades = [0, 20, 50, 80, 110, 150]

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
        '<i style="background:' + getPM10Color(grades[i] + 1) + '"></i> ' + (grades[i] != 0 ? (grades[i] + 0.1).toString().replace(".", ",") : grades[i]) + (grades[i + 1] ? ' &ndash; ' + grades[i + 1]+ '<br>' : '+');
    }

    return div;
};
legend.addTo(map);