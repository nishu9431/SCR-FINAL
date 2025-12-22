# ParkPulse API Directory Structure

```
SMART_PARKING/
│
├── apis/                                    # 📁 Organized API Documentation
│   ├── README.md                           # Main API documentation
│   ├── QUICK_REFERENCE.md                  # Quick API reference guide
│   │
│   ├── auth/                               # 🔐 Authentication APIs
│   │   ├── README.md
│   │   └── auth.py                         # Login, Register, OAuth
│   │
│   ├── admin/                              # 👨‍💼 Admin Management APIs
│   │   ├── README.md
│   │   └── admin.py                        # Dashboard, User management
│   │
│   ├── booking/                            # 📅 Booking APIs
│   │   ├── README.md
│   │   └── bookings.py                     # Create, View, Cancel bookings
│   │
│   ├── location/                           # 📍 Location APIs
│   │   ├── README.md
│   │   └── locations.py                    # Search, Nearby locations
│   │
│   ├── parking/                            # 🚗 Parking Management APIs
│   │   ├── README.md
│   │   ├── lots.py                         # Parking lot CRUD
│   │   └── owners.py                       # Owner operations
│   │
│   ├── payment/                            # 💳 Payment APIs
│   │   ├── README.md
│   │   └── payments.py                     # Payment processing
│   │
│   ├── user/                               # 👤 User Profile APIs
│   │   ├── README.md
│   │   └── users.py                        # Profile, Vehicles
│   │
│   └── analytics/                          # 📊 Analytics & AI APIs
│       ├── README.md
│       ├── predictions.py                  # ML predictions
│       ├── occupancy.py                    # Real-time tracking
│       └── pricing.py                      # Dynamic pricing
│
├── backend/                                # 🔧 Backend Application
│   ├── main.py                            # FastAPI app entry point
│   ├── requirements.txt                   # Python dependencies
│   │
│   ├── api/routes/                        # Original API routes (active)
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── bookings.py
│   │   ├── locations.py
│   │   ├── lots.py
│   │   ├── owners.py
│   │   ├── payments.py
│   │   ├── users.py
│   │   ├── predictions.py
│   │   ├── occupancy.py
│   │   └── pricing.py
│   │
│   ├── core/                              # Core configurations
│   │   ├── config.py                      # App settings
│   │   ├── database.py                    # DB connection
│   │   └── websocket_manager.py           # WebSocket handler
│   │
│   ├── models/                            # Database models
│   │   └── models.py                      # SQLAlchemy models
│   │
│   ├── schemas/                           # Pydantic schemas
│   │   └── schemas.py                     # Request/Response models
│   │
│   ├── services/                          # Business logic
│   │   ├── ml_data_service.py
│   │   ├── prediction_service.py
│   │   ├── pricing_service.py
│   │   ├── rbac_service.py
│   │   ├── realtime_service.py
│   │   ├── recommendation_service.py
│   │   ├── timescale_service.py
│   │   └── waitlist_service.py
│   │
│   └── ml_models/                         # ML models & data
│       └── base_prices.json
│
└── frontend/                               # 🎨 Frontend Application
    ├── index.html                         # Landing redirect
    │
    ├── pages/                             # HTML pages
    │   ├── Landing_page.html
    │   ├── Booking_page.html
    │   ├── Login_page.html
    │   ├── Signup_page.html
    │   ├── SlotSelection_page.html
    │   ├── BookingConfirmation_page.html
    │   ├── Admin_Login.html
    │   └── Admin_Dashboard.html
    │
    ├── css/                               # Stylesheets
    │   ├── Booking_page.css
    │   ├── Login_page.css
    │   ├── Signup.css
    │   ├── Admin_Dashboard.css
    │   └── ...
    │
    └── js/                                # JavaScript files
        ├── Booking_page.js
        ├── Admin_Dashboard.js
        ├── Signup.js
        └── utils.js
```

## 📝 Notes

- **`/apis/`** folder contains organized API documentation and copies of API files for reference
- **`/backend/api/routes/`** contains the actual working API files used by the application
- All API endpoints are accessible through the FastAPI app at `http://localhost:8000/v1`
- Documentation is auto-generated at `http://localhost:8000/docs`

## 🔄 Workflow

1. Backend serves APIs from `/backend/api/routes/`
2. Frontend consumes APIs from JavaScript files
3. `/apis/` folder provides organized documentation and reference
