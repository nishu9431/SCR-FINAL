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
    
    // thumbnail image generated earlier in session
    const THUMB = 'https://placehold.co/400x300/6366f1/ffffff?text=Parking';
  
    // data (8 parking locations as requested)
    const parkingLocations = [
        { id: "1", name: "MG Road Parking", lat: 35, lng: 45, availableSpots: 15 },
        { id: "2", name: "Forum Mall Parking - Konankunte", lat: 55, lng: 65, availableSpots: 8 },
        { id: "3", name: "Nexus Mall - Koramangala", lat: 45, lng: 35, availableSpots: 3 },
        { id: "4", name: "Indranagar Parking Lot", lat: 65, lng: 55, availableSpots: 12 },
        { id: "5", name: "Phoenix Mall of Asia - Yelahanka", lat: 25, lng: 50, availableSpots: 20 },
        { id: "6", name: "Garuda Mall - Jayanagar", lat: 70, lng: 40, availableSpots: 6 },
        { id: "7", name: "Royal Meenakshi Mall - Bannerghatta Road", lat: 40, lng: 70, availableSpots: 18 },
        { id: "8", name: "VegaCity - Bannerghatta Road", lat: 50, lng: 25, availableSpots: 4 },
    ];
  
    const nearbyParkingLots = [
        { id: "1", name: "MG Road Parking", availableSpots: 15, distance: "0.5 km away", pricePerHour: 60 },
        { id: "2", name: "Forum Mall Parking - Konankunte", availableSpots: 8, distance: "1.2 km away", pricePerHour: 50 },
        { id: "3", name: "Nexus Mall - Koramangala", availableSpots: 3, distance: "0.8 km away", pricePerHour: 70 },
        { id: "4", name: "Indranagar Parking Lot", availableSpots: 12, distance: "2.1 km away", pricePerHour: 55 },
        { id: "5", name: "Phoenix Mall of Asia - Yelahanka", availableSpots: 20, distance: "3.5 km away", pricePerHour: 45 },
        { id: "6", name: "Garuda Mall - Jayanagar", availableSpots: 6, distance: "1.8 km away", pricePerHour: 65 },
        { id: "7", name: "Royal Meenakshi Mall - Bannerghatta Road", availableSpots: 18, distance: "2.5 km away", pricePerHour: 50 },
        { id: "8", name: "VegaCity - Bannerghatta Road", availableSpots: 4, distance: "2.0 km away", pricePerHour: 55 },
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
  
    /******** NEW: Render PME glossy booking cards ********/
    function renderBookingCards() {
        const grid = document.getElementById('parking-grid');
        if (!grid) return;
  
        // build HTML for glossy booking cards
        let cardsHTML = '';
        nearbyParkingLots.forEach(lot => {
            const availability = getAvailability(lot.availableSpots);
            // map availability.label ('high'|'mid'|'low') to our CSS class names used earlier
            const availClass = availability === AVAILABILITY_CONFIG.high ? 'high' : (availability === AVAILABILITY_CONFIG.medium ? 'mid' : 'low');
            const availCss = availability === AVAILABILITY_CONFIG.high ? 'av-high' : (availability === AVAILABILITY_CONFIG.medium ? 'av-mid' : 'av-low');
  
            cardsHTML += `
              <article class="pme-card" data-lot="${escapeHtml(lot.name)}" data-price="${lot.pricePerHour}" data-distance="${escapeHtml(lot.distance)}">
                <div class="pme-card-thumb">
                  <img src="${THUMB}" alt="${escapeHtml(lot.name)} preview" />
                </div>
  
                <div class="pme-card-body">
                  <div class="pme-card-head">
                    <div class="pme-icon pin ${getIconColor(lot)}" aria-hidden="true"></div>
                    <div>
                      <h3 class="pme-title">${escapeHtml(lot.name)}</h3>
                      <div class="pme-distance">${escapeHtml(lot.distance)}</div>
                    </div>
                  </div>
  
                  <div class="pme-availability ${availCss}">${availability === AVAILABILITY_CONFIG.high ? '✓' : (availability === AVAILABILITY_CONFIG.medium ? '⚠' : '!')} <strong class="pme-available">${lot.availableSpots}</strong> Spots Available</div>
  
                  <div class="pme-footer">
                    <div class="pme-price"><span class="pme-currency">₹</span><span class="pme-amount">${lot.pricePerHour}</span><small class="pme-per">/hr</small></div>
                    <button class="pme-btn book" type="button">Book Now</button>
                  </div>
                </div>
              </article>
            `;
        });
  
        grid.innerHTML = cardsHTML;
  
        // render lucide icons in the newly-inserted HTML (for any inline lucide tags)
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
    }
  
    /******** helpers ********/
    function getIconColor(lot) {
      // a simple mapping to give variety — you can adjust
      const map = {
        'City Mall Parking': 'green',
        'MG Road Parking': 'orange',
        'Brigade Road Lot': 'red',
        'Koramangala Hub': 'green',
        'Indiranagar Plaza': 'purple',
        'Whitefield Central': 'amber'
      };
      return map[lot.name] || 'green';
    }
  
    function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
    }
  
    /******** event wiring for Book buttons ********/
    document.addEventListener('click', function(e){
      const btn = e.target.closest && e.target.closest('.pme-btn.book');
      if (!btn) return;
      const card = btn.closest('.pme-card');
      if (!card) return;
  
      const payload = {
        lot: card.dataset.lot,
        price: Number(card.dataset.price || 0),
        distance: card.dataset.distance,
        spots: card.querySelector('.pme-available')?.textContent || null
      };
  
      // If your app has a modal open function, call it
      if (typeof window.openBookingModal === 'function') {
        try {
          window.openBookingModal(payload);
          return;
        } catch (err) {
          console.warn('openBookingModal threw:', err);
        }
      }
  
      // Dispatch custom event so existing app code can listen
      const ev = new CustomEvent('pme:book', { detail: payload, bubbles: true, cancelable: true });
      document.dispatchEvent(ev);
  
      // fallback local visual feedback if nobody handles the event
      setTimeout(() => {
        if (!window._pmeHandledBooking) {
          btn.disabled = true;
          const original = btn.innerText;
          btn.innerText = 'Booked ✓';
          btn.style.background = 'linear-gradient(90deg,#43c07a,#38b873)';
          setTimeout(() => {
            btn.innerText = original;
            btn.disabled = false;
            btn.style.background = '';
          }, 1400);
        }
      }, 10);
    });
  
    // init
    renderMapPins();
    renderBookingCards();
  
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
  