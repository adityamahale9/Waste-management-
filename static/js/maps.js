document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('map');
    let map;
    let markers = [];
    let infoWindow;
    
    // Initialize Google Maps
    function initMap() {
        if (!mapContainer) return;
        
        // Create map centered on default location (will be updated with user location)
        map = new google.maps.Map(mapContainer, {
            center: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle
            zoom: 12,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                    featureType: "administrative.locality",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }]
                },
                {
                    featureType: "poi",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }]
                },
                {
                    featureType: "poi.park",
                    elementType: "geometry",
                    stylers: [{ color: "#263c3f" }]
                },
                {
                    featureType: "poi.park",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#6b9a76" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#38414e" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#212a37" }]
                },
                {
                    featureType: "road",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#9ca5b3" }]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry",
                    stylers: [{ color: "#746855" }]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry.stroke",
                    stylers: [{ color: "#1f2835" }]
                },
                {
                    featureType: "road.highway",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#f3d19c" }]
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [{ color: "#2f3948" }]
                },
                {
                    featureType: "transit.station",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#d59563" }]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#17263c" }]
                },
                {
                    featureType: "water",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#515c6d" }]
                },
                {
                    featureType: "water",
                    elementType: "labels.text.stroke",
                    stylers: [{ color: "#17263c" }]
                }
            ]
        });
        
        infoWindow = new google.maps.InfoWindow();
        
        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(userLocation);
                    
                    // Add marker for user's location
                    const userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "Your Location",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeColor: "#FFFFFF",
                            strokeWeight: 2
                        }
                    });
                    
                    // Load recycling centers
                    loadRecyclingCenters();
                },
                () => {
                    // Handle location error
                    console.warn("Error: The Geolocation service failed.");
                    // Still load recycling centers with default location
                    loadRecyclingCenters();
                }
            );
        } else {
            // Browser doesn't support Geolocation
            console.warn("Error: Your browser doesn't support geolocation.");
            // Still load recycling centers with default location
            loadRecyclingCenters();
        }
    }
    
    // Load recycling centers from the API
    function loadRecyclingCenters() {
        fetch('/api/recycling-centers')
            .then(response => response.json())
            .then(data => {
                addRecyclingCentersToMap(data.centers);
            })
            .catch(error => {
                console.error('Error loading recycling centers:', error);
            });
    }
    
    // Add recycling centers to the map
    function addRecyclingCentersToMap(centers) {
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        
        // Create marker icon
        const recycleIcon = {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(32, 32)
        };
        
        // Add markers for each center
        centers.forEach(center => {
            const marker = new google.maps.Marker({
                position: { lat: center.latitude, lng: center.longitude },
                map: map,
                title: center.name,
                icon: recycleIcon
            });
            
            markers.push(marker);
            
            // Create info window content
            const contentString = `
                <div class="info-window">
                    <h5>${center.name}</h5>
                    <p><strong>Address:</strong> ${center.address}</p>
                    <p><strong>Phone:</strong> ${center.phone || 'N/A'}</p>
                    <p><strong>Materials:</strong> ${center.materials || 'Various materials'}</p>
                    ${center.website ? `<p><a href="${center.website}" target="_blank">Visit Website</a></p>` : ''}
                    <p><a href="https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}" target="_blank">Get Directions</a></p>
                </div>
            `;
            
            // Add click event to marker
            marker.addListener("click", () => {
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });
        });
        
        // Adjust map bounds to fit all markers if there are any
        if (markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
            
            // Don't zoom in too far
            const listener = google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 16) map.setZoom(16);
                google.maps.event.removeListener(listener);
            });
        }
    }
    
    // Load Google Maps API and initialize map
    function loadMapScript() {
        if (mapContainer) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=initMap`;
            script.async = true;
            script.defer = true;
            window.initMap = initMap;
            document.head.appendChild(script);
        }
    }
    
    // Start loading map
    loadMapScript();
});
