# Authentication API

Handles user authentication, registration, and OAuth integration.

## Endpoints

### POST `/v1/auth/register`
Register a new user

### POST `/v1/auth/login`
Login with email and password

### GET `/v1/auth/google`
Initiate Google OAuth login

### GET `/v1/auth/google/callback`
Google OAuth callback endpoint

## File: `auth.py`
- JWT token generation
- Password hashing
- Google OAuth integration
