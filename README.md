# 🅿️ ParkPulse - Smart Parking Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg)](https://www.docker.com/)

An intelligent, real-time parking management system leveraging IoT architecture and microservices to optimize urban parking utilization. Built with FastAPI, PostgreSQL, and Docker.

## 🌟 Features

- **Real-Time Availability**: Live parking slot status across multiple locations
- **Vehicle-Type Specific Booking**: Separate slots for 2-wheelers, 4-wheelers, and commercial vehicles
- **Time-Based Reservations**: Book parking slots with specific start and end times
- **Smart Slot Allocation**: Prevents booking conflicts through temporal overlap detection
- **Dynamic Pricing**: Vehicle-type specific pricing (₹40/₹60/₹50 per hour)
- **Interactive Slot Selection**: Visual 2D grid interface for choosing parking spots
- **Dual Authentication**: JWT tokens + Google OAuth 2.0 integration
- **Responsive Design**: Mobile-friendly interface for on-the-go bookings
- **Docker Containerization**: Consistent deployment across environments
- **RESTful APIs**: Standard interfaces for third-party integrations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 3000)                      │
│         HTML5 + CSS3 + JavaScript (Vanilla)                 │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST (JSON)
┌────────────────────▼────────────────────────────────────────┐
│                 Backend API (Port 8000)                      │
│          FastAPI + Python 3.11 + Uvicorn                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │  Locations   │  │   Bookings   │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────┬──────────────────┬────────────────────┬────────────┘
        │                  │                    │
┌───────▼──────────┐  ┌───▼──────────┐  ┌──────▼─────────┐
│   PostgreSQL     │  │ TimescaleDB  │  │     Redis      │
│  (Port 5432)     │  │  (Port 5433) │  │  (Port 6379)   │
│                  │  │              │  │                │
│ • users          │  │ • occupancy  │  │ • Sessions     │
│ • parking_lots   │  │   _logs      │  │ • Cache        │
│ • parking_slots  │  │ • predictions│  │                │
│ • bookings       │  │              │  │                │
│ • payments       │  │              │  │                │
└──────────────────┘  └──────────────┘  └────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker** 24.0+ and **Docker Compose**
- **Git** for cloning the repository
- **Modern Web Browser** (Chrome, Firefox, Edge)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nishu9431/SCR-FINAL.git
   cd SCR-FINAL
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Key environment variables:
   ```env
   DATABASE_URL=postgresql://parkpulse:parkpulse123@db:5432/parkpulse
   SECRET_KEY=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-secret
   ```

3. **Build and Start Services**
   ```bash
   docker-compose up --build -d
   ```

4. **Initialize Database**
   ```bash
   docker exec parkpulse_backend python -c "from core.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

5. **Seed Sample Data** (8 Bangalore Locations)
   ```bash
   docker exec parkpulse_backend python seed_vehicle_data.py
   ```

6. **Access the Application**
   - **Frontend**: http://localhost:3000/pages/Landing_page.html
   - **API Documentation**: http://localhost:8000/docs
   - **pgAdmin**: http://localhost:5050
     - Email: `admin@parkpulse.io`
     - Password: `admin`

## 📁 Project Structure

```
SCR-FINAL/
├── backend/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py           # Authentication endpoints
│   │       ├── locations.py      # Parking location APIs
│   │       ├── bookings.py       # Booking management
│   │       ├── users.py          # User management
│   │       └── payments.py       # Payment processing
│   ├── core/
│   │   ├── database.py           # Database configuration
│   │   ├── security.py           # JWT & OAuth utilities
│   │   └── config.py             # App configuration
│   ├── models/
│   │   └── models.py             # SQLAlchemy models
│   ├── main.py                   # FastAPI application entry
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Backend container image
├── frontend/
│   ├── pages/
│   │   ├── Landing_page.html     # Home page
│   │   ├── Login_page.html       # User login
│   │   ├── Signup_page.html      # User registration
│   │   ├── Booking_page.html     # Location selection
│   │   ├── SlotSelection_page.html      # Slot grid view
│   │   └── BookingConfirmation_page.html # Success page
│   ├── css/                      # Stylesheets
│   ├── js/                       # JavaScript modules
│   └── Dockerfile                # Frontend container image
├── docker-compose.yml            # Service orchestration
├── seed_vehicle_data.py          # Sample data generator
└── README.md                     # This file
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/signup` | Create new user account |
| POST | `/v1/auth/login` | Login with credentials |
| GET | `/v1/auth/google` | Google OAuth redirect |
| GET | `/v1/auth/google/callback` | OAuth callback handler |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/locations` | Get all parking locations with availability |
| GET | `/v1/locations/{id}/slots` | Get available slots for location |

**Query Parameters:**
- `start_time`: ISO 8601 datetime (e.g., `2025-12-17T10:00:00`)
- `end_time`: ISO 8601 datetime
- `vehicle_type`: `2wheeler`, `4wheeler`, or `others`

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/bookings` | Create new booking |
| GET | `/v1/bookings` | Get user's bookings |
| GET | `/v1/bookings/{id}` | Get booking details |
| DELETE | `/v1/bookings/{id}` | Cancel booking |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/users/me` | Get current user profile |
| PUT | `/v1/users/me` | Update user profile |

## 📊 Database Schema

### Key Tables

**users**
- id, email, hashed_password, name, phone
- role (user/admin/owner), is_active, created_at

**parking_lots**
- id, name, address, latitude, longitude
- total_slots, available_slots
- **vehicle_pricing** (JSON: `{"2wheeler": 40, "4wheeler": 60, "others": 50}`)
- amenities, rating, operating_hours

**parking_slots**
- id, lot_id, slot_number, zone, floor
- **vehicle_type** (`2wheeler`, `4wheeler`, `others`)
- status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE)

**bookings**
- id, user_id, slot_id
- start_time, end_time, **vehicle_type**
- total_amount, status (PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED)

## 🅿️ Parking Locations

1. **MG Road Parking** - Commercial District
2. **Forum Mall Parking** - Konankunte
3. **Nexus Mall** - Koramangala
4. **Indranagar Parking Lot** - East Bangalore
5. **Phoenix Mall of Asia** - Yelahanka
6. **Garuda Mall** - Jayanagar
7. **Royal Meenakshi Mall** - Bannerghatta Road
8. **VegaCity** - Bannerghatta Road

*Total Slots: 306 (152 2-wheelers, 114 4-wheelers, 40 commercial)*

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.11
- **ORM**: SQLAlchemy 2.0
- **Authentication**: PyJWT, python-jose, bcrypt
- **Server**: Uvicorn (ASGI)

### Database
- **Primary DB**: PostgreSQL 15
- **Time-Series**: TimescaleDB (extension)
- **Caching**: Redis 7
- **Admin Tool**: pgAdmin 4

### Frontend
- **Markup**: HTML5 with semantic tags
- **Styling**: CSS3 (Flexbox, Grid, Animations)
- **Scripting**: Vanilla JavaScript (ES6+)
- **Icons**: Lucide Icons
- **HTTP Client**: Fetch API

### Infrastructure
- **Containerization**: Docker 24.0
- **Orchestration**: Docker Compose
- **Version Control**: Git + GitHub

## 🔐 Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Tokens**: HS256 algorithm, 24-hour expiry
- **OAuth 2.0**: Google authentication integration
- **SQL Injection Prevention**: Parameterized queries via SQLAlchemy
- **CORS**: Configured for localhost:3000 and production domains
- **Input Validation**: Pydantic models for request/response validation

## 🔐 Database Credentials

- **pgAdmin**: admin@parkpulse.io / admin
- **Database**: parkpulse / parkpulse123

