# Deploy Paul Semeah Lifetime Premium - LIVE INSTRUCTIONS

**Date**: June 27, 2026  
**Action**: Grant lifetime premium to paul.semeah@siemens.com  
**Target**: PRODUCTION Supabase Database  

---

## Quick Deploy (1 Minute)

### Option 1: Using Supabase Dashboard (Recommended for Live)

1. **Login to Supabase**
   - Go to https://app.supabase.com
   - Select the Authentic Hadith project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query"

3. **Copy & Paste the SQL**
   - Open this file: `/scripts/114-grant-paul-semeah-lifetime.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Execute**
   - Click "Run" button (or Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify Results**
   - The verification query at the bottom will show:
     - `subscription_tier: 'lifetime'`
     - `subscription_status: 'active'`
     - `subscription_expires_at: '2099-12-31'`

---

### Option 2: Using Supabase CLI (Advanced)

```bash
# From project root
npx supabase db push

# This will apply all migrations including:
# - /supabase/migrations/20260627000000_grant_paul_lifetime_premium.sql
# - /scripts/114-grant-paul-semeah-lifetime.sql
```

---

## What Gets Deployed

### Database Changes:
1. **profiles table** - Sets subscription_tier to 'lifetime'
2. **subscriptions table** - Creates lifetime subscription record
3. **auth.users** - Confirms email (if not already)

### What Paul Gets:
✓ Lifetime premium access  
✓ Unlimited hadith storage  
✓ All premium learning paths  
✓ Advanced AI features  
✓ No expiration (set to 2099)  

---

## Verification After Deploy

Run this query to confirm:

```sql
SELECT 
  u.email,
  p.subscription_tier,
  p.subscription_status,
  p.subscription_expires_at,
  s.plan_type
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'paul.semeah@siemens.com';
```

**Expected Output:**
| email | subscription_tier | subscription_status | subscription_expires_at | plan_type |
|-------|------------------|-------------------|-------------------------|-----------|
| paul.semeah@siemens.com | lifetime | active | 2099-12-31 23:59:59+00 | lifetime |

---

## Deployment Checklist

- [ ] Logged into Supabase production account
- [ ] Selected correct project (Authentic Hadith)
- [ ] Copied entire SQL from `/scripts/114-grant-paul-semeah-lifetime.sql`
- [ ] Executed in SQL Editor
- [ ] Got "Success" message
- [ ] Ran verification query and got expected results
- [ ] Tested by logging in as paul.semeah@siemens.com (if account exists)
- [ ] Confirmed premium features are unlocked

---

## Rollback (If Needed)

If something goes wrong, run this to revert:

```sql
UPDATE profiles
SET 
  subscription_tier = NULL,
  subscription_status = NULL,
  subscription_expires_at = NULL
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paul.semeah@siemens.com'
);

DELETE FROM subscriptions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paul.semeah@siemens.com'
);
```

---

## Support

If deployment fails:

1. **Check if user exists**
   ```sql
   SELECT * FROM auth.users WHERE email = 'paul.semeah@siemens.com';
   ```

2. **Check database permissions** - Ensure service role has write access

3. **Verify email exact match** - Must be exactly `paul.semeah@siemens.com`

---

## Timeline

- **Created**: June 27, 2026
- **Ready to Deploy**: Immediately
- **Target Go-Live**: ASAP (inshallah)
- **Persistence**: Permanent until manually changed
