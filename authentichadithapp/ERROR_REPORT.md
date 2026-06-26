# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟢 No active errors

**Current state**: Build 80 (v1.1.0, build 80) SUBMITTED to TestFlight. Contains FIX-116 (Sign In with Apple), FIX-119 (bookmark save), FIX-121 (push token schema), FIX-122 (SIWA Apple Developer Portal capability). Rule 034 all 3 probes GREEN (2026-06-25). Awaiting KP Rule 040 device QA on physical iPhone before Submit for Review.

**SwarmClaw audit (2026-06-25):** 3 Medium bugs must be fixed before Rule 040 passes cleanly:
- Problem 2: SaveHadithModal dark mode broken (components/my-hadith/SaveHadithModal.tsx — static COLORS)
- Problem 3: PaywallScreen + CustomerCenterScreen dark mode broken (components/premium/ — static COLORS)
- Problem 1 (KP decision): queryClient.clear() on signout (lib/auth/AuthProvider.tsx — forbidden zone, one-line fix)

**Build 80 receipts**:
- EAS Build ID: `a1d564e0-66b7-478d-be4a-63b6fde812d9`
- App Version: 1.1.0, Build Number: 80
- Commit: `7ed62cd1` on `main`
- Provisioning profile: RL2RYR793P (with SIWA entitlement)
- EAS Submission ID: `e3e075fd-b2a8-48e2-bce5-7d20faa3437c`
- TestFlight status: SUBMITTED ✅
- TestFlight URL: `appstoreconnect.apple.com/apps/6764673665/testflight/ios`
- `npx tsc --noEmit` → EXIT:0 (last confirmed on Build 80 EAS build machine)

**Previous Build 77 receipts (superseded by Build 80)**:
- EAS Build ID: `4947bf11-5c46-4d3d-af37-31905a1dfab4` · Build Number: 77 · Commit: `d18a515`

**Remaining gate**: Rule 040 — KP device QA on physical iPhone (8-item checklist + dark mode check) required before "Submit for Review" in ASC. Content Integrity items below remain open governance decisions (not code bugs).

---

## 🔴 CONTENT INTEGRITY — open, decision required (2026-06-07)

> App ships to the Ummah and is named "Authentic Hadith." KP directive: do not exaggerate or misrepresent. Read-only retried audit of the 7 shipping collections (31,493 rows). Full detail in `BUILD_FIX_LOG.md` AUDIT-061.

1. **Grades unreliable (CRITICAL)** — 29,879 sahih / 1,610 hasan / **4 daif**. Near-zero daif across the Sunan (which contain many weak narrations) is implausible → grade labels are heuristic, not scholar-verified. Bukhari+Muslim (14,444) are sound on consensus; the other 5 collections' grades cannot be stood behind as-is. Decision: source authoritative gradings, OR hide grade labels, OR ship Bukhari+Muslim only for V1.
2. **Empty rows as hadiths** — 369 empty english_text (Muslim 203 fully blank), 387 empty arabic_text. Inflates the count; blank cards on unfiltered surfaces.
3. **Duplicates** — 169 dup `hadith_number` rows (Tirmidhi 77, Bukhari 36, Ibn Majah 31, Malik 12, Abu Dawud 7, Muslim 6).
4. **Narrator** — empty 44% (Muslim 99%); regex-extracted, best-effort only, never authoritative.

Until (1)–(3) are resolved, the displayed total (31,493) is mildly overstated and grade labels on the 5 non-Sahihayn collections overstate authenticity. These are content/governance calls, not code bugs.

---

> Diagnosed 2026-06-04. All three are server-side. Build 20 reads live data from Supabase `nqklipakrfuwebkdnhwg` (nq) and live AI from `https://www.authentichadith.app`. Fixing the backend fixes Build 20 with NO new build required. Production writes + deploy are GATED (see .claude/rules) — awaiting KP approval.
>
> **2026-06-05 update:** BUG-B closed (Arabic backfilled, 14,115 rows). Also discovered + fixed a local-only Supabase misconfig: `.env.local` (dev) pointed at the wrong stray project `lwklogxdpjnvfxrlcnca`; repointed to `nq`. EAS production env was already `nq` (verified), so no rebuild needed. See `BUILD_FIX_LOG.md` FIX-058.

### BUG-A — Musnad Ahmad only 393 hadiths (missing ~28k) ✅ RESOLVED-BY-HIDE 2026-06-07 (V1)
- Resolution: HIDDEN for V1 across all surfaces (FIX-060). sunnah.com source blocked (key 403). Re-seed + unhide in v1.1.
- Evidence: nq `hadiths` per-collection counts — bukhari 7277, muslim 7167, nasai 5045, ... musnad-ahmad **393**. nq `collections.total_hadiths` for musnad-ahmad = 393, total_books = 10. Other 7 collections complete (31,886 total).
- Root cause: Musnad Ahmad only partially seeded into nq. Source `fawazahmed0/hadith-api` CDN (`eng-ahmad` / `ara-ahmad`) has the full corpus.
- Fix: re-seed musnad-ahmad into nq via `external/v0-authentic-hadith/scripts/seed-from-cdn.mjs` (or `/api/seed-full`). Needs nq SUPABASE_SERVICE_ROLE_KEY. Recompute collection totals after.

### BUG-B — Arabic text missing on Bukhari + Muslim ✅ RESOLVED 2026-06-05
- Evidence (nq rows with non-empty arabic_text): bukhari **71 / 7277**, muslim **22 / 7167**, nasai 4970/5045, musnad-ahmad 393/393.
- Root cause: bulk seed loaded English but not Arabic for bukhari/muslim. App code correct (`HadithCard` renders `arabic_text`); column empty in nq.
- Fix APPLIED: ran `scripts/backfill-arabic.mjs --write` against nq with the service-role key. UPDATED bukhari **7,173** + muslim **6,942** = **14,115** rows. Remaining empty: bukhari 33, muslim 203 — these have no match in the Arabic source (`ara-bukhari`/`ara-muslim`) and are empty by design. First run died mid-Muslim on a transient ECONNRESET; added retry-with-backoff to the script and re-ran idempotently to finish. Verified via live REST reads + mid-collection alignment spot-check (Muslim #1234). No rebuild needed — data served live from nq.

### BUG-C — AI summary 404 (recurring: FIX-037 / FIX-038 / FIX-045)
- Evidence: app posts `POST https://www.authentichadith.app/api/mobile-chat` → **HTTP 404**. Site root 200, `/api/chat` 401. Route file EXISTS locally at `external/v0-authentic-hadith/app/api/mobile-chat/route.ts` but is not served in production.
- Root cause: deployed Vercel backend is out of sync with local web repo and missing the mobile-chat route. Mobile code correct.
- Fix: redeploy `external/v0-authentic-hadith` to production Vercel. PATTERN ALERT — endpoint has dropped 2+ times; deploy drift is systemic.

### DIAGNOSIS UPDATE (execution attempt 2026-06-04)
- Column safety CONFIRMED: nq `hadiths` has both legacy (`collection`,`english_translation`) and current (`collection_slug`,`english_text`) columns, kept in sync by a trigger. Zero rows with null `collection_slug`. So seed/insert paths are visible to the app.
- BUG-A BLOCKED ON DATA SOURCE: the seed source `fawazahmed0/hadith-api` contains 10 books (abudawud, bukhari, dehlawi, ibnmajah, malik, muslim, nasai, nawawi, qudsi, tirmidhi) — **NO Musnad Ahmad**. The 393 rows came from another source. Full Musnad Ahmad (~28k, Arabic + grading) must be sourced elsewhere (e.g. sunnah.com via SUNNAH_API_KEY). seed-full ran but got HTTP 403 on every CDN fetch (jsDelivr 150MB repo block) and `eng-ahmad` does not exist anyway. ZERO rows written.
- BUG-B READY: jsDelivr main host 403s (150MB), but `fastly.jsdelivr.net` / `gcore.jsdelivr.net` mirrors serve the editions (ara-bukhari 9.4MB, HTTP 200). Wrote `scripts/backfill-arabic.mjs` (dependency-free, dry-run default, updates only empty arabic_text). DRY RUN proved: bukhari 7173/7206 matchable, muslim 6942/7145 matchable (~14,100 rows fixable). BLOCKED only on nq service-role key for the write.
- BUG-C ROOT CAUSE: production deploys from `origin/main` (github.com/rsemeah/AuthenticHadithApp) which is MISSING `app/api/mobile-chat/route.ts`. Local tree has it; local main is 7 commits ahead of origin/main. Fix = get the route onto the deployed branch + Vercel redeploy (Rory's infra, gated; pushing local main carries 7 other commits).

### Inputs/decisions needed (cannot proceed safely without)
1. BUG-B: nq SUPABASE_SERVICE_ROLE_KEY (or KP runs `scripts/backfill-arabic.mjs --write`). Then ~14,100 Arabic rows fixed in minutes.
2. BUG-A: content-sourcing decision — source full Musnad Ahmad elsewhere, OR hide/flag the incomplete collection so it does not read as broken to users/reviewers.
3. BUG-C: authorization to redeploy Rory's web backend with the mobile-chat route (and how — avoid pushing 7 unreviewed commits to his main).

---

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
