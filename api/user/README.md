# User API

User profile and account management.

## Endpoints

### GET `/v1/users/me`
Get current user profile

**Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "DRIVER",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### PUT `/v1/users/me`
Update user profile

### GET `/v1/users/{user_id}`
Get specific user details

### PUT `/v1/users/me/password`
Change password

### POST `/v1/users/me/vehicles`
Add vehicle information

### GET `/v1/users/me/vehicles`
Get user's vehicles

### PUT `/v1/users/me/preferences`
Update user preferences

## File: `users.py`

## Features:
- Profile management
- Vehicle registration
- Notification preferences
- Privacy settings
- Account deletion
