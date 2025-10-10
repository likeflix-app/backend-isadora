# 🚀 Deployment Checklist - PostgreSQL Backend

## ✅ Pre-Deployment Checklist

Before deploying to Render, make sure you have:

- [ ] PostgreSQL database created on Render
- [ ] Database URL copied from Render dashboard
- [ ] All environment variables ready

---

## 📋 Step-by-Step Deployment

### 1️⃣ Create PostgreSQL Database (5 min)

**On Render Dashboard:**
```
1. Click "New" → "PostgreSQL"
2. Configure:
   - Name: talento-db
   - Region: ⚠️ SAME as your backend service
   - PostgreSQL Version: 15+
   - Plan: Free (or paid)
3. Click "Create Database"
4. Wait 2-3 minutes for provisioning
```

**Status:** [ ] Complete

---

### 2️⃣ Get Database Connection URL (1 min)

**On Database Dashboard:**
```
1. Click on your "talento-db" database
2. Scroll to "Connections" section
3. Find "Internal Database URL"
4. Click "Copy" button
```

**URL Format:**
```
postgresql://user:password@host.region.render.com/database_name
```

**Status:** [ ] Complete

---

### 3️⃣ Set Environment Variables (2 min)

**On Backend Service Dashboard:**

Go to **Environment** tab and add/verify these variables:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | [Paste Internal DB URL] | [ ] |
| `JWT_SECRET` | Any secure random string | [ ] |
| `FRONTEND_URL` | Your frontend URL | [ ] |
| `NODE_ENV` | `production` | [ ] |
| `PORT` | `3001` | [ ] |

**Generate JWT Secret:**
```bash
# Option 1: Use this
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Or use this
openssl rand -hex 64
```

**Status:** [ ] Complete

---

### 4️⃣ Deploy Backend (Auto)

**After saving environment variables:**
```
✅ Service automatically redeploys
⏳ Wait 2-3 minutes for build and deploy
```

**Status:** [ ] Complete

---

### 5️⃣ Verify Deployment (2 min)

**Check Logs:**

Look for these messages in your service logs:

```
✅ "Database tables created/verified successfully"
✅ "Demo users created successfully"
✅ "Database: PostgreSQL (connected)"
✅ "Talento Backend Server running on port 3001"
```

**If you see these = SUCCESS!** ✅

**Status:** [ ] Complete

---

### 6️⃣ Test the API (5 min)

**Test 1: Health Check**
```bash
curl https://your-backend.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Talento Backend is running",
  "database": "connected",
  "users": 2
}
```

**Test 2: Login with Demo User**
```bash
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'
```

Expected: `"success": true` with token

**Test 3: Create a Test User**
```bash
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

**Status:** [ ] Complete

---

### 7️⃣ Verify Data Persistence (IMPORTANT!)

**This is the critical test:**

1. Create a new user via registration ✅
2. Go to Render → Manual Deploy → Deploy latest commit
3. Wait for deployment to complete
4. Try to login with the user you created in step 1

**If login works = DATA PERSISTS!** 🎉

**Status:** [ ] Complete

---

## 🔍 Troubleshooting

### ❌ "Failed to connect to database"

**Possible causes:**
- DATABASE_URL not set or incorrect
- Database not running
- Wrong region (use Internal URL)
- SSL issue

**Fix:**
```
1. Verify DATABASE_URL in environment variables
2. Check database status on Render dashboard
3. Ensure using "Internal Database URL" (not External)
4. Check both services are in same region
```

---

### ❌ "relation 'users' does not exist"

**Possible causes:**
- Database initialization failed
- Permissions issue

**Fix:**
```
1. Check logs for initialization errors
2. Try manual deploy to restart initialization
3. Verify database user has CREATE TABLE permissions
```

---

### ❌ Data still disappearing

**Possible causes:**
- DATABASE_URL not set
- Still using in-memory storage
- Wrong database URL

**Fix:**
```
1. Double-check DATABASE_URL environment variable
2. Look for "Database: PostgreSQL (connected)" in logs
3. Verify you see table creation messages in logs
```

---

## 📊 Post-Deployment Verification

### Database Connection
- [ ] Logs show "Database: PostgreSQL (connected)"
- [ ] No connection errors in logs
- [ ] Health endpoint returns "database": "connected"

### Tables Created
- [ ] Logs show "Database tables created/verified successfully"
- [ ] Logs show "Demo users created successfully"
- [ ] Can login with demo@example.com

### Data Persistence
- [ ] Created test user before deployment
- [ ] Redeployed service
- [ ] Test user still exists after deployment ✅

### API Functionality
- [ ] /api/health returns 200
- [ ] Can register new users
- [ ] Can login with credentials
- [ ] Can submit talent applications
- [ ] Admin can manage applications

---

## 🎯 Success Criteria

All of these must be true:

✅ PostgreSQL database created on Render  
✅ DATABASE_URL environment variable set  
✅ Backend deploys without errors  
✅ Logs show database connection successful  
✅ Demo users can login  
✅ New users can register  
✅ Data persists after redeployment  
✅ All API endpoints working  

---

## 📝 Environment Variables Reference

Copy this template for your .env file (local) or Render environment:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-64-character-random-hex-string
FRONTEND_URL=https://your-frontend.onrender.com

# Optional
NODE_ENV=production
PORT=3001
```

---

## 🔗 Useful Links

**Render Dashboard:**
- Database: https://dashboard.render.com/ → Your Database
- Backend: https://dashboard.render.com/ → Your Service
- Logs: Service → Logs tab

**Documentation:**
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed setup
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Technical details
- [README.md](./README.md) - API documentation

---

## ✨ Final Notes

**What's Different Now:**

Before:
- ❌ Data in JavaScript arrays
- ❌ Lost on every deployment
- ❌ No data persistence

After:
- ✅ Data in PostgreSQL database
- ✅ Survives all deployments
- ✅ Professional data persistence

**Remember:**
- Database and backend must be in **same region** for Internal URL
- Use **Internal Database URL** (faster, free bandwidth)
- Free tier database expires after 90 days (need to recreate)
- Upgrade to paid tier for permanent database

---

## 🎉 You're Done!

Once all checkboxes are complete, your backend has persistent storage and data will never disappear again!

**Questions?** Check the troubleshooting section above or review the documentation files.

