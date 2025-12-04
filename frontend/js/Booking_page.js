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
                "2wheeler": { available_slots: 5, total_slots: 20, price_per_hour: 20 },
                "4wheeler": { available_slots: 8, total_slots: 30, price_per_hour: 50 },
                "others": { available_slots: 2, total_slots: 10, price_per_hour: 40 }
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
                "2wheeler": { available_slots: 3, total_slots: 15, price_per_hour: 15 },
                "4wheeler": { available_slots: 5, total_slots: 25, price_per_hour: 45 },
                "others": { available_slots: 0, total_slots: 8, price_per_hour: 35 }
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
                "2wheeler": { available_slots: 1, total_slots: 10, price_per_hour: 25 },
                "4wheeler": { available_slots: 2, total_slots: 20, price_per_hour: 60 },
                "others": { available_slots: 0, total_slots: 5, price_per_hour: 50 }
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
                "2wheeler": { available_slots: 4, total_slots: 15, price_per_hour: 20 },
                "4wheeler": { available_slots: 6, total_slots: 25, price_per_hour: 50 },
                "others": { available_slots: 2, total_slots: 8, price_per_hour: 40 }
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
                "2wheeler": { available_slots: 8, total_slots: 30, price_per_hour: 18 },
                "4wheeler": { available_slots: 10, total_slots: 50, price_per_hour: 45 },
                "others": { available_slots: 2, total_slots: 15, price_per_hour: 38 }
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
                "2wheeler": { available_slots: 2, total_slots: 12, price_per_hour: 22 },
                "4wheeler": { available_slots: 3, total_slots: 20, price_per_hour: 55 },
                "others": { available_slots: 1, total_slots: 6, price_per_hour: 45 }
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
                "2wheeler": { available_slots: 6, total_slots: 25, price_per_hour: 20 },
                "4wheeler": { available_slots: 10, total_slots: 40, price_per_hour: 48 },
                "others": { available_slots: 2, total_slots: 12, price_per_hour: 40 }
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
                "2wheeler": { available_slots: 1, total_slots: 8, price_per_hour: 18 },
                "4wheeler": { available_slots: 2, total_slots: 15, price_per_hour: 45 },
                "others": { available_slots: 1, total_slots: 5, price_per_hour: 38 }
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
                "2wheeler": { available_slots: 12, total_slots: 40, price_per_hour: 15 },
                "4wheeler": { available_slots: 10, total_slots: 35, price_per_hour: 40 },
                "others": { available_slots: 3, total_slots: 10, price_per_hour: 30 }
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
            const others = vehicleTypes["others"] || {};
            
            // For now, show all slots as available (booking logic not yet implemented)
            const totalAvailable = (twoWheeler.available_slots || 0) + (fourWheeler.available_slots || 0) + (others.available_slots || 0);
            const availability = getAvailability(totalAvailable);
            const availClass = availability === AVAILABILITY_CONFIG.high ? 'high' : (availability === AVAILABILITY_CONFIG.medium ? 'mid' : 'low');
            const availCss = availability === AVAILABILITY_CONFIG.high ? 'av-high' : (availability === AVAILABILITY_CONFIG.medium ? 'av-mid' : 'av-low');
            
            // Determine if location is fully booked (when totalAvailable is 0)
            const isFullyBooked = totalAvailable === 0;

            cardsHTML += `
              <article class="pme-card ${isFullyBooked ? 'fully-booked' : ''}" data-lot-id="${lot.id}" data-lot-name="${escapeHtml(lot.name)}">
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
                    ${twoWheeler.available_slots > 0 ? `
                    <button class="vehicle-btn two-wheeler" data-vehicle-type="2wheeler" data-price="${twoWheeler.price_per_hour || 0}" data-available="${twoWheeler.available_slots}">
                      <span class="vehicle-icon">🏍️</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">2 Wheeler</div>
                        <div class="vehicle-details">₹${twoWheeler.price_per_hour || 0}/hr • ${twoWheeler.available_slots} slots available</div>
                      </div>
                    </button>
                    ` : `
                    <button class="vehicle-btn two-wheeler disabled" disabled>
                      <span class="vehicle-icon">🏍️</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">2 Wheeler</div>
                        <div class="vehicle-details">₹${twoWheeler.price_per_hour || 0}/hr • Fully booked</div>
                      </div>
                    </button>
                    `}
                    
                    ${fourWheeler.available_slots > 0 ? `
                    <button class="vehicle-btn four-wheeler" data-vehicle-type="4wheeler" data-price="${fourWheeler.price_per_hour || 0}" data-available="${fourWheeler.available_slots}">
                      <span class="vehicle-icon">🚗</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">4 Wheeler</div>
                        <div class="vehicle-details">₹${fourWheeler.price_per_hour || 0}/hr • ${fourWheeler.available_slots} slots available</div>
                      </div>
                    </button>
                    ` : `
                    <button class="vehicle-btn four-wheeler disabled" disabled>
                      <span class="vehicle-icon">🚗</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">4 Wheeler</div>
                        <div class="vehicle-details">₹${fourWheeler.price_per_hour || 0}/hr • Fully booked</div>
                      </div>
                    </button>
                    `}
                    
                    ${others.available_slots > 0 ? `
                    <button class="vehicle-btn others" data-vehicle-type="others" data-price="${others.price_per_hour || 0}" data-available="${others.available_slots}">
                      <span class="vehicle-icon">🚐</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">Others</div>
                        <div class="vehicle-details">₹${others.price_per_hour || 0}/hr • ${others.available_slots} slots available</div>
                      </div>
                    </button>
                    ` : `
                    <button class="vehicle-btn others disabled" disabled>
                      <span class="vehicle-icon">🚐</span>
                      <div class="vehicle-info">
                        <div class="vehicle-label">Others</div>
                        <div class="vehicle-details">₹${others.price_per_hour || 0}/hr • Fully booked</div>
                      </div>
                    </button>
                    `}
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
      const btn = e.target.closest && e.target.closest('.vehicle-btn:not(.disabled)');
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
  
  function showBookings(e) {
      e.preventDefault();
      alert('Previous Bookings: This feature will show your booking history. Coming soon!');
  }
  
  function showSettings(e) {
      e.preventDefault();
      alert('Settings: Configure your account preferences. Coming soon!');
  }
  