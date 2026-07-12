-- Check profiles columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check existing profiles
SELECT p.*, u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- Check roles
SELECT role, COUNT(*) FROM profiles GROUP BY role;
