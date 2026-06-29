-- Set the first user (or all current users) as admin for initial setup
-- This updates ALL existing profiles to admin role.
-- After setup, manually manage roles via the Supabase dashboard.
UPDATE profiles SET role = 'admin' WHERE role = 'user';
