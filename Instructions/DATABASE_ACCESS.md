# 🗄️ Database Access Guide

## pgAdmin Access

### 1. **Access pgAdmin Web Interface**
- **URL**: http://localhost:5050
- **Email**: admin@parkpulse.com
- **Password**: admin123

### 2. **Create Server Connection in pgAdmin**

After logging into pgAdmin:

1. Click **"Add New Server"** or right-click **Servers** → **Register** → **Server**

2. **General Tab**:
   - **Name**: ParkPulse Database

3. **Connection Tab**:
   - **Host name/address**: `parkpulse_db` (or `localhost`)
   - **Port**: `5432`
   - **Maintenance database**: `parkpulse`
   - **Username**: `parkpulse`
   - **Password**: `parkpulse123`
   - ✅ Check **"Save password"**

4. Click **Save**

### 3. **View Data**

Navigate to:
```
Servers → ParkPulse Database → Databases → parkpulse → Schemas → public → Tables
```

Right-click any table (e.g., `users`) → **View/Edit Data** → **All Rows**

## Direct Database Access

### Using Docker CLI:
```bash
docker exec -it parkpulse_db psql -U parkpulse -d parkpulse
```

### Common SQL Commands:
```sql
-- List all tables
\dt

-- View all users
SELECT * FROM users;

-- View all bookings
SELECT * FROM bookings;

-- View parking lots
SELECT * FROM parking_lots;

-- Exit
\q
```

## Database Credentials Summary

| Service | URL/Host | Username | Password |
|---------|----------|----------|----------|
| **pgAdmin** | http://localhost:5050 | admin@parkpulse.com | admin123 |
| **PostgreSQL** | localhost:5432 | parkpulse | parkpulse123 |
| **Database Name** | - | parkpulse | - |

## Data Storage Location

### macOS (Docker Desktop):
- **Physical Location**: `~/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw`
- **Logical Path** (inside VM): `/var/lib/docker/volumes/smart_parking_postgres_data/_data`
- **Access Method**: Only accessible through Docker commands or pgAdmin

### View Docker Volume:
```bash
docker volume inspect smart_parking_postgres_data
```

## Current Database Users

The system has **8 registered users** including:
- ravi@gmail.com
- tushar@gmail.com
- (and 6 others)

## Backup Database

```bash
docker exec parkpulse_db pg_dump -U parkpulse parkpulse > backup.sql
```

## Restore Database

```bash
docker exec -i parkpulse_db psql -U parkpulse parkpulse < backup.sql
```
