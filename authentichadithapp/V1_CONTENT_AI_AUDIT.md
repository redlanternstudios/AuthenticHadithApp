# V1_CONTENT_AI_AUDIT.md

**Audit date:** 2026-05-09 (re-verified 2026-05-10)
**Scope:** real-device QA findings (1) "the other hadiths never downloaded" and (2) "AI Summary is not configured correctly"
**Auditor:** Content + AI Backend Engineer (FIX-037 sprint)
**Production Supabase:** `nqklipakrfuwebkdnhwg.supabase.co`
**Production web/API host:** `https://authentichadith.app` (Vercel)
**Method:** repo-wide source inspection + read-only PostgREST probes (anon key) + safe `curl` tests against the deployed Vercel domain.

> **2026-05-10 update.** All counts and the AI route 404 were re-verified today against live production. Findings are unchanged. Linkage integrity additionally confirmed: zero NULL-slug hadiths, zero hadiths with non-canonical slugs, `collection_hadiths` join total (31,886) matches denormalized `hadiths.collection_slug` total. Companion document `CURRENT_VS_HANDOFF_AUDIT.md` reconciles every load-bearing claim from Rory Semeah's May 2026 handoff PDF against today's state — most "needs seeding" claims in that PDF are obsolete (V1 sprint already seeded them) and must NOT be re-run.

---

## TL;DR

| Finding | Classification | Owner of fix |
|---|---|---|
| Hadith chapter screen truncates at 100 rows for any book larger than that | mobile query/pagination limit | Code (this sprint) |
| Per-collection content is otherwise complete; only Musnad Ahmad has the documented 393 / 27,647 gap | expected Musnad Ahmad gap | Content (KP) |
| `/api/mobile-chat` returns HTTP 404 on both apex and `www` hosts | BACKEND_ROUTE_ERROR | Vercel deploy / web repo (out of this lane) |
| Mobile detail screen shows raw error via `Alert.alert` when summary fails | UI_FALLBACK_ONLY (cosmetic, second-order) | Code (this sprint) |

The content gap KP saw is the chapter cap. The AI Summary failure is a backend deployment problem, not mobile code — the mobile route URL and payload are correct, the route just isn't deployed. KP needs to redeploy the web app's `/api/mobile-chat` route or rewire mobile to a route that exists.

---

## Part A — Hadith Content Diagnosis

### Classification

**mobile query/pagination limit** (primary cause for the symptom KP saw) + **expected Musnad Ahmad gap** (secondary, pre-documented).

### Evidence

**Production schema is healthy.** `hadiths` table has 31,886 rows. Per-collection counts match `collections.total_hadiths` metadata exactly:

| Collection slug | `collections.total_hadiths` | actual rows in `hadiths` |
|---|---:|---:|
| `sahih-bukhari` | 7,277 | 7,277 |
| `sahih-muslim` | 7,167 | 7,167 |
| `sunan-abu-dawud` | 3,751 | 3,751 |
| `jami-tirmidhi` | 3,241 | 3,241 |
| `sunan-nasai` | 5,045 | 5,045 |
| `sunan-ibn-majah` | 3,524 | 3,524 |
| `muwatta-malik` | 1,488 | 1,488 |
| `musnad-ahmad` | 393 | 393 |

Total: 31,886. Seven of eight collections are at 100% of their declared totals. Only **Musnad Ahmad has the known 393 / 27,647 gap** documented in `V1_SCHEMA_ALIGNMENT_AUDIT.md` § "Must NOT be faked". This is a content task, not a mobile bug, and KP has not approved bulk import.

**The mobile bug is a hardcoded 100-row cap on the chapter screen.**

`app/chapter/[id].tsx` line 71 fetches hadiths with `.limit(100)`:

```ts
const { data, error } = await supabase
  .from('hadiths')
  .select('*')
  .eq('collection_slug', parentBook!.collectionSlug)
  .eq('book_number', parentBook!.bookNumber)
  .order('hadith_number', { ascending: true })
  .limit(100)
```

Many books in production exceed 100 hadiths. Spot-check from the live database:

| Collection | Book number | Hadith count | Currently visible in chapter screen |
|---|---:|---:|---:|
| Sahih al-Bukhari | 4 | 114 | 100 |
| Sahih al-Bukhari | 8 | 160 | 100 |
| Sahih al-Bukhari | 10 | 259 | 100 |
| Sahih Muslim | 4 | 318 | 100 |
| Sahih Muslim | 5 | 395 | 100 |
| Sahih Muslim | 6 | 375 | 100 |
| Muwatta Malik | 15 ("Pilgrimage") | 574 | 100 |

Largest book in the entire corpus (queried via `books.total_hadiths`): **574 hadiths** (Muwatta Malik, "The Book of Pilgrimage"). All other books are below 500.

This matches KP's report: when a real-device user opened a large chapter, they saw the first 100 hadiths and "the other hadiths never downloaded."

### Other queries reviewed and found OK

| File | Query | Verdict |
|---|---|---|
| `hooks/use-hadiths.ts` `useHadiths` | no default limit, relies on PostgREST 1000-row cap | dead code — only `useCollections` is imported elsewhere; not user-visible. Left as-is. |
| `app/(tabs)/today.tsx` | random hadith fetch (single row) | OK |
| `app/(tabs)/index.tsx` | random hadith fetch via offset (single row) | OK |
| `app/(tabs)/search.tsx` | `.limit(50)` on results | intentional UX; OK |
| `app/topics/[slug].tsx` | `.limit(50)` on tag→hadith join | intentional UX; OK |
| `app/quiz.tsx` | random offset reads | OK |
| `app/reflections.tsx` | filtered by `saved_hadiths.notes` (RLS-bounded) | OK |
| `app/collection/[slug].tsx` | books only (8 collections, max ~410 books) | OK |
| `app/book/[id].tsx` | chapters only (max ~95 chapters/book) | OK |

### Other things ruled out

- **Wrong collection mapping.** App uses real `collection_slug` values; live data probes confirmed slugs match (`sahih-bukhari`, `sahih-muslim`, …, `musnad-ahmad`). No mapping bug.
- **Stale cache / offline fallback.** Mobile has no offline cache for hadiths. React Query uses default cache only. No bundled hadith fallback exists (per FIX-033 audit; only Sunnah practices have a fallback dataset).
- **Silent error swallowing.** Hadith hooks `throw error` on Supabase failures. React Query surfaces errors to the screen. Verified by inspection.
- **`hadith_number` ordering.** Queried sample rows: `hadith_number` is **integer**, not text — numeric ordering already correct.

### Smallest safe fix applied

**`app/chapter/[id].tsx`** — raise `.limit(100)` to `.limit(1000)`.

Rationale:
- 1000 is PostgREST's default hard cap (verified live: an unfiltered Bukhari query returns exactly 1000 of 7,277 rows).
- The largest book in production is 574 hadiths, comfortably under 1000.
- Single round trip; no pagination machinery added (Rule: minimum surface change for a bug fix).
- If the corpus ever exceeds 1000 rows in a single book, a follow-up sprint can add `range()`-based pagination. Not needed for V1.

---

## Part B — AI Summary Diagnosis

### Classification

**BACKEND_ROUTE_ERROR** (route 404 on the deployed Vercel host). With a secondary **UI_FALLBACK_ONLY** issue on the hadith detail screen (Alert popup vs the friendly inline message used on the home card).

### Endpoint that mobile calls

`lib/api/groq.ts` builds `${API_CONFIG.baseUrl}/api/mobile-chat` where `baseUrl` resolves from (in order): `EXPO_PUBLIC_API_URL` env var → `Constants.expoConfig?.extra?.apiUrl` → `PRODUCTION_API_URL = 'https://authentichadith.app'`.

Effective URL on a stock production build: **`https://authentichadith.app/api/mobile-chat`**.

Payload shape sent by mobile:

```json
{ "messages": [ { "role": "user", "content": "<prompt with hadith text>" } ] }
```

Used by:

- **Home "Hadith of the Moment" inline summary** — `components/hadith/HadithCard.tsx` (FIX-033 inline AI Summary block via `showSummarize` prop)
- **Hadith detail "AI Summary" button** — `app/hadith/[id].tsx` (`handleSummarize`)
- **Assistant tab chat** — `app/(tabs)/assistant.tsx` (full conversation)

All three paths funnel through `sendChatMessage()` in `lib/api/groq.ts`.

### curl test — what the deployed Vercel actually returns

Apex `https://authentichadith.app/api/mobile-chat`:

```
HTTP/2 307
location: https://www.authentichadith.app/api/mobile-chat
```

Following the redirect to `www`:

```
HTTP/2 404
content-type: text/html; charset=utf-8
x-matched-path: /404
x-vercel-cache: HIT
etag: "dc07c1d7be439073f002e79594a68780"
last-modified: Tue, 28 Apr 2026 10:25:44 GMT
```

The `x-vercel-cache: HIT` and 11-day-old `last-modified` confirm the 404 is a stable, cached response from the current production deployment — not a transient outage.

I tested both payload shapes (the brief's `{message, context}` shape and the mobile app's `{messages: [...]}` shape) and both return the same Next.js 404 HTML.

Sibling routes on the same host respond normally:

```
GET /api/chat          -> 405  (route exists; method-not-allowed for GET)
GET /api/mobile-chat   -> 404  (route does not exist)
GET /api/daily-hadith  -> 200
GET /api/test-groq     -> 200
GET /api/search        -> 200
```

`POST /api/chat` returned `HTTP 401` (the website's chat route requires auth). The mobile-chat route was specifically designed (per `lib/api/groq.ts` comment and BUILD_FIX_LOG entry on FIX-031) to be the unauthenticated mobile-friendly variant. It is missing from the current deployment.

### What this means by classification

| Category | Verdict |
|---|---|
| `VERCEL_ENV_MISSING_GROQ_API_KEY` | Cannot fully rule out (server doesn't even reach env-check), but the surface symptom is route-missing, not env-missing. If the route returned 503 with a friendly body, env would be the suspect; instead it returns the Next.js 404 page, which means the request never reaches the route handler. |
| `MOBILE_ENDPOINT_WRONG` | Mobile is pointed at the route the system was designed around. The route is gone from prod. So strictly speaking the mobile URL is "wrong" in the sense of "no longer resolvable," but the mobile code itself isn't doing anything incorrect — the backend is missing a piece. |
| `BACKEND_ROUTE_ERROR` | **Primary classification.** The backend deployment does not include `/api/mobile-chat`. |
| `PAYLOAD_SHAPE_BUG` | Cannot be tested while the route is 404. Mobile shape `{messages: [...]}` matches what the local `app/api/chat/route.ts` shim expects (which is the design contract). No reason to change shape now. |
| `UI_FALLBACK_ONLY` | Yes, secondary: `app/hadith/[id].tsx` line 105-107 uses `Alert.alert('Error', 'Could not generate summary…')` while `HadithCard` (FIX-033) already uses a friendly inline message. Worth aligning. |
| `UNKNOWN_NEEDS_LOGS` | No — the curl evidence is decisive. |

### Where the source for the route lives

`external/v0-authentic-hadith/` in this repo only contains a single Supabase migration file — the actual web/Vercel app source is **not present in this monorepo**. Per the parity audit (`WEB_TO_MOBILE_PARITY_AUDIT.md` line 49), the route file used to live at `external/v0-authentic-hadith/app/api/mobile-chat/route.ts`, but that subtree is no longer in this repo. Whether the deployed Vercel project still has the route source on its own deploy branch is an external question for KP to verify in the Vercel dashboard for project `authentichadith` (or wherever the deploy is wired).

### Smallest safe code fixes I can apply from this lane

1. **Friendly inline error on hadith detail screen.** Replace the `Alert.alert(…)` in `app/hadith/[id].tsx` `handleSummarize` with the same inline `summaryError` pattern already used in `HadithCard.tsx`. No new architecture; matches FIX-033 design. Result: when the backend route is restored OR while it stays down, users see *"Summary is temporarily unavailable. Please try again later."* in-line — no scary popup. **Applied this sprint.**

2. **Defensive check on response shape.** Detail screen calls `setSummary(response)` directly. Match `HadithCard.tsx`'s defensive guard (only set if response is a non-empty string). **Applied this sprint.**

### Fixes I cannot apply from this lane

- **Restoring `/api/mobile-chat` on the Vercel deployment.** The route source is not in this repo. KP needs to either redeploy the web app from its source repo with the route file present, or move the source for this route into `external/v0-authentic-hadith/` and ensure it ships with the next web deploy.
- **Setting `GROQ_API_KEY` on Vercel.** Manual dashboard task; even if the route is redeployed, it will return 503 unless the env var is set on the Vercel project for the production environment. KP-only.

### What KP needs to do on Vercel (do NOT skip)

1. Confirm the current Vercel project that serves `authentichadith.app`. (Project name on Vercel; settings → domains.)
2. Confirm the deployed source includes `app/api/mobile-chat/route.ts` (or whatever the equivalent App Router path is). If the file is missing, the route will return 404.
3. Confirm that `GROQ_API_KEY` is set in Vercel → project → Settings → Environment Variables → Production. If absent, the route will return 503 even after redeploy.
4. Trigger a redeploy.
5. Re-run the curl below to verify a 200 + JSON body:

   ```bash
   curl -i -X POST "https://authentichadith.app/api/mobile-chat" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Test."}]}'
   ```

This is **out of scope for the Content + AI Backend Engineer lane** (this lane edits mobile code only and does not touch Vercel dashboards). It is also explicitly **not a Manual Release Ops task** in the strict sense — it is a web backend deploy task. Whichever lane owns web/Vercel deploys should pick this up.

---

## Files inspected

- `lib/api/groq.ts`, `lib/config/constants.ts`, `lib/supabase/client.ts`
- `app/(tabs)/index.tsx`, `app/(tabs)/today.tsx`, `app/(tabs)/collections.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/assistant.tsx`
- `app/collection/[slug].tsx`, `app/book/[id].tsx`, `app/chapter/[id].tsx`, `app/hadith/[id].tsx`
- `app/topics/[slug].tsx`, `app/quiz.tsx`, `app/reflections.tsx`
- `app/api/chat/route.ts` (local server-route shim — confirmed dead code on device per FIX-031)
- `components/hadith/HadithCard.tsx`
- `hooks/use-hadiths.ts`, `hooks/use-hadith.ts`
- `.env.example`, `app.config.js`

## Live evidence captured

- 8 collections returned, slugs and totals match `collections.total_hadiths` exactly
- `hadiths` table has 31,886 rows total (matches sum of declared totals exactly)
- Musnad Ahmad: 393 rows in DB (declared 393; the 27,647 figure was an external aspirational target, not currently declared in `collections.total_hadiths`)
- `hadith_number` column is integer (numeric ordering correct)
- PostgREST default cap = 1000 rows (verified by no-limit query against Bukhari)
- `/api/mobile-chat` → 307 → 404 (cached, etag present, 11+ days old)
- `/api/chat`, `/api/daily-hadith`, `/api/test-groq`, `/api/search` all live

## Documentation updates from this sprint

- `V1_CONTENT_AI_AUDIT.md` — this file
- `app/chapter/[id].tsx` — chapter list cap raised from 100 → 1000
- `app/hadith/[id].tsx` — friendly inline error replaces `Alert.alert` for AI Summary failure
- `ERROR_REPORT.md` — flipped to 🔴 ACTIVE for the AI Summary backend route 404 (so the next session immediately sees it as a release blocker)
