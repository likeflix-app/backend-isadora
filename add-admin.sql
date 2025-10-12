-- Add admin user directly to PostgreSQL database
-- Run this in your Render PostgreSQL console or via psql command

-- Generate a UUID and bcrypt hash for the admin user
-- Password: 'Admin123!' (you should change this after first login)
-- BCrypt hash below is for 'Admin123!' with salt rounds = 10

INSERT INTO users (id, email, name, password, role, mobile, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid()::VARCHAR,
  'admin@isadora.com',
  'Isadora Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Password: Admin123!
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

-- Verify the admin was created
SELECT id, email, name, role, email_verified, created_at 
FROM users 
WHERE role = 'admin';

-- Show all admin users
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';

