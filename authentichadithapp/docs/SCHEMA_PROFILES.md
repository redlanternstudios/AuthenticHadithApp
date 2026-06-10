# Canonical Live Schema — `profiles` (READ BEFORE TOUCHING ANY PROFILE CODE)

Verified against production (Supabase project `nq` / `nqklipakrfuwebkdnhwg`) on 2026-06-09 via
service-role introspection. This is the SOURCE OF TRUTH. The app code drifted from it and broke
signup + onboarding (FIX-064). Do not write a profile from memory — match this table.

## Columns (exact, live)

| Column | Notes |
|---|---|
| `id` | uuid, PK |
| `user_id` | uuid, **NOT NULL**, FK → `auth.users(id)`. **This is the key the app reads/writes by.** Must equal the auth uid. |
| `name` | text. The display name. **NOT `username`, NOT `full_name`** — those columns DO NOT EXIST. |
| `avatar_url` | text, nullable |
| `school_of_thought` | text, nullable |
| `role` | text (default `user`) |
| `subscription_tier` | text (default `free`) — Stripe/web side only |
| `subscription_status` | text, nullable |
| `subscription_expires_at` / `subscription_started_at` / `subscription_cancel_at_period_end` | subscription state (web/Stripe) |
| `stripe_customer_id` / `stripe_subscription_id` | nullable |
| `created_at` / `updated_at` | timestamptz |

## The two landmines that broke the app (FIX-064)

1. **Wrong column name.** `AuthProvider.signUp` wrote `username`; `onboarding` wrote `full_name`. Neither column exists → `PGRST204 could not find the column`. The real column is **`name`**.
2. **Missing NOT-NULL `user_id`.** Both inserts omitted `user_id` → `23502 null value violates not-null constraint`. `user_id` MUST be set to the auth uid, and it is the column the app queries by (`revenuecat.ts` does `.eq('user_id', authUid)`).

## Correct write shapes (copy these)

```ts
// AuthProvider.signUp — after supabase.auth.signUp
await supabase.from('profiles').insert({
  id: data.user.id,
  user_id: data.user.id,      // NOT NULL, the read key
  name: fullName?.trim() || email.split('@')[0],   // column is `name`
  avatar_url: null,
  role: 'user',
})

// onboarding — upsert on user_id
await supabase.from('profiles').upsert({
  id: user.id,
  user_id: user.id,
  name: data.name,
  school_of_thought: data.schoolOfThought || null,
}, { onConflict: 'user_id' })
```

## Reads (the app's contract)

The app resolves a profile by **`user_id` = auth uid** (see `lib/purchases/revenuecat.ts` update,
`app/onboarding.tsx`). Any new profile read/write must use `user_id`, not `id`.
(Existing rows have `id ≠ user_id`; do not assume they match.)

## How this was verified (receipts, 2026-06-09)

- Live column list pulled via `GET /rest/v1/profiles?select=*&limit=1` (service role).
- Broken shape canary → `400 / 23502` (NOT NULL user_id) and `PGRST204` (no `username`).
- Fixed shape canary with a real throwaway auth user → `201`, profile resolvable by `user_id`, then cleaned up.
- Premium is gated by RevenueCat entitlement `premium`, NOT by any `profiles` column (see DEMO_ACCOUNT / FIX-063).

Related: `BUILD_FIX_LOG.md` FIX-064, Golden Rule #2, `SYSTEM_RULES.md` Rule 032 (probe live schema) & Rule 034 (verify against production).
