-- Check existing profiles and their roles
SELECT p.id, p.user_id, p.display_name, p.role, u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- Check total profiles
SELECT role, COUNT(*) FROM profiles GROUP BY role;
