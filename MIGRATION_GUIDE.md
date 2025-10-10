# Migration Guide: In-Memory to PostgreSQL

## What Changed?

Your backend has been migrated from **in-memory storage** to **PostgreSQL database** for persistent data storage.

### Before (In-Memory Storage)
```javascript
let users = [...]; // Lost on every deployment
let talentApplications = []; // Lost on every deployment
```

### After (PostgreSQL)
```javascript
// All data stored in PostgreSQL
// Persists across deployments, restarts, and updates
```

## Why You Were Losing Data

**The Problem:**
- JavaScript arrays stored data in server memory
- Every deployment = server restart = memory cleared
- All new users and applications were lost

**The Solution:**
- PostgreSQL database stores data permanently
- Survives deployments, restarts, and server crashes
- Professional production-ready solution

## Quick Setup for Render Deployment

### Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com/
2. Click **New** → **PostgreSQL**
3. Settings:
   - Name: `talento-db`
   - Region: **Same as your backend** (important!)
   - PostgreSQL Version: 15+
   - Plan: Free (or paid for production)
4. Click **Create Database**
5. **Wait 2-3 minutes** for it to provision

### Step 2: Get Database Connection URL

1. Click on your new `talento-db` database
2. Scroll to **Connections** section
3. Copy the **Internal Database URL** (looks like this):
   ```
   postgresql://talento_db_user:abc123...@dpg-xxxxx-a.oregon-postgres.render.com/talento_db_xyz
   ```

### Step 3: Add Database URL to Backend

1. Go to your backend service (backend-isadora)
2. Click **Environment** tab
3. Click **Add Environment Variable**
4. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the URL from Step 2
5. Click **Save Changes**

### Step 4: Verify Other Environment Variables

Make sure you have these set:
- ✅ `DATABASE_URL` - (just added)
- ✅ `JWT_SECRET` - Any secure random string
- ✅ `FRONTEND_URL` - Your frontend URL
- ✅ `NODE_ENV` - Set to `production`

### Step 5: Deploy

Your service will automatically redeploy. Watch the logs for:
```
✅ Database tables created/verified successfully
✅ Demo users created successfully
🚀 Talento Backend Server running on port 3001
💾 Database: PostgreSQL (connected)
```

## Verification

After deployment, test:

1. **Create a new user** (via registration or admin panel)
2. **Trigger a new deployment** (make any code change and push)
3. **Check if the user still exists** ✅

If the user persists, congratulations! Your data is now permanent.

## Local Development Setup

If you want to test locally:

```bash
# Install PostgreSQL
brew install postgresql@15  # macOS
sudo apt install postgresql  # Ubuntu/Linux

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql     # Ubuntu/Linux

# Create database
psql postgres
CREATE DATABASE talento_db;
\q

# Add to .env file
DATABASE_URL=postgresql://localhost:5432/talento_db

# Install dependencies and run
npm install
npm run dev
```

## What Happens on First Run?

The application automatically:
1. ✅ Connects to PostgreSQL
2. ✅ Creates `users` table
3. ✅ Creates `talent_applications` table
4. ✅ Creates indexes for performance
5. ✅ Seeds demo users (if database is empty):
   - `demo@example.com` / `password`
   - `admin@talento.com` / `password`

## Files Changed

- ✅ `db.js` - New database connection and query functions
- ✅ `server.js` - Updated all endpoints to use PostgreSQL
- ✅ `package.json` - Added `pg` and `pg-promise` dependencies
- ✅ `README.md` - Updated documentation
- ✅ `DATABASE_SETUP.md` - Detailed setup guide (new)
- ✅ `MIGRATION_GUIDE.md` - This file (new)

## Database Schema

### Users Table
Stores all registered users and admins.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key (UUID) |
| email | VARCHAR(255) | Unique, not null |
| name | VARCHAR(255) | User's full name |
| password | VARCHAR(255) | Hashed password |
| role | VARCHAR(50) | 'user' or 'admin' |
| mobile | VARCHAR(50) | Phone number |
| email_verified | BOOLEAN | Email verification status |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update date |

### Talent Applications Table
Stores all talent application submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key (UUID) |
| user_id | VARCHAR(255) | Foreign key to users |
| status | VARCHAR(50) | 'pending', 'verified', 'rejected' |
| full_name | VARCHAR(255) | Talent's name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Contact phone |
| ... | ... | Many more fields for application data |

## Troubleshooting

### "Failed to connect to database"
- ✅ Check `DATABASE_URL` is set correctly
- ✅ Verify database is running (on Render dashboard)
- ✅ Ensure backend and database are in same region (for Internal URL)

### "relation 'users' does not exist"
- The database initialization failed
- Check server logs for errors
- Verify database user has CREATE TABLE permissions

### "SSL connection error"
- The app automatically handles SSL for production
- Make sure `NODE_ENV=production` is set on Render

### Data still disappearing
- Verify you added `DATABASE_URL` to environment variables
- Check logs for "Database: PostgreSQL (connected)"
- If you see errors, check database connection string

## Cost Considerations

### Render Free Tier
- ✅ PostgreSQL: Free (with limitations)
- ✅ Web Service: Free (with sleep after inactivity)
- ⚠️ Free databases expire after 90 days
- ⚠️ 1GB storage limit

### Upgrading
- If you need permanent database, upgrade to paid tier ($7/month)
- Prevents 90-day expiration
- Better performance and uptime

## Next Steps

1. ✅ Set up PostgreSQL on Render (follow steps above)
2. ✅ Add `DATABASE_URL` to environment variables
3. ✅ Deploy and verify data persists
4. Consider upgrading to paid tier for production
5. Optional: Set up automated database backups

## Need Help?

Check the logs:
```bash
# On Render dashboard
Go to your service → Logs tab
Look for database connection messages
```

Common log messages:
- ✅ `Database tables created/verified successfully` - Good!
- ✅ `Demo users created successfully` - Good!
- ❌ `Failed to connect to database` - Check DATABASE_URL
- ❌ `relation does not exist` - Database initialization issue

## Support

If you encounter issues:
1. Check the logs on Render dashboard
2. Verify all environment variables are set
3. Ensure database and backend are in the same region
4. Review [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions

