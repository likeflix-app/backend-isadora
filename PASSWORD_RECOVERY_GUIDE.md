# Password Recovery Implementation Guide

## Overview

This guide explains how the password recovery feature works in the Talento backend and how to use it.

## Features

- **Secure Token Generation**: Uses cryptographically secure random tokens
- **Token Expiration**: Reset tokens expire after 1 hour for security
- **Email Integration**: Sends password reset emails (optional, can work without email setup)
- **Development Mode**: Returns reset token in API response when email is not configured
- **Security**: Doesn't reveal whether an email exists in the system

## Environment Variables

Add these to your `.env` file to enable email functionality:

```env
# Email Configuration (Optional - if not set, tokens will be returned in API response)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (required for reset links)
FRONTEND_URL=http://localhost:8084
```

### Gmail Setup Instructions

1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Copy the generated password to `EMAIL_PASSWORD` in your `.env`

## API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (Email Configured):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Success Response (Email NOT Configured - Development Mode):**
```json
{
  "success": true,
  "message": "Password reset token generated (email not configured)",
  "resetToken": "a1b2c3d4e5f6...",
  "resetUrl": "http://localhost:8084/reset-password?token=a1b2c3d4e5f6..."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Email is required"
}
```

### 2. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email-or-api",
  "newPassword": "newSecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**

Invalid/Expired Token:
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

Password Too Short:
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

## Frontend Integration

### 1. Forgot Password Page

Create a form that sends a password reset request:

```javascript
async function handleForgotPassword(email) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert(data.message);
      
      // In development mode, you can use the returned token
      if (data.resetToken) {
        console.log('Reset Token:', data.resetToken);
        console.log('Reset URL:', data.resetUrl);
      }
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send password reset request');
  }
}
```

### 2. Reset Password Page

Create a form that accepts the token (from URL params) and new password:

```javascript
async function handleResetPassword(token, newPassword) {
  try {
    const response = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        token, 
        newPassword 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Password reset successful! You can now login.');
      // Redirect to login page
      window.location.href = '/login';
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to reset password');
  }
}

// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
```

### 3. Complete React/Vue Example

```jsx
// ForgotPasswordPage.jsx
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      if (data.resetUrl) {
        // Development mode - show reset URL
        console.log('Reset URL:', data.resetUrl);
      }
    } catch (error) {
      setMessage('Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
```

```jsx
// ResetPasswordPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {!token ? (
        <p>Invalid reset link</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
```

## Database Schema

The following fields have been added to the `users` table:

- `reset_token` (VARCHAR 255): Stores the password reset token
- `reset_token_expiry` (TIMESTAMP): Stores when the token expires

## Security Features

1. **Token Expiration**: Tokens automatically expire after 1 hour
2. **Secure Token Generation**: Uses crypto.randomBytes for cryptographically secure tokens
3. **Email Validation**: Doesn't reveal if an email exists in the system
4. **Password Hashing**: New passwords are hashed with bcrypt before storage
5. **Token Cleanup**: Reset tokens are cleared after successful password reset

## Testing

### Without Email Configuration (Development)

1. Send password reset request:
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'
```

2. Copy the `resetToken` from the response

3. Reset password:
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_RESET_TOKEN","newPassword":"newpassword123"}'
```

### With Email Configuration (Production)

1. Configure email environment variables
2. Send password reset request
3. Check your email inbox for the reset link
4. Click the link or use the token to reset password

## Email Template

The password reset email includes:
- Personalized greeting with user's name
- Clear call-to-action button
- Plain text link as backup
- Token expiration notice (1 hour)
- Security notice about ignoring unexpected emails

## Troubleshooting

### Email Not Sending

1. Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
2. Verify Gmail app password is correct (not regular password)
3. Check console logs for email errors
4. Try using the development mode (without email config) first

### Token Invalid or Expired

1. Tokens expire after 1 hour - request a new one
2. Each token can only be used once
3. Check that the token is being passed correctly from the URL

### Password Not Updating

1. Ensure new password is at least 6 characters
2. Check that the token hasn't expired
3. Verify the token exists in the database

## Best Practices

1. **Always use HTTPS in production** for secure token transmission
2. **Set up email properly** for production environments
3. **Monitor reset attempts** for potential abuse
4. **Consider rate limiting** for forgot-password endpoint
5. **Add CAPTCHA** to prevent automated attacks
6. **Log all password reset activities** for security auditing

## Support

For issues or questions, check the server logs or contact the development team.

