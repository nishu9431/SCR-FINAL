# Analytics API

Analytics, predictions, and dynamic pricing.

## Endpoints

### GET `/v1/predictions/occupancy`
Predict parking occupancy

**Query Parameters:**
- `lot_id`: Parking lot ID
- `timestamp`: Future timestamp

### GET `/v1/occupancy/realtime`
Get real-time occupancy data

### GET `/v1/occupancy/history`
Get historical occupancy data

### GET `/v1/pricing/calculate`
Calculate dynamic price

**Query Parameters:**
- `lot_id`: Parking lot ID
- `start_time`: Start time
- `end_time`: End time
- `vehicle_type`: Type of vehicle

### GET `/v1/pricing/trends`
Get pricing trends

### GET `/v1/analytics/revenue`
Revenue analytics

### GET `/v1/analytics/usage`
Usage statistics

## Files:
- `predictions.py` - ML-based predictions
- `occupancy.py` - Real-time occupancy tracking
- `pricing.py` - Dynamic pricing engine

## Features:
- Machine learning predictions
- Real-time WebSocket updates
- Historical data analysis
- Revenue forecasting
- Demand-based pricing
- TimescaleDB integration
