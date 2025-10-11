# Cleanup Pending Applications & Media Kits

This guide explains how to delete all pending applications and their associated media kit files from the database.

## 🎯 What Gets Deleted

- All talent applications with `status = 'pending'`
- All media kit files (images/PDFs) associated with those applications

## 📋 Prerequisites

You need your PostgreSQL database connection URL. This is typically found in:
- Your Render dashboard (Environment variables)
- Format: `postgresql://username:password@host:port/database`

---

## Method 1: Using Node.js Script (Recommended)

### Step 1: Get your database URL

Go to your Render dashboard and copy the `DATABASE_URL` environment variable.

### Step 2: Run the cleanup script

```bash
node cleanup-pending.js "postgresql://username:password@host:port/database"
```

Replace the connection string with your actual database URL.

### What it does:
1. ✅ Connects to your PostgreSQL database
2. 🔍 Finds all pending applications
3. 📎 Identifies associated media kit files
4. 🗑️ Deletes media kit files from the file system
5. 🗑️ Deletes pending applications from the database
6. 📊 Shows a summary of what was deleted

---

## Method 2: Using SQL Script (Alternative)

If you prefer to run SQL directly in your database console:

### Step 1: Access your database

Go to your Render dashboard and open the database shell/console.

### Step 2: Run the SQL commands

Copy and paste the contents of `cleanup-pending.sql` into your database console.

This will:
1. Show what will be deleted
2. Delete all pending applications
3. Verify the deletion

⚠️ **Note:** This method only deletes database records. Media kit files will remain on the server.

---

## Method 3: Using cURL (Via API)

If your server is running, you can also delete applications via the API:

### Step 1: Get admin token

```bash
# Login as admin
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talento.com","password":"your-password"}'
```

Save the `token` from the response.

### Step 2: Get all pending applications

```bash
curl -X GET "https://your-backend.onrender.com/api/talent/applications?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Delete each application

For each application ID:

```bash
curl -X DELETE "https://your-backend.onrender.com/api/talent/applications/APPLICATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Verification

After cleanup, verify that all pending applications are gone:

```sql
SELECT COUNT(*) FROM talent_applications WHERE status = 'pending';
```

Should return `0`.

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check that your DATABASE_URL is correct
- Ensure you have network access to the database
- Verify the database credentials

### "File not found" warnings
- This is normal if files were already deleted
- The script will continue with other files

### Script hangs
- Check your network connection
- Verify the database URL is correct
- Try running with `node --trace-warnings cleanup-pending.js`

---

## ⚠️ Important Notes

1. **Backup first**: Consider backing up your database before running any deletion scripts
2. **Irreversible**: Deleted applications cannot be recovered
3. **Media files**: Only the Node.js script deletes media files from the server
4. **Production**: Be extra careful when running on production databases

---

## 📞 Support

If you encounter any issues, check:
1. Database connection logs
2. File permissions for the uploads directory
3. Network connectivity to the database server

