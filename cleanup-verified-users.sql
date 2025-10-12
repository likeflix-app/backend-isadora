-- Delete all verified users EXCEPT admins and their data
-- This script will remove all users with email_verified = true AND role != 'admin'
-- Note: Associated talent_applications will be CASCADE deleted automatically
-- Admin users will be PRESERVED

BEGIN;

-- Show what will be deleted
SELECT 
    'About to delete ' || COUNT(*) || ' verified non-admin user(s)' as action
FROM users 
WHERE email_verified = true AND role != 'admin';

-- Show details of verified non-admin users to be deleted
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email_verified = true AND role != 'admin'
ORDER BY created_at DESC;

-- Show admin users that will be preserved
SELECT 
    'Admin users to be PRESERVED: ' || COUNT(*) as preserved_admins
FROM users 
WHERE email_verified = true AND role = 'admin';

SELECT 
    id,
    email,
    name,
    'PRESERVED' as status
FROM users 
WHERE email_verified = true AND role = 'admin'
ORDER BY created_at DESC;

-- Show associated talent applications that will be deleted
SELECT 
    'Associated talent applications: ' || COUNT(*) as associated_applications
FROM talent_applications ta
WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = ta.user_id 
    AND u.email_verified = true
    AND u.role != 'admin'
);

-- Delete all verified non-admin users (CASCADE will delete related talent_applications)
DELETE FROM users 
WHERE email_verified = true AND role != 'admin';

-- Commit the transaction
COMMIT;

-- Verify deletion
SELECT 
    COUNT(*) as remaining_verified_users
FROM users 
WHERE email_verified = true;

SELECT 
    COUNT(*) as remaining_applications
FROM talent_applications;

