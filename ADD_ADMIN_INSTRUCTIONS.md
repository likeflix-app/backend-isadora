# How to Add Admin User

There are **3 ways** to add an admin user to your system:

---

## ✅ Option 1: Using the API Endpoint (Recommended)

Your backend already has an endpoint to create admin users.

### Using curl:

```bash
curl -X POST "https://backend-isadora.onrender.com/api/auth/create-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@isadora.com",
    "password": "Admin123!",
    "name": "Isadora Admin"
  }'
```

### Using the provided script:

```bash
chmod +x add-admin-via-api.sh
./add-admin-via-api.sh
```

**Note:** Edit the script first to change the email, password, and backend URL as needed.

---

## ✅ Option 2: Using SQL in Render PostgreSQL Console

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your PostgreSQL database
3. Click on **"Connect"** → **"PSQL Command"** or use the web console
4. Run the SQL from `add-admin.sql` file:

```sql
INSERT INTO users (id, email, name, password, role, mobile, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid()::VARCHAR,
  'admin@isadora.com',
  'Isadora Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  '',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = 'Isadora Admin',
  updated_at = CURRENT_TIMESTAMP;
```

**Default Password:** `Admin123!`

---

## ✅ Option 3: Using Node.js Script (Requires Local PostgreSQL or DATABASE_URL)

If you have access to the database URL:

1. Create a `.env` file with your database URL:
```env
DATABASE_URL=postgresql://your-database-url-from-render
```

2. Run the script:
```bash
node create-admin.js
```

---

## 🔑 Default Admin Credentials

After creating the admin user with any of the above methods:

- **Email:** `admin@isadora.com`
- **Password:** `Admin123!`
- **Role:** `admin` (full access)

**⚠️ Important:** Change the password after first login!

---

## 🎯 What Admin Users Can Do

Admin users have full access to:
- ✅ View all talent applications
- ✅ Approve/reject talent applications
- ✅ Manage all users
- ✅ View statistics and analytics
- ✅ Delete applications and users
- ✅ Upload and manage media files
- ✅ Access all admin-only API endpoints

---

## 📝 Existing Demo Admin

Your system was already configured with a demo admin user:

- **Email:** `admin@talento.com`
- **Password:** `password`

You can use this account or create a new one using the methods above.

---

## 🔧 Troubleshooting

### "User already exists"
If the email is already in use, the API will promote that user to admin role automatically.

### "Database connection error"
Make sure your DATABASE_URL environment variable is set correctly in Render.

### API endpoint not responding
Check that your backend service is running on Render.

---

## 📞 Need Help?

If you encounter any issues, check:
1. Backend service is running: `https://backend-isadora.onrender.com/api/health`
2. Database is connected
3. Environment variables are set correctly in Render

