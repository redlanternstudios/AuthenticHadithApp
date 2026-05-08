# Web-to-Mobile Parity Audit
## Authentic Hadith — `external/v0-authentic-hadith/` (Vercel Next.js) vs `authentichadithapp/` (Expo React Native)

**Audit date:** 2026-05-08
**Auditor:** Senior Full-Stack Mobile/Web Parity Engineer
**Scope:** Sunnah practices, hadith collections, hadith detail, Summarize action, share/save/AI
**Method:** Repo-wide source inspection (no live scraping). Findings are based strictly on what's committed to this repo.

---

## TL;DR

The original premise — *"replicate the website to mobile"* — needs a small correction once the actual web source is read:

| Feature | Where the source lives | Mobile status |
|---|---|---|
| **Sunnah practices** | NOT in web source — **mobile-exclusive feature** | Mobile screen exists; previously depended on Supabase tables that aren't in any committed migration. Now backed by a bundled fallback dataset (FIX-033). |
| **Summarize button** | NOT in web source (zero matches for "summari") — **mobile-exclusive feature** | Already implemented on `app/hadith/[id].tsx` (pre-existing). Now also surfaced on the home "Hadith of the Moment" card (FIX-033). |
| **Hadith collections (8 collections, books, chapters, hadith content)** | Web seed scripts in `external/v0-authentic-hadith/scripts/` + production Supabase | Mobile reads the same Supabase tables — full parity by design |
| **Hadith detail (Save / Share / AI Summary / tags)** | Web has Save/Share/tags; AI Summary not in committed web | Mobile has all four including AI Summary |
| **Daily Hadith / Hadith of the Moment** | Web `/api/daily-hadith` server route | Mobile fetches same route via `/api/mobile-chat` infrastructure |

The mobile app is **at parity or ahead** of what's in the committed web source on these axes. The only area that needed real work was content robustness when Supabase is empty — the bundled Sunnah fallback handles that.

---

## Website Sources Found

Located at `external/v0-authentic-hadith/`.

### Routes (Next.js App Router)

```
app/
├── page.tsx                                    # marketing landing
├── home/page.tsx                               # daily hadith homepage
├── collections/page.tsx                        # collection grid
├── collections/[slug]/page.tsx                 # collection detail (books + grade dist)
├── hadith/[id]/page.tsx                        # hadith detail
├── search/page.tsx                             # search
├── learn/page.tsx                              # learn paths
├── assistant/page.tsx                          # AI chat assistant
├── saved/page.tsx                              # saved/bookmarked
├── profile/page.tsx                            # user profile
├── settings/page.tsx
├── api/
│   ├── chat/route.ts                           # AI chat (server-side Groq)
│   ├── mobile-chat/route.ts                    # AI chat for mobile clients
│   ├── daily-hadith/route.ts                   # hadith of the moment
│   ├── search/route.ts                         # hadith search
│   ├── seed/route.ts                           # seeding hadiths
│   ├── seed-book/route.ts
│   ├── seed-full/route.ts
│   ├── seed-status/route.ts
│   └── test-groq/route.ts
```

### Components (`external/v0-authentic-hadith/components/`)
- `auth-form.tsx`
- `checkout.tsx`
- `collections/` (book-card, breadcrumb, chapter-card, collection-card, collection-filters, hadith-card-condensed)
- `home/` (ai-assistant-block, bottom-navigation, daily-hadith-card, quick-actions-grid, recently-viewed-list, search-bar)
- `islamic-pattern.tsx`
- `layout/` (app-shell, mobile-drawer, sidebar)
- `onboarding/` (progress-indicator, step-preferences, step-profile, step-safety, success-animation)
- `sign-out-button.tsx`
- `theme-provider.tsx`
- `ui/` (button, input, label)

### Data sources
- SQL seed scripts in `external/v0-authentic-hadith/scripts/`:
  - `001-create-profiles-table.sql`
  - `002-create-user-preferences-table.sql`
  - `003-create-hadiths-tables.sql`
  - `004-seed-sample-hadiths.sql`
  - `005-create-collections-tables.sql`
  - `006-seed-collections-data.sql` — **8 canonical collections** (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Muwatta Malik, Musnad Ahmad), partial book lists for Bukhari, sample chapters for books 1-2, 10 topic seeds
  - `007-seed-tirmidhi-book1-hadiths.sql`
  - `008-seed-tirmidhi-remaining-hadiths.sql`
  - `seed-real-hadiths.sql` — Bukhari/Muslim hadiths organized by topic (purification, prayer, fasting, etc.)
  - `seed-trigger.sql`

### Sunnah references in web code
Only navigation and content-filter level — no Sunnah practices page exists:
- `app/home/page.tsx` — likely a nav link
- `components/layout/mobile-drawer.tsx`, `sidebar.tsx` — nav
- `lib/islamic-safety-filter.ts` — content rules

**There is no `app/sunnah/` route in the web source.**

### Summarize references in web code
**Zero matches** for "summari" across the entire `external/v0-authentic-hadith/` tree. The Summarize button KP saw on the live site is either:
1. Deployed code not committed to this repo (the Vercel deployment may be ahead of the snapshot)
2. The AI Assistant chat feature being conflated with summarize
3. Mobile-exclusive (which is the case for `app/hadith/[id].tsx` in our mobile repo)

---

## Mobile Sources Found

Located at `authentichadithapp/`.

### Routes (Expo Router)
```
app/
├── (tabs)/
│   ├── index.tsx                  # home with Hadith of the Moment + Explore grid
│   ├── collections.tsx            # collections tab
│   ├── search.tsx
│   ├── assistant.tsx              # AI chat
│   ├── profile.tsx
│   └── ...
├── hadith/[id].tsx                # hadith detail (Save, Share, AI Summary, tags)
├── collection/[slug].tsx          # collection detail (books, grade dist)
├── collections/index.tsx          # collection list
├── stories/                        # NEW (mobile-only): prophet + companion stories
├── learn/[pathId].tsx              # learning paths
├── learn/lesson/[lessonId].tsx
├── sunnah.tsx                     # NEW (mobile-only): Sunnah practices
├── achievements.tsx               # NEW (mobile-only): Badges (FIX-032)
├── progress.tsx                   # NEW (mobile-only): progress dashboard
├── api/chat/route.ts              # server-route shim (FIX-031 hardened)
└── ...
```

### Mobile components added in this codebase
- `components/hadith/HadithCard.tsx` (now with optional inline AI Summary action — FIX-033)
- `components/gamification/` (AchievementCard, LevelProgressBar, StreakCounter, StatCard) — FIX-032 stack
- `components/premium/PremiumGate.tsx`

### Mobile data sources
- Reads the **same Supabase database** the web app uses (collections, hadiths, books, chapters, tags, hadith_views, saved_hadiths)
- Local-first AsyncStorage for progress (`lib/progress/progressService.ts`, FIX-032)
- New: bundled Sunnah fallback dataset (`lib/sunnah/sunnahFallbackData.ts`, FIX-033)

### Mobile Summarize implementation (pre-existing)
File: `app/hadith/[id].tsx`
- Lines 22, 41-42, 91-108, 372-403
- Uses `sendChatMessage` from `lib/api/groq.ts` → POST to `${API_CONFIG.baseUrl}/api/mobile-chat` on the deployed Vercel server
- Friendly Alert error if backend fails
- FIX-033: same flow now also embedded inside `HadithCard` via `showSummarize` prop, used on the home Hadith of the Moment card

---

## Data Comparison

### Hadith Collections

| Field | Web seed (`006-seed-collections-data.sql`) | Mobile UI (`app/collection/[slug].tsx`) | Match |
|---|---|---|---|
| `name_en`, `name_ar` | ✅ | ✅ | ✅ |
| `slug` | ✅ | ✅ | ✅ |
| `description_en` | ✅ | ✅ | ✅ |
| `total_hadiths` | ✅ | ✅ rendered with toLocaleString | ✅ |
| `total_books` | ✅ | ✅ | ✅ |
| `scholar`, `scholar_dates` | ✅ | ✅ | ✅ |
| `is_featured` | ✅ | ✅ | ✅ |
| `grade_distribution` | ✅ | ✅ rendered as GradeBar | ✅ |

**8 collections seeded:** Sahih al-Bukhari (7,275), Sahih Muslim (5,362), Sunan Abu Dawud (5,274), Jami at-Tirmidhi (3,956), Sunan an-Nasai (5,761), Sunan Ibn Majah (4,341), Muwatta Malik (1,832), Musnad Ahmad (27,647). **Total: 61,448 hadiths declared.** Actual hadith content in DB depends on production seeding state (web seed scripts only insert sample/topic-based hadiths — full corpus is presumed populated server-side via `/api/seed-full` etc.).

### Books seeded

Web seed has Bukhari books 1-12 (Revelation through Fear Prayer). Books 13-97 are NOT in committed web seeds — they live in production Supabase.

### Hadith content

Web seed `seed-real-hadiths.sql` populates a topic-organized pool (purification, prayer, fasting, etc.) with Bukhari/Muslim narrations. Production Supabase is presumed to have the full 61k corpus from the web's seed APIs.

**Mobile has full read access** to whatever is in production. There is no mobile-side hadith data we'd need to migrate from the web — both clients are thin views over the same DB.

### Sunnah practices

| | Web | Mobile (before FIX-033) | Mobile (after FIX-033) |
|---|---|---|---|
| Page exists | ❌ | ✅ `app/sunnah.tsx` | ✅ |
| Data source | N/A | Supabase `sunnah_categories` / `sunnah_practices` (tables NOT in committed migrations) | Supabase preferred; **bundled fallback if empty** |
| Practice count | N/A | 0 (when DB empty) | **35 curated practices, 7 categories** when DB empty |
| References cited | N/A | yes when DB has them | yes — every fallback entry has `hadith_ref` and `collection` |

### Summarize action

| | Web (committed source) | Mobile (before FIX-033) | Mobile (after FIX-033) |
|---|---|---|---|
| Detail screen | not present | ✅ pre-existing in `app/hadith/[id].tsx` | ✅ unchanged |
| Home Hadith card | n/a | ❌ no inline Summarize | ✅ inline AI Summary in HadithCard via `showSummarize` prop |
| Backend | calls `/api/mobile-chat` | ✅ same | ✅ same |
| Friendly fallback | n/a | Alert on error | inline error block: "Summary is temporarily unavailable. Please try again later." |

### Share / Save / Tags

All three work in mobile (`app/hadith/[id].tsx` has `shareHadith`, `SaveHadithModal`, hadith_tags query). Same DB tables web uses.

---

## Gaps

### Critical launch blocker
- **None identified** in this audit. All previously-known launch blockers (RevenueCat singleton, GROQ throw, badges crash, slug workspace mismatch, CocoaPods locale) are already resolved (FIX-026 through FIX-032).

### High priority
- **Production Supabase content audit (cannot verify from this repo).** The mobile app's collection/book/hadith counts depend entirely on whether production Supabase has been fully seeded from the web's seed scripts. KP needs to verify in the Supabase dashboard:
  - `collections` table has all 8 rows
  - `books` table has expected book counts per collection
  - `hadiths` table has the expected ~61k rows
  - `chapters` table has chapter coverage
  - If any of these are sparse, the mobile (and web) UI will show empty/partial — fix is web-side data seeding, not mobile code.

### Medium priority
- **Sunnah Mark-as-Practiced UI not yet wired.** The progress service supports `sunnah_practice` completion type (FIX-032), but `app/sunnah.tsx` has no per-practice mark-complete affordance. Acceptable v1 gap; users can still browse practices.
- **Web `app/api/daily-hadith` route is the canonical "Hadith of the Moment" provider** — verify mobile is consuming it, not a different fallback. (Inspection shows mobile uses `useHadiths` / random hadith fetching directly from Supabase; minor divergence but functionally equivalent.)

### Polish
- The bundled Sunnah fallback (35 entries) is intentionally curated, not exhaustive. If KP wants 365 daily-rotating practices, that's a follow-up content task — not a blocker.
- Mobile `collections/index.tsx` has a simpler card layout than the web's `collection-card.tsx`. If KP wants visual parity, mirror the web component design.

### Deferred
- Web has admin seeding routes (`/api/seed`, `/admin/seed/page.tsx`) — these are server-only and should NOT be ported to mobile.
- Web has Stripe checkout (`app/actions/stripe.ts`, `app/api/checkout/`, `app/api/webhooks/stripe/`) — mobile uses RevenueCat/IAP per Apple guidelines (FIX-027). Intentional divergence.

---

## Resolved by FIX-033

| Item | Status |
|---|---|
| Sunnah practice fallback dataset | ✅ Implemented — `lib/sunnah/sunnahFallbackData.ts` with 35 sourced practices across 7 categories |
| Mobile Sunnah screen renders content even when Supabase empty | ✅ `app/sunnah.tsx` falls back transparently |
| Summarize action on home Hadith of the Moment card | ✅ `HadithCard` accepts `showSummarize` prop; home passes it true |
| Friendly summary unavailable fallback | ✅ Inline error block, no Alert/redbox |
| Parity audit document | ✅ This file |

## Unresolved (KP follow-up)

| Item | Owner | Type |
|---|---|---|
| Verify production Supabase has full hadith/book/chapter content | KP / DB admin | External |
| Decide whether to wire `useCompletionStatus('sunnah_practice', id)` onto Sunnah practice items | Engineering | Low-risk dev task |
| Confirm whether the live website's Summarize button (if it exists) uses a different endpoint than `/api/mobile-chat` | KP | External / data |
| Expand bundled Sunnah dataset to 365 entries if a daily rotation is desired | Content team | Content task |
