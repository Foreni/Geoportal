"use strict";
document.getElementById('close-button').addEventListener("click", () => {
    clearSelection();
    activeSensorLayerID = undefined;
});

document.getElementById('pollution-change').addEventListener("click", () => {
    if (document.getElementById('pollution-change').innerText == 'PM10') {
        document.getElementById('pollution-change').innerText = 'PM2.5'
        drawMarkers(1);
    } else {
        document.getElementById('pollution-change').innerText = 'PM10';
        drawMarkers(0);
    }
});

let activeSensorLayerID = undefined;
let normalRadius = 8;
let markedRadius = 15;
let markedStyles = {
    weight: 2
};

function getClosestBiggestValueIndex (array, value) {
    array = array.slice();
    array.sort(function(a, b){return b - a});

    for (let i = 0; i < array.length; i++)
    {   
        if (value == array[array.length - 1])
            return 0;

        if (value > array[i]) {
            return (array.length - 1 - i);
        }
    }
}

let maxPM10RangesValues = [0, 20, 50, 80, 110, 150];
let maxPM25RangesValues = [0, 13, 35, 55, 75, 110];

function getAirState(pm10Value, pm25Value) {
    //,,No data" object must be always on last indexes array position.
    let indexes = [
        {"state" : 'Bardzo dobre powietrze', "color": '#57b108'},
        {"state" : 'Dobre powietrze', "color": '#b0dd10'},
        {"state" : 'Umiarkowanie czyste powietrze', "color": '#ffd911'},
        {"state" : 'Dostatecznie czyste powietrze', "color": '#e58100'},
        {"state" : 'Złe powietrze', "color": '#e50000'},
        {"state" : 'Bardzo złe powietrze', "color": '#990000'},
        {"state" : 'Brak danych o zanieczyszczeniach', "color": '#bfbfbf'},
    ]      

    if (pm10Value === undefined && pm25Value === undefined)
        return indexes[indexes.length - 1]

    let pm10Index = getClosestBiggestValueIndex(maxPM10RangesValues, pm10Value);
    let pm25Index = getClosestBiggestValueIndex(maxPM25RangesValues, pm25Value);

    if (pm10Index > pm25Index | pm25Index === undefined) {
        return indexes[pm10Index];    
    }
    else {
        return indexes[pm25Index];
    }
}

function markedSensorRestoreStyling () {
    markers._layers[activeSensorLayerID]._radius = normalRadius
}

function togglePanel() {
    if (document.getElementById("right-panel").style.display == "none")
        document.getElementById('right-panel').style.display="initial";
    else
        document.getElementById('right-panel').style.display="none";
}

function clearSelection() {
    markedSensorRestoreStyling(); 
    markers.resetStyle();
    togglePanel();
}

togglePanel();

function drawMarkers(pollutionIndex) {
    if (markers !== undefined & activeSensorLayerID !== undefined) {
        clearSelection();
    }

    activeSensorLayerID = undefined;        

    if (markers !== undefined & legend !== undefined) 
    {
        map.removeLayer(markers);
        map.removeControl(legend);
    }
    
    legend = L.control({position: 'bottomleft'});

    legend.onAdd = function (map) {

        let div = L.DomUtil.create('div', 'legend');
        div.innerHTML = "Legenda [µg/m³]:<br>"

        let grades = undefined;

        if (pollutionIndex == 1) {
            grades = maxPM25RangesValues;
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML += '<i style="background:' + getAirState(undefined, grades[i] + 1).color + '"></i> ' +
                grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1]+ '<br>' : '+<br>');
            }
        } else {
            grades = maxPM10RangesValues;
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML += '<i style="background:' + getAirState(grades[i] + 1).color + '"></i> ' +
                grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1] + '<br>' : '+<br>');
            }
        }

        div.innerHTML += "<span style='font-size: 11px'>Progi zanieczyszczeń <a href='https://powietrze.gios.gov.pl/pjp/current#'>GIOŚ</a></span>"

        return div; 
    };

    legend.addTo(map);

    markers = L.geoJSON(sensors, {
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.circleMarker(latlng, {"radius": normalRadius})
        },

        style: (feature) => {
            let featureStyle = {
                stroke: true,
                color: "white",
                weight: 0.5,
                fillOpacity: 1,
                fillColor: '#bfbfbf'
            }

            if (feature.properties.SDS011 !== undefined)
                if (pollutionIndex == 1)
                    featureStyle.fillColor = getAirState(undefined, feature.properties.SDS011.sensordatavalues[pollutionIndex].value).color;
                else
                    featureStyle.fillColor = getAirState(feature.properties.SDS011.sensordatavalues[pollutionIndex].value).color;
            return featureStyle;
        },

        onEachFeature: (feature, layer) => {layer.on('click', () => {onSensorClicked(feature, layer)})}
    }).addTo(map);
}

function initalizePanelData(feature, layer) {

    document.getElementById('right-panel').style.display="initial";    

    let commonIndex = {};

    let indoor = undefined;

    if (feature.properties.SDS011 !== undefined | feature.properties.BME280 !== undefined) {
        if (feature.properties.SDS011 !== undefined) {
            document.getElementById("pollution-section").style.display = 'initial'
            commonIndex = getAirState(feature.properties.SDS011.sensordatavalues[0].value, feature.properties.SDS011.sensordatavalues[1].value);
            let pm10Color = getAirState(feature.properties.SDS011.sensordatavalues[0].value).color;
            let pm25Color = getAirState(undefined, feature.properties.SDS011.sensordatavalues[1].value).color; 

            function styling (insertion) {
                return ("<div class=square style='background-color: " + insertion.toString() + ";'></div>")
            }

            document.getElementById('PM10-pollution-value').innerHTML = styling(pm10Color) + feature.properties.SDS011.sensordatavalues[0].value.toString() + " µg/m³";
            document.getElementById('PM2.5-pollution-value').innerHTML = styling(pm25Color) + feature.properties.SDS011.sensordatavalues[1].value.toString() + " µg/m³";

            indoor = feature.properties.SDS011.location.indoor;
        } else {
            commonIndex = getAirState();
        }

        if (feature.properties.BME280 !== undefined) {
            document.getElementById("weather-section").style.display = 'initial';

            for (let i = 0; i < Object.keys(feature.properties.BME280.sensordatavalues).length; i++) {
                    if (feature.properties.BME280.sensordatavalues[i].value_type == "temperature")
                        document.getElementById("temperature-value").innerHTML = feature.properties.BME280.sensordatavalues[i].value + ' &#8451;';
                    else if (feature.properties.BME280.sensordatavalues[i].value_type == "humidity") {
                        document.getElementById("humidity-value").innerHTML = feature.properties.BME280.sensordatavalues[i].value + '%';
                    }
                    else if (feature.properties.BME280.sensordatavalues[i].value_type == "pressure") {
                        
                        let pressure = parseFloat(feature.properties.BME280.sensordatavalues[i].value);
                        pressure = Math.round(pressure / 10) / 10;

                        document.getElementById("pressure-value").innerHTML = pressure + ' hPa';
                    }
            }
            
            indoor = feature.properties.BME280.location.indoor;
        }

    } else {
        commonIndex.state = "Żadne dane nie są dostępne"
    }

    if (feature.properties.SDS011 === undefined) document.getElementById("pollution-section").style.display = 'none';
    if (feature.properties.BME280 === undefined) document.getElementById("weather-section").style.display = 'none';

    document.getElementById('background-graphic').style.backgroundColor = commonIndex.color;

    if (indoor !== undefined) {
        if (indoor == 1)
            document.getElementById('header').innerHTML = '<b>' + 'Czujnik w budynku' + '</b>';
        else if (indoor == 0)
            document.getElementById('header').innerHTML = '<b>' + 'Czujnik zewnętrzny' + '</b>';
    }

    else {
        document.getElementById('header').innerHTML = '<b>' + 'Czujnik' + '</b>';
    }

    document.getElementById('subheader').innerHTML = '<b>' + commonIndex.state + '</b>';
}

function onSensorClicked(feature, layer) {
        if (activeSensorLayerID !== undefined) {
            clearSelection();
        }
        
        if (activeSensorLayerID !== layer._leaflet_id) {
            layer._radius = markedRadius;
            layer.setStyle(markedStyles)
            activeSensorLayerID = layer._leaflet_id;
            initalizePanelData(feature, layer, 'right-panel');
        }
    
        else {
            activeSensorLayerID = undefined;
        }
}

let map = L.map('map', {
    minZoom: 11,
    maxZoom: 16,
    doubleClickZoom: false

}).setView([49.7821562, 22.7692634], 11);

map.setMaxBounds(map.getBounds());

L.tileLayer(atob("aHR0cHM6Ly97c30uYmFzZW1hcHMuY2FydG9jZG4uY29tL3Jhc3RlcnRpbGVzL2RhcmtfYWxsL3t6fS97eH0ve3l9LnBuZw=="), {
    attributionControl: false,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a><br>Measurements: <a href="https://sensor.community/">Sensor.Community</a> contributors.'
}).addTo(map);

let radius = 50; //kilometers
let requestUrl = 'https://data.sensor.community/airrohr/v1/filter/area=49.7821562,22.7692634,' + radius.toString();
let request = new XMLHttpRequest();
request.open('GET', requestUrl);
request.responseType = 'json';

let markers = undefined;
let sensors = {};
let legend = undefined;

//TUTAJ WSADZAĆ KOD WYKONUJĄCY SIĘ PRZY POKAZYWANIU CZUJNIKÓW NA MAPIE
request.onload = () => {
    document.getElementById("preloader").style.display="none";
    const response = request.response;
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

    drawMarkers(0);
}

request.send();