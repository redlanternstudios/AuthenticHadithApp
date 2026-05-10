# CURRENT_VS_HANDOFF_AUDIT.md

**Audit date:** 2026-05-10
**Lane:** Content + AI Backend Engineer
**Source under reconciliation:** Rory Semeah, *Authentic Hadith App — Developer Handoff Brief*, May 2026 (PDF in repo root)
**Method:** every load-bearing handoff claim re-tested against
- the live production Supabase project `nqklipakrfuwebkdnhwg` via PostgREST (anon key, count-exact probes)
- the live Vercel deployment serving `authentichadith.app`
- the current `main` of this monorepo (HEAD `58ed171`)
**Companion documents:** `V1_SCHEMA_ALIGNMENT_AUDIT.md` (FIX-035), `V1_CONTENT_AI_AUDIT.md` (FIX-037), `BUILD_FIX_LOG.md`

---

## TL;DR

The handoff is a **stale snapshot from before this app's V1 sprint**. Most "empty" tables it lists are now seeded, the platform path is no longer Capacitor/Next.js, and the AI provider has changed from Anthropic to Groq. The two real-device blockers KP saw on RoPhone are **not handoff-era issues** — they are post-V1 issues that the handoff predates.

| Area | Handoff snapshot (May 2026 PDF) | Production today (2026-05-10) |
|---|---|---|
| Mobile platform | Next.js web app + Capacitor wrapper recommendation | **Expo SDK 54 / React Native 0.81.5 native app**, internal-device IPA installed |
| AI provider | Anthropic API | **Groq** (`@ai-sdk/groq`, `llama-3.3-70b-versatile`) |
| Monetization | Stripe schema present, not wired | **RevenueCat 9.9.0** wired (Apple guideline-compliant); Stripe schema dormant |
| Collections / books / chapters | "0 rows — needs seeding" | **8 / 410 / 735 rows seeded** |
| Hadiths | 31,886 | **31,886** (unchanged — only handoff fact that's still load-bearing) |
| Sahaba / story_parts | "0 rows — needs seeding" | **13 / 36 rows seeded** |
| Prophets / prophet_stories | "0 rows — needs seeding" | **25 / 43 rows seeded** |
| Learning paths / lessons | "0 rows — needs seeding" | **6 paths / 10 lessons / 10 path-lesson links** seeded |
| Sunnah categories / practices | "0 rows — needs seeding" | **10 categories / 365 practices** seeded |
| AI mobile chat route | (not in handoff) | **`/api/mobile-chat` returns HTTP 404 on prod** — cached 404, etag from 2026-04-28 |
| Musnad Ahmad rows | (not specifically called out) | **393 rows** vs aspirational ~27,647 (pre-documented content gap; KP approval required to backfill) |

**Bottom line:** The handoff's "seed everything" instructions are obsolete — running them today would either no-op (because tables are seeded) or, worse, double-seed and corrupt foreign keys. The real V1 launch blockers are (1) one mobile pagination bug already fixed in FIX-037 and (2) a missing Vercel route, neither of which the handoff anticipates.

---

## Part A — Reconciliation Table

For each load-bearing claim, the handoff is classified as:

- **already resolved** — was true at hand-off, was fixed before today
- **still true** — was true at hand-off, is true today
- **outdated** — was true at hand-off, no longer applies
- **current DB content gap** — there is still a real content gap today
- **current mobile query bug** — there is still a real mobile-side bug today
- **backend/env config gap** — there is still a real Vercel/env gap today
- **manual Apple/RevenueCat task** — out of this lane (Manual Release Ops)
- **not relevant to Expo mobile path** — handoff assumed a different platform

### Section 01 — "What Was Built"

| Handoff claim | Verified state today | Classification |
|---|---|---|
| "Built primarily in v0 / Next.js / React web app" | The deployed *web* property at `authentichadith.app` may still be Next.js (not in this repo's working tree any longer — only `external/v0-authentic-hadith/supabase/` migration stub remains). The **mobile** target — which is what KP is shipping — is `authentichadithapp/`, an Expo SDK 54 React Native app. | **outdated for the mobile path** / not relevant to Expo mobile path |
| "Live at authentichadith.app" | Confirmed reachable; sibling API routes return 200 (`/api/daily-hadith`, `/api/test-groq`, `/api/search`). | **still true** for the web property |
| "Supabase project ID `nqklipakrfuwebkdnhwg`" | Confirmed; project responds, anon key in `lib/supabase/client.ts` resolves to it. | **still true** |
| "Stripe schema is built, not yet wired end-to-end" | `subscriptions` and `stripe_events` tables exist with **0 rows** today. Mobile uses RevenueCat, not Stripe (per `lib/revenuecat/`, `lib/purchases/`, `hooks/useRevenueCatSubscription.ts`). | **outdated** for mobile path. The Stripe schema is dormant on the web side; mobile monetization is RevenueCat per Apple's IAP guideline |
| "AI features: Anthropic API (`ai_usage` table exists)" | `ai_usage` table exists with 27 rows of historical writes. **Mobile and the deployed Vercel route now use Groq**, not Anthropic. `package.json` pins `@ai-sdk/groq 1.2.9`; the local `app/api/chat/route.ts` shim invokes `createGroq({apiKey: process.env.GROQ_API_KEY})`; the env file lists `GROQ_API_KEY` — `ANTHROPIC_API_KEY` is also listed but is not what mobile calls today. | **outdated** — provider switched. The mobile contract is Groq, not Anthropic |
| "Schema is complete and production-grade. Content was not fully seeded. Most tables exist but are empty." | This was true at hand-off. Today **almost every table the handoff named as empty has been seeded** during the V1 sprint (FIX-035). See Section 02 reconciliation below. | **already resolved** for almost every named table |

### Section 02 — Supabase Audit Reconciliation

Live PostgREST count probes, executed today against `https://nqklipakrfuwebkdnhwg.supabase.co`:

| Table group | Handoff status | Today's row count (verified) | Classification |
|---|---|---:|---|
| `hadiths` | "31,886" | **31,886** | **still true** |
| `hadith_enrichment`, `hadith_tags`, `hadith_tag_weights`, `hadith_topics` | "Live" | All exist; `hadith_tags` 88 rows, `hadith_enrichment` reachable (HTTP 200) | **still true** |
| `profiles`, `user_preferences`, `user_stats`, `user_streaks`, `user_activity_log` | "Live, 2 users seeded" | All RLS-protected, reachable. User count not probed (RLS hides). | **still true** |
| `achievements`, `user_achievements` | "33 achievements seeded" | **`achievements` = 33** rows | **still true** |
| `promo_codes`, `redemptions` | "3 promo codes" | **`promo_codes` = 3**, `redemptions` reachable | **still true** |
| `collections`, `books`, `chapters`, `hadith_books`, `collection_hadiths` | "Empty — 0 rows — needs seeding" | **`collections` = 8**, **`books` = 410**, **`chapters` = 735**, `hadith_books` reachable (HTTP 200), **`collection_hadiths` = 31,886** | **already resolved**. The handoff's "needs seeding" prompt for collections is obsolete and must NOT be re-run |
| `sahaba`, `story_parts`, `sahaba_reading_progress`, `shareable_snippets` | "Empty — needs seeding" | **`sahaba` = 13**, **`story_parts` = 36**, mirrors reachable | **already resolved**. Handoff names `companions / companion_stories` — the production tables are `sahaba / story_parts` (alias map in V1_SCHEMA_ALIGNMENT_AUDIT.md). The handoff path would create duplicate empty tables; do not run |
| `prophets`, `prophet_stories`, `prophet_reading_progress` | "Empty — needs seeding" | **`prophets` = 25**, **`prophet_stories` = 43**, mirror reachable | **already resolved** |
| `learning_paths`, `learning_modules`, `learning_lessons`, `learning_quiz_questions` | "Empty — needs seeding" | **`learning_paths` = 6**, **`lessons` = 10** (handoff's `learning_modules` / `learning_lessons` are aliased to mobile's `path_lessons` (10) + `lessons` (10)), `learning_quiz_questions` is now `quiz_questions` (created in FIX-035; empty by design pending authored content) | **already resolved at the schema level**. **`lesson_hadith` join table is still empty** (genuine content gap, not blocking — V1 lessons render their own `content` text) |
| `saved_hadiths`, `discussions`, `reflections`, `reading_progress`, `user_bookmarks` | "Waiting for users" | All reachable; `reading_progress` and `user_bookmarks` are RLS-bounded user tables. `saved_hadiths` is RLS-bounded; mobile reflections piggyback on `saved_hadiths.notes` per FIX-035 | **still true** (user-driven tables; expected empty when no users) |
| `subscriptions`, `stripe_events` | "Empty — Stripe not wired yet" | **0 rows** today; mobile uses RevenueCat, not Stripe | **outdated**. Stripe schema is dormant. Re-wiring it is not on the mobile critical path |
| `sunnah_categories`, `sunnah_practices`, `sunnah_tracking` | "Empty — needs seeding" | **`sunnah_categories` = 10**, **`sunnah_practices` = 365** (full year), `sunnah_tracking` reachable | **already resolved** |
| `topics`, `hadith_topics`, `categories`, `tags`, `tag_aliases`, `enrichment_reviews` | "Empty — needs seeding" | **`topics` = 10**, **`tags` = 168**, `tag_aliases`/`enrichment_reviews` reachable | **already resolved** |
| `ai_usage` | (mentioned only in passing) | **27 rows** — historical Anthropic-era writes | **still true at the table level**, but the provider it logs is now obsolete since mobile uses Groq. Not blocking |

### Section 03 — "Instructions for Claude" (the seed prompts)

The PDF's six paste-this-into-Claude prompts are designed to seed an empty database. **Today they would either no-op or actively double-seed and corrupt unique constraints.** None should be run.

| Handoff prompt | Verified state today | Classification |
|---|---|---|
| Step 1 — Verify the connection (`pg_stat_user_tables`) | Read-only, harmless to run; results above | **still true** (safe; just informational) |
| Step 2 — Seed `collections` with 7 collections + populate `collection_hadiths` from `collection_slug` | `collections` already has 8 rows (handoff missed Sunan Ibn Majah in its seven). `collection_hadiths` already has 31,886 rows. Re-running would either fail on `slug` UNIQUE or insert a duplicate 8th collection | **outdated — DO NOT RUN.** Already resolved |
| Step 3 — Seed `sahaba` with 5 companions + 2 `story_parts` per | 13 sahaba and 36 story_parts already exist. Re-running risks PK collision or duplicate names | **outdated — DO NOT RUN** |
| Step 4 — Seed `prophets` with 4 prophets + 2 `prophet_stories` per | 25 prophets and 43 prophet_stories already exist | **outdated — DO NOT RUN** |
| Step 5 — Seed one `learning_paths` row + 2 `learning_modules` + 3 `learning_lessons` | 6 paths, 10 lessons, 10 path-lesson links already exist. Handoff's `learning_modules` / `learning_lessons` table names don't match production (production: `lessons` + `path_lessons`) | **outdated — DO NOT RUN** |
| Step 6 — Seed 3 `sunnah_categories` + 3 `sunnah_practices` per | 10 categories and 365 practices (a full year) already exist | **outdated — DO NOT RUN** |

### Section 04 — "Getting Into Xcode" (Capacitor vs Expo)

| Handoff claim | Verified state today | Classification |
|---|---|---|
| "Option A: Capacitor wrapper (fastest)" | We did not take this path. There is no Capacitor config in `authentichadithapp/`, no `npx cap` artifacts, no `next export` setup. | **not relevant to Expo mobile path** |
| "Option B: Expo / React Native (recommended)" | **This is the path that was taken.** App is Expo SDK 54, internal-device IPA already installed on RoPhone, EAS profiles configured (`eas.json`), bundle ID `com.byred.authentichadith` | **already resolved** (KP and prior agents executed Option B) |
| "Apple sometimes rejects thin wrappers" | Moot now that we're native | **not relevant** |

### Section 05 — Environment Variables

| Handoff env var | Verified state today | Classification |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mobile equivalents are `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `app.config.js`, `lib/supabase/client.ts`). Both are set in `.env.local` and resolve to `nqklipakrfuwebkdnhwg`. | **still true** in spirit; just renamed for Expo |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only; in `.env.local` (per Section 06 of `.env.example`-style listing). Not bundled into mobile JS | **still true** |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Listed in `.env.local` for the historical web work; not used by mobile (RevenueCat path) | **outdated for mobile path**. Manual Apple/RevenueCat task if web monetization is ever revived |
| `ANTHROPIC_API_KEY` | Listed in `.env.local`. **Not what the deployed Vercel route or local `app/api/chat/route.ts` shim uses.** They use `GROQ_API_KEY` | **outdated**. The required env var on Vercel is **`GROQ_API_KEY`**, not Anthropic |
| (Not in handoff:) `GROQ_API_KEY` | Required by the local `app/api/chat/route.ts` shim and by the missing-on-Vercel `/api/mobile-chat` route. Currently set in `.env.local`. **Vercel production env: unverified — likely needs to be set** | **backend/env config gap** |
| (Not in handoff:) `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | Set in `.env.local`. RevenueCat SDK confirmed initialised at runtime per FIX-031 narrative | **still true** |

### Section 06 — Priority Order (handoff's 3-week plan)

| Handoff week | Verified state today | Classification |
|---|---|---|
| Week 1 — "Connect Supabase MCP, run audit, seed collections / Sahaba / Prophets" | Audit done; **all named seeding is already done**. Re-doing it would corrupt | **already resolved — DO NOT RE-DO** |
| Week 1 last bullet — "Verify authentichadith.app shows content in all sections" | Web property is out of this lane; mobile-side parity confirmed in `WEB_TO_MOBILE_PARITY_AUDIT.md` | **still true (verification only)** |
| Week 2 — "Choose Capacitor or Expo, get to TestFlight" | Expo chosen, internal-device IPA installed on RoPhone. TestFlight submission is the next external step | **already resolved through internal IPA**. TestFlight upload is Manual Release Ops (out of this lane) |
| Week 3 — "Seed learning paths and sunnah practices, connect Stripe webhooks, prepare App Store listing" | Learning paths and Sunnah practices already seeded. Stripe is dormant; mobile path is RevenueCat. App Store listing prep is Manual Release Ops | Mix of **already resolved**, **outdated**, and **manual Apple/RevenueCat task** |

---

## Part B — Missing Hadith Diagnosis (re-verified today)

> **Reading note on PostgREST count syntax.** Probes use `Prefer: count=exact` + `Range: 0-0`. The `content-range` response header has the form `<rangeStart>-<rangeEnd>/<totalCount>`. So `0-0/8` means *"items 0..0 returned out of 8 total"* — **the table has 8 rows, not zero.** A genuinely empty table responds with `*/0`. This convention is applied throughout this document.

### Raw counts vs linkage counts

| Layer | Count today | Verified by |
|---|---:|---|
| Raw `hadiths` rows | **31,886** | `Range: 0-0` against `hadiths` |
| `hadiths.collection_slug` denormalized | **31,886** (sum across the 8 known slugs) | per-slug `count=exact` probe (full table below) |
| `collection_hadiths` join table | **31,886** | `Range: 0-0` against `collection_hadiths` |
| `hadiths` with NULL `collection_slug` | **0** | `collection_slug=is.null` |
| `hadiths` with non-canonical slug (outside the 8) | **0** | `collection_slug=not.in.(8 slugs)` |
| `books` total | **410** | direct count |
| `books` per collection (sum) | **410** = 98 + 57 + 43 + 49 + 52 + 38 + 63 + 10 | `collection_id` filter per collection |
| `chapters` total | **735** | direct count |

Linkage is clean — no orphan hadiths, no wrong slugs, and the denormalized `hadiths.collection_slug` total matches the `collection_hadiths` join total exactly.

### Per-collection (re-run 2026-05-10)

```
sahih-bukhari            7,277 hadiths   98 books   (declared total_hadiths: 7,277)
sahih-muslim             7,167 hadiths   57 books   (declared total_hadiths: 7,167)
sunan-abu-dawud          3,751 hadiths   43 books   (declared total_hadiths: 3,751)
jami-tirmidhi            3,241 hadiths   49 books   (declared total_hadiths: 3,241)
sunan-nasai              5,045 hadiths   52 books   (declared total_hadiths: 5,045)
sunan-ibn-majah          3,524 hadiths   38 books   (declared total_hadiths: 3,524)
muwatta-malik            1,488 hadiths   63 books   (declared total_hadiths: 1,488)
musnad-ahmad               393 hadiths   10 books   (declared total_hadiths:   393)  ← see below
                       -------
                        31,886 hadiths  410 books
```

Seven of eight collections are 100% of their declared totals. The DB is **not** the gap — every collection screen would render the full count if mobile asked for it correctly.

### Musnad Ahmad — UI consistency check

The handoff narrative and `V1_SCHEMA_ALIGNMENT_AUDIT.md` reference an aspirational target of ~27,647 hadiths for Musnad Ahmad. **That number is not in the production DB and not in the mobile codebase.**

- `collections.total_hadiths` for `musnad-ahmad` = **393** (the actual row count). Live verification: `curl ... /collections?slug=eq.musnad-ahmad` returns `{"slug":"musnad-ahmad","total_hadiths":393}`.
- Repo grep for `27647`, `27,647`, `27 647`: **zero matches** in `app/`, `components/`, `hooks/`, `lib/`.
- Every screen that renders Musnad Ahmad's count reads `collections.total_hadiths` directly:
  - `app/(tabs)/collections.tsx:56` → `{item.total_hadiths} hadiths`
  - `app/collection/[slug].tsx:206` → `{collection.total_hadiths?.toLocaleString() || '0'}`
  - `app/progress.tsx:55-79,171` → uses it as the denominator for completion percentage

So the Musnad Ahmad screen will render *"393 hadiths"* and show 393 of 393 once a user reads them. It will **not** appear visually broken to a user the way "100 of 259 visible" does on a chapter screen. **Therefore Musnad Ahmad is unlikely to be the screen KP saw**, unless KP specifically expected the 27,647 figure.

Sparse-book evidence: the 393 Musnad Ahmad hadiths span only 8 distinct `book_number` values: `[1, 2, 3, 5, 6, 7, 8, 31]`. Books 4, 9-30, 32+ are absent. That uneven distribution is the signature of partial seed data, not a sort or pagination bug.

### Mobile collection detail query path (verified)

| Screen | What it queries | Cap | Verdict |
|---|---|---|---|
| `app/(tabs)/collections.tsx` | `collections.*` ordered by `name_en` | none (8 rows) | OK |
| `app/collection/[slug].tsx` | `collections` by slug + `books` by `collection_id` (no hadiths fetched here) | none (max 98 books) | OK |
| `app/book/[id].tsx` | `books` by id + `chapters` by `book_id` (no hadiths fetched here) | none (max ~95 chapters) | OK |
| `app/chapter/[id].tsx` | `hadiths` by `collection_slug` + `book_number` | **was 100 → now 1000** (FIX-037 commit `0174c57`) | **Fixed**. Largest book is 574; cap raised to 1000 = PostgREST default ceiling |
| `app/hadith/[id].tsx` | single hadith by id | n/a | OK |

The chapter screen does not currently consume the `collection_hadiths` join table even though that table has a `chapter_id` column that would permit true per-chapter scoping. Today the chapter screen returns *every hadith in the parent book* (because the `hadiths` table has no `chapter_id` column). That is a documented design tradeoff (`V1_SCHEMA_ALIGNMENT_AUDIT.md`, FIX-008 narrative in `BUILD_FIX_LOG.md`) and is not the source of "missing" hadiths — it would cause *too many* to appear, not too few. Wiring `collection_hadiths` for true per-chapter filtering is a post-V1 enhancement.

### Classification

| Class | Status |
|---|---|
| `DB_CONTENT_GAP` | **partial** — only Musnad Ahmad has a real gap (393 / ~27,647). KP's prior decision: do not bulk-import without verified source approval (`V1_SCHEMA_ALIGNMENT_AUDIT.md` § "Must NOT be faked"). All other 7 collections are at 100% |
| `MOBILE_QUERY_LIMIT_BUG` | **was true; now FIXED** — `app/chapter/[id].tsx` was capped at 100 rows per book. Many books exceed that (Bukhari book 10: 259, Sahih Muslim book 5: 395, Muwatta Malik book 15: 574). Raised to 1000 in FIX-037 (`0174c57`). PostgREST default cap is 1000; largest book is 574; safe margin |
| `MOBILE_CACHE_STALE` | **ruled out** — mobile has no offline hadith cache. React Query default cache only. No bundled hadith fallback dataset. Sunnah has a fallback (FIX-033) but it is gated by Rule 030 (live data wins) |
| `WRONG_COLLECTION_MAPPING` | **ruled out** — slugs in code match production exactly; verified against `collections.slug` |
| `EXPECTED_MUSNAD_AHMAD_GAP` | **applies for Musnad Ahmad only** — this is the only collection whose UI count looks broken. Pre-documented; KP-decision pending |
| `UNKNOWN_NEEDS_KP_SCREENSHOT` | **applies if** KP saw missing content on a collection *other than* Musnad Ahmad and *other than* a chapter screen on a book larger than 100 hadiths. If KP can attach a screenshot of which screen + which collection, classification can be tightened |

**Most likely interpretation of "the other hadiths never downloaded":** KP opened a chapter inside a large book (Bukhari book 10 = 259 hadiths is a likely candidate), saw the first 100, scrolled, and never got more. **FIX-037 already addresses this.** A new internal-device IPA built off `0174c57` or later should resolve the symptom.

---

## Part C — AI Summary Diagnosis (re-verified today)

### Endpoint contract

`lib/api/groq.ts` posts to `${API_CONFIG.baseUrl}/api/mobile-chat`. With `EXPO_PUBLIC_API_URL` resolving to `https://authentichadith.app`, the effective URL is **`https://authentichadith.app/api/mobile-chat`**.

Mobile sends payload shape `{ "messages": [ {"role":"user","content": "<prompt>"} ] }`.

Three call sites:
- Home "Hadith of the Moment" inline AI Summary (`components/hadith/HadithCard.tsx`, FIX-033 `showSummarize` prop)
- Hadith detail "AI Summary" button (`app/hadith/[id].tsx`)
- Assistant tab full chat (`app/(tabs)/assistant.tsx`)

All three funnel through `sendChatMessage()`.

### curl test (re-run 2026-05-10) — exact endpoint status, response body, and headers

```
$ curl -i -L -X POST "https://authentichadith.app/api/mobile-chat" \
       -H "Content-Type: application/json" \
       -d '{"message":"Summarize this hadith briefly: Actions are judged by intentions.",
            "context":{"source":"Sahih al-Bukhari","grade":"Sahih"}}'

HTTP/2 307                                          ← apex → www redirect
location: https://www.authentichadith.app/api/mobile-chat
content-type: text/plain
server: Vercel

HTTP/2 404                                          ← actual response after redirect
content-type: text/html; charset=utf-8
content-length: 50690
etag: "dc07c1d7be439073f002e79594a68780"
last-modified: Tue, 28 Apr 2026 10:25:44 GMT
x-matched-path: /404
x-next-error-status: 404
x-vercel-cache: HIT
```

**Response body type:** `text/html; charset=utf-8` (not JSON). 50,690 bytes. The first response chunk is the standard Next.js 404 error page. Body identification:

```
<title>404: This page could not be found.</title>
... 404: This page could not be found ...
```

Tested both the handoff-spec single-message shape `{message, context}` and the mobile-app shape `{messages: [...]}` — **both return the identical 404 HTML page**, 50,690 bytes each. The route does not differentiate by payload because it is not present at all.

The 404 has been the cached, stable production response for **12+ days** (etag and `last-modified` from 2026-04-28; `x-vercel-cache: HIT`). This rules out a transient outage and rules out a middleware/runtime failure of the route — Next.js's 404 renderer is the *framework's* fallback, served when no matching route file exists. A live route that threw or that lacked an env var would surface as a 5xx with JSON, not the framework 404.

Sibling routes still healthy:

```
GET /api/chat          -> 405  (route exists; method-not-allowed for GET)
GET /api/mobile-chat   -> 404  (route does not exist)
GET /api/daily-hadith  -> 200
GET /api/test-groq     -> 200
GET /api/search        -> 200
```

The deployment is generally healthy; **only `/api/mobile-chat` is missing**. The route source previously lived at `external/v0-authentic-hadith/app/api/mobile-chat/route.ts` (per `WEB_TO_MOBILE_PARITY_AUDIT.md`), but that subtree is no longer in this monorepo (only `external/v0-authentic-hadith/supabase/` remains).

### Classification (final)

**Primary: `BACKEND_ROUTE_ERROR`**

| Class | Verdict | Evidence |
|---|---|---|
| `VERCEL_ENV_MISSING_GROQ_API_KEY` | **Cannot be the surface symptom; may be a secondary issue once route is restored.** | A missing key would surface as 503 with JSON `{error: "AI assistant unavailable"}` (per the local shim at `app/api/chat/route.ts:34-44`). Observed response is HTML 404 from Next.js's framework renderer with `x-matched-path: /404` — the request never reaches a route handler |
| `MOBILE_ENDPOINT_WRONG` | **No.** | Mobile URL is the URL the system was designed around (`/api/mobile-chat`). The mobile code is correct; the backend deployment is missing the file |
| `BACKEND_ROUTE_ERROR` | **PRIMARY.** | `/api/mobile-chat` is not present in the current Vercel deployment; sibling routes are healthy; cached 404 is 12+ days old |
| `PAYLOAD_SHAPE_BUG` | **Cannot be tested while route is 404.** | Both `{message, context}` and `{messages: [...]}` shapes return identical 404. Mobile shape `{messages: [...]}` matches the contract used by the local Groq shim and the historical FIX-031 narrative |
| `UI_FALLBACK_ONLY` | **Already addressed in FIX-037 (`0174c57`).** | Hadith detail screen now uses the same friendly inline `summaryError` block as `HadithCard.tsx`. `Alert.alert` popup removed |
| `UNKNOWN_NEEDS_LOGS` | **No.** | curl evidence is decisive — the response is the framework 404, not a route-handler error |

### Anthropic vs Groq mismatch

The handoff says "AI features: Anthropic API." That is **not what the mobile contract expects today.** Mobile's `lib/api/groq.ts` and the local `app/api/chat/route.ts` shim both call Groq via `@ai-sdk/groq`, model `llama-3.3-70b-versatile`. The Vercel route, when it is restored, must be the Groq variant (it can keep writing telemetry to `ai_usage` if the schema accepts the new provider name, but the request flow is Groq). If KP or anyone asks "should we wire Anthropic instead?" — that is a **provider-switch** decision, explicitly disallowed in the FIX-037 brief, and would be its own scoped sprint.

---

## What Rory's handoff got right

1. **Hadith count: 31,886.** Still exact today.
2. **Supabase project ID `nqklipakrfuwebkdnhwg`.** Confirmed; the app and audit talk to it.
3. **Schema is "production-grade."** The schema is genuinely solid; gaps were always content, not structure. V1 sprint completed the seeding. Three forward-looking tables (`quiz_questions`, `study_notes`, `user_progress_events`) added in FIX-035.
4. **"The gaps are content, not code."** Largely true *at the time of the handoff*. The two real-device blockers KP saw on RoPhone were code (chapter pagination) + backend deploy (mobile-chat route), not content — but those are post-handoff issues the handoff predates.
5. **AI features intent.** Correctly anticipated AI Summary as a feature. Just wrong about the provider.

## What is outdated

1. **Platform path.** Capacitor / Next.js wrapper recommendation is moot — Expo / React Native is shipped and on device.
2. **"Empty" tables.** `collections`, `books`, `chapters`, `sahaba`, `story_parts`, `prophets`, `prophet_stories`, `learning_paths`, `lessons`, `path_lessons`, `sunnah_categories`, `sunnah_practices`, `topics`, `tags` are all seeded. **Re-running the handoff's seed prompts would corrupt foreign-key state.**
3. **Stripe path.** Mobile is RevenueCat per Apple guidelines. Stripe schema is dormant.
4. **Anthropic provider.** Mobile contract is Groq. The `ANTHROPIC_API_KEY` env var the handoff lists is not what the mobile path needs; the missing one is `GROQ_API_KEY` on Vercel.
5. **3-week plan.** Most of weeks 1-2 is already done. Week 3's Stripe webhooks are not on the V1 mobile critical path.
6. **Table-name aliases.** The handoff names `companion_stories` (404 in production today) and `learning_modules` / `learning_lessons` (the production names are `story_parts` and `lessons` / `path_lessons`). Documented in `V1_SCHEMA_ALIGNMENT_AUDIT.md` alias map.

## What is still missing today

1. **`/api/mobile-chat` on the Vercel deployment.** The route returns a cached 404 and has done so for 12+ days. Route source is no longer in this repo's `external/v0-authentic-hadith/`. **Fix: redeploy the web app from its source repo with the route file present.** Owner: web/Vercel deploy lane.
2. **`GROQ_API_KEY` on Vercel production environment.** Even when the route is restored, it will return 503 unless the env var is set. **Owner: KP (Vercel dashboard).**
3. **Musnad Ahmad content gap (393 / ~27,647).** Pre-documented. KP-decision required to bulk-import; do not fake. Not blocking for V1 if empty-state on that one collection is acceptable.
4. **`lesson_hadith` join table empty.** 10 lessons render their own `content` text. Not blocking; richer hadith linking can layer on later.
5. **Manual Apple/RevenueCat dashboard setup.** Out of this lane (Manual Release Ops). Includes App Store Connect listing, screenshots, RevenueCat product / offering wiring.
6. **TestFlight upload of internal IPA.** Out of this lane (Manual Release Ops).

---

## Whether missing hadiths are DB content gap or mobile loading bug

**Mobile loading bug** (now fixed in FIX-037 commit `0174c57`), with one isolated **DB content gap** (Musnad Ahmad, pre-documented).

The seven collections KP would normally browse are at 100% in production. The bug was that `app/chapter/[id].tsx` capped the chapter screen at 100 hadiths, silently truncating any book over 100. That cap was raised to 1000 in FIX-037. A fresh internal-device IPA built off `0174c57` (or later) should make "the other hadiths" actually download.

If, after the new IPA, KP still sees missing content, it will be one of:
- He's looking at Musnad Ahmad (393 vs 27,647 — content gap, KP decision)
- He's looking at a screen this audit hasn't surfaced (would need a screenshot of the affected screen)

## Whether AI Summary is Vercel/env issue or mobile code issue

**Vercel deploy issue** (route missing), with a downstream **env config gap** likely waiting (`GROQ_API_KEY`).

The mobile code is correct. URL is correct. Payload shape is correct. Friendly fallback now in place on every call site (FIX-037). The fix is not in mobile code. The fix is:

1. Restore `/api/mobile-chat` in the deployed Vercel project (route source is no longer in this monorepo).
2. Verify `GROQ_API_KEY` is set in Vercel → Settings → Environment Variables → Production.
3. Trigger redeploy.
4. Verify with: `curl -i -X POST "https://authentichadith.app/api/mobile-chat" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Test."}]}'` → expect HTTP 200 + JSON.

Until that is done, mobile users see the friendly *"Summary is temporarily unavailable. Please try again later."* fallback. Reading and browsing hadiths is unaffected.

---

## Recommended fix order

1. **Web/Vercel deploy lane (KP or whoever owns the web repo):** redeploy `authentichadith.app` with `/api/mobile-chat/route.ts` present + `GROQ_API_KEY` in Vercel env. Verify with the curl above. — **Highest priority; only blocker remaining for AI Summary feature parity.**
2. **Manual Release Ops:** TestFlight upload of an internal IPA built off commit `0174c57` (FIX-037 baseline) or later, so KP can re-test the chapter content fix on RoPhone.
3. **Real-device QA (Runtime QA Commander lane):** rerun the chapter sweep on a large book (e.g. Bukhari book 10 with 259 hadiths) and confirm all 259 download; rerun the AI Summary sweep once Step 1 is done.
4. **KP content decision:** declare whether Musnad Ahmad's 393 / 27,647 gap blocks V1. If yes, scope a sourced bulk-import sprint (sunnah.com API or equivalent) — do NOT fake content.
5. **Long-tail (post-V1):** wire `lesson_hadith` content as authored material is finalised; revisit Stripe wiring only if a web monetization SKU is reintroduced.

---

## Files changed (this audit)

- `CURRENT_VS_HANDOFF_AUDIT.md` (new — this file)
- `V1_CONTENT_AI_AUDIT.md` (existing from FIX-037; appended a "Reconciliation note" pointing to this file)

No code changes in this audit pass. Mobile code fixes for the chapter cap and the AI Summary fallback were already shipped in **FIX-037 commit `0174c57`** on `main`.
