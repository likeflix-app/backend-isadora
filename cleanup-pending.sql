-- Delete all pending talent applications and their data
-- This script will remove all applications with status = 'pending'

BEGIN;

-- Show what will be deleted
SELECT 
    'About to delete ' || COUNT(*) || ' pending application(s)' as action
FROM talent_applications 
WHERE status = 'pending';

-- Show details of pending applications
SELECT 
    id,
    full_name,
    email,
    created_at,
    media_kit_urls
FROM talent_applications 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Delete all pending applications
DELETE FROM talent_applications 
WHERE status = 'pending';

-- Commit the transaction
COMMIT;

-- Verify deletion
SELECT 
    COUNT(*) as remaining_pending_applications
FROM talent_applications 
WHERE status = 'pending';

