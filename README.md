# 🅿️ ParkPulse - Smart Parking Platform

Real-time parking availability system for Bengaluru with 9 major parking locations.

## 📁 Project Structure

```
SMART_PARKING/
├── frontend/           # Frontend application
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── pages/         # HTML pages
├── backend/           # FastAPI backend service
├── docker-compose.yml # Docker services configuration
├── quickstart.sh      # Quick start script
└── .env.example       # Environment variables template
```

## 🚀 Quick Start

1. **Start all Docker services:**
   ```bash
   docker-compose up -d
   ```

2. **Or use the quickstart script:**
   ```bash
   ./quickstart.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000/pages/Landing_page.html
   - Booking: http://localhost:3000/pages/Booking_page.html
   - API Docs: http://localhost:8000/docs
   - Database: http://localhost:5050

## 🏗️ Services

- **Frontend**: Python HTTP server (Port 3000)
- **Backend API**: FastAPI (Port 8000)
- **Database**: PostgreSQL (Port 5432)
- **pgAdmin**: Database management (Port 5050)

## 🅿️ Parking Locations

1. MG Road Parking
2. Forum Mall Parking - Konankunte
3. Nexus Mall - Koramangala
4. Indranagar Parking Lot
5. Phoenix Mall of Asia - Yelahanka
6. Garuda Mall - Jayanagar
7. Royal Meenakshi Mall - Bannerghatta Road
8. VegaCity - Bannerghatta Road
9. BMSIT College

## 🔐 Database Credentials

- **pgAdmin**: admin@parkpulse.io / admin
- **Database**: parkpulse / parkpulse123

