# 🔐 Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click on project dropdown → "New Project"
   - Name: "ParkPulse" or any name you prefer
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   
5. **Configure OAuth Consent Screen** (if prompted)
   - User Type: External
   - App name: ParkPulse
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Add `email`, `profile`, `openid`
   - Test users: Add your Gmail address
   - Click "Save and Continue"

6. **Create OAuth Client ID**
   - Application type: **Web application**
   - Name: ParkPulse Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:8000`
   - **Authorized redirect URIs:**
     - `http://localhost:8000/v1/auth/google/callback`
   - Click "Create"

7. **Save Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**

## Step 2: Update Backend Configuration

1. **Open `.env` file** (or create one from `.env.example`)
   ```bash
   cd /Users/nishumackbookair/Desktop/SMART_PARKING
   nano .env
   ```

2. **Add Google OAuth credentials:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:8000/v1/auth/google/callback
   ```

3. **Save and exit** (Ctrl+O, Enter, Ctrl+X)

## Step 3: Install Required Python Package

The backend needs the `requests` library (should already be installed):

```bash
# Check if it's in requirements.txt
grep requests backend/requirements.txt

# If not, add it manually or rebuild Docker
docker-compose restart backend
```

## Step 4: Restart Backend

```bash
cd /Users/nishumackbookair/Desktop/SMART_PARKING
docker-compose restart backend
```

## Step 5: Test Google Login

1. Open: http://localhost:3000/pages/Login_page.html
2. Click **"Continue with Google"** button
3. You'll be redirected to Google's login page
4. Sign in with your Google account
5. Grant permissions
6. You'll be redirected back and logged in automatically

## How It Works

### Backend Flow:
1. `/v1/auth/google` - Returns Google OAuth URL
2. User clicks → Redirected to Google
3. Google authenticates user
4. Google redirects to `/v1/auth/google/callback?code=...`
5. Backend exchanges code for access token
6. Backend gets user info from Google
7. Backend creates or finds user in database
8. Backend returns JWT token
9. Frontend stores token and redirects to Booking page

### Frontend Flow:
```javascript
// When "Continue with Google" is clicked:
loginWithGoogle() {
  fetch("http://localhost:8000/v1/auth/google")
    .then(data => window.location.href = data.url)
}

// On callback:
if (code in URL) {
  fetch("http://localhost:8000/v1/auth/google/callback?code=" + code)
    .then(data => {
      localStorage.setItem('access_token', data.access_token)
      redirect to Booking page
    })
}
```

## Security Notes

⚠️ **Important for Production:**

1. **Change Redirect URIs** to your production domain:
   ```
   https://yourapp.com/v1/auth/google/callback
   ```

2. **Update authorized origins:**
   ```
   https://yourapp.com
   ```

3. **Use environment variables** - Never commit credentials to Git

4. **Enable HTTPS** - Google requires HTTPS for production

5. **Complete OAuth consent screen** verification for production

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that redirect URI in Google Console matches exactly:
  `http://localhost:8000/v1/auth/google/callback`

### Error: "Access blocked"
- Make sure you added your email as a test user in OAuth consent screen

### Error: "Failed to get access token"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that Google+ API is enabled

### Error: "CORS error"
- Make sure `http://localhost:3000` is in authorized origins
- Restart backend after adding credentials

## Testing Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth Client ID
- [ ] Added redirect URI: `http://localhost:8000/v1/auth/google/callback`
- [ ] Added JavaScript origin: `http://localhost:3000`
- [ ] Added credentials to `.env` file
- [ ] Restarted backend container
- [ ] Tested "Continue with Google" button
- [ ] Successfully logged in with Google account
- [ ] Redirected to Booking page after login

## Quick Commands

```bash
# View current environment variables
cat .env | grep GOOGLE

# Restart backend
docker-compose restart backend

# View backend logs
docker logs -f parkpulse_backend

# Test Google OAuth endpoint
curl http://localhost:8000/v1/auth/google
```

## Support

If you encounter issues:
1. Check backend logs: `docker logs -f parkpulse_backend`
2. Check browser console for JavaScript errors
3. Verify Google Cloud Console settings
4. Ensure all URLs match exactly (including http/https)
