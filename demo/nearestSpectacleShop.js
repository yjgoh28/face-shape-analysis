function findNearestSpectacleShops() {
  const spinner = document.getElementById('shopSpinner');
  spinner.style.display = 'block';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        const request = {
          location: userLocation,
          radius: '5000',
          type: ['optician'],
          keyword: 'spectacles shop'
        };

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.nearbySearch(request, (results, status) => {
          displayResults(results, status);
          spinner.style.display = 'none';
        });
      },
      () => {
        console.error('Error: The Geolocation service failed.');
        alert('Unable to retrieve your location. Please try again.');
        spinner.style.display = 'none';
      }
    );
  } else {
    console.error('Error: Your browser doesn\'t support geolocation.');
    alert('Your browser doesn\'t support geolocation. Please use a modern browser.');
    spinner.style.display = 'none';
  }
}

function displayResults(results, status) {
  const sidebar = document.getElementById('sidebar');
  const shopList = document.getElementById('shop-list');
  shopList.innerHTML = '';

  if (status === google.maps.places.PlacesServiceStatus.OK && results) {
    results.forEach((place) => {
      const shopDiv = document.createElement('div');
      shopDiv.style.marginBottom = '20px';
      shopDiv.style.borderBottom = '1px solid #ccc';
      shopDiv.style.paddingBottom = '10px';

      const name = document.createElement('h3');
      name.textContent = place.name;
      shopDiv.appendChild(name);

      const address = document.createElement('p');
      address.textContent = place.vicinity;
      shopDiv.appendChild(address);

      const rating = document.createElement('p');
      rating.textContent = `Rating: ${place.rating ? place.rating + '/5' : 'N/A'}`;
      shopDiv.appendChild(rating);

      const link = document.createElement('a');
      link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
      link.textContent = 'View on Google Maps';
      link.target = '_blank';
      shopDiv.appendChild(link);

      shopList.appendChild(shopDiv);
    });

    sidebar.style.display = 'block';
  } else {
    shopList.innerHTML = '<p>No spectacle shops found nearby. Please try a different location.</p>';
    sidebar.style.display = 'block';
  }
}

// Change this line to export the function
export { findNearestSpectacleShops };