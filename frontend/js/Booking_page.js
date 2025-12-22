document.addEventListener('DOMContentLoaded', () => {
    // Check if user logged in via Google OAuth (token in URL)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) {
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_email', email);
        // Clean URL by removing parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Initialize user profile
    initializeUserProfile();
    
    // API base URL
    const API_BASE = 'http://localhost:8000/v1';
    
    // thumbnail image generated earlier in session
    const THUMB = 'https://placehold.co/400x300/6366f1/ffffff?text=Parking';
  
    // Initialize time inputs with defaults (current time + 1 hour)
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const searchButton = document.getElementById('search-parking-btn');
    
    // Set default values
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    startTimeInput.value = formatDateTimeLocal(oneHourLater);
    endTimeInput.value = formatDateTimeLocal(twoHoursLater);
    
    // Initialize search functionality
    initializeSearch();
    
    // Static data for map pins and booking cards
    const parkingLocations = [
        { 
            id: "1", 
            name: "MG Road Parking", 
            lat: 35, 
            lng: 45, 
            availableSpots: 15,
            address: "MG Road, Bengaluru",
            distance: "2.5 km away",
            rating: 4.5,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 20 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 50 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 40 }
            }
        },
        { 
            id: "2", 
            name: "Forum Mall Parking - Konankunte", 
            lat: 55, 
            lng: 65, 
            availableSpots: 8,
            address: "Konankunte, Bengaluru",
            distance: "5.2 km away",
            rating: 4.2,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 15 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 45 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 35 }
            }
        },
        { 
            id: "3", 
            name: "Nexus Mall - Koramangala", 
            lat: 45, 
            lng: 35, 
            availableSpots: 3,
            address: "Koramangala, Bengaluru",
            distance: "3.8 km away",
            rating: 4.6,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 25 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 60 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 50 }
            }
        },
        { 
            id: "4", 
            name: "Indranagar Parking Lot", 
            lat: 65, 
            lng: 55, 
            availableSpots: 12,
            address: "Indranagar, Bengaluru",
            distance: "4.1 km away",
            rating: 4.3,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 20 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 50 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 40 }
            }
        },
        { 
            id: "5", 
            name: "Phoenix Mall of Asia - Yelahanka", 
            lat: 25, 
            lng: 50, 
            availableSpots: 20,
            address: "Yelahanka, Bengaluru",
            distance: "8.5 km away",
            rating: 4.7,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 18 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 45 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 38 }
            }
        },
        { 
            id: "6", 
            name: "Garuda Mall - Jayanagar", 
            lat: 70, 
            lng: 40, 
            availableSpots: 6,
            address: "Jayanagar, Bengaluru",
            distance: "6.3 km away",
            rating: 4.4,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 22 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 55 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 45 }
            }
        },
        { 
            id: "7", 
            name: "Royal Meenakshi Mall - Bannerghatta Road", 
            lat: 40, 
            lng: 70, 
            availableSpots: 18,
            address: "Bannerghatta Road, Bengaluru",
            distance: "7.2 km away",
            rating: 4.5,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 20 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 48 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 40 }
            }
        },
        { 
            id: "8", 
            name: "VegaCity - Bannerghatta Road", 
            lat: 50, 
            lng: 25, 
            availableSpots: 4,
            address: "Bannerghatta Road, Bengaluru",
            distance: "7.8 km away",
            rating: 4.1,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 18 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 45 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 38 }
            }
        },
        { 
            id: "9", 
            name: "BMSIT College", 
            lat: 60, 
            lng: 30, 
            availableSpots: 25,
            address: "Avalahalli, Yelahanka, Bengaluru",
            distance: "9.2 km away",
            rating: 4.6,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 15 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 40 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 30 }
            }
        }
    ];
  
    const AVAILABILITY_CONFIG = {
        high: { color: "#10B981", class: 'high', label: 'high' },
        medium: { color: "#F59E0B", class: 'medium', label: 'mid' },
        low: { color: "#EF4444", class: 'low', label: 'low' },
    };
  
    const getAvailability = (spots) => {
        if (spots > 10) return AVAILABILITY_CONFIG.high;
        if (spots > 5) return AVAILABILITY_CONFIG.medium;
        return AVAILABILITY_CONFIG.low;
    };
  
    /******** MAP PINS (unchanged, only moved here) ********/
    function renderMapPins() {
        const container = document.getElementById('map-pins-container');
        if (!container) return;
  
        let pinsHTML = '';
        parkingLocations.forEach(location => {
            const availability = getAvailability(location.availableSpots);
            pinsHTML += `
                <div class="map-pin" style="top: ${location.lat}%; left: ${location.lng}%;">
                    <div class="pin-pulse" style="background-color: ${availability.color};"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${availability.color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin pin-icon">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div class="tooltip">
                        <p class="tooltip-name">${escapeHtml(location.name)}</p>
                        <p class="tooltip-spots" style="color: ${availability.color};">${location.availableSpots} spots</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = pinsHTML;
    }
  
    /******** Render cards using static data ********/
    function fetchAndRenderLocations() {
        const grid = document.getElementById('parking-grid');
        if (!grid) {
            console.error('parking-grid element not found!');
            return;
        }
        
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        
        if (!startTime || !endTime) {
            grid.innerHTML = '<p class="error-message">Please select start and end times</p>';
            return;
        }
        
        // Use static parkingLocations data
        const locations = parkingLocations;
        
        console.log('Total parking locations:', locations.length);
        console.log('Selected time:', startTime, 'to', endTime);
        
        if (!locations || locations.length === 0) {
            grid.innerHTML = '<p class="error-message">No parking locations available.</p>';
            return;
        }
        
        // Render cards - Show all locations regardless of availability
        let cardsHTML = '';
        locations.forEach(lot => {
            const vehicleTypes = lot.vehicle_types || {};
            const twoWheeler = vehicleTypes["2wheeler"] || {};
            const fourWheeler = vehicleTypes["4wheeler"] || {};
            const autoTruck = vehicleTypes["auto_truck"] || {};
            
            // For now, show all slots as available (booking logic not yet implemented)
            const totalAvailable = (twoWheeler.available_slots || 0) + (fourWheeler.available_slots || 0) + (autoTruck.available_slots || 0);
            const availability = getAvailability(totalAvailable);
            const availClass = availability === AVAILABILITY_CONFIG.high ? 'high' : (availability === AVAILABILITY_CONFIG.medium ? 'mid' : 'low');
            const availCss = availability === AVAILABILITY_CONFIG.high ? 'av-high' : (availability === AVAILABILITY_CONFIG.medium ? 'av-mid' : 'av-low');
            
            // Determine if location is fully booked (when totalAvailable is 0)
            const isFullyBooked = totalAvailable === 0;

            cardsHTML += `
              <article class="pme-card ${isFullyBooked ? 'fully-booked' : ''}" data-lot-id="${lot.id}" data-location-id="${lot.id}" data-lot-name="${escapeHtml(lot.name)}">
                <div class="pme-card-thumb">
                  <img src="${THUMB}" alt="${escapeHtml(lot.name)} preview" />
                  ${isFullyBooked ? '<div class="booked-overlay">FULLY BOOKED</div>' : ''}
                </div>
  
                <div class="pme-card-body">
                  <div class="pme-card-head">
                    <div class="pme-icon pin ${isFullyBooked ? 'red' : 'green'}" aria-hidden="true"></div>
                    <div>
                      <h3 class="pme-title">${escapeHtml(lot.name)}</h3>
                      <div class="pme-distance">${lot.distance}</div>
                    </div>
                  </div>
  
                  <div class="pme-availability ${isFullyBooked ? 'av-booked' : availCss}">
                    ${isFullyBooked ? '❌ FULLY BOOKED' : `${availability === AVAILABILITY_CONFIG.high ? '✓' : (availability === AVAILABILITY_CONFIG.medium ? '⚠' : '!')} <strong class="pme-available">${totalAvailable}</strong> Total Spots Available`}
                  </div>
                  
                  <div class="vehicle-type-options">
                    <button class="vehicle-btn two-wheeler ${twoWheeler.available_slots === 0 ? 'disabled' : ''}" data-vehicle-type="2wheeler" data-price="${twoWheeler.price_per_hour || 0}" data-available="${twoWheeler.available_slots || 0}" data-ev-slots="${twoWheeler.ev_slots || 0}" data-total="${twoWheeler.total_slots || 0}">
                      <span class="vehicle-icon"></span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">2 Wheeler</div>
                        <div class="vehicle-details">₹${twoWheeler.price_per_hour || 0}/hr • ${twoWheeler.available_slots > 0 ? twoWheeler.available_slots + ' slots available' : 'Fully booked'}</div>
                      </div>
                    </button>
                    
                    <button class="vehicle-btn four-wheeler ${fourWheeler.available_slots === 0 ? 'disabled' : ''}" data-vehicle-type="4wheeler" data-price="${fourWheeler.price_per_hour || 0}" data-available="${fourWheeler.available_slots || 0}" data-ev-slots="${fourWheeler.ev_slots || 0}" data-total="${fourWheeler.total_slots || 0}">
                      <span class="vehicle-icon"></span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">4 Wheeler</div>
                        <div class="vehicle-details">₹${fourWheeler.price_per_hour || 0}/hr • ${fourWheeler.available_slots > 0 ? fourWheeler.available_slots + ' slots available' : 'Fully booked'}</div>
                      </div>
                    </button>
                    
                    <button class="vehicle-btn others ${autoTruck.available_slots === 0 ? 'disabled' : ''}" data-vehicle-type="auto_truck" data-price="${autoTruck.price_per_hour || 0}" data-available="${autoTruck.available_slots || 0}" data-auto-slots="${autoTruck.auto_slots || 0}" data-truck-slots="${autoTruck.truck_slots || 0}" data-total="${autoTruck.total_slots || 0}">
                      <span class="vehicle-icon"></span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">Auto/Truck</div>
                        <div class="vehicle-details">₹${autoTruck.price_per_hour || 0}/hr • ${autoTruck.available_slots > 0 ? autoTruck.available_slots + ' slots available' : 'Fully booked'}</div>
                      </div>
                    </button>
                  </div>
                </div>
              </article>
            `;
        });
  
        console.log('Rendering', locations.length, 'parking cards');
        grid.innerHTML = cardsHTML;
  
        // render lucide icons in the newly-inserted HTML (for any inline lucide tags)
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
        
        console.log('✅ All cards rendered successfully');
    }
  
    /******** helpers ********/
    function formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
    }
  
    /******** event wiring for vehicle type buttons ********/
    document.addEventListener('click', function(e){
      const btn = e.target.closest && e.target.closest('.vehicle-btn');
      if (!btn) return;
      const card = btn.closest('.pme-card');
      if (!card) return;
  
      const lotId = card.dataset.lotId;
      const lotName = card.dataset.lotName;
      const vehicleType = btn.dataset.vehicleType;
      const price = btn.dataset.price;
      const available = btn.dataset.available;
      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;
      
      // Navigate to slot selection page
      const params = new URLSearchParams({
          locationId: lotId,
          locationName: lotName,
          vehicleType: vehicleType,
          price: price,
          available: available,
          startTime: startTime,
          endTime: endTime
      });
      
      window.location.href = `SlotSelection_page.html?${params.toString()}`;
    });
    
    // Search button handler
    searchButton.addEventListener('click', fetchAndRenderLocations);
  
    // init
    renderMapPins();
    fetchAndRenderLocations(); // Load locations on page load
  
  }); // DOMContentLoaded
  
  // Profile dropdown functions
  function initializeUserProfile() {
      // Fetch user profile data
      fetchUserProfile();
      
      // Toggle dropdown
      const profileButton = document.getElementById('profileButton');
      const dropdownMenu = document.getElementById('dropdownMenu');
      const profileDropdown = document.querySelector('.profile-dropdown');
      
      profileButton.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('show');
          profileDropdown.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
          dropdownMenu.classList.remove('show');
          profileDropdown.classList.remove('active');
      });
      
      dropdownMenu.addEventListener('click', (e) => {
          e.stopPropagation();
      });
  }
  
  async function fetchUserProfile() {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
          document.getElementById('profileName').textContent = 'Guest User';
          document.getElementById('profileEmail').textContent = 'Not logged in';
          document.getElementById('profilePhone').textContent = 'N/A';
          return;
      }
      
      try {
          const response = await fetch('http://localhost:8000/v1/users/profile', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          
          if (response.ok) {
              const userData = await response.json();
              document.getElementById('profileName').textContent = userData.full_name || 'User';
              document.getElementById('profileEmail').textContent = userData.email || 'N/A';
              document.getElementById('profilePhone').textContent = userData.phone || 'Not provided';
          } else {
              console.error('Failed to fetch profile:', response.status);
              document.getElementById('profileName').textContent = 'Unknown User';
              document.getElementById('profileEmail').textContent = 'Error loading email';
              document.getElementById('profilePhone').textContent = 'Error loading phone';
          }
      } catch (error) {
          console.error('Error fetching profile:', error);
          document.getElementById('profileName').textContent = 'Error';
          document.getElementById('profileEmail').textContent = 'Unable to load';
          document.getElementById('profilePhone').textContent = 'Unable to load';
      }
  }
  
  function showBookings(e) {
      e.preventDefault();
      alert('Previous Bookings: This feature will show your booking history. Coming soon!');
  }
  
  function showSettings(e) {
      e.preventDefault();
      alert('Settings: Configure your account preferences. Coming soon!');
  }
  
  // Search Functionality
  function initializeSearch() {
      const searchInput = document.getElementById('searchInput');
      const searchResults = document.getElementById('searchResults');
      
      if (!searchInput || !searchResults) return;
      
      // Search parking locations
      searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          
          if (query.length === 0) {
              searchResults.classList.remove('show');
              return;
          }
          
          // Filter locations based on search query
          const filteredLocations = parkingLocations.filter(location => {
              return location.name.toLowerCase().includes(query) ||
                     location.address.toLowerCase().includes(query);
          });
          
          // Display search results
          if (filteredLocations.length > 0) {
              searchResults.innerHTML = filteredLocations.map(location => `
                  <div class="search-result-item" data-location-id="${location.id}">
                      <div class="search-result-name">${location.name}</div>
                      <div class="search-result-address">
                          📍 ${location.address}
                      </div>
                      <div class="search-result-distance">
                          ${location.distance} • ${location.availableSpots} spots available
                      </div>
                  </div>
              `).join('');
              searchResults.classList.add('show');
              
              // Add click event to search result items
              searchResults.querySelectorAll('.search-result-item').forEach(item => {
                  item.addEventListener('click', () => {
                      const locationId = item.getAttribute('data-location-id');
                      scrollToLocationFunc(locationId);
                  });
              });
          } else {
              searchResults.innerHTML = '<div class="no-results">No parking locations found</div>';
              searchResults.classList.add('show');
          }
      });
      
      // Close search results when clicking outside
      document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
              searchResults.classList.remove('show');
          }
      });
      
      // Close search results on escape key
      searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
              searchResults.classList.remove('show');
              searchInput.blur();
          }
      });
  }
  
  // Scroll to specific location in parking grid
  function scrollToLocationFunc(locationId) {
      const searchResults = document.getElementById('searchResults');
      const searchInput = document.getElementById('searchInput');
      
      // Close search dropdown
      searchResults.classList.remove('show');
      searchInput.value = '';
      
      // Find the parking card element
      const parkingCard = document.querySelector(`[data-location-id="${locationId}"]`);
      if (parkingCard) {
          parkingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          parkingCard.style.animation = 'highlight 1.5s ease';
          setTimeout(() => {
              parkingCard.style.animation = '';
          }, 1500);
      }
  }
  