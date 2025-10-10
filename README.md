# Talento Backend

Backend API for Talento Showcase with user management and talent applications.

## 🎉 Latest Update: PostgreSQL Database Integration

The backend now uses **PostgreSQL** for persistent data storage! All users and talent applications are now stored in a database and will **persist across deployments**.

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup instructions.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql@15  # macOS
# or apt install postgresql  # Ubuntu

# Create database
psql postgres
CREATE DATABASE talento_db;
\q
```

**Option B: Use Render PostgreSQL** (for production)
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for details

### 3. Configure Environment

Create a `.env` file:
```env
DATABASE_URL=postgresql://localhost:5432/talento_db
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:8084
NODE_ENV=development
PORT=3001
```

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The database tables will be created automatically on first run.

## Demo Users

Two demo users are created automatically:

- **Regular User:** `demo@example.com` / `password`
- **Admin User:** `admin@talento.com` / `password`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info (requires auth)

### User Management
- `GET /api/users` - Get all verified users
- `POST /api/users` - Create new verified user
- `PATCH /api/users/:userId/role` - Update user role
- `DELETE /api/users/:userId` - Delete user
- `GET /api/users/stats` - Get user statistics

### Talent Applications
- `POST /api/talent/applications` - Submit talent application (requires auth)
- `GET /api/talent/applications` - List all applications (requires auth)
- `GET /api/talent/applications/me` - Get my application (requires auth)
- `GET /api/talent/applications/:id` - Get specific application (admin only)
- `PATCH /api/talent/applications/:id/status` - Approve/reject application (admin only)
- `DELETE /api/talent/applications/:id` - Delete application (admin only)
- `GET /api/talent/stats` - Get talent statistics (admin only)

### File Upload
- `POST /api/upload/media-kit` - Upload talent photos/media kit (max 10 files, 10MB each)
- `DELETE /api/upload/media-kit/:filename` - Delete uploaded file
- `GET /api/admin/media-kits` - List all uploaded files (admin only)
- `GET /uploads/*` - Serve uploaded files

### System
- `GET /api/health` - Health check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `FRONTEND_URL` | Frontend URL for CORS | Required |
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3001` |

## Tech Stack

- **Node.js** with Express
- **PostgreSQL** with pg-promise
- **JWT** authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **CORS** enabled

## Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed PostgreSQL setup
- [File Upload API](./FILE_UPLOAD_API.md) - File upload documentation
- [Talent Application API](./TALENT_APPLICATION_API.md) - Talent application documentation
- [Quick Reference](./QUICK_REFERENCE.md) - Quick API reference

## Deployment

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for production deployment instructions on Render.

## File Storage Note

**Important:** File uploads to `/uploads/media-kits/` may be lost on platforms with ephemeral storage (like Render's free tier). For production use, consider integrating cloud storage:
- AWS S3
- Cloudinary
- Google Cloud Storage
- Uploadcare

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

## License

MIT

