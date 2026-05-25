# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟢 No active errors

### Latest fix: FIX-045 (AI Assistant spinner hang) — code complete, device verification PENDING
KP reported "the AI Assistant is currently not working correctly" on a TestFlight build. AskUserQuestion narrowed it to: spinner shows after send, never returns, no red error banner appears. Live probe of `https://www.authentichadith.app/api/mobile-chat` returned HTTP 200 in 2.84s with the correct `{response: string}` shape — backend healthy. cURL also handled the apex 307→www redirect cleanly in 2.37s.

Root cause was the **mobile transport layer**, not the backend: `PRODUCTION_API_URL` was the apex `https://authentichadith.app`, which 307-redirects to www. iOS NSURLSession (under React Native fetch) has documented edge cases where a 307 with a POST body silently stalls — and `lib/api/groq.ts` had **no client-side timeout** (NSURLSession's default `timeoutIntervalForResource` is 7 days), so a stalled fetch never resolved or rejected, leaving `isLoading=true` and never triggering the assistant.tsx catch block that would show the error banner.

Fix applied three places:
1. `lib/config/constants.ts` — `PRODUCTION_API_URL` apex → `https://www.authentichadith.app`.
2. `app.config.js` — `apiUrl` env fallback apex → `https://www.authentichadith.app`.
3. `lib/api/groq.ts` — added `AbortController` + 12s timeout, DEV log on `AbortError` path, DEV log on malformed-payload path.

Typecheck clean (`npx tsc --noEmit` → exit 0). **Manual TestFlight verification PENDING.** Next physical pass on the Assistant tab should confirm: (1) "What does Sahih Bukhari say about prayer?" returns grounded response in <10s, (2) "Is coffee halal?" returns scholar-deferral string instantly (no network), (3) airplane-mode-mid-request surfaces the red error banner + Retry within ~12s.

**Out-of-band**: `eas env:list --environment production | grep -i API_URL`. If `EXPO_PUBLIC_API_URL` is set to apex, update it to www. so the env override matches the code default.

**AC3 (Supabase session-history reload on Assistant reopen) was dropped from scope** — repo-wide grep confirmed no chat-persistence code or migrations have ever existed. Implementing AC3 is net-new feature work, not a fix. Tracked separately.

See `BUILD_FIX_LOG.md` FIX-045 for the full root-cause + lesson + files-changed log.

---

### Prior fix: FIX-044 (Learning Paths) — code complete, simulator verification PENDING
KP reported "the learning paths are not loading correctly." Production probe (anon key) confirmed `learning_paths` has 6 rows, `lessons` 10, `path_lessons` 10, RLS allows anon SELECT, and the `[pathId]` embed query returns 4 lessons for the Foundations path. The data and queries are healthy.

Root cause was **spec coverage**, not data: `app/(tabs)/learn.tsx` rendered title/description/level/hours but never wired a progress indicator, even though AC #1 required one and AC #3 required cross-screen completion reactivity. Fix added a `path_lessons` query, `useCompletedItems('lesson')` subscription to the local progress store, a `progressByPath` memo, and an emerald progress bar + "X / Y lessons" caption on every card (free and premium). Also added `__DEV__ && console.error` upstream of every Supabase throw in `app/(tabs)/learn.tsx` and `app/learn/[pathId].tsx` so future failures surface in Metro / LogBox instead of vanishing into React Query.

Typecheck clean (`npx tsc --noEmit` → exit 0). **Manual simulator verification of the 3 acceptance criteria has NOT been run from this session** — the next physical pass on a booted iPhone simulator should confirm: (1) cards render in <3s with the progress bar, (2) Foundations → 4 lesson cards, (3) Mark Complete on a lesson → Learn screen bar advances to 1/4.

See `BUILD_FIX_LOG.md` FIX-044 for the full root-cause + lesson + files-changed log.

---

### Prior fix: FIX-042 (Subscription) — verified
The prior issue (subscription screen silently swallowing degraded-mode failures and surfacing a useless generic "Something went wrong. Please try again." Alert on purchase rejection) was resolved by `FIX-042` in `BUILD_FIX_LOG.md`. Two surgical changes in `app/settings/subscription.tsx`:

1. The init `useEffect` now calls `isRevenueCatConfigured()` and inspects `offerings.availablePackages` after the parallel fetch, setting `initError` with a specific message for degraded mode vs. empty-offerings. The screen no longer falls through to the misleading "No subscription plans available right now" fallback.
2. `handlePurchase` and `handleRestore` now use a new `extractPurchaseError(err, fallback)` helper that prefers RevenueCat's structured error fields (`readableErrorCode`, `code`, `userInfo.readableErrorCode`, `underlyingErrorMessage`) over `err.message`, so the most actionable failure modes (`PURCHASE_NOT_ALLOWED_ERROR`, `STORE_PROBLEM_ERROR`, etc.) no longer collapse into the generic catch-all.

### Verification trace (2026-05-23)

```bash
npx tsc --noEmit
# → clean (no new errors introduced; pre-existing unrelated expo-sqlite warning unchanged)
```

Manual physical verification still required:
1. Open Profile tab → Subscription, confirm tiers render when RevenueCat is fully configured.
2. Reproduce degraded mode locally (blank `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` in `.env.local`) → screen now shows the explicit "In-app purchases are unavailable right now…" message.
3. Tap a tier with sandbox not signed in → Alert now surfaces a `readableErrorCode`-based message instead of the catch-all string.

---

## TESTFLIGHT READINESS SNAPSHOT (2026-05-18)

| Check | Result |
|-------|--------|
| `npx expo-doctor` | 17/17 pass |
| `npx tsc --noEmit` | 0 errors |
| Pinned dependency versions (12) | All exact match |
| `app.json` bundle ID | `com.byred.authentichadith` ✓ |
| `app.json` version | `1.0.0` |
| `ITSAppUsesNonExemptEncryption` | `false` ✓ (no export compliance prompt) |
| `eas.json` `submit.production.ios.ascAppId` | `6764673665` ✓ |
| `eas.json` `appVersionSource` | `remote` (EAS manages build number) |
| `eas.json` `production.autoIncrement` | `true` ✓ |
| EAS production env vars | 6 EXPO_PUBLIC_* keys present ✓ |
| `https://www.authentichadith.app/api/mobile-chat` | HTTP 200 ✓ |

**Next physical step**: trigger the production build with `eas build --profile production --platform ios`, then `eas submit --profile production --platform ios` once the build artifact is ready.

---

## RELATED DOCUMENTS

- `BUILD_FIX_LOG.md` entry `FIX-042` — full root cause, fix, and lesson for the subscription error-surfacing fix.
- `BUILD_FIX_LOG.md` entry `FIX-040` — env pipeline issue: 6 `EXPO_PUBLIC_*` keys pushed to EAS production.
- `BUILD_FIX_LOG.md` entry `FIX-031` — RevenueCat configure + degraded-mode hardening that this fix builds on.

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. There is no active mobile bug. Proceed to your task.
2. If a new mobile error appears, replace this entire file with a fresh 🔴 ACTIVE intake matching the prior format (Headline, Reproduction, Root cause hypothesis, Build identity, Classification, Severity, Recommended fix paths, Ruled-out items).
3. Do NOT delete or edit `BUILD_FIX_LOG.md` historical entries.
4. Before any TestFlight or App Store submit, run these three checks in order. If ANY fail, file a fresh 🔴 entry:
   ```bash
   npx expo-doctor
   npx tsc --noEmit
   eas env:list --environment production    # must show the 6 EXPO_PUBLIC_* keys
   curl -s -o /dev/null -w "HTTP %{http_code}\n" -L -X POST \
     "https://www.authentichadith.app/api/mobile-chat" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"ping"}]}'
   ```
5. Never push `.env.local` to EAS without first filtering to `EXPO_PUBLIC_*` only. Server-only secrets (Stripe, Supabase service role, OpenAI, Groq, TruthSerum private key, Sunnah/Hadith API keys) live on the Vercel web backend, not on EAS Build infra.
