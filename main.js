/* TODO 
- TO SMOOTH MAP DRAG LIMIT
- To reduce latency between map appearance and sensors appearance.
*/

let map = L.map('map', {
    dragging: true,
    minZoom: 11,
    maxZoom: 16,

}).setView([49.7821562, 22.7692634], 11);

map.setMaxBounds(map.getBounds());

L.tileLayer('https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//var circle = L.circle([49.7821562, 22.7692634], {radius: 50000}).addTo(map);

L.geoJSON(data, {
    style: function(feature) {
        return {
            color: '#a17d9d',
            fillOpacity: 0.2
        };
    }
}).addTo(map)

let requestUrl = 'https://data.sensor.community/airrohr/v1/filter/area=49.7821562,22.7692634,50'
let request = new XMLHttpRequest();
request.open('GET', requestUrl);
request.responseType = 'json';
request.send();

//TUTAJ WSADZAĆ KOD WYKONUJĄCY SIĘ PRZY POKAZYWANIU CZUJNIKÓW NA MAPIE
request.onload = () => {
    const response = request.response;
    sensors = {};
    sensors['type'] = 'FeatureCollection';
    sensors['features'] = [];

    for (i = 0; i < response.length; i++) {
        let feature = {
            "type": "Feature",
            "geometry": {
            "type": "Point",
            "coordinates": [response[i].location.longitude, response[i].location.latitude]
            },
            "properties": {

            }    
        }
        
        sensors['features'].push(feature);
    }

    L.geoJSON(sensors).addTo(map);

    console.log(sensors)
}