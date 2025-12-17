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
            '2wheeler': '2 Wheeler',
            '4wheeler': '4 Wheeler',
            'auto_truck': 'Auto/Truck'
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
            
            // Get additional data from URL parameters
            const evSlots = parseInt(urlParams.get('data-ev-slots')) || 0;
            const autoSlots = parseInt(urlParams.get('data-auto-slots')) || 0;
            const truckSlots = parseInt(urlParams.get('data-truck-slots')) || 0;
            const totalFromUrl = parseInt(urlParams.get('data-total')) || 0;
            
            // Determine total slots based on vehicle type
            let totalSlots;
            if (vehicleType === '2wheeler') {
                totalSlots = 40;
            } else if (vehicleType === '4wheeler') {
                totalSlots = 25;
            } else if (vehicleType === 'auto_truck') {
                totalSlots = 30;
            } else {
                totalSlots = totalFromUrl || 20;
            }
            
            const availableCount = available || 12; // Available slots from URL or default
            slots = [];
            
            for (let i = 1; i <= totalSlots; i++) {
                const zone = i <= Math.floor(totalSlots / 3) ? 'Zone A' : i <= Math.floor(totalSlots * 2 / 3) ? 'Zone B' : 'Zone C';
                const floor = i <= Math.floor(totalSlots / 2) ? 'Ground Floor' : 'First Floor';
                
                // First availableCount slots are available, rest are booked
                const isAvailable = i <= availableCount;
                
                // Determine if slot is EV, Auto, or Truck
                let slotLabel = '';
                let slotPrefix = '';
                
                if (vehicleType === '2wheeler') {
                    slotPrefix = '2W';
                    // Last 20 slots (21-40) are EV slots
                    if (i > 20) {
                        slotLabel = 'EV';
                    }
                } else if (vehicleType === '4wheeler') {
                    slotPrefix = '4W';
                    // Last 10 slots (16-25) are EV slots
                    if (i > 15) {
                        slotLabel = 'EV';
                    }
                } else if (vehicleType === 'auto_truck') {
                    // First 15 slots are Auto, next 15 are Truck
                    if (i <= 15) {
                        slotPrefix = 'AUTO';
                        slotLabel = 'Auto';
                    } else {
                        slotPrefix = 'TRUCK';
                        slotLabel = 'Truck';
                    }
                } else {
                    slotPrefix = 'O';
                }
                
                slots.push({
                    id: i,
                    slot_number: `${slotPrefix}-${String(i).padStart(3, '0')}`,
                    zone: zone,
                    floor: floor,
                    status: isAvailable ? 'AVAILABLE' : 'BOOKED',
                    vehicle_type: vehicleType,
                    label: slotLabel
                });
            }
            
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
            console.log(`Generated ${slots.length} total slots (${availableSlots} available, ${slots.length - availableSlots} booked) for ${vehicleType}`);
            
            // Always render slots - even if all are booked, user should see them
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
                const labelDisplay = slot.label ? `<div class="slot-label">${escapeHtml(slot.label)}</div>` : '';
                
                html += `
                    <div class="slot-card ${statusClass}" 
                         data-slot-id="${slot.id}"
                         data-slot-number="${escapeHtml(slot.slot_number)}"
                         data-slot-zone="${escapeHtml(slot.zone || 'General')}">
                        <div class="slot-number">${escapeHtml(slot.slot_number)}</div>
                        ${labelDisplay}
                        <div class="slot-zone">${escapeHtml(slot.zone || 'General')}</div>
                        <div class="slot-status">${statusText}</div>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html;
        
        const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
        console.log('✅ Rendered', slots.length, 'total slots:', availableSlots, 'available,', (slots.length - availableSlots), 'booked');
        
        // Show message if all slots are booked
        if (availableSlots === 0) {
            const noAvailableMsg = document.createElement('div');
            noAvailableMsg.className = 'error-message';
            noAvailableMsg.style.marginTop = '20px';
            noAvailableMsg.textContent = '⚠️ All slots are currently booked for this time period. Please select a different time.';
            container.appendChild(noAvailableMsg);
        }
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
        const slotNumber = selectedSlot.dataset.slotNumber;
        const button = document.getElementById('confirm-booking');
        const originalText = button.innerHTML;
        
        try {
            // Disable button and show loading
            button.disabled = true;
            button.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
            
            // Prepare booking data
            const bookingData = {
                lot_id: parseInt(locationId),
                slot_id: parseInt(slotId),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                vehicle_type: vehicleType
            };
            
            console.log('Creating booking:', bookingData);
            
            // Create booking via API
            const response = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create booking');
            }
            
            const booking = await response.json();
            
            console.log('Booking created successfully:', booking);
            
            // Show detailed success message
            showBookingConfirmation(booking, slotNumber);
            
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
    
    function showBookingConfirmation(booking, slotNumber) {
        // Create confirmation modal/message
        const duration = window.bookingDuration || 0;
        const totalCost = Math.round(price * duration);
        
        const confirmationHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 16px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div style="font-size: 60px; color: #10B981; margin-bottom: 20px;">✓</div>
                    <h2 style="color: #1a1a1a; margin: 0 0 16px 0;">Booking Confirmed!</h2>
                    <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
                        <p style="margin: 8px 0; color: #166534;"><strong>Booking ID:</strong> ${booking.booking_number || booking.id}</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Location:</strong> ${locationName}</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Slot:</strong> ${slotNumber}</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Vehicle Type:</strong> ${vehicleType === '2wheeler' ? '2 Wheeler' : vehicleType === '4wheeler' ? '4 Wheeler' : 'Auto/Truck'}</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Duration:</strong> ${duration} hours</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Total Cost:</strong> ₹${totalCost}</p>
                        <p style="margin: 8px 0; color: #166534;"><strong>Status:</strong> ${booking.status || 'CONFIRMED'}</p>
                    </div>
                    <p style="color: #666; margin: 20px 0;">Your parking slot has been reserved. You will receive a confirmation email shortly.</p>
                    <button onclick="window.location.href='Booking_page.html'" style="background: #10B981; color: white; border: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px;">
                        Back to Bookings
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
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
