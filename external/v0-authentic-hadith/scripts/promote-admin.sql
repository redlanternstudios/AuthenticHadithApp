-- Promote r.semeah@outlook.com to admin
UPDATE profiles
SET role = 'admin'
WHERE user_id = 'f411c817-ad5d-42d4-a459-602a4398349c';

-- Also promote roryleesemeah@gmail.com 
UPDATE profiles
SET role = 'admin'
WHERE user_id = 'a3c78809-55f2-4702-babd-0b0501aceaa5';

-- Verify
SELECT user_id, name, role FROM profiles WHERE role = 'admin';
