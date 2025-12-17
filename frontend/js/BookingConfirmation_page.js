document.addEventListener('DOMContentLoaded', () => {
    // Get booking data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    const bookingData = {
        bookingId: urlParams.get('bookingId'),
        locationName: urlParams.get('locationName'),
        slotNumber: urlParams.get('slotNumber'),
        zone: urlParams.get('zone'),
        vehicleType: urlParams.get('vehicleType'),
        startTime: urlParams.get('startTime'),
        endTime: urlParams.get('endTime'),
        totalAmount: urlParams.get('totalAmount')
    };
    
    // If no booking data, redirect to booking page
    if (!bookingData.bookingId) {
        console.error('No booking data found');
        window.location.href = 'Booking_page.html';
        return;
    }
    
    // Display booking details
    displayBookingDetails(bookingData);
});

function displayBookingDetails(data) {
    // Format vehicle type for display
    const vehicleTypeDisplay = {
        '2wheeler': '🏍️ Two Wheeler',
        '4wheeler': '🚗 Four Wheeler',
        'others': '🚐 Commercial Vehicle'
    };
    
    // Format dates
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);
    
    // Calculate duration
    const durationMs = endDate - startDate;
    const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
    
    // Update DOM elements
    document.getElementById('booking-id').textContent = `#${data.bookingId}`;
    document.getElementById('location-name').textContent = data.locationName || 'N/A';
    document.getElementById('slot-number').textContent = data.slotNumber || 'N/A';
    document.getElementById('zone').textContent = data.zone || 'General';
    document.getElementById('vehicle-type').textContent = vehicleTypeDisplay[data.vehicleType] || data.vehicleType;
    
    document.getElementById('start-time').textContent = formatDateTime(startDate);
    document.getElementById('end-time').textContent = formatDateTime(endDate);
    document.getElementById('duration').textContent = `${durationHours} hours`;
    document.getElementById('total-amount').textContent = `₹${data.totalAmount}`;
}

function formatDateTime(date) {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
}
