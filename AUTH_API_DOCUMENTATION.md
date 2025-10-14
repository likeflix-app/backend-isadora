# Authentication API Documentation

## Overview

This document covers all authentication-related endpoints including login, registration, and password recovery.

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255),                    -- bcrypt hashed
  role VARCHAR(50) DEFAULT 'user',          -- 'user' or 'admin'
  mobile VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT true,
  reset_token VARCHAR(255),                 -- Password reset token
  reset_token_expiry TIMESTAMP              -- Token expiration time
);
```

**Indexes:**
- `idx_users_email` - For fast email lookup
- `idx_users_role` - For role-based queries

---

## API Endpoints

### 1. User Login

**POST** `/api/auth/login`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "emailVerified": true
    }
  }
}
```

**Error Responses:**

Missing Fields (400):
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

Invalid Credentials (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 2. User Registration

**POST** `/api/auth/register`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Doe",
  "mobile": "+39 123 456 7890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "newuser@example.com",
      "name": "Jane Doe",
      "role": "user",
      "emailVerified": true
    }
  }
}
```

**Error Responses:**

User Already Exists (409):
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

Missing Fields (400):
```json
{
  "success": false,
  "message": "Email, password, and name are required"
}
```

---

### 3. Request Password Reset (Forgot Password)

**POST** `/api/auth/forgot-password`

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

When EmailJS is configured:
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

When EmailJS is NOT configured (Development Mode):
```json
{
  "success": true,
  "message": "Password reset token generated (email not configured)",
  "resetToken": "a1b2c3d4e5f6789...",
  "resetUrl": "http://localhost:8084/reset-password?token=a1b2c3d4e5f6789..."
}
```

**Error Response:**

Missing Email (400):
```json
{
  "success": false,
  "message": "Email is required"
}
```

**Security Notes:**
- The API **never reveals** whether an email exists in the system
- Reset tokens expire after **1 hour**
- Tokens are **cryptographically secure** (32 random bytes)

---

### 4. Reset Password

**POST** `/api/auth/reset-password`

**Authentication:** None (uses token from forgot-password)

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**

Invalid/Expired Token (400):
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

Password Too Short (400):
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

Missing Fields (400):
```json
{
  "success": false,
  "message": "Token and new password are required"
}
```

---

### 5. Get Current User Info

**GET** `/api/auth/me`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "emailVerified": true
  }
}
```

**Error Response:**

No Token (401):
```json
{
  "success": false,
  "message": "Access token required"
}
```

Invalid Token (403):
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

## Password Recovery Flow

### Complete Flow Diagram

```
1. User clicks "Forgot Password"
   ↓
2. Frontend sends POST /api/auth/forgot-password with email
   ↓
3. Backend generates secure reset token and saves to database
   ↓
4. Backend sends email via EmailJS with reset link
   ↓
5. User clicks link in email (or uses token in dev mode)
   ↓
6. Frontend displays reset password form with token from URL
   ↓
7. User enters new password
   ↓
8. Frontend sends POST /api/auth/reset-password with token and new password
   ↓
9. Backend validates token (not expired, exists in DB)
   ↓
10. Backend updates password and clears reset token
   ↓
11. User can now login with new password
```

### Token Lifecycle

1. **Generation**: `crypto.randomBytes(32).toString('hex')` - 64 character hex string
2. **Storage**: Saved in `users.reset_token` with expiry in `users.reset_token_expiry`
3. **Expiration**: 1 hour from generation
4. **Usage**: One-time use - cleared after successful password reset
5. **Validation**: Must exist in DB and not be expired

---

## Email Configuration

### Using EmailJS (Current Setup)

Add these variables to your `.env`:

```env
EMAILJS_SERVICE_ID=service_jtqfr53
EMAILJS_TEMPLATE_ID=template_ykfa7k8
EMAILJS_PUBLIC_KEY=5ybDuVhMamekjsSX2
```

**EmailJS Template Parameters:**
- `to_email` - Recipient email
- `to_name` or `user_name` - User's name
- `reset_url` - Complete reset URL with token
- `reset_token` - The token itself (optional)

For detailed EmailJS setup, see `EMAILJS_SETUP_GUIDE.md`.

### Development Mode (No Email)

If EmailJS credentials are not configured:
- Reset token is returned in the API response
- Reset URL is provided for easy testing
- Check server logs for token information

---

## Authentication & Authorization

### JWT Tokens

Tokens are generated during login and include:
- User ID
- Email
- Role (user/admin)
- Expiration (24 hours)

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItdXVpZCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk2NjY2NjY2LCJleHAiOjE2OTY3NTMwNjZ9.signature
```

### User Roles

**user** (default):
- Can access their own data
- Can create bookings
- Can submit talent applications

**admin**:
- All user permissions
- Can manage all users
- Can approve/reject talent applications
- Can view all bookings
- Can update booking statuses

### Protected Endpoints

Endpoints requiring authentication will return:

```json
{
  "success": false,
  "message": "Access token required"
}
```

Admin-only endpoints will return:

```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## Security Best Practices

### Password Requirements
- Minimum 6 characters (enforced on registration and reset)
- Passwords are hashed with bcrypt (salt rounds: 10)
- Never stored or transmitted in plain text

### Reset Token Security
- ✅ Cryptographically secure random generation
- ✅ Time-limited (1 hour expiration)
- ✅ One-time use (cleared after reset)
- ✅ No user enumeration (same response for all emails)
- ✅ Validated against database before use

### JWT Security
- ✅ Signed with secret key
- ✅ 24-hour expiration
- ✅ Contains minimal user data
- ✅ Validated on every protected request

### Recommendations for Production
1. Use HTTPS for all requests
2. Implement rate limiting on auth endpoints
3. Add CAPTCHA to prevent automated attacks
4. Monitor for suspicious password reset activity
5. Consider 2FA for sensitive accounts
6. Use environment-specific JWT secrets
7. Implement password strength requirements

---

## Error Handling

### Common Error Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 400 | Bad Request | Missing required fields, invalid input |
| 401 | Unauthorized | No token provided, user not found |
| 403 | Forbidden | Invalid token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | User already exists |
| 500 | Server Error | Database error, email sending failed |

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error (development only)"
}
```

---

## Testing

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'
```

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123","name":"New User"}'
```

**Forgot Password:**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'
```

**Reset Password:**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_RESET_TOKEN","newPassword":"newpassword123"}'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Related Documentation

- **EmailJS Setup:** See `EMAILJS_SETUP_GUIDE.md`
- **Frontend Integration:** See `PASSWORD_RECOVERY_GUIDE.md`
- **Booking API:** See `BOOKING_API_DOCUMENTATION.md`
- **General API:** See server logs on startup for all endpoints

---

## Changelog

### v1.1.0 - Password Recovery
- Added forgot-password endpoint
- Added reset-password endpoint
- Integrated EmailJS for password reset emails
- Added reset token database fields
- Added development mode (returns token in response)

### v1.0.0 - Initial Release
- User login
- User registration
- JWT authentication
- Role-based access control

