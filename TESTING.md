# 🧪 ParkPulse Testing Guide

## Test Environment Setup

### Prerequisites
1. **Start Docker Desktop**
2. **Verify Services Running:**
   ```bash
   docker ps
   ```
   Expected services:
   - `parkpulse_frontend` (Port 3000)
   - `parkpulse_backend` (Port 8000)
   - `parkpulse_db` (Port 5432)
   - `parkpulse_redis` (Port 6379)
   - `parkpulse_pgadmin` (Port 5050)

3. **Verify Database Seeded:**
   ```bash
   docker exec parkpulse_backend python seed_vehicle_data.py
   ```

---

## 🎯 End-to-End Test Cases

### Test Suite 1: Authentication Flow

#### TC-1.1: User Signup
**Steps:**
1. Navigate to http://localhost:3000/pages/Landing_page.html
2. Click "Get Started" or "Sign Up"
3. Fill signup form:
   - Name: Test User
   - Email: testuser@example.com
   - Password: Test@12345
   - Phone: 9876543210
4. Submit form

**Expected Result:**
- ✅ Account created successfully
- ✅ Redirected to login page
- ✅ Success message displayed

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-1.2: User Login (JWT)
**Steps:**
1. Navigate to http://localhost:3000/pages/Login_page.html
2. Enter credentials:
   - Email: testuser@example.com
   - Password: Test@12345
3. Click "Login"

**Expected Result:**
- ✅ JWT token stored in localStorage
- ✅ Redirected to booking page
- ✅ User info displayed

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-1.3: Google OAuth Login
**Steps:**
1. On login page, click "Sign in with Google"
2. Authorize with Google account
3. Complete OAuth flow

**Expected Result:**
- ✅ OAuth callback successful
- ✅ Token stored
- ✅ Redirected to booking page

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test Suite 2: Booking Flow (Time & Location Selection)

#### TC-2.1: Time Selection Validation
**Steps:**
1. On booking page (http://localhost:3000/pages/Booking_page.html)
2. Select start time: Today 10:00 AM
3. Select end time: Today 9:00 AM (before start time)
4. Click "Find Parking"

**Expected Result:**
- ✅ Error message: "End time must be after start time"
- ✅ Booking does not proceed

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-2.2: Fetch Parking Locations
**Steps:**
1. Select valid times:
   - Start: Today 10:00 AM
   - End: Today 2:00 PM
2. Click "Find Parking"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Location list displayed with 8 Bangalore locations
- ✅ Each location shows:
  - Name
  - Address
  - Distance
  - Available slots count
  - Rating

**Actual Result:**
- [ ] Pass / [ ] Fail
- Locations found: _______
- Notes: _______________________

---

#### TC-2.3: Location Selection
**Steps:**
1. Click "Select" on "MG Road Parking"
2. Verify redirection to vehicle selection

**Expected Result:**
- ✅ Modal/section shows vehicle types:
  - 🏍️ 2-Wheeler (₹40/hr)
  - 🚗 4-Wheeler (₹60/hr)
  - 🚐 Others (₹50/hr)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test Suite 3: Vehicle Type & Slot Selection

#### TC-3.1: Vehicle Type Selection - 2-Wheeler
**Steps:**
1. Click "2-Wheeler" button
2. Verify API call to fetch 2-wheeler slots

**Expected Result:**
- ✅ API call: `GET /v1/locations/{id}/slots?vehicle_type=2wheeler&start_time=...&end_time=...`
- ✅ Redirected to SlotSelection_page.html
- ✅ Only 2-wheeler slots displayed
- ✅ Slot count matches API response

**Actual Result:**
- [ ] Pass / [ ] Fail
- 2W slots available: _______
- Notes: _______________________

---

#### TC-3.2: Slot Grid Display
**Steps:**
1. Verify slot grid layout on SlotSelection page

**Expected Result:**
- ✅ Slots displayed in 2D grid (10 columns)
- ✅ Color coding:
  - 🟢 Green: Available
  - 🔴 Red: Occupied
  - 🟡 Yellow: Reserved
- ✅ Hover shows slot details (zone, floor)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-3.3: Slot Booking
**Steps:**
1. Click an available green slot (e.g., Slot A-101)
2. Confirm booking in confirmation dialog
3. Wait for API response

**Expected Result:**
- ✅ API call: `POST /v1/bookings`
- ✅ Request body contains:
  ```json
  {
    "slot_id": 1,
    "start_time": "2025-12-17T10:00:00",
    "end_time": "2025-12-17T14:00:00",
    "vehicle_type": "2wheeler"
  }
  ```
- ✅ Response: `201 Created` with booking ID

**Actual Result:**
- [ ] Pass / [ ] Fail
- Booking ID: _______
- Notes: _______________________

---

### Test Suite 4: Booking Confirmation

#### TC-4.1: Confirmation Page Redirect
**Steps:**
1. After successful booking, verify redirect

**Expected Result:**
- ✅ Redirected to BookingConfirmation_page.html
- ✅ URL contains query parameters:
  - bookingId
  - locationName
  - slotNumber
  - zone
  - vehicleType
  - startTime
  - endTime
  - totalAmount

**Actual Result:**
- [ ] Pass / [ ] Fail
- URL: _______________________
- Notes: _______________________

---

#### TC-4.2: Confirmation Page Display
**Steps:**
1. Verify confirmation page content

**Expected Result:**
- ✅ Success checkmark animation plays
- ✅ Booking details displayed:
  - Booking ID
  - Location name
  - Slot number
  - Zone
  - Vehicle type (with emoji)
  - Start date/time
  - End date/time
  - Duration (hours)
  - Total cost
- ✅ Next steps section visible
- ✅ Action buttons present:
  - "Book Another Slot"
  - "Print Confirmation"

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-4.3: Print Functionality
**Steps:**
1. Click "Print Confirmation" button
2. Verify print dialog opens

**Expected Result:**
- ✅ Browser print dialog appears
- ✅ Print preview shows clean layout
- ✅ Unnecessary elements hidden (buttons, background)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test Suite 5: Error Handling

#### TC-5.1: Network Error Handling
**Steps:**
1. Stop backend container: `docker stop parkpulse_backend`
2. Try to fetch locations
3. Observe error handling

**Expected Result:**
- ✅ Error message displayed: "Failed to load parking locations"
- ✅ Loading spinner stops
- ✅ No console errors (handled gracefully)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-5.2: Double Booking Prevention
**Steps:**
1. Book Slot A-101 (10:00 AM - 2:00 PM)
2. Attempt to book same slot with overlapping time (12:00 PM - 4:00 PM)

**Expected Result:**
- ✅ Slot shows as "Reserved" (yellow)
- ✅ Not clickable
- ✅ Tooltip: "Slot not available for selected time"

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-5.3: Invalid Token Handling
**Steps:**
1. Manually delete JWT token from localStorage
2. Try to book a slot

**Expected Result:**
- ✅ API returns 401 Unauthorized
- ✅ User redirected to login page
- ✅ Message: "Please login to continue"

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test Suite 6: API Validation

#### TC-6.1: API Response Time
**Steps:**
1. Open browser DevTools → Network tab
2. Fetch locations API
3. Measure response time

**Expected Result:**
- ✅ Response time < 500ms
- ✅ Status: 200 OK
- ✅ Valid JSON response

**Actual Result:**
- Response time: _______ ms
- [ ] Pass (<500ms) / [ ] Fail
- Notes: _______________________

---

#### TC-6.2: Database Persistence
**Steps:**
1. Create a booking
2. Access pgAdmin (http://localhost:5050)
3. Query bookings table:
   ```sql
   SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Result:**
- ✅ Booking record exists
- ✅ Fields match:
  - user_id
  - slot_id
  - start_time, end_time
  - vehicle_type
  - total_amount
  - status = 'CONFIRMED'

**Actual Result:**
- [ ] Pass / [ ] Fail
- Record found: [ ] Yes / [ ] No
- Notes: _______________________

---

### Test Suite 7: UI/UX Validation

#### TC-7.1: Mobile Responsiveness
**Steps:**
1. Open DevTools → Toggle device toolbar
2. Test at breakpoints:
   - 375px (iPhone SE)
   - 768px (iPad)
   - 1024px (Desktop)

**Expected Result:**
- ✅ All pages responsive
- ✅ No horizontal scrolling
- ✅ Buttons accessible
- ✅ Text readable (no overflow)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Issues at: _______________________

---

#### TC-7.2: Loading States
**Steps:**
1. Throttle network (DevTools → Network → Slow 3G)
2. Fetch locations

**Expected Result:**
- ✅ Loading spinner visible
- ✅ Buttons disabled during load
- ✅ Spinner disappears after response

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

#### TC-7.3: Browser Compatibility
**Steps:**
1. Test on:
   - Chrome
   - Firefox
   - Edge
   - Safari (if available)

**Expected Result:**
- ✅ All features work across browsers
- ✅ Consistent UI rendering

**Actual Result:**
- Chrome: [ ] Pass / [ ] Fail
- Firefox: [ ] Pass / [ ] Fail
- Edge: [ ] Pass / [ ] Fail
- Safari: [ ] Pass / [ ] Fail

---

## 📊 Test Summary

### Test Execution Statistics
- Total Test Cases: 20
- Passed: _______
- Failed: _______
- Skipped: _______
- Pass Rate: _______% 

### Critical Issues Found
1. _______________________
2. _______________________
3. _______________________

### Non-Critical Issues
1. _______________________
2. _______________________

### Recommendations
1. _______________________
2. _______________________
3. _______________________

---

## 🔧 Automated Testing (Future)

### Unit Tests
```bash
# Backend API tests
docker exec parkpulse_backend pytest tests/ -v --cov=api
```

### Integration Tests
```bash
# Test database interactions
docker exec parkpulse_backend pytest tests/integration/ -v
```

### Load Testing (Apache Bench)
```bash
# Test 100 concurrent requests
ab -n 1000 -c 100 http://localhost:8000/v1/locations
```

---

## 📝 Test Log Template

**Tester:** _______________________  
**Date:** _______________________  
**Environment:** Development / Staging / Production  
**Browser:** _______________________  
**OS:** _______________________  

**Notes:**
_______________________
_______________________
_______________________

---

**Last Updated:** December 17, 2025  
**Version:** 1.0
