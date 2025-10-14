# EmailJS Password Reset Setup Guide

## Overview

The password recovery feature has been configured to work with **EmailJS**, which you're already using. This guide will help you set up the email template and configure your environment.

## Step 1: Fix Your .env File

I noticed you have a typo in your .env file. Update it to:

```env
# Remove the X from the first line
EMAILJS_SERVICE_ID=service_jtqfr53
EMAILJS_TEMPLATE_ID=template_ykfa7k8
EMAILJS_PUBLIC_KEY=5ybDuVhMamekjsSX2

# Also add this if not already present
FRONTEND_URL=http://localhost:8084
```

**Note:** The backend code will check for both `EMAILJS_*` and `VITE_EMAILJS_*` variables, so either format works.

## Step 2: Create EmailJS Password Reset Template

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Log in to your account
3. Go to **Email Templates**
4. Click **Create New Template**

### Template Configuration

**Template ID:** Use your existing `template_ykfa7k8` or create a new one

**Template Content:**

```html
Subject: Password Reset Request - Talento

---

Hello {{user_name}},

We received a request to reset your password for your Talento account.

Click the button below to reset your password:

{{reset_url}}

Or copy and paste this link into your browser:
{{reset_url}}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

---
This is an automated email, please do not reply.
```

### Template Variables (Parameters)

Make sure your EmailJS template uses these variables:

- `{{to_email}}` - Recipient email address
- `{{to_name}}` or `{{user_name}}` - User's name
- `{{reset_url}}` - Password reset URL with token
- `{{reset_token}}` - The reset token (optional, for reference)

### HTML Template Example (Optional - for better styling)

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Password Reset Request</h2>
  
  <p>Hello {{user_name}},</p>
  
  <p>We received a request to reset your password for your Talento account.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reset_url}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="color: #666; word-break: break-all;">{{reset_url}}</p>
  
  <p><strong>This link will expire in 1 hour.</strong></p>
  
  <p>If you didn't request this password reset, please ignore this email.</p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #999; font-size: 12px;">This is an automated email, please do not reply.</p>
</div>
```

## Step 3: Configure Email Service

In your EmailJS dashboard:

1. Go to **Email Services**
2. Make sure your service (`service_jtqfr53`) is connected to a valid email provider (Gmail, Outlook, etc.)
3. Test the connection

## Step 4: Test the Password Reset

### Backend Test (Development Mode)

If EmailJS is not fully configured yet, the backend will return the reset token in the API response for testing:

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'
```

Response (when EmailJS not configured):
```json
{
  "success": true,
  "message": "Password reset token generated (email not configured)",
  "resetToken": "abc123...",
  "resetUrl": "http://localhost:8084/reset-password?token=abc123..."
}
```

### Full Email Test

Once EmailJS is configured:

1. Request password reset:
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

2. Check your email inbox for the reset link

3. Use the token to reset password:
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN","newPassword":"newpass123"}'
```

## How It Works

1. **User requests password reset** → POST `/api/auth/forgot-password` with email
2. **Backend generates secure token** → Saves to database with 1-hour expiry
3. **EmailJS sends email** → Uses your template with reset URL
4. **User clicks link** → Opens frontend page with token in URL
5. **User enters new password** → POST `/api/auth/reset-password` with token
6. **Backend validates token** → Updates password and clears token

## Environment Variables Summary

Your complete `.env` should include:

```env
# Backend
PORT=3001
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:8084

# EmailJS (fix the typo!)
EMAILJS_SERVICE_ID=service_jtqfr53
EMAILJS_TEMPLATE_ID=template_ykfa7k8
EMAILJS_PUBLIC_KEY=5ybDuVhMamekjsSX2

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Troubleshooting

### Emails Not Sending

1. **Check EmailJS dashboard** - Verify service is active
2. **Check template** - Ensure template ID matches
3. **Check console logs** - Look for EmailJS errors
4. **Verify .env** - Make sure variables are loaded (no typo!)
5. **Test in EmailJS dashboard** - Send a test email directly

### Common Issues

**Issue:** "XVITE_EMAILJS_SERVICE_ID" not working
- **Fix:** Remove the "X" - should be `EMAILJS_SERVICE_ID` or `VITE_EMAILJS_SERVICE_ID`

**Issue:** Template variables not showing
- **Fix:** Use exact variable names in template: `{{to_email}}`, `{{user_name}}`, `{{reset_url}}`

**Issue:** Token expired
- **Fix:** Tokens expire after 1 hour - request a new reset link

## Frontend Integration

See `PASSWORD_RECOVERY_GUIDE.md` for complete frontend implementation examples with React/Vue.

## Security Notes

- ✅ Tokens expire after 1 hour
- ✅ Each token can only be used once
- ✅ Tokens are cryptographically secure (32 random bytes)
- ✅ System doesn't reveal if email exists
- ✅ Passwords are hashed with bcrypt

## Next Steps

1. Fix the typo in your `.env` file (remove the X)
2. Create/update EmailJS template with password reset content
3. Test the password reset flow
4. Implement frontend pages (forgot-password and reset-password)

For detailed frontend implementation, see `PASSWORD_RECOVERY_GUIDE.md`.

