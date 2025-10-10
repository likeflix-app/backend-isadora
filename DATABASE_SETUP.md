# PostgreSQL Database Setup

## Overview

The Isadora Talento backend now uses **PostgreSQL** for persistent data storage. All user data and talent applications are stored in the database and will persist across deployments.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8084

# Node Environment
NODE_ENV=development

# Server Port
PORT=3001
```

## Local Development Setup

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE talento_db;

# Create user (optional)
CREATE USER talento_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE talento_db TO talento_user;

# Exit
\q
```

### 3. Configure Environment

Update your `.env` file:
```env
DATABASE_URL=postgresql://localhost:5432/talento_db
# Or with username/password:
# DATABASE_URL=postgresql://talento_user:your_password@localhost:5432/talento_db
```

### 4. Run the Application

```bash
npm install
npm start
```

The database tables will be created automatically on first run.

## Production Deployment (Render)

### 1. Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name:** `talento-db` (or your preferred name)
   - **Region:** Same as your backend service
   - **PostgreSQL Version:** 15 or higher
   - **Plan:** Free tier (or paid for production)
4. Click **Create Database**

### 2. Get Database URL

1. After creation, click on your database
2. Scroll to **Connections**
3. Copy the **Internal Database URL** (for services in the same region) or **External Database URL**

It will look like:
```
postgresql://username:password@dpg-xxxxx.region.render.com/database_name
```

### 3. Configure Backend Service

1. Go to your backend service on Render
2. Go to **Environment** tab
3. Add environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the database URL from step 2
4. Add other required variables:
   - `JWT_SECRET`: A secure random string
   - `FRONTEND_URL`: Your frontend URL
   - `NODE_ENV`: `production`

### 4. Deploy

Your backend will automatically redeploy and connect to PostgreSQL.

## Database Schema

The application uses two main tables:

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  mobile VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT true
);
```

### Talent Applications Table
```sql
CREATE TABLE talent_applications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  full_name VARCHAR(255) NOT NULL,
  birth_year INTEGER NOT NULL,
  city VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  bio TEXT,
  social_channels JSONB DEFAULT '[]',
  social_links TEXT,
  media_kit_urls JSONB DEFAULT '[]',
  content_categories JSONB DEFAULT '[]',
  available_for_products VARCHAR(50) DEFAULT 'No',
  shipping_address TEXT,
  available_for_reels VARCHAR(50) DEFAULT 'No',
  available_next_3_months VARCHAR(50) DEFAULT 'No',
  availability_period TEXT,
  collaborated_agencies VARCHAR(50) DEFAULT 'No',
  agencies_list TEXT,
  collaborated_brands VARCHAR(50) DEFAULT 'No',
  brands_list TEXT,
  has_vat VARCHAR(50) DEFAULT 'No',
  payment_methods JSONB DEFAULT '[]',
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  review_notes TEXT
);
```

## Demo Users

The database is automatically seeded with two demo users:

1. **Regular User**
   - Email: `demo@example.com`
   - Password: `password`
   - Role: `user`

2. **Admin User**
   - Email: `admin@talento.com`
   - Password: `password`
   - Role: `admin`

## Troubleshooting

### Connection Error
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Ensure database exists
- Check firewall/network settings

### Permission Errors
- Verify user has proper database permissions
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE dbname TO username;`

### SSL Connection Issues (Production)
The app automatically enables SSL for production environments. If you encounter SSL issues, check that your database provider supports SSL connections.

## Migration from In-Memory Storage

The previous version used in-memory storage (JavaScript arrays). All data was lost on each deployment. 

**Now with PostgreSQL:**
- ✅ All data persists across deployments
- ✅ Server restarts don't lose data
- ✅ Multiple instances can share the same data
- ✅ Data can be backed up and restored

**Note:** Files uploaded to `/uploads/media-kits/` may still be lost on platforms with ephemeral storage (like Render). For production, consider using cloud storage services like AWS S3, Cloudinary, or Google Cloud Storage.

