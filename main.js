let map = L.map('map', {
    dragging: true,
    minZoom: 11,
    maxZoom: 16,

}).setView([49.7821562, 22.7692634], 11);
// TODO // TO SMOOTH MAP DRAG LIMIT
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