document.addEventListener('DOMContentLoaded', () => {
    // API base URL
    const API_BASE = 'http://localhost:8000/v1';
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('locationId');
    const locationName = urlParams.get('locationName');
    const vehicleType = urlParams.get('vehicleType');
    const price = parseFloat(urlParams.get('price')) || 0;
    const available = parseInt(urlParams.get('available')) || 0;
    const startTime = urlParams.get('startTime');
    const endTime = urlParams.get('endTime');
    
    // State
    let selectedSlot = null;
    let slots = [];
    
    // Initialize page
    initializePage();
    
    function initializePage() {
        // Validate parameters
        if (!locationId || !vehicleType || !startTime || !endTime) {
            alert('Missing required booking information. Redirecting...');
            window.location.href = 'Booking_page.html';
            return;
        }
        
        // Update booking info display
        updateBookingInfo();
        
        // Fetch and render slots
        fetchSlots();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    function updateBookingInfo() {
        // Update location name in header
        document.getElementById('location-name').textContent = locationName || 'Select Your Slot';
        
        // Update info items
        document.getElementById('info-location').textContent = locationName || 'N/A';
        
        const vehicleTypeDisplay = {
            '2wheeler': '2 Wheeler 🏍️',
            '4wheeler': '4 Wheeler 🚗',
            'others': 'Others (Bus/Truck) 🚐'
        };
        document.getElementById('info-vehicle').textContent = vehicleTypeDisplay[vehicleType] || vehicleType;
        
        // Calculate and display duration
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationHours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
        
        document.getElementById('info-duration').textContent = `${formatDateTime(start)} to ${formatDateTime(end)} (${durationHours}h)`;
        document.getElementById('info-price').textContent = `₹${price}`;
        
        // Store duration for calculations
        window.bookingDuration = durationHours;
    }
    
    function formatDateTime(date) {
        const options = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleString('en-US', options);
    }
    
    async function fetchSlots() {
        const container = document.getElementById('slots-container');
        
        try {
            container.innerHTML = '<div class="loading-message">Loading available slots...</div>';
            
            // Generate mock slots with both available and booked status
            const totalSlots = 20; // Total slots in the parking lot
            const availableCount = available || 12; // Available slots from URL or default
            slots = [];
            
            for (let i = 1; i <= totalSlots; i++) {
                const zone = i <= 10 ? 'Zone A' : i <= 20 ? 'Zone B' : 'Zone C';
                const floor = i <= 10 ? 'Ground Floor' : 'First Floor';
                
                // First availableCount slots are available, rest are booked
                const isAvailable = i <= availableCount;
                
                slots.push({
                    id: i,
                    slot_number: `${vehicleType === '2wheeler' ? '2W' : vehicleType === '4wheeler' ? '4W' : 'O'}-${String(i).padStart(3, '0')}`,
                    zone: zone,
                    floor: floor,
                    status: isAvailable ? 'AVAILABLE' : 'BOOKED',
                    vehicle_type: vehicleType
                });
            }
            
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
            console.log(`Generated ${slots.length} total slots (${availableSlots} available, ${slots.length - availableSlots} booked) for ${vehicleType}`);
            
            if (availableSlots === 0) {
                container.innerHTML = '<div class="error-message">No slots available for the selected time and vehicle type. All slots are currently booked.</div>';
                return;
            }
            
            renderSlots();
            
        } catch (error) {
            console.error('Error fetching slots:', error);
            container.innerHTML = '<div class="error-message">Failed to load slots. Please try again.</div>';
        }
    }
    
    function renderSlots() {
        const container = document.getElementById('slots-container');
        
        // Group slots by zone for better organization
        const slotsByZone = {};
        slots.forEach(slot => {
            const zone = slot.zone || 'General';
            if (!slotsByZone[zone]) {
                slotsByZone[zone] = [];
            }
            slotsByZone[zone].push(slot);
        });
        
        let html = '';
        
        // Render slots grouped by zone
        Object.keys(slotsByZone).sort().forEach(zone => {
            const zoneSlots = slotsByZone[zone];
            
            // Add zone header
            html += `<div class="zone-header">${escapeHtml(zone)}</div>`;
            
            zoneSlots.forEach(slot => {
                // Show both available and booked slots
                const isBooked = slot.status === 'BOOKED';
                const statusClass = isBooked ? 'booked' : 'available';
                const statusText = isBooked ? 'Booked' : 'Available';
                
                html += `
                    <div class="slot-card ${statusClass}" 
                         data-slot-id="${slot.id}"
                         data-slot-number="${escapeHtml(slot.slot_number)}"
                         data-slot-zone="${escapeHtml(slot.zone || 'General')}">
                        <div class="slot-number">${escapeHtml(slot.slot_number)}</div>
                        <div class="slot-zone">${escapeHtml(slot.zone || 'General')}</div>
                        <div class="slot-status">${statusText}</div>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html;
        
        const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
        console.log('✅ Rendered', slots.length, 'total slots:', availableSlots, 'available,', (slots.length - availableSlots), 'booked');
    }
    
    function setupEventListeners() {
        // Slot selection
        document.getElementById('slots-container').addEventListener('click', (e) => {
            const slotCard = e.target.closest('.slot-card.available');
            if (!slotCard) return;
            
            selectSlot(slotCard);
        });
        
        // Clear selection
        document.getElementById('clear-selection').addEventListener('click', clearSelection);
        
        // Confirm booking
        document.getElementById('confirm-booking').addEventListener('click', confirmBooking);
    }
    
    function selectSlot(slotCard) {
        // Remove previous selection
        if (selectedSlot) {
            selectedSlot.classList.remove('selected');
        }
        
        // Select new slot
        slotCard.classList.add('selected');
        selectedSlot = slotCard;
        
        // Update summary
        updateBookingSummary();
        
        // Show summary card
        document.getElementById('booking-summary').style.display = 'block';
        
        // Scroll to summary
        document.getElementById('booking-summary').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function clearSelection() {
        if (selectedSlot) {
            selectedSlot.classList.remove('selected');
            selectedSlot = null;
        }
        
        document.getElementById('booking-summary').style.display = 'none';
    }
    
    function updateBookingSummary() {
        if (!selectedSlot) return;
        
        const slotNumber = selectedSlot.dataset.slotNumber;
        const slotZone = selectedSlot.dataset.slotZone;
        const duration = window.bookingDuration || 0;
        const totalCost = Math.round(price * duration);
        
        document.getElementById('selected-slot-number').textContent = slotNumber;
        document.getElementById('selected-slot-zone').textContent = slotZone;
        document.getElementById('summary-duration').textContent = `${duration} hours`;
        document.getElementById('summary-rate').textContent = `₹${price}/hr`;
        document.getElementById('total-cost').textContent = `₹${totalCost}`;
    }
    
    async function confirmBooking() {
        if (!selectedSlot) {
            alert('Please select a slot first');
            return;
        }
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Please login to continue');
            window.location.href = 'Login_page.html';
            return;
        }
        
        const slotId = selectedSlot.dataset.slotId;
        const button = document.getElementById('confirm-booking');
        const originalText = button.innerHTML;
        
        try {
            // Disable button and show loading
            button.disabled = true;
            button.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
            
            // Create booking
            const response = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    slot_id: parseInt(slotId),
                    start_time: startTime,
                    end_time: endTime,
                    vehicle_type: vehicleType
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create booking');
            }
            
            const booking = await response.json();
            
            // Show success message
            alert(`Booking confirmed! Your slot ${selectedSlot.dataset.slotNumber} is reserved.`);
            
            // Redirect to bookings page or confirmation page
            window.location.href = 'Booking_page.html';
            
        } catch (error) {
            console.error('Booking error:', error);
            alert(`Failed to create booking: ${error.message}`);
            
            // Restore button
            button.disabled = false;
            button.innerHTML = originalText;
            
            // Recreate lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
    
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
