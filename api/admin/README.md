# Admin API

Admin dashboard and management endpoints.

## Endpoints

### GET `/v1/admin/dashboard`
Get admin dashboard statistics

### GET `/v1/admin/users`
List all users with pagination

### PUT `/v1/admin/users/{user_id}`
Update user details or role

### DELETE `/v1/admin/users/{user_id}`
Delete/deactivate user

## File: `admin.py`
- Requires ADMIN role
- Full CRUD operations
- User management
