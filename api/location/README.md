# Location API

Location and address management for parking lots.

## Endpoints

### GET `/v1/locations`
Get all locations

### GET `/v1/locations/search`
Search locations by name or address

**Query Parameters:**
- `q`: Search query
- `lat`: Latitude (optional)
- `lng`: Longitude (optional)
- `radius`: Search radius in km

### GET `/v1/locations/{location_id}`
Get specific location details

### GET `/v1/locations/nearby`
Get nearby parking locations

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius (default: 5km)

## File: `locations.py`
- Geolocation services
- Distance calculations
- Address parsing
- Map integration
