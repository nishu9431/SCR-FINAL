# Booking API

Parking booking and reservation management.

## Endpoints

### POST `/v1/bookings`
Create a new booking

### GET `/v1/bookings`
Get user's booking history

### GET `/v1/bookings/{booking_id}`
Get specific booking details

### PUT `/v1/bookings/{booking_id}`
Modify existing booking

### DELETE `/v1/bookings/{booking_id}`
Cancel booking

## File: `bookings.py`
- Real-time slot validation
- Booking lifecycle management
- Payment integration
