const API_BASE_URL = 'http://localhost:8000';
const REFRESH_INTERVAL = 10000; // 10 seconds
let refreshTimer;
let allBookings = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'Admin_Login.html';
        return;
    }

    initializeDashboard();
    startAutoRefresh();
});

async function initializeDashboard() {
    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        // Fetch all locations
        await fetchLocations();
        
        // Fetch bookings (if available)
        await fetchBookings();
        
        updateLastUpdatedTime();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function fetchLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/v1/locations`);
        const data = await response.json();
        
        if (data.locations && data.locations.length > 0) {
            updateOverviewStats(data.locations);
            updateVehicleBreakdown(data.locations);
            displayLocationsTable(data.locations);
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
}

function updateOverviewStats(locations) {
    const totalLocations = locations.length;
    let totalSlots = 0;
    let totalAvailable = 0;
    
    locations.forEach(location => {
        Object.values(location.vehicle_types).forEach(vehicle => {
            totalSlots += vehicle.total_slots;
            totalAvailable += vehicle.available_slots;
        });
    });
    
    const occupiedSlots = totalSlots - totalAvailable;
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0;
    
    document.getElementById('totalLocations').textContent = totalLocations;
    document.getElementById('totalSlots').textContent = totalSlots;
    document.getElementById('occupiedSlots').textContent = occupiedSlots;
    document.getElementById('occupancyRate').textContent = `${occupancyRate}%`;
}

function updateVehicleBreakdown(locations) {
    let twoWheelerTotal = 0, twoWheelerAvailable = 0;
    let fourWheelerTotal = 0, fourWheelerAvailable = 0;
    let othersTotal = 0, othersAvailable = 0;
    
    locations.forEach(location => {
        if (location.vehicle_types['2wheeler']) {
            twoWheelerTotal += location.vehicle_types['2wheeler'].total_slots;
            twoWheelerAvailable += location.vehicle_types['2wheeler'].available_slots;
        }
        if (location.vehicle_types['4wheeler']) {
            fourWheelerTotal += location.vehicle_types['4wheeler'].total_slots;
            fourWheelerAvailable += location.vehicle_types['4wheeler'].available_slots;
        }
        if (location.vehicle_types['others']) {
            othersTotal += location.vehicle_types['others'].total_slots;
            othersAvailable += location.vehicle_types['others'].available_slots;
        }
    });
    
    // 2-Wheeler
    document.getElementById('twoWheelerTotal').textContent = twoWheelerTotal;
    document.getElementById('twoWheelerAvailable').textContent = twoWheelerAvailable;
    document.getElementById('twoWheelerOccupied').textContent = twoWheelerTotal - twoWheelerAvailable;
    const twoWheelerOccupancy = twoWheelerTotal > 0 ? ((twoWheelerTotal - twoWheelerAvailable) / twoWheelerTotal * 100) : 0;
    document.getElementById('twoWheelerProgress').style.width = `${twoWheelerOccupancy}%`;
    
    // 4-Wheeler
    document.getElementById('fourWheelerTotal').textContent = fourWheelerTotal;
    document.getElementById('fourWheelerAvailable').textContent = fourWheelerAvailable;
    document.getElementById('fourWheelerOccupied').textContent = fourWheelerTotal - fourWheelerAvailable;
    const fourWheelerOccupancy = fourWheelerTotal > 0 ? ((fourWheelerTotal - fourWheelerAvailable) / fourWheelerTotal * 100) : 0;
    document.getElementById('fourWheelerProgress').style.width = `${fourWheelerOccupancy}%`;
    
    // Others
    document.getElementById('othersTotal').textContent = othersTotal;
    document.getElementById('othersAvailable').textContent = othersAvailable;
    document.getElementById('othersOccupied').textContent = othersTotal - othersAvailable;
    const othersOccupancy = othersTotal > 0 ? ((othersTotal - othersAvailable) / othersTotal * 100) : 0;
    document.getElementById('othersProgress').style.width = `${othersOccupancy}%`;
}

function displayLocationsTable(locations) {
    const tbody = document.getElementById('locationsTableBody');
    
    if (locations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No locations found</td></tr>';
        return;
    }
    
    tbody.innerHTML = locations.map(location => {
        const twoWheeler = location.vehicle_types['2wheeler'] || { available_slots: 0, total_slots: 0 };
        const fourWheeler = location.vehicle_types['4wheeler'] || { available_slots: 0, total_slots: 0 };
        const others = location.vehicle_types['others'] || { available_slots: 0, total_slots: 0 };
        
        const totalAvailable = location.total_available_slots;
        const totalSlots = twoWheeler.total_slots + fourWheeler.total_slots + others.total_slots;
        const occupancyPercentage = totalSlots > 0 ? ((totalSlots - totalAvailable) / totalSlots * 100) : 0;
        
        let statusClass = 'operational';
        let statusText = 'Operational';
        
        if (totalAvailable === 0) {
            statusClass = 'full';
            statusText = 'Full';
        } else if (occupancyPercentage > 80) {
            statusClass = 'low';
            statusText = 'Low Availability';
        }
        
        let occupancyClass = '';
        if (occupancyPercentage > 80) occupancyClass = 'high';
        if (occupancyPercentage >= 100) occupancyClass = 'full';
        
        return `
            <tr>
                <td><strong>${location.name}</strong></td>
                <td>${location.address}</td>
                <td><span class="slot-count ${twoWheeler.available_slots < 5 ? 'critical' : twoWheeler.available_slots < 10 ? 'low' : ''}">${twoWheeler.available_slots}/${twoWheeler.total_slots}</span></td>
                <td><span class="slot-count ${fourWheeler.available_slots < 5 ? 'critical' : fourWheeler.available_slots < 10 ? 'low' : ''}">${fourWheeler.available_slots}/${fourWheeler.total_slots}</span></td>
                <td><span class="slot-count ${others.available_slots < 2 ? 'critical' : others.available_slots < 5 ? 'low' : ''}">${others.available_slots}/${others.total_slots}</span></td>
                <td><strong>${totalAvailable}</strong></td>
                <td>
                    <div class="occupancy-bar">
                        <div class="occupancy-bar-fill">
                            <div class="occupancy-bar-fill-inner ${occupancyClass}" style="width: ${occupancyPercentage}%"></div>
                        </div>
                        <span class="occupancy-percentage">${occupancyPercentage.toFixed(0)}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

async function fetchBookings() {
    try {
        // Note: This requires authentication. For demo, we'll show mock data
        // In production, add JWT token to the request
        
        // Mock bookings for demonstration
        const mockBookings = generateMockBookings(10);
        allBookings = mockBookings;
        displayBookings(mockBookings);
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        // Show empty state
        document.getElementById('bookingsGrid').innerHTML = '<div class="loading-cell">Unable to load bookings (authentication required)</div>';
    }
}

function generateMockBookings(count) {
    const statuses = ['active', 'confirmed', 'completed'];
    const locations = ['MG Road Parking', 'Forum Mall', 'Nexus Mall', 'Indranagar'];
    const vehicles = ['2wheeler', '4wheeler', 'others'];
    
    return Array.from({ length: count }, (_, i) => ({
        id: 1000 + i,
        location: locations[Math.floor(Math.random() * locations.length)],
        slot_number: `A-${101 + i}`,
        vehicle_type: vehicles[Math.floor(Math.random() * vehicles.length)],
        start_time: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        end_time: new Date(Date.now() + Math.random() * 7200000).toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        total_amount: Math.floor(Math.random() * 200) + 50
    }));
}

function displayBookings(bookings) {
    const grid = document.getElementById('bookingsGrid');
    
    if (bookings.length === 0) {
        grid.innerHTML = '<div class="loading-cell">No bookings found</div>';
        return;
    }
    
    grid.innerHTML = bookings.slice(0, 12).map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <span class="booking-id">#${booking.id}</span>
                <span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span>
            </div>
            <div class="booking-details">
                <div class="booking-detail-row">
                    <i data-lucide="map-pin"></i>
                    <strong>${booking.location}</strong>
                </div>
                <div class="booking-detail-row">
                    <i data-lucide="square-parking"></i>
                    Slot: <strong>${booking.slot_number}</strong>
                </div>
                <div class="booking-detail-row">
                    <i data-lucide="car"></i>
                    Vehicle: <strong>${booking.vehicle_type}</strong>
                </div>
                <div class="booking-detail-row">
                    <i data-lucide="clock"></i>
                    ${new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="booking-detail-row">
                    <i data-lucide="indian-rupee"></i>
                    Amount: <strong>₹${booking.total_amount}</strong>
                </div>
            </div>
        </div>
    `).join('');
    
    // Re-initialize Lucide icons
    lucide.createIcons();
}

function filterBookings() {
    const filter = document.getElementById('bookingFilter').value;
    
    let filtered = allBookings;
    if (filter !== 'all') {
        filtered = allBookings.filter(b => b.status === filter);
    }
    
    displayBookings(filtered);
    addActivityLog(`Filtered bookings: ${filter}`, 'success');
}
// Auto Refresh
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        refreshData();
    }, REFRESH_INTERVAL);
}

async function refreshData() {
    addActivityLog('Refreshing dashboard data...', 'success');
    await loadDashboardData();
}
ion updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearInterval(refreshTimer);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        window.location.href = 'Admin_Login.html';
    }
}

// Stop refresh on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(refreshTimer);
});
