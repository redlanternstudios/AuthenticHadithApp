# VIP Lifetime Premium Access Setup

## Overview
Paul Semeah (paul.semeah@siemens.com) has been configured for **automatic lifetime premium access** on sign-up.

## How It Works

### Database Trigger
A PostgreSQL trigger `auto_grant_lifetime_on_profile_insert` has been created that:
1. Fires when a new profile is inserted into the `profiles` table
2. Checks if the user's email is in the VIP list (currently: `paul.semeah@siemens.com`)
3. Automatically sets:
   - `subscription_tier` = `'lifetime'`
   - `subscription_status` = `'active'`
   - `subscription_started_at` = NOW()
   - `subscription_expires_at` = `'2099-12-31'`
   - `subscription_cancel_at_period_end` = `false`

### Sign-Up Flow
1. Paul signs up at the login page with `paul.semeah@siemens.com`
2. Account is created in Supabase Auth
3. Upon sign-in, the auth form creates a profile record
4. The trigger intercepts this insert and grants lifetime premium
5. Paul immediately has full premium access

## Testing & Confirmation

### To Verify Setup:
\`\`\`sql
-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'auto_grant_lifetime_on_profile_insert';

-- After Paul signs up, verify his profile:
SELECT 
  p.user_id,
  p.name,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_expires_at,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'paul.semeah@siemens.com';
\`\`\`

Expected result:
- `subscription_tier`: `'lifetime'`
- `subscription_status`: `'active'`
- `subscription_expires_at`: `'2099-12-31 00:00:00+00'`

## Adding More VIP Users

To add additional users to the VIP lifetime list:

1. Edit the SQL function in `/supabase/migrations/` (create new migration)
2. Update the email list in the condition:
\`\`\`sql
WHERE id = NEW.user_id 
AND email IN ('paul.semeah@siemens.com', 'other@email.com')
\`\`\`
3. Run the migration

Or simply modify the existing trigger:
\`\`\`sql
-- Update the email list
CREATE OR REPLACE FUNCTION public.auto_grant_lifetime_for_vip_emails()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM auth.users 
       WHERE id = NEW.user_id 
       AND email IN ('paul.semeah@siemens.com', 'new.email@domain.com')
     ) 
  THEN
    -- ... rest of function
\`\`\`

## Date Expiry
- Expiry is set to **2099-12-31** to effectively provide lifetime access
- Can be adjusted as needed

## Notes
- This is automatic and requires no manual intervention
- The trigger fires on every profile insert, so performance is minimal
- Trigger is in the `public` schema and will persist across backups
