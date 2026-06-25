# Edge Function: send-collection-announcement

Sends Expo push notifications to all registered devices when a new hadith collection becomes available.

## Prerequisites

### 1. Run the migration SQL in Supabase dashboard

Before this function can query push tokens, the `expo_push_token` column must exist on the `profiles` table.

Open the Supabase SQL editor for project `nqklipakrfuwebkdnhwg` and run:

```sql
-- Add push token column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT DEFAULT NULL;

-- Index for efficient Edge Function token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token
ON profiles(expo_push_token)
WHERE expo_push_token IS NOT NULL;
```

### 2. Set the secret in Supabase dashboard

Supabase dashboard → Settings → Edge Functions → Secrets

Add:
```
ANNOUNCEMENT_SECRET = <choose a strong random string, e.g., a UUID v4>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the Edge Function runtime — do not set them manually.

## Deploy

From the repo root, after logging in with `npx supabase login`:

```bash
npx supabase functions deploy send-collection-announcement --project-ref nqklipakrfuwebkdnhwg
```

## Trigger (curl)

```bash
curl -X POST https://nqklipakrfuwebkdnhwg.supabase.co/functions/v1/send-collection-announcement \
  -H "Authorization: Bearer YOUR_ANNOUNCEMENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "sahih-al-bukhari",
    "title": "New Collection Available",
    "body": "Sahih al-Bukhari is now in Authentic Hadith"
  }'
```

Replace `YOUR_ANNOUNCEMENT_SECRET` with the value you set in Supabase secrets.

### Expected success response

```json
{ "sent": 1234, "failed": 0, "cleaned": 0 }
```

### Error responses

| Status | Meaning |
|--------|---------|
| 401 | Wrong or missing Authorization Bearer token |
| 400 | Invalid JSON body, missing field, or blocked hidden collection |
| 500 | Server misconfiguration (env var missing) or Supabase DB error |

## Environment variables

| Variable | Source | Notes |
|----------|--------|-------|
| `ANNOUNCEMENT_SECRET` | Supabase Secrets dashboard | You set this — keep it private |
| `SUPABASE_URL` | Auto-injected by runtime | Do not set manually |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by runtime | Do not set manually; never log this |

## Hidden collection guard

The function blocks announcements for collections not yet visible in the V1 app.
The blocked list mirrors `lib/hadith/visibleCollections.ts → HIDDEN_COLLECTION_SLUGS`.
If you add or remove a slug from that client file, update the `HIDDEN_COLLECTION_SLUGS`
constant in `index.ts` to match.

Currently blocked slugs:
- `musnad-ahmad`
- `sunan-abu-dawud`
- `jami-tirmidhi`
- `sunan-nasai`
- `sunan-ibn-majah`
- `muwatta-malik`

## Chunking

Expo Push API maximum is 100 messages per request. The function automatically splits
all registered tokens into chunks of 100 and sends them sequentially.

## DeviceNotRegistered cleanup

When Expo returns `DeviceNotRegistered` for a token (device uninstalled the app or
revoked permission), the function sets `expo_push_token = NULL` for that row in `profiles`.
This prevents the stale token from being queried on the next announcement.

## V2 delivery receipts (not implemented)

The Expo Push API returns "tickets" (pending acknowledgment), not final delivery receipts.
To verify actual delivery, poll `https://exp.host/--/api/v2/push/getReceipts` with the
ticket IDs returned from the send calls. This is out of scope for V1 but is the correct
production-grade approach for delivery confirmation.
