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
    
    // Store booking ID globally for cancellation
    window.currentBookingId = bookingData.bookingId;
    
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

// Calculate cancellation fee based on hours until start
function calculateCancellationFee(startTime, totalAmount) {
    const now = new Date();
    const start = new Date(startTime);
    const hoursUntilStart = (start - now) / (1000 * 60 * 60);
    
    let cancellationFee = 0;
    let refundAmount = 0;
    let feePercentage = 0;
    
    if (hoursUntilStart < 1) {
        return { canCancel: false, message: 'Cannot cancel within 1 hour of start time' };
    } else if (hoursUntilStart >= 24) {
        feePercentage = 10;
        cancellationFee = totalAmount * 0.10;
        refundAmount = totalAmount * 0.90;
    } else if (hoursUntilStart >= 12) {
        feePercentage = 25;
        cancellationFee = totalAmount * 0.25;
        refundAmount = totalAmount * 0.75;
    } else if (hoursUntilStart >= 6) {
        feePercentage = 50;
        cancellationFee = totalAmount * 0.50;
        refundAmount = totalAmount * 0.50;
    } else {
        feePercentage = 75;
        cancellationFee = totalAmount * 0.75;
        refundAmount = totalAmount * 0.25;
    }
    
    return {
        canCancel: true,
        cancellationFee: cancellationFee.toFixed(2),
        refundAmount: refundAmount.toFixed(2),
        feePercentage,
        hoursUntilStart: hoursUntilStart.toFixed(1)
    };
}

// Cancel booking function
async function cancelBooking() {
    const bookingId = window.currentBookingId;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        alert('Please login to cancel booking');
        window.location.href = 'Login_page.html';
        return;
    }
    
    if (!bookingId) {
        alert('Booking ID not found');
        return;
    }
    
    // Get booking details from displayed data
    const startTime = document.getElementById('start-time').textContent;
    const totalAmount = parseFloat(document.getElementById('total-amount').textContent.replace('₹', ''));
    
    // Calculate cancellation fee
    const urlParams = new URLSearchParams(window.location.search);
    const startTimeISO = urlParams.get('startTime');
    const feeInfo = calculateCancellationFee(startTimeISO, totalAmount);
    
    if (!feeInfo.canCancel) {
        alert(feeInfo.message);
        return;
    }
    
    // Show confirmation dialog with fee information
    const confirmMessage = `Are you sure you want to cancel this booking?\n\n` +
        `Cancellation Fee (${feeInfo.feePercentage}%): ₹${feeInfo.cancellationFee}\n` +
        `Refund Amount: ₹${feeInfo.refundAmount}\n` +
        `Time until booking: ${feeInfo.hoursUntilStart} hours\n\n` +
        `The refund will be processed within 5-7 business days.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Show loading state
    const cancelBtn = document.getElementById('cancelBtn');
    const originalBtnText = cancelBtn.innerHTML;
    cancelBtn.disabled = true;
    cancelBtn.innerHTML = '<i data-lucide="loader"></i> Cancelling...';
    lucide.createIcons();
    
    try {
        const response = await fetch(`http://localhost:8000/v1/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(
                `Booking cancelled successfully!\n\n` +
                `Cancellation Fee: ₹${result.cancellation_fee}\n` +
                `Refund Amount: ₹${result.refund_amount}\n\n` +
                `Refund will be processed within 5-7 business days.`
            );
            window.location.href = 'Booking_page.html';
        } else {
            const error = await response.json();
            alert(`Failed to cancel booking: ${error.detail || 'Unknown error'}`);
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('An error occurred while cancelling the booking. Please try again.');
        cancelBtn.disabled = false;
        cancelBtn.innerHTML = originalBtnText;
        lucide.createIcons();
    }
}
