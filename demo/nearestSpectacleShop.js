// Initialize the map and places service
let map;
let service;
let infowindow;

// Function to initialize the map
function initMap() {
  // Create an info window to display results
  infowindow = new google.maps.InfoWindow();

  // Try HTML5 geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Create a map centered on the user's location
        map = new google.maps.Map(document.getElementById("map"), {
          center: userLocation,
          zoom: 15,
        });

        // Create a marker for the user's location
        new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "Your Location",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          }
        });

        // Use Places API to find nearest spectacle shop
        findNearestSpectacleShop(userLocation);

        createCloseButton();
      },
      () => {
        handleLocationError(true, infowindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infowindow, map.getCenter());
  }
}

// Function to find the nearest spectacle shop
function findNearestSpectacleShop(location) {
  const request = {
    location: location,
    radius: '50000',
    type: ['optician'],
    keyword: 'spectacles shop'
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);
}

// Callback function for place search
function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (let i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
    // Center on and zoom to the nearest shop
    if (results.length > 0) {
      map.setCenter(results[0].geometry.location);
      map.setZoom(14);
      // Open info window for the nearest shop
      createMarker(results[0], true);
    }
  } else {
    console.error('No spectacle shops found nearby.');
    alert('No spectacle shops found nearby. Please try a different location.');
  }
}

// Function to create a marker for each place
function createMarker(place, openInfoWindow = false) {
  if (!place.geometry || !place.geometry.location) return;

  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
  });

  google.maps.event.addListener(marker, "click", () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    const content = `
      <div style="color: #333; padding: 10px;">
        <strong style="font-size: 16px;">${place.name}</strong><br>
        <span style="font-size: 14px;">
          Address: ${place.vicinity}<br>
          Rating: ${place.rating ? place.rating + '/5' : 'N/A'}<br>
          <a href="${googleMapsUrl}" target="_blank" style="color: #1a73e8; text-decoration: none;">View on Google Maps</a>
        </span>
      </div>
    `;
    infowindow.setContent(content);
    infowindow.open(map, marker);
  });

  if (openInfoWindow) {
    google.maps.event.trigger(marker, 'click');
  }
}

// Function to handle geolocation errors
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

// Function to create the close button dynamically
function createCloseButton() {
  const closeButton = document.createElement('div');
  closeButton.id = 'close-map';
  closeButton.innerHTML = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.backgroundColor = 'white';
  closeButton.style.border = '1px solid black';
  closeButton.style.padding = '5px 10px';
  closeButton.style.zIndex = '1002';
  
  closeButton.addEventListener('click', () => {
    document.getElementById('map-container').style.display = 'none';
  });

  document.getElementById('map-container').appendChild(closeButton);
}

// Export the initMap function so it can be called from HTML
window.initMap = initMap;