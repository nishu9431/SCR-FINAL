# 🔐 System Credentials & Configuration

## Service Credentials

### pgAdmin (Database Management)
- **URL**: http://localhost:5050
- **Email**: admin@parkpulse.com
- **Password**: admin123

### PostgreSQL Database
- **Host**: localhost (or `parkpulse_db` inside Docker)
- **Port**: 5432
- **Database**: parkpulse
- **Username**: parkpulse
- **Password**: parkpulse123

### Grafana (Monitoring)
- **URL**: http://localhost:3001
- **Username**: admin
- **Password**: admin (change on first login)

### Backend API
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Interactive Docs**: http://localhost:8000/redoc

### Frontend Application
- **URL**: http://localhost:3000
- **Landing Page**: http://localhost:3000/pages/Landing_page.html
- **Booking Page**: http://localhost:3000/pages/Booking_page.html
- **Login**: http://localhost:3000/pages/Login_page.html
- **Signup**: http://localhost:3000/pages/Signup_page.html

## Email Configuration (Backend)

Located in `backend/core/config.py`:

```python
MAIL_USERNAME = "your-email@gmail.com"
MAIL_PASSWORD = "your-app-password"
MAIL_FROM = "noreply@parkpulse.com"
MAIL_PORT = 587
MAIL_SERVER = "smtp.gmail.com"
MAIL_TLS = True
MAIL_SSL = False
```

### Setting Up Gmail for Email:
1. Enable 2-Factor Authentication in Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env` file with credentials

## Docker Services Ports

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| Backend API | 8000 | 8000 |
| PostgreSQL | 5432 | 5432 |
| pgAdmin | 80 | 5050 |
| Grafana | 3000 | 3001 |
| Redis | 6379 | 6379 |
| TimescaleDB | 5432 | 5433 |
| Prometheus | 9090 | 9090 |

## Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Key variables:
```env
DATABASE_URL=postgresql://parkpulse:parkpulse123@parkpulse_db:5432/parkpulse
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://parkpulse_redis:6379
```

## API Authentication

### JWT Token Configuration:
- **Algorithm**: HS256
- **Expiry**: 30 days
- **Secret Key**: Defined in environment variables

### Test User Credentials:
- **Email**: ravi@gmail.com
- **Password**: (hashed in database)
- **Email**: tushar@gmail.com
- **Password**: (hashed in database)

## Server Connection Strings

### PostgreSQL Connection String:
```
postgresql://parkpulse:parkpulse123@localhost:5432/parkpulse
```

### Redis Connection String:
```
redis://localhost:6379
```

### TimescaleDB Connection String:
```
postgresql://parkpulse:parkpulse123@localhost:5433/parkpulse
```

## Security Notes

⚠️ **Important**: These are development credentials. For production:
1. Change all default passwords
2. Use strong, unique passwords
3. Store credentials in secure environment variables
4. Enable SSL/TLS for all connections
5. Use secrets management (e.g., AWS Secrets Manager, HashiCorp Vault)
6. Never commit `.env` file to git (already in `.gitignore`)
