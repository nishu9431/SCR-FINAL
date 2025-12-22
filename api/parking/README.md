# Parking API

Parking lot and slot management.

## Endpoints

### GET `/v1/lots`
Search and list parking lots

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius
- `from_time`: Start time
- `to_time`: End time

### POST `/v1/lots`
Create new parking lot (Owner only)

### GET `/v1/lots/{lot_id}`
Get parking lot details

### PUT `/v1/lots/{lot_id}`
Update parking lot (Owner only)

### GET `/v1/lots/{lot_id}/slots`
Get available slots

### GET `/v1/owners/lots`
Get lots owned by current user

## Files:
- `lots.py` - Parking lot management
- `owners.py` - Lot owner operations

## Features:
- Real-time availability
- Vehicle type filtering
- Amenity information
- Dynamic pricing
- Owner dashboard
