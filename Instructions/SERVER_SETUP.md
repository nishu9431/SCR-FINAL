# 🚀 Server Setup & Deployment Guide

## Local Development Setup

### 1. Start All Services (Recommended)

```bash
./quickstart.sh
```

This script:
- Checks Docker installation
- Starts all Docker containers
- Initializes the database
- Displays service URLs

### 2. Manual Server Startup

#### Start Docker Services:
```bash
docker-compose up -d
```

#### Start Frontend Server:
```bash
cd frontend
python3 -m http.server 3000
```

Or from project root:
```bash
cd /Users/nishumackbookair/Desktop/SMART_PARKING/frontend && python3 -m http.server 3000 &
```

### 3. Stop Services

#### Stop Frontend:
```bash
pkill -f "http.server 3000"
```

#### Stop Docker Services:
```bash
docker-compose down
```

#### Stop and Remove Volumes (Clean Reset):
```bash
docker-compose down -v
```

## Verify Services are Running

### Check All Services:
```bash
docker ps --filter "name=parkpulse"
```

### Check Specific Ports:
```bash
# Frontend
lsof -i :3000

# Backend API
lsof -i :8000

# Database
lsof -i :5432

# pgAdmin
lsof -i :5050
```

### Check Service Health:
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
docker exec parkpulse_db pg_isready -U parkpulse
```

## Server Configuration

### Frontend Server (Python HTTP)

**Port**: 3000  
**Directory**: `/frontend`  
**Command**: `python3 -m http.server 3000`

Alternative servers:
```bash
# Using Node.js
npx http-server frontend -p 3000

# Using PHP
php -S localhost:3000 -t frontend
```

### Backend Server (FastAPI)

**Port**: 8000  
**Framework**: FastAPI + Uvicorn  
**Container**: parkpulse_backend  
**Auto-reload**: Enabled in development

View logs:
```bash
docker logs -f parkpulse_backend
```

Restart backend:
```bash
docker restart parkpulse_backend
```

## Database Server Setup

### PostgreSQL Configuration

**Container**: parkpulse_db  
**Image**: postgres:15-alpine  
**Port**: 5432  
**Data Volume**: smart_parking_postgres_data

Initialize/Reset Database:
```bash
docker exec parkpulse_backend python init_db.py
```

### Accessing Database Server

**Option 1 - pgAdmin** (Recommended):
- Open http://localhost:5050
- Login with admin@parkpulse.com / admin123
- Register server with host: `parkpulse_db`

**Option 2 - Command Line**:
```bash
docker exec -it parkpulse_db psql -U parkpulse -d parkpulse
```

**Option 3 - External Client** (DBeaver, TablePlus, etc.):
- Host: localhost
- Port: 5432
- Database: parkpulse
- User: parkpulse
- Password: parkpulse123

## Production Deployment

### 1. Update Environment Variables

```bash
cp .env.example .env
# Edit .env with production values
```

Key changes:
- Set strong `SECRET_KEY`
- Use production database credentials
- Configure email settings
- Set `DEBUG=False`

### 2. Build Production Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 3. Deploy to Cloud

#### AWS EC2:
```bash
# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Clone repository
git clone https://github.com/nishu9431/SCR-repo.git
cd SCR-repo

# Start services
docker-compose up -d
```

#### Digital Ocean / Linode:
```bash
# Use Docker droplet
git clone https://github.com/nishu9431/SCR-repo.git
cd SCR-repo
docker-compose up -d
```

### 4. Use Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name parkpulse.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }

    location /pgadmin {
        proxy_pass http://localhost:5050;
    }
}
```

### 5. Enable SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d parkpulse.com
```

## Troubleshooting

### Frontend Not Loading:
```bash
# Kill existing server
pkill -f "http.server 3000"

# Restart
cd frontend && python3 -m http.server 3000
```

### Backend Not Responding:
```bash
# Check logs
docker logs parkpulse_backend

# Restart
docker restart parkpulse_backend
```

### Database Connection Failed:
```bash
# Check if running
docker ps | grep parkpulse_db

# Check logs
docker logs parkpulse_db

# Restart
docker restart parkpulse_db
```

### Port Already in Use:
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Find process using port 8000
lsof -ti:8000 | xargs kill -9
```

## Server Monitoring

### View All Logs:
```bash
docker-compose logs -f
```

### View Specific Service:
```bash
docker logs -f parkpulse_backend
docker logs -f parkpulse_db
docker logs -f parkpulse_pgadmin
```

### Monitor Resources:
```bash
docker stats
```
