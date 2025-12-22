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
            container.innerHTML = '<div class="loading-message">Loading available slots from database...</div>';
            
            // Map auto_truck to others for backend compatibility
            const backendVehicleType = vehicleType === 'auto_truck' ? 'others' : vehicleType;
            
            // Fetch real slots from backend
            const response = await fetch(`${API_BASE}/lots/${locationId}/slots?vehicle_type=${backendVehicleType}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch slots');
            }
            
            const slotsData = await response.json();
            console.log('Fetched slots from backend:', slotsData);
            
            // Use real slots from database
            slots = slotsData.map(slot => ({
                id: slot.id,
                slot_number: slot.slot_number,
                zone: slot.zone || 'General',
                floor: slot.floor || 'Ground Floor',
                status: (slot.status || '').toUpperCase(), // Normalize to uppercase
                vehicle_type: slot.vehicle_type,
                label: ''
            }));
            
            const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
            console.log(`Loaded ${slots.length} slots from database (${availableSlots} available) for ${backendVehicleType}`);
            
            // Always render slots - even if all are booked, user should see them
            renderSlots();
            
        } catch (error) {
            console.error('Error fetching slots:', error);
            container.innerHTML = `<div class="error-message">Failed to load slots. Please try again.<br><small>${error.message}</small></div>`;
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
                // Database uses RESERVED and OCCUPIED for booked slots
                const isBooked = slot.status === 'RESERVED' || slot.status === 'OCCUPIED';
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
        // Calculate estimated cost - actual cost will be calculated by backend
        const estimatedCost = Math.round(price * duration);
        
        document.getElementById('selected-slot-number').textContent = slotNumber;
        document.getElementById('selected-slot-zone').textContent = slotZone;
        document.getElementById('summary-duration').textContent = `${duration} hours`;
        document.getElementById('summary-rate').textContent = `₹${price}/hr`;
        document.getElementById('total-cost').textContent = `₹${estimatedCost} (estimated)`;
    }
    
    async function createGuestUser() {
        try {
            // Generate a unique guest email using timestamp
            const timestamp = Date.now();
            const guestEmail = `guest${timestamp}@parkpulse.demo`;
            const guestPassword = `Guest@${timestamp}`;
            const guestName = `Guest User ${timestamp}`;
            
            console.log('Creating guest account:', guestEmail);
            
            // Register guest user
            const registerResponse = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: guestEmail,
                    password: guestPassword,
                    name: guestName,
                    role: 'driver'
                })
            });
            
            if (!registerResponse.ok) {
                const regError = await registerResponse.json();
                console.error('Failed to register guest user:', regError);
                return false;
            }
            
            const registerData = await registerResponse.json();
            console.log('Guest account created:', registerData);
            
            // Login with guest credentials
            const loginResponse = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: guestEmail,
                    password: guestPassword
                })
            });
            
            if (!loginResponse.ok) {
                const loginError = await loginResponse.json();
                console.error('Failed to login guest user:', loginError);
                return false;
            }
            
            const loginData = await loginResponse.json();
            console.log('Guest login successful:', loginData);
            
            // Store token and email
            localStorage.setItem('access_token', loginData.access_token);
            localStorage.setItem('user_email', guestEmail);
            localStorage.setItem('is_guest', 'true');
            
            console.log('Guest user logged in successfully');
            
            // Show a brief notification
            showGuestNotification();
            
            return true;
            
        } catch (error) {
            console.error('Error creating guest user:', error);
            return false;
        }
    }
    
    function showGuestNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3B82F6;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <strong>Quick Booking Mode</strong><br>
            <span style="font-size: 12px; opacity: 0.9;">You're booking as a guest user</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    async function validateToken(token) {
        try {
            const response = await fetch(`${API_BASE}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async function confirmBooking() {
        if (!selectedSlot) {
            alert('Please select a slot first');
            return;
        }
        
        let token = localStorage.getItem('access_token');
        
        // Validate existing token or create guest user
        if (token) {
            console.log('Token found, validating...');
            const isValid = await validateToken(token);
            if (!isValid) {
                console.log('Token invalid, clearing and creating new guest user...');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('is_guest');
                token = null;
            } else {
                console.log('Token is valid');
            }
        }
        
        // If no token or invalid token, auto-create a guest user
        if (!token) {
            console.log('Creating guest user...');
            const guestCreated = await createGuestUser();
            if (!guestCreated) {
                alert('Unable to proceed with booking. Please try signing up or logging in.');
                window.location.href = 'Login_page.html';
                return;
            }
            token = localStorage.getItem('access_token');
        }
        
        const slotId = selectedSlot.dataset.slotId;
        const slotNumber = selectedSlot.dataset.slotNumber;
        const button = document.getElementById('confirm-booking');
        const originalText = button.innerHTML;
        
        try {
            // Disable button and show loading with animation
            button.disabled = true;
            button.style.background = '#9CA3AF';
            button.innerHTML = `
                <svg style="display: inline-block; width: 20px; height: 20px; animation: spin 1s linear infinite; margin-right: 8px;" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="white" stroke-width="4" fill="none" opacity="0.25"/>
                    <path d="M12 2 A10 10 0 0 1 22 12" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
                </svg>
                Processing Your Booking...
            `;
            
            // Add loading animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            // Prepare booking data
            const bookingData = {
                lot_id: parseInt(locationId),
                slot_id: parseInt(slotId),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                vehicle_type: vehicleType,
                vehicle_plate: `DEMO-${Math.floor(Math.random() * 10000)}`
            };
            
            console.log('Creating booking:', bookingData);
            
            // Create booking via API - note the trailing slash
            const response = await fetch(`${API_BASE}/bookings/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                console.error('Booking API error:', error);
                console.error('Response status:', response.status);
                
                // If credentials error, retry with new guest user
                if (response.status === 401 && error.detail && error.detail.includes('credentials')) {
                    console.log('Auth failed, creating new guest user and retrying...');
                    
                    // Clear old token
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('is_guest');
                    
                    // Create new guest user
                    const guestCreated = await createGuestUser();
                    if (!guestCreated) {
                        throw new Error('Unable to authenticate. Please try again or login.');
                    }
                    
                    // Retry booking with new token
                    const newToken = localStorage.getItem('access_token');
                    const retryResponse = await fetch(`${API_BASE}/bookings/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${newToken}`
                        },
                        body: JSON.stringify(bookingData)
                    });
                    
                    if (!retryResponse.ok) {
                        const retryError = await retryResponse.json();
                        throw new Error(retryError.detail || 'Failed to create booking after retry');
                    }
                    
                    const booking = await retryResponse.json();
                    console.log('Booking created successfully on retry:', booking);
                    showBookingConfirmation(booking, slotNumber);
                    return;
                }
                
                throw new Error(error.detail || 'Failed to create booking');
            }
            
            const booking = await response.json();
            
            console.log('Booking created successfully:', booking);
            
            // Show detailed success message
            showBookingConfirmation(booking, slotNumber);
            
        } catch (error) {
            console.error('Booking error:', error);
            console.error('Error stack:', error.stack);
            
            // Show user-friendly error message
            alert(`Failed to create booking: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
            
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
        // Use the actual price from backend response (includes dynamic pricing)
        const totalCost = booking.price || 0;
        const duration = window.bookingDuration || 0;
        
        const confirmationHTML = `
            <div id="booking-success-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease-out;">
                <div style="background: white; padding: 50px 40px; border-radius: 20px; max-width: 550px; width: 90%; text-align: center; box-shadow: 0 25px 80px rgba(0,0,0,0.4); animation: slideUp 0.4s ease-out; position: relative;">
                    <div style="position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); animation: scaleIn 0.5s ease-out;">
                        <div style="font-size: 50px; color: white;">✓</div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">Booking Successful!</h2>
                        <p style="color: #6B7280; margin: 0 0 30px 0; font-size: 16px;">Your parking slot has been confirmed</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); padding: 25px; border-radius: 16px; margin: 20px 0; text-align: left; border: 2px solid #10B981;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Booking ID</p>
                                <p style="margin: 5px 0 0 0; color: #059669; font-size: 18px; font-weight: 700;">#${booking.id}</p>
                            </div>
                            <div>
                                <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                                <p style="margin: 5px 0 0 0; color: #059669; font-size: 18px; font-weight: 700; text-transform: uppercase;">${booking.status || 'CONFIRMED'}</p>
                            </div>
                        </div>
                        <hr style="border: none; border-top: 1px solid #D1FAE5; margin: 20px 0;">
                        <div style="margin-bottom: 12px;">
                            <span style="color: #374151; font-weight: 600;">📍 Location:</span>
                            <span style="color: #1F2937; margin-left: 8px;">${locationName}</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #374151; font-weight: 600;">🅿️ Slot:</span>
                            <span style="color: #1F2937; margin-left: 8px; background: #10B981; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700;">${slotNumber}</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #374151; font-weight: 600;">🚗 Vehicle:</span>
                            <span style="color: #1F2937; margin-left: 8px;">${vehicleType === '2wheeler' ? 'Two Wheeler' : vehicleType === '4wheeler' ? 'Four Wheeler' : 'Auto/Truck'}</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #374151; font-weight: 600;">⏱️ Duration:</span>
                            <span style="color: #1F2937; margin-left: 8px;">${duration} hours</span>
                        </div>
                        <hr style="border: none; border-top: 1px solid #D1FAE5; margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <span style="color: #374151; font-size: 18px; font-weight: 600;">Total Amount:</span>
                            <span style="color: #059669; font-size: 28px; font-weight: 800;">₹${Math.round(totalCost)}</span>
                        </div>
                    </div>
                    
                    <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 15px; margin: 20px 0; text-align: left;">
                        <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                            <strong>📧 Confirmation sent!</strong><br>
                            Check your email for booking details and QR code.
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button onclick="window.print()" style="flex: 1; background: white; color: #059669; border: 2px solid #10B981; padding: 14px 24px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                            🖨️ Print Receipt
                        </button>
                        <button onclick="window.location.href='Booking_page.html'" style="flex: 1; background: #10B981; color: white; border: none; padding: 14px 24px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
                            ✓ Done
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes scaleIn {
                    0% { transform: translateX(-50%) scale(0); }
                    50% { transform: translateX(-50%) scale(1.2); }
                    100% { transform: translateX(-50%) scale(1); }
                }
                #booking-success-modal button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
        
        // Play success sound effect (optional - using audio API)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
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
