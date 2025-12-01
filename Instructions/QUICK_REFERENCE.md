# 📋 Quick Reference Guide

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000/pages/Landing_page.html | - |
| **Backend API** | http://localhost:8000/docs | - |
| **pgAdmin** | http://localhost:5050 | admin@parkpulse.com / admin123 |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Database** | localhost:5432 | parkpulse / parkpulse123 |

## Quick Start Commands

```bash
# Start everything
./quickstart.sh

# Start frontend only
cd frontend && python3 -m http.server 3000

# Stop frontend
pkill -f "http.server 3000"

# View Docker services
docker ps --filter "name=parkpulse"

# View backend logs
docker logs -f parkpulse_backend

# Access database CLI
docker exec -it parkpulse_db psql -U parkpulse -d parkpulse

# Restart backend
docker restart parkpulse_backend
```

## Database Access

### pgAdmin Setup:
1. Open http://localhost:5050
2. Login: admin@parkpulse.com / admin123
3. Add Server:
   - Name: ParkPulse Database
   - Host: `parkpulse_db`
   - Port: 5432
   - Database: parkpulse
   - User: parkpulse
   - Password: parkpulse123

## Common Issues & Solutions

### Port 3000 in use:
```bash
pkill -f "http.server 3000"
```

### Backend not responding:
```bash
docker restart parkpulse_backend
docker logs parkpulse_backend
```

### Database connection failed:
```bash
docker restart parkpulse_db
```

## File Locations

- **Frontend**: `frontend/pages/`
- **Styles**: `frontend/css/`
- **Scripts**: `frontend/js/`
- **Backend**: `backend/`
- **API Routes**: `backend/api/routes/`
- **Database Models**: `backend/models/models.py`

## Environment Setup

```bash
# Install Python packages (for VS Code IntelliSense)
pip install fastapi uvicorn sqlalchemy pydantic requests

# All runtime packages are in Docker containers
```

## Parking Locations

1. MG Road Parking
2. Forum Mall Parking - Konankunte
3. Nexus Mall - Koramangala
4. Indranagar Parking Lot
5. Phoenix Mall of Asia - Yelahanka
6. Garuda Mall - Jayanagar
7. Royal Meenakshi Mall - Bannerghatta Road
8. VegaCity - Bannerghatta Road
