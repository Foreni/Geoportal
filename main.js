let map = L.map('map', {
    dragging: false,
    // zoomControl: false,
    // touchZoom: false,
    // doubleClickZoom: false,
    // scrollWheelZoom: false,
    minZoom: 12,
    maxZoom: 16,
    maxBoundsViscosity: 1 

}).setView([49.7821562, 22.7692634], 14);

map.setMaxBounds(map.getBounds());

L.tileLayer('https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);