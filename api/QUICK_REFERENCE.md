# ParkPulse API Quick Reference

## 🔑 Authentication Required
All endpoints except registration and login require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 API Summary

| Category | Endpoint Base | Description | Key Files |
|----------|--------------|-------------|-----------|
| 🔐 **Auth** | `/v1/auth` | Authentication & OAuth | `auth.py` |
| 👨‍💼 **Admin** | `/v1/admin` | Admin operations | `admin.py` |
| 📅 **Booking** | `/v1/bookings` | Parking reservations | `bookings.py` |
| 📍 **Location** | `/v1/locations` | Location services | `locations.py` |
| 🚗 **Parking** | `/v1/lots`, `/v1/owners` | Lot management | `lots.py`, `owners.py` |
| 💳 **Payment** | `/v1/payments` | Payment processing | `payments.py` |
| 👤 **User** | `/v1/users` | User management | `users.py` |
| 📊 **Analytics** | `/v1/predictions`, `/v1/occupancy`, `/v1/pricing` | AI & Analytics | `predictions.py`, `occupancy.py`, `pricing.py` |

## 🚀 Quick Start

1. **Register/Login**
   ```bash
   POST /v1/auth/register
   POST /v1/auth/login
   ```

2. **Search Parking**
   ```bash
   GET /v1/lots?lat=12.9716&lng=77.5946&radius=5
   ```

3. **Create Booking**
   ```bash
   POST /v1/bookings
   ```

4. **Process Payment**
   ```bash
   POST /v1/payments/create
   ```

## 📡 Real-time Features
- **WebSocket**: `ws://localhost:8000/ws/occupancy/{lot_id}`
- Real-time slot updates
- Occupancy monitoring

## 🔗 Links
- **API Docs**: http://localhost:8000/docs
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
