# Environment Variables

This file documents every environment variable consumed by the AuthenticHadith mobile app and its server-side API routes.

## Server-Side Variables (never shipped to client)

These variables are read inside API route handlers (`app/api/**`). They must be set as EAS secrets or in the server host environment. They are never prefixed with `EXPO_PUBLIC_` and are therefore excluded from the client JS bundle.

| Variable | Required | Example Value | Where Used | Set In |
|---|---|---|---|---|
| `SUPABASE_URL` | Required | `https://abcdefgh.supabase.co` | `app/api/auth/delete-account/route.ts` — builds the Supabase admin client | EAS Secret, server `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service-role JWT) | `app/api/auth/delete-account/route.ts` — authenticates admin-level Supabase operations. Never expose to client. | EAS Secret, server `.env` |
| `GROQ_API_KEY` | Required | `gsk_abc123...` | `app/api/mobile-chat/route.ts` — authenticates requests to the Groq inference API | EAS Secret, server `.env` |

## Client-Side Variables (bundled — safe for mobile)

These are prefixed with `EXPO_PUBLIC_` and are embedded in the JS bundle at build time. They must not contain secrets.

| Variable | Required | Example Value | Where Used | Set In |
|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Required | `https://abcdefgh.supabase.co` | `lib/supabase/client.ts` — Supabase client for auth and data | EAS env (`eas.json` or `eas secret`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Required | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key) | `lib/supabase/client.ts` — public/anon Supabase key | EAS env |
| `EXPO_PUBLIC_API_URL` | Required | `https://www.authentichadith.app` | `lib/supabase/client.ts`, `lib/api/groq.ts` — base URL for mobile-chat and other API routes. Must be the `www.` host to avoid redirect loops. | EAS env |
| `EXPO_PUBLIC_APP_ENV` | Optional | `production` | Build-time environment flag | EAS env |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | Required (iOS build) | `appl_...` | `hooks/usePremiumStatus.ts` — RevenueCat iOS public key | EAS env |

## Setting Secrets in EAS

```bash
# Server-side secrets (not embedded in client bundle)
eas secret:create --scope project --name SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name SUPABASE_SERVICE_ROLE_KEY --value "your-service-role-key"
eas secret:create --scope project --name GROQ_API_KEY --value "your-groq-api-key"

# Client-side (set in eas.json under build.production.env or via secret:create)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://www.authentichadith.app"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_your_key"
```

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It must never appear in client-side code or be committed to source control.
- `GROQ_API_KEY` is read only at request time inside the route handler, not at module load. This prevents the key from being referenced during the Expo bundling phase.
- The `EXPO_PUBLIC_API_URL` must point to `https://www.authentichadith.app` (with `www.`). The apex domain (`authentichadith.app`) issues a redirect which breaks `fetch` in React Native.
