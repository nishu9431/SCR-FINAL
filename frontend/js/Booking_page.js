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
    
    // Function to update min/max constraints based on current time
    function updateTimeConstraints() {
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        startTimeInput.min = formatDateTimeLocal(now);
        startTimeInput.max = formatDateTimeLocal(threeDaysLater);
        endTimeInput.max = formatDateTimeLocal(threeDaysLater);
        
        // Update end time min based on start time
        const selectedStart = startTimeInput.value ? new Date(startTimeInput.value) : now;
        endTimeInput.min = formatDateTimeLocal(selectedStart);
    }
    
    // Set default values and initial restrictions
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    updateTimeConstraints();
    startTimeInput.value = formatDateTimeLocal(oneHourLater);
    endTimeInput.value = formatDateTimeLocal(twoHoursLater);
    
    // Update constraints periodically (every 30 seconds)
    setInterval(updateTimeConstraints, 30000);
    
    // Add validation when user changes start time
    startTimeInput.addEventListener('change', function() {
        const selectedStart = new Date(this.value);
        const currentTime = new Date();
        const maxTime = new Date(currentTime.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        // Check if selected time is in the past
        if (selectedStart < currentTime) {
            alert('⚠️ Start time cannot be in the past. Please select a current or future time.');
            const minValidTime = new Date(currentTime.getTime() + 5 * 60 * 1000); // 5 minutes from now
            this.value = formatDateTimeLocal(minValidTime);
            updateTimeConstraints();
            return;
        }
        
        if (selectedStart > maxTime) {
            alert('⚠️ Booking is only allowed up to 3 days in advance.');
            this.value = formatDateTimeLocal(maxTime);
            updateTimeConstraints();
            return;
        }
        
        // Update end time min to be after start time
        const minEndTime = new Date(selectedStart.getTime() + 60 * 60 * 1000); // At least 1 hour after start
        endTimeInput.min = formatDateTimeLocal(selectedStart);
        
        // If current end time is before new start time, update it
        const currentEnd = new Date(endTimeInput.value);
        if (currentEnd <= selectedStart) {
            endTimeInput.value = formatDateTimeLocal(minEndTime);
        }
        
        updateTimeConstraints();
    });
    
    // Add input validation on focus to prevent manual past date entry
    startTimeInput.addEventListener('input', function() {
        const selectedStart = new Date(this.value);
        const currentTime = new Date();
        
        if (selectedStart < currentTime) {
            this.setCustomValidity('Start time cannot be in the past');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Add validation when user changes end time
    endTimeInput.addEventListener('change', function() {
        const selectedEnd = new Date(this.value);
        const selectedStart = new Date(startTimeInput.value);
        const currentTime = new Date();
        const maxTime = new Date(currentTime.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        // Check if end time is in the past
        if (selectedEnd < currentTime) {
            alert('⚠️ End time cannot be in the past. Please select a current or future time.');
            const minValidEndTime = new Date(Math.max(currentTime.getTime(), selectedStart.getTime()) + 60 * 60 * 1000);
            this.value = formatDateTimeLocal(minValidEndTime);
            updateTimeConstraints();
            return;
        }
        
        if (selectedEnd <= selectedStart) {
            alert('⚠️ End time must be after start time.');
            this.value = formatDateTimeLocal(new Date(selectedStart.getTime() + 60 * 60 * 1000));
            updateTimeConstraints();
            return;
        }
        
        if (selectedEnd > maxTime) {
            alert('⚠️ Booking is only allowed up to 3 days in advance.');
            this.value = formatDateTimeLocal(maxTime);
            updateTimeConstraints();
            return;
        }
        
        updateTimeConstraints();
    });
    
    // Add input validation on focus to prevent manual past date entry
    endTimeInput.addEventListener('input', function() {
        const selectedEnd = new Date(this.value);
        const currentTime = new Date();
        const selectedStart = new Date(startTimeInput.value);
        
        if (selectedEnd < currentTime) {
            this.setCustomValidity('End time cannot be in the past');
        } else if (selectedEnd <= selectedStart) {
            this.setCustomValidity('End time must be after start time');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Initialize search functionality
    initializeSearch();
    
    // Static data for map pins and booking cards
    const parkingLocations = [
        { 
            id: "1", 
            name: "Downtown Parking Plaza", 
            lat: 35, 
            lng: 45, 
            availableSpots: 15,
            address: "123 Market Street",
            distance: "2.5 km away",
            rating: 4.5,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 35 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 50 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 43 }
            }
        },
        { 
            id: "2", 
            name: "Airport Long-term Parking", 
            lat: 55, 
            lng: 65, 
            availableSpots: 8,
            address: "Airport Access Road",
            distance: "5.2 km away",
            rating: 4.2,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 32 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 45 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 38 }
            }
        },
        { 
            id: "3", 
            name: "Tech Campus Garage", 
            lat: 45, 
            lng: 35, 
            availableSpots: 3,
            address: "1 Infinite Loop",
            distance: "3.8 km away",
            rating: 4.6,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 42 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 60 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 51 }
            }
        },
        { 
            id: "4", 
            name: "Beach Parking Lot", 
            lat: 65, 
            lng: 55, 
            availableSpots: 12,
            address: "Ocean Beach",
            distance: "4.1 km away",
            rating: 4.3,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 35 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 50 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 43 }
            }
        },
        { 
            id: "5", 
            name: "Residential Complex Parking", 
            lat: 25, 
            lng: 50, 
            availableSpots: 20,
            address: "456 Residential Drive",
            distance: "8.5 km away",
            rating: 4.7,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 34 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 48 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 41 }
            }
        },
        { 
            id: "6", 
            name: "Garuda Mall", 
            lat: 70, 
            lng: 40, 
            availableSpots: 6,
            address: "Magrath Road, Ashok Nagar",
            distance: "6.3 km away",
            rating: 4.4,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 28 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 40 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 34 }
            }
        },
        { 
            id: "7", 
            name: "Royal Meenakshi Mall", 
            lat: 40, 
            lng: 70, 
            availableSpots: 18,
            address: "Bannerghatta Road",
            distance: "7.2 km away",
            rating: 4.5,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 25 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 35 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 30 }
            }
        },
        { 
            id: "8", 
            name: "VegaCity Mall", 
            lat: 50, 
            lng: 25, 
            availableSpots: 4,
            address: "Rajajinagar",
            distance: "7.8 km away",
            rating: 4.1,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 27 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 38 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 32 }
            }
        },
        { 
            id: "9", 
            name: "BMSIT College", 
            lat: 60, 
            lng: 30, 
            availableSpots: 25,
            address: "Avalahalli",
            distance: "9.2 km away",
            rating: 4.6,
            vehicle_types: {
                "2wheeler": { available_slots: 40, total_slots: 40, ev_slots: 20, price_per_hour: 21 },
                "4wheeler": { available_slots: 25, total_slots: 25, ev_slots: 10, price_per_hour: 30 },
                "auto_truck": { available_slots: 30, total_slots: 30, auto_slots: 15, truck_slots: 15, price_per_hour: 26 }
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
    async function fetchAndRenderLocations() {
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
        
        // Validate that times are not in the past
        const selectedStart = new Date(startTime);
        const selectedEnd = new Date(endTime);
        const currentTime = new Date();
        const maxTime = new Date(currentTime.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        if (selectedStart < currentTime) {
            alert('⚠️ Start time cannot be in the past. Please select current or future time.');
            startTimeInput.value = formatDateTimeLocal(currentTime);
            return;
        }
        
        if (selectedEnd <= selectedStart) {
            alert('⚠️ End time must be after start time.');
            endTimeInput.value = formatDateTimeLocal(new Date(selectedStart.getTime() + 60 * 60 * 1000));
            return;
        }
        
        if (selectedStart > maxTime || selectedEnd > maxTime) {
            alert('⚠️ Booking is only allowed up to 3 days in advance.');
            return;
        }
        
        // Fetch real-time availability from database
        grid.innerHTML = '<p class="loading-message">Loading parking locations and availability...</p>';
        
        try {
            // Fetch availability for all locations
            const availabilityPromises = parkingLocations.map(async (lot) => {
                const lotData = { ...lot };
                
                // Fetch real available slots for each vehicle type
                for (const vehicleType of ['2wheeler', '4wheeler', 'others']) {
                    try {
                        const response = await fetch(`${API_BASE}/lots/${lot.id}/slots?vehicle_type=${vehicleType}`);
                        if (response.ok) {
                            const slots = await response.json();
                            const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;
                            const totalCount = slots.length;
                            
                            // Update the vehicle type data with real counts
                            const frontendType = vehicleType === 'others' ? 'auto_truck' : vehicleType;
                            if (lotData.vehicle_types[frontendType]) {
                                lotData.vehicle_types[frontendType].available_slots = availableCount;
                                lotData.vehicle_types[frontendType].total_slots = totalCount;
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to fetch slots for lot ${lot.id}, vehicle ${vehicleType}:`, err);
                    }
                }
                
                return lotData;
            });
            
            const locations = await Promise.all(availabilityPromises);
            
            console.log('Total parking locations:', locations.length);
            console.log('Selected time:', startTime, 'to', endTime);
            
            if (!locations || locations.length === 0) {
                grid.innerHTML = '<p class="error-message">No parking locations available.</p>';
                return;
            }
            
            // Render cards with real-time availability
            let cardsHTML = '';
            locations.forEach(lot => {
                const vehicleTypes = lot.vehicle_types || {};
                const twoWheeler = vehicleTypes["2wheeler"] || {};
                const fourWheeler = vehicleTypes["4wheeler"] || {};
                const autoTruck = vehicleTypes["auto_truck"] || {};
                
                // Calculate total available from real data
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
        
        } catch (error) {
            console.error('Error fetching parking locations:', error);
            grid.innerHTML = '<p class="error-message">Failed to load parking locations. Please try again.</p>';
        }
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
      const storedEmail = localStorage.getItem('user_email');
      
      console.log('Fetching profile with token:', token ? 'Token exists' : 'No token');
      console.log('Stored email:', storedEmail);
      
      if (!token) {
          document.getElementById('profileName').textContent = 'Guest User';
          document.getElementById('profileEmail').textContent = 'Not logged in';
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
          
          console.log('Profile response status:', response.status);
          
          if (response.ok) {
              const userData = await response.json();
              console.log('User data received:', userData);
              
              // Use full_name first, then name, then extract from email
              const displayName = userData.full_name || userData.name || userData.email?.split('@')[0] || 'User';
              const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              
              document.getElementById('profileName').textContent = capitalizedName;
              document.getElementById('profileEmail').textContent = userData.email || 'N/A';
          } else {
              console.error('Failed to fetch profile:', response.status);
              // Token might be invalid - clear it
              if (response.status === 401 || response.status === 403) {
                  console.log('Token invalid, clearing...');
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user_email');
              }
              document.getElementById('profileName').textContent = 'Unknown User';
              document.getElementById('profileEmail').textContent = storedEmail || 'Error loading email';
          }
      } catch (error) {
          console.error('Error fetching profile:', error);
          document.getElementById('profileName').textContent = 'Error';
          document.getElementById('profileEmail').textContent = storedEmail || 'Unable to load';
      }
  }
  
  function showBookings(e) {
      e.preventDefault();
      const modal = document.getElementById('bookingsModal');
      const modalBody = document.getElementById('bookingsModalBody');
      
      modal.style.display = 'block';
      modalBody.innerHTML = '<div class="loading">Loading bookings...</div>';
      
      // Fetch bookings
      fetchUserBookings();
  }
  
  async function fetchUserBookings() {
      const token = localStorage.getItem('access_token');
      const modalBody = document.getElementById('bookingsModalBody');
      
      if (!token) {
          modalBody.innerHTML = '<div class="error-message">Please log in to view your bookings.</div>';
          return;
      }
      
      try {
          const response = await fetch('http://localhost:8000/v1/users/bookings', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          
          if (response.ok) {
              const bookings = await response.json();
              displayBookings(bookings);
          } else {
              modalBody.innerHTML = '<div class="error-message">Failed to load bookings. Please try again.</div>';
          }
      } catch (error) {
          console.error('Error fetching bookings:', error);
          modalBody.innerHTML = '<div class="error-message">Error loading bookings. Please check your connection.</div>';
      }
  }
  
  function displayBookings(bookings) {
      const modalBody = document.getElementById('bookingsModalBody');
      
      if (!bookings || bookings.length === 0) {
          modalBody.innerHTML = `
              <div class="no-bookings">
                  <i data-lucide="calendar-x"></i>
                  <p>No bookings found</p>
                  <p class="subtitle">Start booking parking spots to see your history here.</p>
              </div>
          `;
          lucide.createIcons();
          return;
      }
      
      const bookingsHTML = bookings.map(booking => {
          const startDate = new Date(booking.start_time);
          const endDate = new Date(booking.end_time);
          const statusClass = booking.status.toLowerCase();
          const statusIcon = {
              'pending': 'clock',
              'confirmed': 'check-circle',
              'active': 'play-circle',
              'completed': 'check-circle-2',
              'cancelled': 'x-circle'
          }[booking.status.toLowerCase()] || 'circle';
          
          return `
              <div class="booking-card ${statusClass}">
                  <div class="booking-header">
                      <div class="booking-location">
                          <i data-lucide="map-pin"></i>
                          <h3>${booking.lot_name || 'Parking Lot'}</h3>
                      </div>
                      <div class="booking-status ${statusClass}">
                          <i data-lucide="${statusIcon}"></i>
                          <span>${booking.status}</span>
                      </div>
                  </div>
                  <div class="booking-details">
                      <div class="booking-detail-row">
                          <div class="detail-item">
                              <i data-lucide="car"></i>
                              <span>Slot: ${booking.slot_number || 'N/A'}</span>
                          </div>
                          <div class="detail-item">
                              <i data-lucide="truck"></i>
                              <span>${booking.vehicle_type || 'N/A'}</span>
                          </div>
                      </div>
                      <div class="booking-detail-row">
                          <div class="detail-item">
                              <i data-lucide="calendar"></i>
                              <span>${startDate.toLocaleDateString()}</span>
                          </div>
                          <div class="detail-item">
                              <i data-lucide="clock"></i>
                              <span>${startDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                          </div>
                      </div>
                      <div class="booking-detail-row">
                          <div class="detail-item">
                              <i data-lucide="indian-rupee"></i>
                              <span class="price">₹${parseFloat(booking.total_amount || booking.price || 0).toFixed(2)}</span>
                          </div>
                          <div class="detail-item booking-id">
                              <span>#${booking.id}</span>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      }).join('');
      
      modalBody.innerHTML = bookingsHTML;
      lucide.createIcons();
  }
  
  function closeBookingsModal() {
      const modal = document.getElementById('bookingsModal');
      modal.style.display = 'none';
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
      const modal = document.getElementById('bookingsModal');
      if (event.target === modal) {
          modal.style.display = 'none';
      }
  });
  
  function showSettings(e) {
      e.preventDefault();
      const modal = document.getElementById('settingsModal');
      modal.style.display = 'block';
      
      // Load current user data
      loadUserSettings();
  }
  
  async function loadUserSettings() {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
          alert('Please log in to access settings');
          closeSettingsModal();
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
              document.getElementById('settings-name').value = userData.full_name || userData.name || '';
              document.getElementById('settings-email').value = userData.email || '';
          } else {
              throw new Error('Failed to load user data');
          }
      } catch (error) {
          console.error('Error loading settings:', error);
          showSettingsMessage('Failed to load settings', 'error');
      }
  }
  
  function closeSettingsModal() {
      const modal = document.getElementById('settingsModal');
      modal.style.display = 'none';
      // Clear password fields
      document.getElementById('settings-new-password').value = '';
      document.getElementById('settings-confirm-password').value = '';
      document.getElementById('settings-message').innerHTML = '';
  }
  
  // Handle settings form submission
  document.addEventListener('DOMContentLoaded', () => {
      const settingsForm = document.getElementById('settingsForm');
      if (settingsForm) {
          settingsForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              await saveSettings();
          });
      }
  });
  
  async function saveSettings() {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
          alert('Please log in to save settings');
          return;
      }
      
      const name = document.getElementById('settings-name').value.trim();
      const newPassword = document.getElementById('settings-new-password').value;
      const confirmPassword = document.getElementById('settings-confirm-password').value;
      
      // Validate name
      if (!name) {
          showSettingsMessage('Name is required', 'error');
          return;
      }
      
      // Validate password if provided
      if (newPassword) {
          if (newPassword.length < 8) {
              showSettingsMessage('Password must be at least 8 characters', 'error');
              return;
          }
          if (newPassword !== confirmPassword) {
              showSettingsMessage('Passwords do not match', 'error');
              return;
          }
      }
      
      // Prepare update data
      const updateData = {
          full_name: name
      };
      
      if (newPassword) {
          updateData.password = newPassword;
      }
      
      try {
          showSettingsMessage('Saving changes...', 'info');
          
          const response = await fetch('http://localhost:8000/v1/users/profile', {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(updateData)
          });
          
          if (response.ok) {
              showSettingsMessage('Settings saved successfully!', 'success');
              // Refresh profile display
              await fetchUserProfile();
              // Clear password fields
              document.getElementById('settings-new-password').value = '';
              document.getElementById('settings-confirm-password').value = '';
              
              // Close modal after 2 seconds
              setTimeout(() => {
                  closeSettingsModal();
              }, 2000);
          } else {
              const error = await response.json();
              showSettingsMessage(error.detail || 'Failed to save settings', 'error');
          }
      } catch (error) {
          console.error('Error saving settings:', error);
          showSettingsMessage('Failed to save settings. Please try again.', 'error');
      }
  }
  
  function showSettingsMessage(message, type) {
      const messageEl = document.getElementById('settings-message');
      messageEl.textContent = message;
      messageEl.className = `settings-message ${type}`;
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
      const settingsModal = document.getElementById('settingsModal');
      if (event.target === settingsModal) {
          settingsModal.style.display = 'none';
      }
  });
  
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
  