# BUILD_FIX_LOG.md — Authentic Hadith iOS App
## Historical Repair Database

> **PURPOSE**: This is the permanent record of every bug fixed in this app. Every Claude session MUST check this log before attempting a fix — the solution may already be here. After fixing any bug, log it here using the format below. This file only grows — never delete entries.

---

## HOW TO USE THIS FILE

**For Claude**: Search this file for keywords from the current error. If a match exists, apply the documented fix. If it is a new error, fix it and add a new entry.

**For KP / Any Engineer**: This is your app repair history. Use it to spot patterns, recurring issues, and track what has been fixed. Hand this file to any new developer or AI session to give them full context on every landmine in this codebase.

---

## GOLDEN RULES (Learned from 19 bugs across 10 sessions)

These rules were extracted from recurring production failures. Violating any of them WILL break the app.

### 1. The Hadiths Table is a Flat Island
The `hadiths` table has **ZERO foreign keys**. No FK to collections, no FK to books, no FK to chapters.
- NEVER use PostgREST join syntax on hadiths: `collection:collections(*)` will FAIL silently
- ALWAYS use `.select('*')` and do separate lookups by `collection_slug` or `book_number`
- To get hadiths for a chapter: chapter → book (book_id) → collection (collection_id) → hadiths (collection_slug + book_number). Three hops.
- Valid FK joins TO hadiths: `saved_hadiths.hadith_id→hadiths.id`, `hadith_views.hadith_id→hadiths.id`

### 2. Column Names: Trust the DB, Not the Code
The #1 recurring bug (6 occurrences). Code was written against an ASSUMED schema.
- Text columns: `english_text`, `arabic_text` (NOT english_translation, text_en, text_ar)
- Name columns: `name_en`, `name_ar` (NOT name)
- Grade column: `grade` (NOT grading)
- Alias columns exist on: achievements (name, description), user_stats (xp, hadiths_read, quizzes_completed, lessons_completed, sunnah_streak, perfect_quizzes), user_streaks (active_days)
- PostgREST does NOT error on non-existent filter columns. It silently returns zero results.

### 3. RevenueCat: One File, One Truth
All RevenueCat config lives in `lib/revenuecat/config.ts`. Period.
- Entitlement ID: `premium`
- Product IDs: `ah_premium_monthly`, `ah_premium_annual`, `ah_lifetime`
- API keys come from EAS secrets via `app.config.js extra`. Never hardcode.

### 4. Native vs Web: Different Worlds
- API calls using relative paths (`/api/chat`) only work in web builds
- On iOS/Android: use the full deployed URL (`https://authentichadith.app/api/mobile-chat`)
- Always test API calls on native, not just web preview

### 5. Build Before You Ship
Before any EAS build:
- `npx tsc --noEmit` (catch type errors)
- `npx expo doctor` (catch SDK compatibility issues)
- Verify every Supabase query column name against the actual schema
- Check BUILD_FIX_LOG.md for known patterns

---

## LOG ENTRY TEMPLATE

<!--
### [FIX-XXX] — Short Error Description
**Date**: YYYY-MM-DD
**Session**: Claude Code / Cowork / Manual
**Severity**: Critical | Warning | Minor

**Error Message**:
```
[exact error message or key portion]
```

**Root Cause**: 
[One sentence — what actually caused it]

**Fix Applied**:
```
[exact commands run or code changes made]
```

**Files Changed**:
- path/to/file — what was changed and why

**Verification Command**:
```
[command that proves the fix works]
```

**Result**: Fixed / Partially fixed / Still failing

**Lesson**: 
[What to remember so this never happens again.]

---
-->

## FIXES

### [FIX-035] — V1 Mobile Schema Alignment with Production Supabase
**Date**: 2026-05-08
**Session**: Claude Code (Senior Supabase Schema Architect / V1 Release Stabilization Lead)
**Severity**: Warning — pre-emptive alignment to prevent V1 launch blockers

**Symptoms**:
- Earlier audit (`WEB_TO_MOBILE_PARITY_AUDIT.md`) reported "missing tables" for companion stories, my-hadith folders, redeem codes, daily hadiths, etc.
- Concern that visible V1 features (stories, folders, quiz, notes, sunnah, badges, learning) might be backed by missing production tables and crash on first user interaction.
- `app/stories/companion/[slug].tsx`, `app/stories/prophet/[slug].tsx`, `app/learn/lesson/[lessonId].tsx` used `.single()` on params-driven lookups — Rule 028 violation, would throw `PGRST116` on a stale deep-link slug/id.

**Root Causes**:
1. **Schema-name drift between brief and production.** The brief and earlier audit referenced `companions`, `companion_stories`, `my_hadith_folders`, `folder_hadiths`, `redeem_codes` — none of which exist in production *under those names*. Production has the same conceptual entities under different names (`sahaba`, `story_parts`, `hadith_folders` + `saved_hadiths.folder_id`, `promo_codes`). Mobile app code was already aligned to the real names; the gap was documentation, not implementation.
2. **Three V1 forward-looking tables genuinely missing:** `quiz_questions`, `study_notes`, `user_progress_events`. None are required for current screens to function (quiz generates dynamically, reflections use `saved_hadiths.notes`, progress is local-first), but creating them now unblocks future content authoring and richer UX without a schema migration close to launch.
3. **`.single()` overuse on content-by-slug queries** — three V1 detail screens would throw on a stale or invalid deep-link instead of showing a clean "not found" empty state.

**Fix Applied**:

1. Probed production Supabase via PostgREST anon key. Built a complete table inventory and alias map. Documented in `V1_SCHEMA_ALIGNMENT_AUDIT.md`.
2. Created `authentichadithapp/supabase/migrations/100-v1-schema-alignment.sql` adding three tables:
   - `quiz_questions` — authored quiz content (forward-compatible; current screen still works dynamically against `hadiths`)
   - `study_notes` — entity-flexible user notes (`hadith` | `lesson` | `story` | `sunnah_practice` | etc.)
   - `user_progress_events` — unified Supabase mirror for completion events (UNIQUE on user_id+entity_type+entity_id+action for idempotent upserts)
   All three use `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY` wrapped in `DO $$ BEGIN ... EXCEPTION duplicate_object`, and full RLS — fully idempotent and re-runnable.
3. Hardened three detail screens against bad slug/id: `.single()` → `.maybeSingle()`, added `__DEV__` warn logs for non-fatal query errors, and replaced `app/learn/lesson/[lessonId].tsx`'s silent `return null` with a clear "Lesson not found" empty state.

**Files Changed**:
- `supabase/migrations/100-v1-schema-alignment.sql` (NEW) — three forward-looking V1 tables
- `V1_SCHEMA_ALIGNMENT_AUDIT.md` (NEW) — route-by-route schema audit + alias map
- `app/stories/companion/[slug].tsx` — `.single()` → `.maybeSingle()`, non-fatal error handling
- `app/stories/prophet/[slug].tsx` — `.single()` → `.maybeSingle()`, non-fatal error handling
- `app/learn/lesson/[lessonId].tsx` — `.single()` → `.maybeSingle()`, replace silent `return null` with intentional empty state UI
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — new Rule 032 about table-name aliases
- `APP_LAUNCH_PLAYBOOK.md` — V1 schema gate checklist

**Verification**:
- `python3 -c "import json; json.load(open('package-lock.json'))"` → VALID
- `tsc --noEmit` → only 2 pre-existing errors in Expo template files (`components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`); zero errors in any file changed by this fix
- `expo-doctor` → 16/17 checks pass; sole failure is the pre-existing reanimated 3.18.2 vs 4.1.1 mismatch tied to ERROR_REPORT.md's active warm-relaunch bug, unrelated to schema work
- SQL migration syntax verified by manual review against the patterns used in existing migrations 996/997/998/999. All statements are idempotent.
- Production schema verified via PostgREST: 8 collections, 410 books, 31886 hadiths, 25 prophets, 13 sahaba, 36 story_parts, 365 sunnah_practices, 10 lessons, 0 hadith_folders (RLS), all reachable from anon key.

**Production Application Instructions**:
1. KP opens Supabase dashboard for project `nqklipakrfuwebkdnhwg`
2. SQL Editor → New query → paste contents of `authentichadithapp/supabase/migrations/100-v1-schema-alignment.sql`
3. Run. The migration is wrapped in idempotent guards; re-running is safe.
4. Verify with anon-key probe: `quiz_questions`, `study_notes`, `user_progress_events` all return HTTP 200.

**Lesson Learned**:
The "missing tables" framing in the brief was symptom-level, not root-level. The actual gap was naming-convention drift between the brief (which used semantically-named placeholders) and production (which had the same entities under different names). Always probe the live schema and build an alias map before assuming missing data is missing tables. Adding new tables when an existing one already serves the purpose creates duplicate sources of truth — exactly the kind of debt that turns into the next FIX-002.

**Pattern Category**: Schema Alignment / Route-to-Table Audit / Rule 028 (no `.single()` on params-driven lookups)

---

### [FIX-034] — Regenerate Corrupted `package-lock.json` Blocking EAS Build
**Date**: 2026-05-08
**Session**: Claude Code (Senior EAS Release Engineer)
**Severity**: Critical — every EAS build aborted in "Install dependencies"

**Problem**:
Two consecutive EAS preview iOS builds (`aa4e7b45-...`, `3fa1f5e1-...`) failed in the **Install dependencies** phase. EAS CLI surfaced only the generic "Unknown error" message; `--verbose-logs` and `--build-logger-level debug` flags affected only EAS server-side logging, not CLI output. Each build cost 60-90s before erroring.

**Root Cause** (revealed by KP-pasted EAS web log):
```
npm verbose shrinkwrap failed to load package-lock.json
Expected ',' or '}' after property value in JSON at position 112804
while parsing near "...=0.65 <1.0\"\n        \"react-native\": \"^0...."
```

`package-lock.json` was malformed JSON. Local inspection found two corruption sites:
1. **char 112804** — duplicate `"react-native"` peerDep keys with no comma between them, in `node_modules/@react-native-async-storage/async-storage`
2. **char 532824** — missing `}` and `,` between `peerDependenciesMeta` and `"node_modules/zod"` entry

Both were merge artifacts — npm rewrote the lockfile multiple times without proper deduplication or formatting. The local team didn't catch it because:
- `npm install --dry-run` reports "up to date" against cached `node_modules` even when the lockfile JSON is invalid
- `expo-doctor` doesn't validate lockfile syntax
- TypeScript and Metro don't read package-lock.json
- `npm ci` (what EAS uses) is strict and aborts immediately on parse failure

**Fix Applied**:

```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
rm package-lock.json
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm install --ignore-scripts
```

Result:
- Lockfile shrank from 14,311 lines → 13,440 lines (corruption was bloating with duplicate entries)
- `python3 -c "import json; json.load(...)"` → ✅ valid JSON
- `npm ci` replay in `/tmp/test-ci/` sandbox installed 639 packages cleanly (exactly what EAS does)

**Files Changed**:
- `package-lock.json` — regenerated from scratch (914 insertions, 1786 deletions in diff stat)
- `EAS_PREVIEW_BUILD_01.md` — full build history (Build #1, #2 failed; Build #3 succeeded)
- `ERROR_REPORT.md` — documented diagnostic order, reset to 🟢 after Build #3 succeeded
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — Rule 031 added

**Verification**:
- ✅ Local TS clean
- ✅ Local `expo-doctor` 17/17
- ✅ Local `npm ci` sandbox replay installed 639 packages
- ✅ **EAS Build #3 (`7f408c96-a815-4de4-820d-2b3a317b7b54`) succeeded** in 10:33 — produced installable simulator IPA at `https://expo.dev/artifacts/eas/gHoFdJunVtDYkm7KYv8bpf.tar.gz`

**Result**: Fixed. Three commits documented this loop:
- `ac6c0ea` — removed orphan `lib/offline/` (correct cleanup, but unrelated to this build failure)
- `bda7fdc` — honest stop-point after wrong hypothesis was disproved
- `9a93dbf` — actual fix (lockfile regen)

**Lesson**:
When EAS "Install dependencies" fails with opaque CLI output, **validate `package-lock.json` JSON first**:
```bash
python3 -c "import json; json.load(open('package-lock.json'))"
```
If invalid, `rm package-lock.json && npm install --ignore-scripts` fixes it. Don't speculate about JS source issues until the lockfile JSON is verified parseable.

The cost of two extra builds (~5 min each, real EAS credits) was avoidable if the CLI had surfaced the parse error. Bug in EAS CLI UX, but ours to work around.

The orphan `lib/offline/` directory removal in commit `ac6c0ea` was good cleanup (those files were genuinely dormant + unused) but did NOT cause or fix this build failure. Keep it removed.

**Pattern Category**: EAS Build / lockfile integrity / opaque-CLI workaround

---

### [FIX-033] — Web-to-Mobile Parity: Sunnah Fallback Data + Home Summarize Button
**Date**: 2026-05-08
**Session**: Claude Code (Senior Full-Stack Mobile/Web Parity Engineer)
**Severity**: Medium — content robustness + UX parity

**Problem**:
Runtime QA surfaced concerns that the mobile app was missing content compared to the deployed web version, specifically:
1. The Sunnah practices screen could go empty if the Supabase `sunnah_categories` / `sunnah_practices` tables were unseeded (and these tables are not in any committed migration in this repo).
2. The web home page reportedly has a Summarize affordance; the mobile home Hadith of the Moment card had only a Refresh action — no inline summary.
3. Hadith collection and detail content was suspected to be partial.

**Audit findings** (full document: `WEB_TO_MOBILE_PARITY_AUDIT.md`):
- The committed web source (`external/v0-authentic-hadith/`) does NOT have a Sunnah page. Sunnah is mobile-exclusive.
- The committed web source has ZERO matches for "summari" — Summarize is also mobile-exclusive. The mobile hadith detail screen (`app/hadith/[id].tsx`) already implements it (pre-existing).
- Hadith collections/books/hadith content is read from the same Supabase database by both web and mobile. There's no mobile data gap to migrate from web — both are thin clients over one DB. Production seed completeness is a DB admin question, not a mobile code question.
- The actual gaps were: (a) Sunnah goes empty if DB is unseeded; (b) Summarize is buried on the detail screen, not exposed on home.

**Fixes Applied**:

1. **`lib/sunnah/sunnahFallbackData.ts` (new)**: Curated 35 well-known Sunnah practices across 7 categories (Purification, Prayer, Daily Adhkar, Eating & Drinking, Sleep & Waking, Greetings & Manners, Fasting). Each practice has a stable id, hadith_ref, source collection, and day_of_year anchor. DEV-only duplicate-id and orphan-category-id checks at module load.

2. **`app/sunnah.tsx`**: Local-first fallback. When Supabase returns 0 categories, the screen renders the bundled dataset transparently. Live data wins whenever ≥1 category is returned. "Today's Sunnah" rotation now deterministically falls back to `dayOfYear % length` if no exact day match exists.

3. **`components/hadith/HadithCard.tsx`**: New optional `showSummarize` prop. When true (and not compact), renders an inline "AI Summary" button + result/error block under the hadith. Calls the same `sendChatMessage` flow the detail screen uses (POST `/api/mobile-chat`). Friendly fallback message: *"Summary is temporarily unavailable. Please try again later."* — no Alert popup, no redbox.

4. **`app/(tabs)/index.tsx`**: Home passes `showSummarize` to the Hadith of the Moment card.

**Files Changed**:
- `lib/sunnah/sunnahFallbackData.ts` (new, ~430 lines)
- `app/sunnah.tsx` (fallback wiring)
- `components/hadith/HadithCard.tsx` (showSummarize prop + inline AI Summary block)
- `app/(tabs)/index.tsx` (pass showSummarize)
- `WEB_TO_MOBILE_PARITY_AUDIT.md` (new — full audit)
- `BUILD_FIX_LOG.md` (this entry)

No web code changed. No native iOS files changed. No packages installed.

**Verification**:
```bash
npx tsc --noEmit
# → only pre-existing unrelated expo-sqlite warning. No new TS errors.
```

Manual test checklist (KP):
1. Open Sunnah screen → 7 categories, 35 practices visible (or live Supabase data if seeded)
2. Tap each category → expands to show practices with hadith refs
3. Today's Sunnah card at top changes daily (day_of_year rotation)
4. Open home → tap "AI Summary" on Hadith of the Moment card → loading spinner → summary text in green-bordered block
5. If Groq endpoint is down: friendly "Summary is temporarily unavailable" — no redbox, no Alert
6. Tap card body → still navigates to hadith detail (Pressable navigation preserved)

**Result**: Fixed. Parity work documented honestly in `WEB_TO_MOBILE_PARITY_AUDIT.md` — including the finding that several "missing" features (Sunnah, Summarize) are actually mobile-exclusive features the web doesn't have.

**Lesson**:
A "port web to mobile" task starts with reading both sources, not assuming the web is a superset. In this case the mobile app had MORE features than the web (Sunnah practices, Summarize, Stories, Badges, Progress dashboard) and the actual gap was thinner than presumed. Always run a parity audit doc BEFORE migrating data — it's faster than building the wrong thing.

The bundled fallback pattern (`lib/sunnah/sunnahFallbackData.ts`) is reusable for any feature that depends on optional remote data. Local-first wins when the spec is "must work even if backend is empty."

**Pattern Category**: Web-mobile parity / content robustness / local-first fallback

---

### [VERIFY-033] — Runtime Smoke Test 01 (post-FIX-032)
**Date**: 2026-05-08
**Session**: Claude Code (Senior iOS Runtime QA Automation Engineer)
**Type**: Verification — no code changes

**What was verified**:
- ✅ Cold launch produces a clean home screen render with all FIX-031 fixes intact (no GROQ throw, no i18n warning, no RevenueCat singleton error, RevenueCat configure logs success)
- ✅ Metro bundles in 1.4–5.8s with zero errors
- ✅ TypeScript compiles cleanly (one pre-existing unrelated `expo-sqlite` warning)
- ✅ All FIX-032 wiring is correct end-to-end via code inspection: prophet/companion/lesson screens use `useCompletionStatus`, achievements screen reads only from `useBadges`/`useProgressSummary` (no Supabase queries that can fail)
- ✅ AsyncStorage backing dir confirmed at the iOS simulator container path. Currently empty (no completions yet — clean baseline).
- ✅ Display name on home screen is "Authentic Hadith" (FIX-026 verified visually via simulator home screen icon label)

**What required manual KP action**:
Tap-driven flows could not be reliably automated — `xcrun simctl` lacks a tap subcommand, AppleScript synthetic clicks were partially blocked by accessibility permission scope and competed with KP's other foreground apps. The following require KP's hands:
1. Tap Badges tile → confirm screen renders with 9 badges (mostly locked first launch), no crash
2. Tap a Prophet/Companion story → tap Mark as Complete → button immediately shows "✅ Completed"
3. Navigate away + back → still Completed
4. Force-quit + relaunch → still Completed (AsyncStorage persistence)
5. Open Badges after a completion → confirm corresponding badge unlocked
6. Tap a lesson → tap Mark as Complete → "✅ Lesson Completed" → auto-back

**Findings worth promoting**:

1. **`react-native-reanimated` warm-relaunch SIGABRT (HIGH severity, dev-only)**.
   100% reproducible: terminate the app via `simctl terminate` and immediately re-launch while same Metro session is running → SIGABRT in `-[ReanimatedModule installTurboModule] +__assert_rtn`. Two iOS DiagnosticReports captured (`AuthenticHadith-2026-05-08-160713.ips`, `…-162138.ips`). **Cold launches work cleanly** — the issue is JS context reuse on warm relaunch within a dev-client+Metro session. Production EAS builds embed the JS bundle and do not exhibit this path; cold-launch is the same path that works in dev. KP must verify on a real device with an EAS preview IPA before final ship.

2. **Sunnah completion UI not implemented**. `app/sunnah.tsx` is a read-only practice browser. Service supports the `sunnah_practice` type but no consumer screen wires it. Acceptable v1 gap; "First Sunnah" badge cannot unlock until UI ships.

3. **RevenueCat offerings dev-only error confirmed** as known FIX-031 external blocker (Apple Dev Portal IAP not enabled). Not a regression.

**Remaining risks**: documented in `RUNTIME_SMOKE_TEST_01.md` (created this session, committed alongside this entry).

**Recommendation**: Build EAS preview IPA now and test on a real device. The dev-client warm-relaunch crash is not a build blocker — it likely doesn't reproduce on a clean cold launch from a TestFlight install. Real-device verification is the gate.

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build --platform ios --profile preview --non-interactive
```

**Pattern Category**: Runtime QA / verification milestone

---

### [FIX-032] — Stabilize Badges and Unified Progress Completion System
**Date**: 2026-05-08
**Session**: Claude Code (Senior React Native Product Systems Engineer)
**Severity**: Critical — Badges crash blocked an entire feature; completion persistence had been entirely cosmetic for lessons (TODO-only) and partially broken for stories (no UI refresh).

**Symptoms**:
1. Tapping the **Badges** tile on the home screen crashed/closed the app.
2. Stories: tapping **Mark as Complete** fired a Supabase upsert but the screen never reflected the change — button stayed visible, no state refresh, fire-and-forget `trackActivity` could throw silently.
3. Lessons: **Mark as Complete** was a literal TODO that just called `router.back()` — no persistence, no XP, no progress.
4. Sunnah: no completion UI at all.
5. Progress data was scattered across 5+ Supabase tables (`prophet_reading_progress`, `sahaba_reading_progress`, `user_lesson_progress`, `user_stats`, `user_streaks`) plus undefined `achievements`/`user_achievements` tables that don't exist in any committed migration. No client-side single source of truth. Unauthenticated users had zero progress capability.

**Root Causes**:

1. **Badges crash**: `app/achievements.tsx` queried `supabase.from('achievements')` and `from('user_achievements')` and `from('user_stats').single()`. The `.single()` call throws PGRST116 when no row exists (every first-time user). The `achievements`/`user_achievements` tables don't exist in any migration. Without an `error` check or `maybeSingle()`, the queryFn threw → React Query error → screen unmounted abruptly. Also imported static `COLORS` (Rule 017 violation) for theming.

2. **Stories Mark as Complete didn't refresh**: `handleMarkComplete` in `app/stories/prophet/[slug].tsx` and `companion/[slug].tsx` did `await supabase.from(...).upsert(...)` but never called `queryClient.invalidateQueries`, so the `progress` query (which the `isComplete` flag was derived from) stayed stale. The UI showed "Mark as Complete" indefinitely. Also `trackActivity(...)` was unawaited (fire-and-forget) — its `.single()` on missing `user_stats` would throw an unhandled rejection.

3. **Lesson Mark as Complete was a literal TODO**: `app/learn/lesson/[lessonId].tsx:60-64` just called `router.back()`. No persistence, no XP. The button accomplished nothing.

4. **No unified progress source**: every screen invented its own progress query against its own table. Guest users had zero progress. Restart preserved nothing if Supabase was unavailable. Badge eligibility had no real signal source.

**Fixes Applied**:

Created **`lib/progress/progressService.ts`** — local-first AsyncStorage-backed service:
- Storage: `@authentic_hadith/progress/v1` with version + records array
- API: `markComplete(type, id, metadata?)`, `isComplete(...)`, `getCompleted(type?)`, `getProgressSummary()`, `getBadges()`, `subscribe(listener)`, `refresh()`, `_resetForTesting()`
- Completion types: `story | lesson | sunnah_practice | course | daily_hadith`
- Best-effort Supabase mirror (lazy-imported, never throws): writes to `prophet_reading_progress` / `sahaba_reading_progress` (story with `entityKind` metadata), `user_lesson_progress` (lesson). Sync failure is silent in DEV warn.
- Defensive parsing: corrupted store → fresh empty
- Idempotent: `markComplete` returns existing record without duplicating
- Subscriber notify pattern so all hooks reactively re-render on any write

Created **`hooks/useProgress.ts`** — React hooks that consume the service:
- `useCompletionStatus(type, id)` → `{ isComplete, isLoading, isMarking, markComplete }`
- `useCompletedItems(type?)` → `{ records, isLoading }`
- `useProgressSummary()` → `{ summary, isLoading }`
- `useBadges()` → `{ badges, isLoading }`

Each subscribes to `progressService.subscribe(...)` so a write from any screen propagates everywhere on the next render.

Rewrote **`app/achievements.tsx`**:
- Reads ONLY from `useBadges()` and `useProgressSummary()` — no Supabase queries that can fail or crash
- Theme-aware via `useTheme() + getColors(isDark)` (Rule 017 compliance)
- 9 calculated badges (Seeker, First Story, First Lesson, First Sunnah, 5-of-each tiers, 7-day streak, 25-total Dedicated)
- Filter chips: All / Unlocked / Locked
- Empty state: "Complete lessons, stories, and Sunnah practices to unlock badges."
- XP derived from local progress so level math works without Supabase
- Cannot crash on missing data, missing auth, missing schema, or first launch

Updated **`app/stories/prophet/[slug].tsx`** + **`app/stories/companion/[slug].tsx`**:
- Replaced direct `supabase.from(...).upsert(...)` + isComplete-from-query with `useCompletionStatus('story', slug)`
- Mark-as-Complete now: optimistic local write → notify all subscribers → background Supabase mirror with `entityKind` metadata so the service can resolve the right legacy table
- `trackActivity(...)` wrapped in try/catch
- Available to all users (was previously gated on auth — now guests get local progress too)
- Loading state on the button (`isLoading={completion.isMarking}`)

Updated **`app/learn/lesson/[lessonId].tsx`**:
- Replaced TODO with full completion: `useCompletionStatus('lesson', lessonId)` + `markComplete()` + best-effort `trackActivity('complete_lesson')`
- Brief 600ms delay before `router.back()` so the user sees the "✅ Lesson Completed" badge state
- New "Lesson Completed" badge styling

Hardened **`lib/gamification/track-activity.ts`**:
- `single()` → `maybeSingle()` for both `user_stats` and `user_streaks` (no PGRST116 throws on missing rows)
- `updateStreak` wrapped in try/catch — streak failure no longer tanks the rest of trackActivity

Hardened **`app/progress.tsx`**:
- All `.single()` calls on `user_stats` / `user_streaks` switched to `.maybeSingle()`

**Files Changed**:
- `lib/progress/progressService.ts` (new, ~330 lines)
- `hooks/useProgress.ts` (new)
- `app/achievements.tsx` (rewritten)
- `app/stories/prophet/[slug].tsx` (completion flow refactor)
- `app/stories/companion/[slug].tsx` (completion flow refactor)
- `app/learn/lesson/[lessonId].tsx` (TODO → real persistence)
- `lib/gamification/track-activity.ts` (single → maybeSingle hardening)
- `app/progress.tsx` (single → maybeSingle hardening)
- `BUILD_FIX_LOG.md` (this entry)
- `SYSTEM_RULES.md` (Rules 026, 027, 028 — see below)
- `APP_LAUNCH_PLAYBOOK.md` (Runtime QA progression checklist)
- `ERROR_REPORT.md` (status remains 🟢)

**Verification**:

```bash
npx tsc --noEmit
# → only pre-existing unrelated expo-sqlite error (dormant feature, not introduced)

LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client
xcrun simctl launch F5384F69-2BE1-40DC-806B-B4C45F03736A com.byred.authentichadith
xcrun simctl openurl F5384F69-2BE1-40DC-806B-B4C45F03736A "exp+authentichadithapp://expo-development-client/?url=http://localhost:8081"
```

Result: Metro bundle clean (5.8s on cached, 0 errors). Home screen renders with content. Bundle includes the new progress service / hooks / achievements screen. App launches without redbox. The remaining "RevenueCat SDK Conf..." dev-only toast is the FIX-031 known issue (Apple Developer Portal IAP not enabled — pending KP manual task), not a regression.

**Remaining manual verification** (requires KP to physically tap, since macOS Automation permission for `xcrun simctl ui tap` is not yet granted):
1. Tap Badges tile → confirm screen renders with 9 badges (locked state on first launch), no crash
2. Open a Prophet story → tap Mark as Complete → button immediately shows "✅ Completed"
3. Navigate away and back → still Completed
4. Hard restart app → still Completed (AsyncStorage persistence)
5. Open Badges → confirm "First Story" badge unlocked
6. Open a lesson → tap Mark as Complete → "✅ Lesson Completed" → auto navigate back
7. Open Badges → confirm "First Lesson" badge unlocked

**Lesson**:
Three patterns surfaced as worth permanent rules (see SYSTEM_RULES Rules 026-028):
- Completion / progress writes must go through a unified service, not direct table upserts. Component-only state is not persistence.
- Local-first storage is the contract for any user-progress feature. Backend mirror is best-effort.
- Screens that display calculated state (badges, level, summary) must compute from the unified service, never query progress tables directly. They must render with empty defaults on first launch.

The `achievements`/`user_achievements` tables referenced by the old code don't exist in any committed migration. Future work: either ship a migration if server-side achievements are needed for cross-device sync, or remove the references entirely. For now, the local-first calculation is sufficient for shipping.

**Pattern Category**: Product state architecture / Local-first persistence / Crash-proof UI

---

### [FIX-031] — Harden Runtime Startup Services (RevenueCat, AI Env Validation, i18n)
**Date**: 2026-05-08
**Session**: Claude Code (Senior React Native Runtime Engineer)
**Severity**: Critical (3 redbox-level startup errors — all blocked the home screen)

**Problems**:
Post-FIX-030 launch smoke test surfaced three startup runtime errors that prevented the home screen from rendering:

1. `app/api/chat/route.ts:6` threw at module load when `process.env.GROQ_API_KEY` was undefined. Expo Router bundles every file under `app/` into the client JS bundle, including server-side route files. Server-only secrets are not in the client bundle, so the throw fired on every device launch.
2. `RevenueCatProvider.tsx:55` surfaced "There is no singleton instance" because `Purchases.configure()` was never called. The provider's comment claimed configure happened in `_layout.tsx` but no such call existed. Customer info / offerings calls then hit the unconfigured singleton.
3. `lib/i18n/i18n.ts` used `compatibilityJSON: 'v4'` which requires `Intl.PluralRules`. Hermes ships without full Intl support. i18next emitted an ERROR-level log to React Native LogBox warning the user.

**Root Causes**:
1. **Server route bundled into client**: Module-load throws are appropriate for server-only code only when guaranteed not to be loaded in the client. Expo Router's behavior breaks that guarantee. Fix: move env validation inside the request handler so it only runs when the route is invoked on the server.
2. **Two parallel configure paths, neither wired up**: `lib/purchases/revenuecat.ts` had a `configureRevenueCat()` function but nothing called it. `RevenueCatProvider.tsx` directly imported `Purchases` and assumed configure happened upstream. Fix: route the provider through `configureRevenueCat()` so both modules share one `isConfigured` truth, and have the helper return a boolean rather than `void` so the provider can detect degraded mode.
3. **i18next v4 plural format requires Intl**: `compatibilityJSON: 'v3'` uses the older format that does not need `Intl.PluralRules`. Existing translation files work unchanged because the project does not currently use plural keys with v4-only ICU syntax.

**Fixes Applied**:

```typescript
// app/api/chat/route.ts — moved env check inside POST handler
export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'AI assistant unavailable',
          details: 'The AI assistant is temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }
    const groq = createGroq({ apiKey })
    // ... rest of handler ...
  }
}

// lib/purchases/revenuecat.ts — configureRevenueCat now returns boolean,
// isRevenueCatConfigured() exposed for the provider.
export function isRevenueCatConfigured(): boolean { return isConfigured }
export async function configureRevenueCat(supabaseUserId?: string): Promise<boolean> {
  if (!Purchases) return false
  if (isConfigured) return true
  const apiKey = Platform.select({...})
  if (!apiKey) {
    __DEV__ && console.warn('[RevenueCat] No API key — degraded mode (no IAP).')
    return false
  }
  try { Purchases.configure({ apiKey }) } catch { return false }
  isConfigured = true
  return true
}
// All exported data functions (getOfferings, getSubscriptionStatus, restorePurchases,
// purchasePackage) now also short-circuit on `!isConfigured`.

// lib/revenuecat/RevenueCatProvider.tsx — provider now:
// - calls configureRevenueCat() before any default-instance method
// - tracks isConfigured + purchasesAvailable + error state
// - wraps getCustomerInfo and getOfferings in their own try/catch so a data
//   fetch failure (expected on simulator without StoreKit Config) does not
//   surface as a misleading "Initialization error"
// - exposes context: isConfigured, purchasesAvailable, error
// - restorePurchases now returns Promise<CustomerInfo | null> in degraded mode

// lib/i18n/i18n.ts
i18n.use(initReactI18next).init({
  // ...
  compatibilityJSON: 'v3', // was 'v4' — v3 does not require Intl.PluralRules (Hermes-safe)
})
```

**Files Changed**:
- `app/api/chat/route.ts` — moved GROQ_API_KEY check + Groq client init inside POST handler; returns 503 with friendly message if key missing
- `lib/i18n/i18n.ts` — `compatibilityJSON: 'v4'` → `'v3'`
- `lib/purchases/revenuecat.ts` — `configureRevenueCat()` returns boolean; `isRevenueCatConfigured()` exported; data functions short-circuit on `!isConfigured`
- `lib/revenuecat/RevenueCatProvider.tsx` — degraded-mode handling, configure routed through helper, isolated catch blocks for getCustomerInfo / getOfferings, expanded context with `isConfigured` / `purchasesAvailable` / `error`
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — Rules 023, 024, 025 added (see below)
- `APP_LAUNCH_PLAYBOOK.md` — runtime-startup preflight added
- `ERROR_REPORT.md` — reset to 🟢

**Verification**:

Re-ran smoke test:
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client --clear
xcrun simctl launch F5384F69-2BE1-40DC-806B-B4C45F03736A com.byred.authentichadith
xcrun simctl openurl F5384F69-2BE1-40DC-806B-B4C45F03736A "exp+authentichadithapp://expo-development-client/?url=http://localhost:8081"
```

Result:
- Bundle 49.7s (cleared cache)
- ✅ No GROQ_API_KEY redbox
- ✅ No i18next pluralResolver redbox
- ✅ No "RevenueCat singleton not configured" redbox
- ✅ Home screen renders: greeting, title, hadith count (36,246), Explore grid (Today/Quiz/Stories/Sunnah/Progress/Badges), Hadith of the Moment with Arabic + Sahih Muslim 1978 attribution, Refresh button
- RevenueCat SDK confirms native init: `SDK Version - 5.67.1`, `Bundle ID - com.byred.authentichadith`, `Purchases is configured with StoreKit version 2`, `Delegate set`
- Remaining dev-mode toast: native SDK debug log about offerings fetch — expected on simulator without StoreKit Config and before Apple Developer Portal IAP capability is enabled. Resolves automatically once KP completes the manual external setup.

```bash
npx tsc --noEmit
# → only pre-existing unrelated error: lib/offline/sqlite-db.ts (expo-sqlite not installed; dormant feature)
```

**Result**: Fixed at app layer. App launches to home screen cleanly. Ready for full 13-step UI smoke test once KP grants macOS Automation permission for auto-foreground.

**Lesson**:
Three patterns surfaced as worth permanent rules (see SYSTEM_RULES Rules 023-025):
- Server-only code paths must not throw at module load — Expo Router does NOT guarantee server-only files stay out of the client bundle
- SDK singletons (RevenueCat, Stripe, Sentry, etc.) must never be called before their explicit `configure()` succeeds; provider patterns should track `isConfigured` and gate every default-instance method behind it
- Optional services must degrade gracefully with no startup redbox when env keys are missing in dev — return a degraded-mode state instead of throwing

The mobile assistant calls the deployed Vercel server's `/api/mobile-chat` (verified via `lib/api/groq.ts`), NOT the local `app/api/chat/route.ts`. The local route is dead code in the mobile client — it just had to stop throwing at module load.

**Pattern Category**: Runtime startup hardening / Degraded-mode providers / Server-route bundling

---

### [FIX-030] — Patch Slug-Derived Stale Workspace Reference for Local Expo iOS Run
**Date**: 2026-05-08
**Session**: Claude Code (Senior iOS Release Engineer)
**Severity**: High (blocked every local `expo run:ios`; not blocking EAS)

**Problem**:
```
xcodebuild: error: The workspace named "AuthenticHadithApp" does not contain a scheme named "AuthenticHadith".
xcodebuild exited with error code 65.
```

**Root Cause**:
`app.json` has `expo.name = "Authentic Hadith"` (drives `ios/AuthenticHadith.xcodeproj`) and `expo.slug = "authentichadithapp"` (drives `ios/AuthenticHadithApp.xcworkspace`). Expo SDK 54's internal prebuild step (which runs as part of `expo run:ios`) regenerated the slug-derived workspace with a stale `<FileRef location="group:AuthenticHadithApp.xcodeproj">` — pointing at a project that no longer exists. The slug-derived path was Expo CLI's preferred workspace selection, so xcodebuild was invoked against the broken one.

This is structural: the `name` ≠ `slug` mismatch will keep producing the broken workspace on every future `expo run:ios` until either (a) `expo prebuild --clean` regenerates everything consistently, or (b) `expo.slug` is changed to align with `expo.name`. Both have side effects, so a local-only patch is the chosen workaround.

**Fix Applied** (Option A from ERROR_REPORT.md):
```bash
sed -i '' 's|AuthenticHadithApp.xcodeproj|AuthenticHadith.xcodeproj|g' \
  ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata
```

The workspace file is in a gitignored directory (`ios/` is fully gitignored). The edit is local-only and does not affect commits, EAS builds, or any other environment.

**Files Changed**:
- `ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata` — patched `AuthenticHadithApp.xcodeproj` → `AuthenticHadith.xcodeproj` (gitignored, not committed)
- `BUILD_FIX_LOG.md` — this entry
- `APP_LAUNCH_PLAYBOOK.md` — workaround documented in Section 5 preflight
- `ERROR_REPORT.md` — status reset to 🟢

**Verification**:
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
# → Build Succeeded, 0 errors, 1 cosmetic SDWebImage warning
# → AuthenticHadith.app installed on iPhone 17 Pro simulator
# → Deep link sent: exp+authentichadithapp://expo-development-client/?url=...
```

DerivedData folder this run: `AuthenticHadithApp-hjbjrvddcnhsmeacvbzkxdxletkr` (slug-derived, confirming Expo selected the patched workspace).

**Result**: Fixed for this build. The patch may need to be reapplied any time Expo's internal prebuild regenerates the file. If recurrence is observed, escalate per SYSTEM_RULES Rule 009 to a permanent rule + consider a real fix:
- `expo prebuild --clean` (KP-approved only) — eliminates the stale workspace permanently
- Slug realignment in `app.json` — risky, affects deep links and Expo dev URLs

**Lesson**:
Expo derives different ios/ paths from different `app.json` keys: `xcodeproj` from `expo.name`, `xcworkspace` from `expo.slug`. When those keys disagree, you get two parallel workspace files where one is correct and one is broken. Local `run:ios` may pick either depending on internal cache state. The shipping app (EAS production) is unaffected because EAS regenerates `ios/` from scratch each build.

The simulator-foreground osascript error from FIX-029 recurred and remains unresolved — KP must grant macOS Automation → System Events permission to the host terminal in System Settings. Not a code issue.

**Pattern Category**: Expo prebuild artifact / slug-name mismatch / local workspace state

---

### [FIX-029] — First Successful Local iOS Build Verification (post FIX-028)
**Date**: 2026-05-07
**Session**: Claude Code (Senior iOS Release Engineer)
**Severity**: Verification milestone

**Result**: `npx expo run:ios` produced a clean Debug build, installed on iPhone 17 Pro simulator. Native loop is closed.

**What worked**:
- Workspace: `ios/AuthenticHadith.xcworkspace`
- xcodebuild: 0 errors, 1 cosmetic warning (`SDWebImage iOS@9.0 deployment version mismatch` — harmless lint)
- App bundle: `AuthenticHadith.app` produced and signed
- Install: succeeded on simulator `F5384F69-2BE1-40DC-806B-B4C45F03736A` (iPhone 17 Pro, iOS 26.4)
- Bundle ID confirmed at runtime: `com.byred.authentichadith`
- RevenueCat 5.67.1 + RevenueCatUI linked via autolinking (FIX-027 model confirmed)
- No `aps-environment` entitlement (FIX-026 effect preserved)

**What did not auto-complete (manual KP step required)**:
The post-install simulator foreground step failed:
```
Error: osascript -e tell app "System Events" to count processes whose name is "Simulator" exited with non-zero code: 1
```
This is a macOS Automation permission issue, not a build issue. The terminal running `npx expo run:ios` lacks permission to control "System Events" via AppleScript. The app is installed on the simulator and ready to run; only the auto-foregrounding step failed.

**KP fix (one-time, ~30 seconds)**:
1. System Settings → Privacy & Security → Automation
2. Find Terminal (or iTerm / Claude Code / whatever shell host runs `expo run:ios`)
3. Toggle ON access to "System Events"
4. Re-run `npx expo run:ios` — simulator will foreground automatically

**Workaround without permission grant**:
1. Open Simulator.app manually
2. In a separate terminal: `cd authentichadithapp && npx expo start --dev-client`
3. Tap "Authentic Hadith" on the simulator home screen
4. App will load JS from Metro

**Files Changed**: documentation only (`BUILD_FIX_LOG.md`, `APP_LAUNCH_PLAYBOOK.md`). No code changes. No `ios/` commits (gitignored).

**Verification**:
```bash
xcrun simctl list devices booted              # iPhone 17 Pro Booted
ls /Users/kp/Library/Developer/Xcode/DerivedData/AuthenticHadith-*/Build/Products/Debug-iphonesimulator/AuthenticHadith.app
# → exists with all icons + Info.plist
```

**Lesson**: The first `expo run:ios` against a fresh `ios/` from prebuild succeeded with the FIX-026/027/028 governance stack in place. The pattern that emerged: with display name correct, plugins clean, locale set, pods installed, and IAP capability deferred to Apple Developer portal, the local build is reliable. If a future session sees the osascript "System Events" error, the fix is in macOS Settings, not in Expo or Xcode.

**Pattern Category**: Build verification / macOS permissions

---

### [FIX-028] — CocoaPods UTF-8 Locale Failure After iOS Prebuild
**Date**: 2026-05-07
**Session**: Claude Code (Senior iOS Release Engineer)
**Severity**: Build blocker (environment, not code)

**Problem**:
```
After `npx expo prebuild --clean` regenerated `ios/`, the downstream `pod install` step failed with:

WARNING: CocoaPods requires your terminal to be using UTF-8 encoding.
/opt/homebrew/Cellar/ruby/4.0.2/lib/ruby/4.0.0/unicode_normalize/normalize.rb:153:in 'UnicodeNormalize.normalize':
Unicode Normalization not appropriate for ASCII-8BIT (Encoding::CompatibilityError)
    from .../cocoapods-1.16.2/lib/cocoapods/config.rb:167:in 'String#unicode_normalize'
    from .../cocoapods-1.16.2/lib/cocoapods/config.rb:167:in 'Pod::Config#installation_root'
```

**Root Cause**:
KP's shell had `LANG=""` and `LC_ALL=""`. All `LC_*` variables fell back to `C` (ASCII-8BIT). CocoaPods 1.16.2's `Pod::Config#installation_root` calls `String#unicode_normalize`, which raises `Encoding::CompatibilityError` on ASCII-8BIT strings. This is an environment problem, not a CocoaPods bug, not a Ruby version bug, not an Expo bug. The CocoaPods warning printed during the failure was the literal canary: "CocoaPods requires your terminal to be using UTF-8 encoding."

**Fix Applied**:
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update
```

Result: 101 dependencies / 111 pods installed in 103 seconds. RevenueCat 5.67.1 and RevenueCatUI 5.67.1 autolinked correctly via React Native autolinking — confirming FIX-027's diagnosis that no Expo config plugin is needed for `react-native-purchases`. CocoaPods generated `ios/AuthenticHadith.xcworkspace`.

**Files Changed**:
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — added Rule 022 (CocoaPods Requires UTF-8 Locale Before iOS Native Install)
- `APP_LAUNCH_PLAYBOOK.md` — Section 5 now opens with the UTF-8 preflight

**Environment fix only — no app code changed.** No native iOS files were committed (entire `ios/` directory is gitignored).

**Commands Used**:
```bash
# Diagnostic (before fix)
locale && echo $LANG && echo $LC_ALL && pod --version

# Apply fix (per-command, environment-scoped)
cd ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update

# Permanent fix (for KP's shell)
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.zshrc
```

**Verification**:
```bash
ls ios/Pods                            # exists
ls ios/Podfile.lock                    # exists, 80 KB
ls ios/AuthenticHadith.xcworkspace     # exists
plutil -extract CFBundleDisplayName raw ios/AuthenticHadith/Info.plist
# → "Authentic Hadith"
plutil -extract CFBundleVersion raw ios/AuthenticHadith/Info.plist
# → "4"
grep -n "PRODUCT_BUNDLE_IDENTIFIER" ios/AuthenticHadith.xcodeproj/project.pbxproj
# → com.byred.authentichadith (Debug + Release)
grep "RevenueCat" ios/Podfile.lock | head
# → RevenueCat (5.67.1), RevenueCatUI (5.67.1)
grep -R "aps-environment" ios/AuthenticHadith
# → no match (push entitlement gone, FIX-026 effect preserved)
```

**Result**: Fixed at environment layer. iOS native build is now ready for `npx expo run:ios` (KP-approved) or local archive.

**Lesson**:
When pod install fails with a Ruby encoding error, the diagnosis order is: (1) locale, (2) workspace state, (3) Ruby/CocoaPods version. Don't reinstall Ruby or CocoaPods or run `expo prebuild --clean` until locale is verified. The CocoaPods warning about UTF-8 encoding is not a soft suggestion — it's the canary for the failure that follows.

There's also a stale `ios/AuthenticHadithApp.xcworkspace` left from a pre-rename prebuild attempt. It's gitignored cruft. Manual cleanup: `rm -rf ios/AuthenticHadithApp.xcworkspace` (KP discretion, not run automatically).

**Pattern Category**: Environment / locale / build prerequisites

---

### [FIX-027] — Revert invalid `react-native-purchases` plugin registration (FIX-026 follow-up)
**Date**: 2026-05-07
**Session**: Claude Code (Senior Release Verification Engineer)
**Severity**: Critical (broke every EAS build)

**Error Message**:
```
Failed to read the app config from the project using "npx expo config" command:
npx expo config --json exited with non-zero code: 1.
Falling back to the version of "@expo/config" shipped with the EAS CLI.
Unable to resolve a valid config plugin for react-native-purchases.
• No "app.plugin.js" file found in react-native-purchases: config plugins are typically
  exported from an "app.plugin.js" file in the package root.
• main export of react-native-purchases does not appear to be a config plugin: the following
  error was thrown when importing /node_modules/react-native-purchases/dist/index.js:
  Unexpected token 'typeof'
Verify that react-native-purchases includes a config plugin. If it does not, then remove
the entry from plugins in your app config file.
    Error: build command failed.
```

**Root Cause**:
FIX-026 added `react-native-purchases` to `expo.plugins` based on a faulty assumption in `XCODE_NATIVE_RELEASE_AUDIT.md` C-01. The audit claimed the package's "Expo config plugin registers the In-App Purchase capability on the native target." This is wrong for `react-native-purchases` v9.x. The package ships a runtime SDK at `dist/index.js` and a native iOS plugin at `ios/PurchasesPlugin.swift` (Swift-side native helper, unrelated to Expo). It does **not** ship an Expo config plugin. There is no `app.plugin.js` file. Its `package.json` has no `expo` field. Importing `dist/index.js` as a config plugin throws a TypeScript syntax error because it is not a config plugin.

How RevenueCat actually wires into Expo: standard React Native autolinking handles the JS bridge. The In-App Purchase capability is enabled externally through the Apple Developer portal for the bundle ID, not through Expo plugin registration. This is exactly the manual task already tracked as M-05 in the audit doc (verify product IDs across App Store Connect and RevenueCat dashboard).

The other three FIX-026 edits (display name, buildNumber, CFBundleDisplayName) are valid and remain in place.

**Fix Applied**:
```
File: app.json
Removed line: "react-native-purchases" from expo.plugins array

Before:
  "plugins": [
    "expo-router",
    [...],
    "expo-secure-store",
    "expo-web-browser",
    "react-native-purchases"
  ]

After:
  "plugins": [
    "expo-router",
    [...],
    "expo-secure-store",
    "expo-web-browser"
  ]
```

**Files Changed**:
- `app.json` — removed `react-native-purchases` plugin entry
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — Rule 021 rewritten to require pre-flight verification that a package actually ships a config plugin before registering, and a post-edit `npx expo config --json` check
- `XCODE_NATIVE_RELEASE_AUDIT.md` — C-01 status changed from RESOLVED to INVALID, Release Readiness note corrected, "What Is Missing" item 1 corrected
- `APP_LAUNCH_PLAYBOOK.md` — pre-prebuild checklist strengthened to require config-plugin existence verification

**Verification Command**:
```bash
# 1. app.json must remain valid JSON
node -e "JSON.parse(require('fs').readFileSync('app.json'))"

# 2. The bad plugin entry must be gone
grep -c "react-native-purchases" app.json
# Expected: 0

# 3. Expo config must now parse cleanly (this was the failing gate)
npx expo config --json > /dev/null
echo "exit: $?"
# Expected: exit: 0

# 4. EAS preview build must clear pre-flight (run only with KP approval)
npx eas-cli build --platform ios --profile preview --non-interactive
```

**Result**: Fixed at config layer. Build pipeline unblocked.

**Lesson**:
A package in `package.json` is not an Expo config plugin unless the package explicitly ships one. Three signals confirm a config plugin exists: (a) `app.plugin.js` at the package root, (b) `expo` field in the package's `package.json`, (c) explicit "add to expo.plugins" instruction in the package's official documentation. If none are present, the package autolinks via React Native and any iOS capability is enabled externally (Apple Developer portal, App Store Connect, or manual `infoPlist` keys). Adding a package to `expo.plugins` without one of those three signals breaks every EAS and local build.

The deeper meta-lesson: an audit document is not ground truth. FIX-026 trusted the audit's C-01 claim without running `npx expo config --json` after the edit. The edit committed and pushed to `main` because no verification gate caught it. Every plugin change must be followed by `npx expo config --json` before commit. SYSTEM_RULES.md Rule 021 now codifies this gate.

**Pattern Category**: Native plugin registration / Config validation gate

---

### [FIX-026] — iOS Release Blockers: RevenueCat Plugin, Push Entitlement, Display Name
**Date**: 2026-05-07
**Session**: Claude Code (Senior Expo/iOS Release Engineer)
**Severity**: Critical (3 release blockers)

**Error Message**:
```
XCODE_NATIVE_RELEASE_AUDIT.md identified 3 critical blockers preventing TestFlight submission:
- C-01: react-native-purchases missing from Expo plugins array — StoreKit entitlement risk
- C-02: aps-environment entitlement present but no push notification code in app
- C-03: CFBundleDisplayName shows "AuthenticHadithApp" instead of "Authentic Hadith"
```

**Root Cause**:
- C-01: `react-native-purchases` was in package.json (^9.9.0) but its Expo config plugin was never registered. Without plugin registration, EAS prebuild does not add the In-App Purchase capability to the iOS target. RevenueCat would silently fail in production.
- C-02: A previous prebuild generated `ios/AuthenticHadithApp/AuthenticHadithApp.entitlements` with `aps-environment = development`. No `expo-notifications` plugin is registered and no push code exists anywhere in `app/`, `lib/`, `hooks/`, `components/`, or `services/`. The notifications screen is a pure stub with disabled switches. The entitlement was orphaned from a prior aborted notification implementation.
- C-03: `expo.name` was "AuthenticHadithApp" (the raw scaffolding name). No `CFBundleDisplayName` override was set. Users saw the developer name instead of the marketing name "Authentic Hadith" on their home screen.

**Fix Applied**:
```
File: app.json

1. expo.name: "AuthenticHadithApp" → "Authentic Hadith"
2. expo.ios.buildNumber: "1" → "4" (sync to highest known native value, EAS autoIncrement will manage from here)
3. expo.ios.infoPlist.CFBundleDisplayName: added "Authentic Hadith"
4. expo.plugins: appended "react-native-purchases"

Push entitlement (C-02): No code change required.
- Verified zero notification code via grep across the entire JS layer
- No expo-notifications plugin registered (and not added)
- The orphan aps-environment entitlement only persists in the currently-generated ios/ folder
- Running `npx expo prebuild --clean` will regenerate ios/ from app.json plugins only — none of which add aps-environment — so the entitlement will be eliminated automatically
```

**Files Changed**:
- `app.json` — display name, build number, CFBundleDisplayName, RevenueCat plugin
- `BUILD_FIX_LOG.md` — this entry
- `SYSTEM_RULES.md` — new Rule 021 (Native packages must register their Expo plugin)
- `XCODE_NATIVE_RELEASE_AUDIT.md` — resolved/remaining status updates
- `APP_LAUNCH_PLAYBOOK.md` — pre-prebuild config checklist added

**Verification Command**:
```bash
# Verify app.json is well-formed
node -e "JSON.parse(require('fs').readFileSync('app.json'))"

# Verify the four edits landed
grep -n "Authentic Hadith\|react-native-purchases\|buildNumber" app.json

# After KP approves prebuild:
npx expo prebuild --clean
grep -i "aps-environment" ios/AuthenticHadithApp/AuthenticHadithApp.entitlements
# Expected: no match (push entitlement gone)

grep "CFBundleDisplayName" ios/AuthenticHadithApp/Info.plist
# Expected: <string>Authentic Hadith</string>

grep "InAppPurchase\|com.apple.developer.in-app-payments" ios/AuthenticHadithApp/AuthenticHadithApp.entitlements
# Expected: in-app purchase capability present (added by react-native-purchases plugin)
```

**Result**: Fixed at config layer. Native verification deferred until KP approves `npx expo prebuild --clean`.

**Lesson**:
A package being in `package.json` is necessary but not sufficient for native iOS capabilities. Any package that ships an Expo config plugin (RevenueCat, Notifications, Camera, etc.) must be registered in `expo.plugins` or its native effects are silently dropped during prebuild. Always cross-check `package.json` native packages against `app.json` plugin registrations during release audits. The orphan-entitlement pattern (entitlement persists from a prior prebuild even after the source plugin was removed) is fixed by `expo prebuild --clean`, not by manually editing the generated entitlements file.

**Pattern Category**: Native plugin registration / Release audit

---

### [FIX-025] — WORKFLOW_ROUTER.md Governance Hardening
**Date**: 2026-05-07
**Session**: Claude Code (Senior Mobile Engineering Governance Architect)
**Severity**: Process / Governance

**Error Message**:
```
Sessions repeatedly bouncing between VS Code and Xcode for issues that lived entirely in the JS/Expo layer. Original WORKFLOW_ROUTER.md was incomplete (cut off mid-file), referenced non-existent folders (services/, utils/), recommended `npx expo run:ios` instead of the actual EAS Build pipeline, and was not listed in the mandatory startup reading list.
```

**Root Cause**:
The router lacked enterprise-grade routing precision. Folder structure was inaccurate (missing `external/`, `supabase/`, `types/`; falsely listing `services/`, `utils/`). iOS build guidance ignored EAS Build, which is the actual production pipeline. The documentation protocol in the router did not match SYSTEM_RULES.md Rule 012 (5 steps vs 6). CLAUDE.md startup protocol and SYSTEM_RULES.md Rule 013 did not require reading WORKFLOW_ROUTER.md, so future sessions could skip it entirely.

**Fix Applied**:
```
1. Rewrote WORKFLOW_ROUTER.md as a 14-section enterprise routing protocol:
   - Purpose, Golden Rule, Default Working Directory
   - Tool Selection Matrix (40+ classified scenarios)
   - Problem Classification Protocol (4 categories with required output template)
   - VS Code App Layer / Expo Hybrid Layer / Xcode Native Layer sections
   - Do Not Edit warning for generated ios/ files (with exception clause)
   - First Command Decision Tree
   - Verification Rules per layer
   - Documentation Protocol aligned with SYSTEM_RULES Rule 012
   - Escalation Rules
   - Final Operating Rule
2. Corrected folder list to actual repo (added external/, supabase/, types/; removed services/, utils/).
3. Replaced `npx expo run:ios` as default with EAS Build profiles (preview / production) matching APP_LAUNCH_PLAYBOOK.md Section 5.
4. Added explicit high-risk gating around `npx expo prebuild --clean`.
5. Updated CLAUDE.md: added Step 5 (Read WORKFLOW_ROUTER.md) and inserted it into File Priority Order at position 4.
6. Updated SYSTEM_RULES.md: added WORKFLOW_ROUTER.md to Rule 013 mandatory reads, added new Rule 020 (Classify Before Acting), added WORKFLOW_ROUTER.md to Required File System list.
```

**Files Changed**:
- WORKFLOW_ROUTER.md — created/rewrote as 14-section enterprise routing protocol
- CLAUDE.md — added Step 5 to startup protocol, inserted into File Priority Order
- SYSTEM_RULES.md — Rule 013 expanded, new Rule 020 added, Required File System updated
- BUILD_FIX_LOG.md — this entry

**Verification Command**:
```
grep -n "WORKFLOW_ROUTER" CLAUDE.md SYSTEM_RULES.md
# Should show references in both startup protocol and Rule 013
ls WORKFLOW_ROUTER.md
# Should exist
grep -n "Rule 020" SYSTEM_RULES.md
# Should appear after Rule 019
```

**Result**: Fixed

**Lesson**:
A routing protocol is only as good as the system that enforces it. Writing the router is half the work — wiring it into the mandatory startup reads (CLAUDE.md, SYSTEM_RULES.md Rule 013) and into a permanent rule (Rule 020) is what makes it survive future sessions. Any future "engineering operating system" doc must be added to all three enforcement points, or it will be silently skipped.

**Pattern Category**: Governance / Process Hardening

---

### [FIX-021] — Home Screen Random Offset Crash
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
"Hadith of the Moment" section blank — .single() throws when offset exceeds row count
```

**Root Cause**: 
`Math.floor(Math.random() * 1000)` generated a random offset up to 999, but if the hadiths table had fewer rows, `.range(offset, offset).single()` returned zero rows and threw.

**Fix Applied**:
```
Query actual row count first with { count: 'exact', head: true }
Cap random offset to the real count
Use .maybeSingle() instead of .single() for graceful null return
```

**Files Changed**:
- app/(tabs)/index.tsx — safe random offset with count query and maybeSingle

**Verification Command**:
```
Refresh home screen 20+ times — should never crash or show blank
```

**Result**: Fixed

**Lesson**: 
Never use hardcoded limits with `.single()`. Always query the actual count or use `.maybeSingle()` to handle the zero-row case gracefully.

---

### [FIX-020] — Duplicate QueryClientProvider + Missing Stack Routes
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Warning

**Error Message**:
```
Potential cache inconsistency — two QueryClients active
4 routes showing default Expo header instead of custom
```

**Root Cause**: 
`_layout.tsx` wrapped app with both `QueryClientProvider` (line 59) and `ReactQueryProvider` (line 64). `ReactQueryProvider` creates its own `QueryClientProvider` internally, so the outer one was a shadowed duplicate. Also, routes for book, chapter, topics, bookmarks, and collections were missing from the Stack, causing them to render with the default Expo header.

**Fix Applied**:
```
Removed outer QueryClientProvider and queryClient constant from _layout.tsx
Moved ReactQueryProvider to outermost position (after ErrorBoundary)
Added Stack.Screen entries for: book, chapter, topics, bookmarks, collections
```

**Files Changed**:
- app/_layout.tsx — single QueryClientProvider via ReactQueryProvider, 5 new Stack routes

**Verification Command**:
```
Navigate to book, chapter, topics screens — verify no default Expo header appears
```

**Result**: Fixed

**Lesson**: 
Only one QueryClientProvider should exist in the component tree. If a provider component creates its own internally, do not wrap it with another one. Check provider source code before nesting.

---

### [FIX-019] — Subscription Screen Crashes on RevenueCat Init Failure
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Unhandled promise rejection in useEffect — infinite spinner if RevenueCat fails
```

**Root Cause**: 
The async IIFE in `useEffect` had no `.catch()` handler. If `getOfferings()` or `getSubscriptionStatus()` threw (network error, wrong API key, cold start), the promise rejected unhandled. The `loading` state never reached `false`, leaving the user stuck on a spinner.

**Fix Applied**:
```
Added try/catch/finally around the async init
Added initError state for error display
Moved loading indicator and error fallback above the content
Guarded status card behind !loading check
```

**Files Changed**:
- app/settings/subscription.tsx — error handling on init, loading/error state guards

**Verification Command**:
```
Test subscription screen with network off — should show error message, not infinite spinner
```

**Result**: Fixed

**Lesson**: 
Every async IIFE in useEffect MUST have a .catch() or be wrapped in try/catch. Unhandled rejections in useEffect can crash or hang the screen.

---

### [FIX-018] — Boilerplate modal.tsx Shipping to Production
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Expo template screen "This is a modal" reachable in production app
```

**Root Cause**: 
The default Expo Router template `modal.tsx` was never replaced with real content. It displayed "This is a modal" with a home link. Registered in `_layout.tsx` as a Stack.Screen. Apple reviewers would flag this as an incomplete app (Guideline 2.1).

**Fix Applied**:
```
Deleted app/modal.tsx
Removed Stack.Screen name="modal" entry from _layout.tsx
```

**Files Changed**:
- app/modal.tsx — DELETED
- app/_layout.tsx — removed modal Stack.Screen

**Verification Command**:
```
grep -r "modal" app/_layout.tsx  # should return nothing
ls app/modal.tsx  # should not exist
```

**Result**: Fixed

**Lesson**: 
After scaffolding with Expo, immediately audit for template boilerplate screens. Delete anything that says "This is a modal" or references ThemedText/ThemedView from the template.

---

### [FIX-017] — 3 Screens Unreachable (Delete Account, Subscription, Bookmarks)
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Delete account, subscription, and bookmarks screens exist but have zero navigation paths
Apple Guideline 5.1.1: account deletion must be accessible
```

**Root Cause**: 
All three screens were created as route files but no button or link in the app pointed to them. The delete-account screen is required by Apple for apps with account creation. The subscription screen is required for revenue. The bookmarks screen completes the save-and-view loop.

**Fix Applied**:
```
Added to profile.tsx ACCOUNT section:
  - "Saved Hadiths" row → router.push('/bookmarks')
  - "Subscription" row → router.push('/settings/subscription')

Added to profile.tsx SETTINGS section:
  - "Delete Account" row → router.push('/settings/delete-account') with error-red tint
```

**Files Changed**:
- app/(tabs)/profile.tsx — added 3 new SettingsRow navigation links

**Verification Command**:
```
Open Profile tab → verify "Saved Hadiths", "Subscription", and "Delete Account" rows appear and navigate correctly
```

**Result**: Fixed

**Lesson**: 
After creating a new screen file, ALWAYS add at least one navigation path to it from an existing screen. Audit for orphan routes before every submission: `grep -r "router.push" app/ | grep -v node_modules` and cross-reference against the app/ directory listing.

---

### [FIX-016] — Search Querying Non-Existent Column (english_translation)
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Search returning zero English results — PostgREST silently drops filter on non-existent column
```

**Root Cause**: 
Search screen built OR filter using `english_translation.ilike.%term%` but the hadiths table column is `english_text`. PostgREST silently ignores filters on non-existent columns, so English search queries returned nothing.

**Fix Applied**:
```diff
- `english_translation.ilike.%${term}%`,
+ `english_text.ilike.%${term}%`,
```

**Files Changed**:
- app/(tabs)/search.tsx — line 69, corrected column name in OR filter

**Verification Command**:
```
grep -n "english_translation" app/(tabs)/search.tsx  # should return nothing
```

**Result**: Fixed

**Lesson**: 
PostgREST does NOT throw errors when you filter on non-existent columns — it silently returns no matches. This makes column name typos extremely hard to catch at runtime. Always verify filter column names against the actual schema. The hadiths table text columns are: english_text, arabic_text.

---

### [FIX-015] — DB Alias Columns Missing for Gamification Screens
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Achievements/badges screen crashing — code references name, description, xp
but DB has name_en, description_en, total_xp
```

**Root Cause**: 
Agent-written gamification code used short column names (name, description, xp, hadiths_read, etc.) but the production Supabase tables use longer names (name_en, description_en, total_xp, total_hadiths_read, etc.). Rather than rewriting all code references across 10+ files, added DB alias columns.

**Fix Applied**:
```sql
-- achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE achievements SET name = name_en, description = description_en;

-- user_stats table
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS hadiths_read INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS quizzes_completed INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS perfect_quizzes INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS lessons_completed INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS sunnah_streak INTEGER DEFAULT 0;

-- user_streaks table
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS active_days TEXT[] DEFAULT '{}';
```

**Files Changed**:
- Supabase SQL (run directly against production DB)
- No code changes needed — alias columns match existing code expectations

**Verification Command**:
```sql
SELECT name, description FROM achievements LIMIT 1;
SELECT xp, hadiths_read FROM user_stats LIMIT 1;
SELECT active_days FROM user_streaks LIMIT 1;
```

**Result**: Fixed

**Lesson**: 
When code references column names that differ from DB columns, two options: (1) change all code references, or (2) add alias columns to DB. Option 2 is faster when many files reference the short name. But alias columns must be kept in sync with source columns — add a trigger or cron if data changes frequently. Currently these alias columns are a one-time sync, not auto-updating.

---

### [FIX-014] — Chapter Screen Showing ALL Hadiths (No Filter)
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Clicking into a chapter shows every hadith in the database instead of
only hadiths for that chapter's book and collection
```

**Root Cause**: 
Agent-written chapter/[id].tsx had `.from('hadiths').select('*')` with zero filter conditions. The hadiths table has no chapter_id column and no FK to chapters. The code assumed a direct chapter→hadiths relationship that does not exist.

**Fix Applied**:
```
Built 3-step chain query using React Query's enabled option:
1. Fetch chapter → get parent book_id
2. Fetch book → get collection_id (FK exists: books.collection_id→collections)
3. Fetch hadiths → filter by collection_slug + book_number
```

**Files Changed**:
- app/chapter/[id].tsx — rewrote to use 3-step chain query

**Verification Command**:
```
Navigate to any chapter → verify only hadiths from that book/collection appear
```

**Result**: Fixed

**Lesson**: 
The hadiths table is a flat table with NO foreign keys. The only way to filter hadiths by chapter context is: chapter→book (book_id)→collection (collection_id)→hadiths (collection_slug + book_number). This is a 3-hop lookup. Never assume direct FK relationships on hadiths.

---

### [FIX-013] — Book Screen Displaying undefined for Name
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Warning

**Error Message**:
```
Book detail screen shows "undefined" where book name should display
```

**Root Cause**: 
Book interface typed `name: string` but the actual DB column is `name_en`. All `book.name` references resolved to undefined.

**Fix Applied**:
```diff
interface Book {
-  name: string
+  name_en: string
+  name_ar: string
+  number: number
}
// All references: book.name → book.name_en
```

**Files Changed**:
- app/book/[id].tsx — updated interface and all display references

**Verification Command**:
```
grep -n "book\.name[^_]" app/book/[id].tsx  # should return nothing
```

**Result**: Fixed

**Lesson**: 
The books table uses name_en and name_ar, not name. Same pattern as collections (name_en, name_ar). Always check the actual column suffix convention before writing interfaces.

---

### [FIX-012] — Broken FK Joins in useHadiths + PremiumGate Blocking AI
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
PostgREST FK join on hadiths table failing - not found errors
AI Assistant blocked behind PremiumGate for all users
```

**Root Cause**: 
Hadiths table has no foreign keys to collections or books tables. PostgREST join syntax (collection:collections(*), book:books(*)) was invalid. AI Assistant was wrapped in PremiumGate component unnecessarily.

**Fix Applied**:
```
Removed PremiumGate from app/(tabs)/assistant.tsx
Replaced FK joins in hooks/use-hadiths.ts with simple .select()
Corrected filter columns to collection_slug and book_number
Added separate collection name lookup query by slug
```

**Files Changed**:
- app/(tabs)/assistant.tsx — removed PremiumGate wrapper
- hooks/use-hadiths.ts — replaced invalid FK joins with correct select + lookup

**Verification Command**:
```
npx tsc --noEmit && npx expo start
```

**Result**: Fixed

**Lesson**: 
The hadiths table has NO foreign keys. Never use PostgREST join syntax against it. Always use simple .select() and do collection/book lookups separately by slug.

---

### [FIX-011] — Broken FK Joins in useHadith Detail Hook
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Hadith detail returning not found - PostgREST join failing
```

**Root Cause**: 
Same as FIX-012. PostgREST join query fails because hadiths table has no FK constraints.

**Fix Applied**:
```
Replaced FK join with simple select in hooks/use-hadith.ts
Added separate collection name query by slug
```

**Files Changed**:
- hooks/use-hadith.ts — removed broken FK joins, added collection lookup

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
Duplicate of FIX-012 pattern. Any hook querying hadiths must NOT use FK joins.

---

### [FIX-010] — Comprehensive Audit Fixes for App Store Build 6
**Date**: 2026-05-07
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Multiple blank tabs (Collections, Stories), wrong navigation routes,
missing settings screens, broken delete account
```

**Root Cause**: 
Multiple files referenced nonexistent DB columns (content_parts instead of story_parts table), wrong navigation routes (/collections/id instead of /collection/slug), and missing stub screens for settings routes.

**Fix Applied**:
```
Stories: fetch from prophet_stories/story_parts tables instead of nonexistent content_parts column
Progress tracking: use correct tables (prophet_reading_progress, sahaba_reading_progress)
Collections: fix nav route from /collections/id to /collection/slug
Sunnah: add fallback hadith_ref for DB-sourced practices
Delete account: fix API URL config path
Stories index: order by name_en instead of nonexistent columns
Added missing notifications and sync settings screens
Added english_text and collection_slug alias columns to hadiths table with sync trigger
```

**Files Changed**:
- Multiple screens across app/ directory
- lib/ service files
- Supabase migration added

**Verification Command**:
```
npx tsc --noEmit && npx expo start --ios
```

**Result**: Fixed

**Lesson**: 
Always verify DB column names against the actual Supabase schema before writing queries. The mobile codebase was built against an assumed schema that differed from production.

---

### [FIX-009] — 30+ Column Name Mismatches Causing Blank Tabs
**Date**: 2026-05-05
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Collections, Learn, and Stories tabs rendering blank - no data displayed
```

**Root Cause**: 
30+ column name mismatches across 13 files. The app was querying columns that did not exist in the production Supabase schema (e.g., text_ar/text_en instead of arabic_text/english_text).

**Fix Applied**:
```
Updated all 13 files to use correct production column names
Updated migrations 996/999 with proper column names and RLS policies
```

**Files Changed**:
- 13 files across app/, hooks/, lib/

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
The number 1 recurring issue: code assumes a DB schema that does not match production. ALWAYS check the actual Supabase table schema before writing or debugging queries. Use the HADITH_COLUMNS constant to prevent drift.

---

### [FIX-008] — EAS Build Config Missing buildNumber and ascAppId
**Date**: 2026-05-05
**Session**: Claude Code
**Severity**: Warning

**Error Message**:
```
EAS build config incomplete - missing buildNumber, ascAppId for submission
```

**Root Cause**: 
eas.json was missing submit.production.ios section. app.json was missing ios.buildNumber.

**Fix Applied**:
```
Added ascAppId to eas.json
Added ios.buildNumber to app.json
Changed lessons query to order by order_index
```

**Files Changed**:
- eas.json — added submit config
- app.json — added buildNumber

**Verification Command**:
```
npx eas build --platform ios --profile preview
```

**Result**: Fixed

**Lesson**: 
Before first App Store submission: ensure eas.json has submit.production.ios with ascAppId, and app.json has ios.buildNumber. Increment buildNumber for every new upload.

---

### [FIX-007] — iOS App Store Submission Blockers (Duplicate Deps, Missing Plugins)
**Date**: 2026-05-04
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
package.json parse error - duplicate dependency keys
EAS build failing - missing StoreKit entitlements
```

**Root Cause**: 
package.json had duplicate dependency keys (async-storage, supabase-js, react-query each appeared twice) and a missing comma. app.json was missing required plugins and permission strings. RevenueCat entitlement ID was mismatched across files.

**Fix Applied**:
```
Removed duplicate dependency keys from package.json, fixed missing comma
app.json: added buildNumber, infoPlist permission strings, expo-notifications plugin,
  react-native-purchases plugin, userInterfaceStyle: automatic
eas.json: added submit.production.ios section
lib/revenuecat/config.ts: unified ENTITLEMENT_ID to premium (was mismatched),
  removed hardcoded test API key
```

**Files Changed**:
- package.json — deduped dependencies
- app.json — added plugins, permissions, buildNumber
- eas.json — added submit config
- lib/revenuecat/config.ts — unified entitlement ID

**Verification Command**:
```
npm install && npx expo doctor
```

**Result**: Fixed

**Lesson**: 
package.json must never have duplicate keys - JSON silently drops the first one. Always run npx expo doctor before submitting. The react-native-purchases plugin MUST be in app.json plugins array for StoreKit2 to work in managed workflow.

---

### [FIX-006] — RevenueCat API Key and Entitlement ID Scattered Across Files
**Date**: 2026-05-04
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
RevenueCat subscription check failing - entitlement ID mismatch
Hardcoded test API key in production code
```

**Root Cause**: 
RevenueCat config was duplicated across multiple files with different values. ENTITLEMENT_ID was 'RedLantern Studios Pro' in one file and 'premium' in another. A hardcoded test API key was in _layout.tsx.

**Fix Applied**:
```
lib/revenuecat/config.ts is now the canonical source for:
  REVENUECAT_API_KEY (reads from app.json extra via EAS secrets)
  ENTITLEMENT_ID = premium (unified)
  PRODUCT_IDS = ah_premium_monthly / ah_premium_annual / ah_lifetime
app/_layout.tsx: removed hardcoded test key, imports from config
lib/purchases/revenuecat.ts: re-exports from config instead of duplicating
app.json extra: added revenueCatApiKeyIos/Android slots using EAS secret interpolation
```

**Files Changed**:
- lib/revenuecat/config.ts — single source of truth
- app/_layout.tsx — removed hardcoded key
- lib/purchases/revenuecat.ts — re-exports from config
- app.json — added EAS secret slots

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
RevenueCat config must live in ONE file only: lib/revenuecat/config.ts. Never hardcode API keys. Use EAS secrets with app.json extra interpolation. Product IDs are: ah_premium_monthly, ah_premium_annual, ah_lifetime. Entitlement ID is: premium.

---

### [FIX-005] — Line-Wrap Corruption in 4 Files + CI Workflow Wrong Directory
**Date**: 2026-05-03
**Session**: Claude Code (Codex)
**Severity**: Critical

**Error Message**:
```
TypeScript parser errors in delete-account.tsx, subscription.tsx,
PaywallScreen.tsx, useRevenueCatSubscription.ts
CI workflow building from wrong directory
```

**Root Cause**: 
Lines were hard-wrapped at 80 chars, splitting identifiers and string literals across lines. CI workflow (eas-ios.yml) pointed to app/ instead of authentichadithapp/.

**Fix Applied**:
```
Fixed line-wrap corruption in 4 files (rejoined split lines)
Fixed CI workflow to install/build from authentichadithapp/
Added tsc + lint checks before EAS build in CI
Upgraded node 18 to 20 in CI
Added ios.buildNumber and ITSAppUsesNonExemptEncryption to app.json
Added react-native-purchases plugin to app.json plugins
Added stub screens for language.tsx, notifications.tsx, sync.tsx
```

**Files Changed**:
- delete-account.tsx, subscription.tsx, PaywallScreen.tsx, useRevenueCatSubscription.ts — fixed line wraps
- .github/workflows/eas-ios.yml — fixed directory path
- app.json — added encryption flag, plugin
- Added 3 stub settings screens

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
Watch for line-wrap corruption when code is pasted through tools that enforce 80-char line limits. TypeScript identifiers and string literals cannot be split across lines. Always run tsc after bulk file edits.

---

### [FIX-004] — Critical Bugs Blocking App Store Submission
**Date**: 2026-05-02
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Delete account not working - wrong API path
RevenueCat test key in production
Product IDs mismatched across files
```

**Root Cause**: 
Delete account used wrong API path. RevenueCat had a hardcoded test key in _layout.tsx. Product IDs were different across files. app.config.js did not exist to bridge EAS secrets.

**Fix Applied**:
```
Fix delete-account: correct API path (/api/auth/delete-account) and send required confirmation body
Remove hardcoded test RevenueCat key from _layout.tsx
Create app.config.js to bridge EAS secrets into Constants.expoConfig.extra
Align product IDs across all files to: ah_monthly_999, ah_annual_4999, ah_lifetime_9999
Add react-native-purchases plugin to app.json for StoreKit2 support
Add comprehensive App Store submission checklist
```

**Files Changed**:
- delete-account screen — fixed API path and body
- app/_layout.tsx — removed test key
- app.config.js — created (bridges EAS secrets)
- Multiple files — unified product IDs
- app.json — added plugin

**Verification Command**:
```
npx tsc --noEmit && npx eas build --platform ios --profile preview
```

**Result**: Fixed

**Lesson**: 
app.config.js is REQUIRED to bridge EAS secrets to the app at runtime via Constants.expoConfig.extra. Without it, env vars set in EAS are invisible to the app. Product IDs must be canonical: ah_monthly_999, ah_annual_4999, ah_lifetime_9999.

---

### [FIX-003] — Critical Logic Gaps Across Mobile App
**Date**: 2026-05-01
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
AI chat not working on iOS/Android (only web)
Search not using synonym expansion
Missing settings screens causing navigation crashes
Lesson completion was a no-op
Profile creation silently failing
```

**Root Cause**: 
AI chat used relative /api/chat path which only works in web builds. TruthSerum search was imported but never called. Settings screens were routed to but did not exist. Lesson progress write was never implemented. Profile creation swallowed errors.

**Fix Applied**:
```
Fix AI chat: use deployed web app URL on native (relative path only works in web)
Wire up TruthSerum v2: search now calls expandSearchQuery() for synonym expansion
Create missing settings screens: language, notifications, sync
Fix lesson completion: actually writes to lesson_progress table
Fix profile creation: throw on failure instead of silently continuing
Fix folder table names: standardize on user_folders
Fix RevenueCat config: warn on missing/test key instead of silent fallback
Remove hardcoded test key from app.config.js production fallback
```

**Files Changed**:
- lib/api/groq.ts — use full URL for native
- app/(tabs)/search.tsx — wire expandSearchQuery
- app/settings/ — added 3 missing screens
- hooks/ — fixed lesson progress write
- lib/auth/ — throw on profile creation failure

**Verification Command**:
```
npx tsc --noEmit && npx expo start --ios
```

**Result**: Fixed

**Lesson**: 
Relative API paths (/api/chat) ONLY work in web builds. On iOS/Android, you must use the full deployed URL (https://authentichadith.app/api/mobile-chat). Always verify API calls work on native, not just web.

---

### [FIX-002] — Supabase Schema Mismatch (Wrong Column Names Everywhere)
**Date**: 2026-04-30
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
All queries returning empty - wrong column names
```

**Root Cause**: 
The initial codebase was written against an assumed schema. Real DB uses: arabic_text/english_text (not text_ar/text_en), grading (not grade), book/chapter/reference/narrator fields instead of just collection_name.

**Fix Applied**:
```
Added HADITH_COLUMNS constant to select only needed columns
Collections screen: group by book (the actual collection identifier)
Search and Assistant: use correct column names for ilike queries
All queries: use actual production column names
```

**Files Changed**:
- Multiple files across hooks/, app/, lib/

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
The real hadiths table schema: id (UUID), arabic_text, english_text, grading, book, chapter, reference, narrator, collection_slug, book_number. NEVER assume column names. Always verify against actual Supabase table.

---

### [FIX-001] — Auth Flow Broken (Sign-out, OAuth Error Handling, Route Protection)
**Date**: 2026-04-29
**Session**: Claude Code
**Severity**: Critical

**Error Message**:
```
Sign-out not clearing session properly
OAuth buttons crashing when providers not configured
No server-side route protection
```

**Root Cause**: 
Sign-out was not using scope:global and not clearing server-side cookies. OAuth buttons had no error handling for unconfigured providers. No middleware for route protection.

**Fix Applied**:
```
Add middleware.ts for server-side route protection
Add /api/auth/signout server route for proper SSR cookie clearing
Fix all sign-out handlers to use scope:global + server-side cleanup
OAuth buttons show friendly error when providers not configured
Home page adds client-side auth guard fallback
```

**Files Changed**:
- middleware.ts — created
- api/auth/signout — created
- All sign-out handlers — updated
- OAuth buttons — added error handling

**Verification Command**:
```
npx tsc --noEmit
```

**Result**: Fixed

**Lesson**: 
Supabase sign-out must use scope:global AND clear server-side cookies via a dedicated /api/auth/signout route. Always handle the case where OAuth providers are not configured - show a friendly message, do not crash.

---

### [FIX-024] — Dark Mode Broken on 6 Screens (Static COLORS Import)
**Date**: 2026-05-07
**Session**: Claude Code — Release Hardening Sprint 02
**Severity**: Warning

**Error Message**:
```
6 screens import static COLORS (always light) instead of getColors(isDark). Dark mode shows light-on-light text, unreadable UI.
```

**Root Cause**: 
`export const COLORS = LIGHT_COLORS` on line 98 of colors.ts means any screen importing COLORS is permanently stuck in light mode. The correct pattern is `getColors(isDark)` with `useTheme()` hook, but 6 screens were never converted.

**Fix Applied**:
```
For each screen:
1. Replace import { COLORS } with import { getColors }
2. Add import { useTheme } from '@/lib/theme/ThemeProvider'
3. Add const { isDark } = useTheme() + const colors = getColors(isDark) in component
4. Move all color properties from StyleSheet to inline styles using colors.xxx
5. bookmarks/index.tsx: full rewrite — had zero color system imports, all hardcoded hex
```

**Files Changed**:
- app/(tabs)/assistant.tsx — COLORS → getColors(isDark) + inline color styles
- app/(tabs)/collections.tsx — COLORS → getColors(isDark) + inline color styles
- app/(tabs)/search.tsx — COLORS → getColors(isDark) + inline color styles
- app/(tabs)/learn.tsx — COLORS → getColors(isDark) + inline color styles
- app/(tabs)/my-hadith.tsx — COLORS → getColors(isDark) + inline color styles
- app/bookmarks/index.tsx — full rewrite: hardcoded hex → theme-aware color system

**Verification Command**:
```
Toggle dark mode in settings — all 6 screens should render correctly with dark backgrounds and light text
```

**Result**: Fixed

**Lesson**: 
`COLORS = LIGHT_COLORS` is a trap. Any screen importing COLORS is broken in dark mode. Always use `getColors(isDark)` with `useTheme()` hook. After creating any new screen, verify it uses the dynamic color system.

---

### [FIX-023] — Production Console Statements Leaking to Device Logs
**Date**: 2026-05-07
**Session**: Claude Code — Release Hardening Sprint 02
**Severity**: Warning

**Error Message**:
```
19 console.warn/error statements across lib/, app/, and components/ directories shipping to production builds
```

**Root Cause**: 
Console statements were added during development for debugging but never gated for production. React Native's `__DEV__` flag is the standard way to ensure these are dead-code eliminated in production builds, but no statements used it.

**Fix Applied**:
```
Prefixed all 19 statements with __DEV__ && 
Pattern: console.error('msg') → __DEV__ && console.error('msg')
Kept: ErrorBoundary.tsx (standard React pattern), app/api/chat/route.ts (server-side), scripts/ (dev only)
```

**Files Changed**:
- lib/purchases/revenuecat.ts — 6 statements gated (2 warn, 4 error)
- lib/storage/theme-storage.ts — 3 statements gated
- lib/storage/language-storage.ts — 2 statements gated
- lib/theme/ThemeProvider.tsx — 1 statement gated
- lib/api/my-hadith.ts — 2 statements gated
- lib/offline/sync-manager.ts — 1 statement gated
- lib/revenuecat/RevenueCatProvider.tsx — 2 statements gated
- app/my-hadith/create-folder.tsx — 1 statement gated
- app/my-hadith/folder/[id].tsx — 1 statement gated
- components/my-hadith/SaveHadithModal.tsx — 1 statement gated
- components/share/ShareSheet.tsx — 1 statement gated

**Verification Command**:
```
grep -rn 'console\.\(log\|warn\|error\)' --include='*.ts' --include='*.tsx' lib/ app/ components/ | grep -v '__DEV__' | grep -v 'ErrorBoundary' | grep -v 'api/chat'
```

**Result**: Fixed

**Lesson**: 
Every console statement must be gated behind `__DEV__` except ErrorBoundary (standard React pattern) and server-side routes. Add this check to any pre-release audit.

---

### [FIX-022] — AI Quota Cosmetic Only (No Persistence, No Enforcement)
**Date**: 2026-05-07
**Session**: Claude Code — Release Hardening Sprint 02
**Severity**: Critical

**Error Message**:
```
AI Assistant free-tier quota displays 3/3 remaining but resets on every app restart. No actual limit enforcement — users can send unlimited messages.
```

**Root Cause**: 
`freeUsed` was stored in `useState(0)` with no persistence layer. The counter reset on every mount. No check before API call. No premium bypass. The quota banner was purely cosmetic.

**Fix Applied**:
```
1. Added AsyncStorage persistence with date-keyed JSON: { date: "2026-05-07", count: 3 }
2. On mount: load persisted count, reset if date changed (daily reset)
3. Before send: check isAtLimit flag, block if free user at limit
4. On success only: increment and persist (failed calls don't consume quota)
5. Premium bypass: usePremiumStatus().isPremium skips all quota logic
6. UI: disable input + send button at limit, show upgrade message in quota banner
```

**Files Changed**:
- app/(tabs)/assistant.tsx — full quota system rewrite: AsyncStorage persistence, premium bypass, send gate, limit-reached UI

**Verification Command**:
```
1. Send 3 messages as free user — quota banner shows 0/3, input disabled
2. Force-quit and reopen app — quota persists, still blocked
3. Wait until next day (or change device date) — quota resets
4. Premium user — banner shows "Unlimited", no limit enforced
```

**Result**: Fixed

**Lesson**: 
Any usage limit displayed to the user MUST be backed by actual enforcement. A cosmetic counter without persistence and a send gate is worse than no counter — it sets false expectations. Always persist quotas to AsyncStorage with a date key for daily resets.

---

## PATTERN TRACKER

| Pattern | Occurrences | Root Cause | Systemic Fix Needed |
|---------|-------------|------------|---------------------|
| DB column name mismatch | 6 (FIX-002, 009, 010, 011, 013, 015, 016) | Code written against assumed schema, not actual production schema | Add HADITH_COLUMNS constant + always verify columns against Supabase dashboard before any query work |
| Orphan screens (no nav path) | 4 (FIX-003, 005, 017, 020) | Screen files created but no button/link navigates to them | After creating any screen, ALWAYS add at least one navigation path. Audit with grep before submission |
| PostgREST FK join on hadiths | 3 (FIX-011, 012, 014) | Hadiths table has no foreign keys but code assumes FK relationships | Never use FK join syntax on hadiths table. Use simple .select() + separate lookups |
| RevenueCat config scattered | 3 (FIX-004, 006, 007) | Config duplicated across multiple files with different values | Single source of truth: lib/revenuecat/config.ts only |
| Unhandled async in useEffect | 2 (FIX-019, FIX-004) | Async IIFE with no .catch() causes crash or infinite spinner | Every async IIFE in useEffect MUST have try/catch/finally |
| Hardcoded test keys in prod | 2 (FIX-004, 006) | Test API keys committed directly in source | Use EAS secrets + app.config.js extra interpolation. Never hardcode keys |
| Template boilerplate shipped | 2 (FIX-005, 018) | Expo scaffolding files never cleaned up | Audit for template files (modal.tsx, ThemedText, react-logo) after scaffolding |
| Silent PostgREST failures | 1 (FIX-016) | PostgREST does not error on non-existent filter columns | Test search/filter results manually. Column typos cause silent zero-result returns |
| Static COLORS import (dark mode) | 6 screens (FIX-024) | COLORS = LIGHT_COLORS always light. Screens using COLORS instead of getColors(isDark) | Every screen MUST use getColors(isDark) with useTheme() hook. Never import COLORS directly |
| Ungated console statements | 19 statements (FIX-023) | console.error/warn shipped to production without __DEV__ guard | All console statements must be prefixed with __DEV__ && except ErrorBoundary and server routes |
| Cosmetic-only enforcement | 1 (FIX-022) | Usage limit displayed but not persisted or enforced | Any user-facing limit must be backed by AsyncStorage persistence + actual send gate |

---

## QUICK REFERENCE — COMMON FIX CATEGORIES

| Category | Typical Cause | First Check |
|----------|--------------|-------------|
| Build fails | Dependency mismatch, Expo SDK incompatibility | npx expo doctor, check package.json |
| TypeScript error | Type mismatch, missing types, strict mode | npx tsc --noEmit |
| Metro bundler crash | Cache corruption, circular imports | npx expo start -c |
| EAS build failure | eas.json config, provisioning, bundle ID | EAS build logs, eas.json |
| Runtime crash | Null reference, async error, missing env var | Check .env, check lib/ configs |
| iOS specific | Podfile, native module, Info.plist | npx expo prebuild --clean (ask KP first) |
| Auth/Supabase | Missing keys, wrong URL, RLS policy | Check .env, check lib/supabase config |
| RevenueCat | Wrong API key, wrong entitlement ID | Check lib/revenuecat/config.ts ONLY |
| Navigation | Wrong route path, missing screen, layout error | Check app/ directory structure |
| Blank tabs/screens | DB column name mismatch | Verify column names against actual Supabase schema |
| AI chat not working | Relative API path on native | Must use full URL on iOS/Android, not /api/chat |
| Search not returning results | TruthSerum not wired, wrong column names | Check expandSearchQuery is called, verify column names |
