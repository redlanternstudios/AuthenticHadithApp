# V1_SCHEMA_ALIGNMENT_AUDIT.md

**Audit date:** 2026-05-08
**Scope:** every visible mobile route → production Supabase schema
**Auditor:** V1 Schema Alignment Sprint (FIX-035)
**Production Supabase:** `nqklipakrfuwebkdnhwg.supabase.co`
**Method:** PostgREST schema probing with anon key + repo-wide source inspection

---

## TL;DR

The earlier "missing tables" finding was partially incorrect. After full schema probing:

- **3 V1 tables genuinely need to be created:** `quiz_questions`, `study_notes`, `user_progress_events`.
- **No mobile screen currently queries a missing table.** Every visible V1 screen has a backing table in production.
- **Several "missing" tables in the prior audit are actually aliased** to existing production tables under different names. Documented in the alias map below.
- **Only one screen has a real crash risk:** `app/stories/companion/[slug].tsx` uses `.single()` on a slug that may not match (Rule 028 violation). Same risk in `app/stories/prophet/[slug].tsx` and `app/learn/lesson/[lessonId].tsx`.
- **Sunnah live data is healthy.** 365 practices + 10 categories already in production. The bundled fallback dataset is correctly used only as a last resort per Rule 030.
- **Content gaps remain:** Musnad Ahmad has 393 of ~27,647 hadiths; `lesson_hadith` join table is empty; `quiz_questions` will be empty until authored.

The V1 release is **content-bounded**, not **schema-bounded**.

---

## Production Schema Snapshot — Tables That Exist

| Table | Rows | Source migration | Used by mobile route |
|---|---:|---|---|
| `collections` | 8 | seeded externally | collections, collection/[slug] |
| `books` | 410 | seeded externally | book/[id] |
| `chapters` | 735 | seeded externally | chapter/[id] |
| `hadiths` | 31,886 | seeded externally | hadith/[id], search, today, home |
| `tags` | 168 | seeded externally | hadith/[id] |
| `hadith_tags` | 88 | seeded externally | hadith/[id] |
| `topics` | 10 | seeded externally | topics/index, topics/[slug] |
| `prophets` | 25 | seeded externally | stories/index, stories/prophet/[slug] |
| `sahaba` | 13 | seeded externally | stories/index, stories/companion/[slug] |
| `prophet_stories` | 43 | seeded externally | stories/prophet/[slug] |
| `story_parts` | 36 | seeded externally | stories/companion/[slug] (filtered by sahabi_id) |
| `sunnah_categories` | 10 | seeded externally | sunnah |
| `sunnah_practices` | 365 | seeded externally | sunnah |
| `achievements` | 33 | seeded externally | (legacy; current screen reads local progress) |
| `learning_paths` | 6 | 999-mobile-app-tables.sql | (tabs)/learn, learn/[pathId] |
| `lessons` | 10 | 999-mobile-app-tables.sql | learn/lesson/[lessonId] |
| `path_lessons` | 10 | 999-mobile-app-tables.sql | learn/[pathId] |
| `lesson_hadith` | 0 | 999-mobile-app-tables.sql | learn/lesson/[lessonId] (sparse — content gap) |
| `promo_codes` | 3 | 999-mobile-app-tables.sql | redeem |
| `redemptions` | 0 | 999-mobile-app-tables.sql | redeem (RPC writes here) |
| `hadith_folders` | 0 | 996-my-hadith-tables.sql | my-hadith, my-hadith/folder/[id] |
| `folder_collaborators` | 0 | 996-my-hadith-tables.sql | (sharing — deferred) |
| `folder_comments` | 0 | 996-my-hadith-tables.sql | (collab — deferred) |
| `saved_hadiths` | RLS | (extended by 996) | bookmarks, my-hadith, reflections |
| `hadith_views` | RLS | seeded externally | hadith/[id] |
| `reflections` | RLS | seeded externally | reflections (alternate; current uses saved_hadiths.notes) |
| `quiz_attempts` | RLS | seeded externally | quiz |
| `user_streaks` | RLS | seeded externally | progress |
| `user_lesson_progress` | RLS | 999-mobile-app-tables.sql | progress (mirror) |
| `prophet_reading_progress` | RLS | seeded externally | progress (mirror) |
| `sahaba_reading_progress` | RLS | seeded externally | progress (mirror) |
| `user_stats` | RLS | seeded externally | progress (mirror) |
| `user_achievements` | RLS | seeded externally | (legacy mirror) |
| `profiles` | RLS | seeded externally | profile |
| `user_preferences` | RLS | seeded externally | settings |
| `subscriptions` | RLS | seeded externally | settings/subscription |
| `stripe_events` | RLS | seeded externally | (web webhook log) |

---

## Alias Map — Earlier "Missing" Tables → Production Names

| Brief / earlier-audit name | Real production table | Status |
|---|---|---|
| `companions` | **`sahaba`** | Already exists, 13 rows. No migration needed. |
| `companion_stories` | **`story_parts`** filtered by `sahabi_id` | Already exists, 36 rows. Companion detail screen already queries the right table. |
| `my_hadith_folders` | **`hadith_folders`** | Already exists from migration 996. App code already uses correct name. |
| `folder_hadiths` | **`saved_hadiths.folder_id`** column | Already exists from migration 996. The folder→hadith relation is a column on saved_hadiths, not a separate join table. |
| `redeem_codes` | **`promo_codes`** | Already exists from migration 999. App calls `redeem_promo_code()` RPC. |
| `bookmarks` | **`saved_hadiths`** | Already exists. App code is aligned. |
| `daily_hadiths` | (no table — computed at request time from `hadiths`) | Intentional. Daily hadith is deterministic via date hash. |
| `study_notes` | **does not exist** | Created in this sprint. |
| `quiz_questions` | **does not exist** | Created in this sprint. |
| `user_progress_events` | **does not exist** | Created in this sprint. |

---

## Route-by-Route Audit

### Stories

#### `app/stories/index.tsx` — Stories list (V1: required)

- **Tables queried:** `prophets`, `sahaba`
- **Both exist:** ✅ 25 prophets, 13 sahaba
- **Failure mode (current):** none
- **Risk:** low
- **Fix:** none (route works against live data)

#### `app/stories/prophet/[slug].tsx` — Prophet story (V1: required)

- **Tables queried:** `prophets` by slug, `prophet_stories` by `prophet_id`
- **Both exist:** ✅ 25 prophets, 43 story parts
- **Failure mode (current):** `.single()` on `prophets` will throw `PGRST116` if a user opens an invalid slug (deep-link with bad URL, or stale cache). Result: React Query throws, screen shows blank. Rule 028 violation.
- **Risk:** medium (deep-link or hardware-back from wrong screen could trigger)
- **Fix strategy:** harden with `.maybeSingle()` + clear "Story not found" empty state.

#### `app/stories/companion/[slug].tsx` — Companion story (V1: required)

- **Tables queried:** `sahaba` by slug, `story_parts` by `sahabi_id`
- **Both exist:** ✅ 13 sahaba, 36 story parts
- **Failure mode (current):** Same `.single()` crash risk as prophet screen.
- **Risk:** medium
- **Fix strategy:** harden with `.maybeSingle()` + clear empty state.

### My Hadith

#### `app/(tabs)/my-hadith.tsx` — Folder grid (V1: required)

- **Tables queried via `lib/api/my-hadith.ts`:** `hadith_folders`, `saved_hadiths`
- **Both exist:** ✅ from migration 996
- **Failure mode (current):** none — auth gate is friendly, FlatList has empty state
- **Risk:** low
- **Fix:** none

#### `app/my-hadith/folder/[id].tsx` — Folder detail (V1: required)

- **Tables queried:** `saved_hadiths` joined to `hadiths`
- **Both exist:** ✅
- **Risk:** low
- **Fix:** none required for V1

#### `app/my-hadith/create-folder.tsx` — Create folder (V1: required)

- **Tables queried:** `hadith_folders` insert
- **Exists:** ✅
- **Risk:** low
- **Fix:** none

### Quiz

#### `app/quiz.tsx` — Knowledge quiz (V1: required)

- **Tables queried:** `hadiths` (random offset reads), `quiz_attempts` (insert)
- **Both exist:** ✅ 31,886 hadiths, quiz_attempts is RLS-protected
- **Behavior:** Questions are generated dynamically from random hadith metadata (narrator, collection, grade). No `quiz_questions` table is read by the screen as currently coded.
- **Failure mode (current):** none for V1; quiz works against live hadiths
- **Risk:** low
- **Fix strategy:** **create `quiz_questions` table for forward compatibility** (KP wants authored quiz content for V1+). Screen does not need to be wired to the new table for V1 launch — it remains dynamic. Authored content can be layered later.

### Notes / Reflections

#### `app/reflections.tsx` — Reflections (V1: required)

- **Tables queried:** `saved_hadiths` filtered by `notes IS NOT NULL`
- **Exists:** ✅ `saved_hadiths.notes` column added by migration 996
- **Failure mode (current):** none — sign-in gate is friendly, empty state present
- **Risk:** low
- **Fix:** none. The reflections screen reuses `saved_hadiths.notes` and is correctly aligned.
- **Forward-looking:** `study_notes` table is created in this sprint to support future entity-flexible notes (lessons, stories, sunnah practices). Reflections screen is unchanged.

### Progress / Badges

#### `app/progress.tsx` — Progress dashboard (V1: required)

- **Source:** `lib/progress/progressService.ts` (local AsyncStorage) + best-effort Supabase mirror
- **Tables mirrored to:** `prophet_reading_progress`, `sahaba_reading_progress`, `user_lesson_progress`, `user_stats` — all exist
- **Failure mode (current):** none. Local-first means UI never depends on Supabase. Mirror failures swallow silently per FIX-032.
- **Risk:** low
- **Fix:** none required. **Forward-looking:** `user_progress_events` table is created in this sprint to enable a unified mirror later. Service is unchanged for V1.

#### `app/achievements.tsx` — Badges (V1: required)

- **Source:** `useBadges()` + `useProgressSummary()` from progress service (local)
- **Tables queried:** none directly (FIX-032 cleanup)
- **Failure mode (current):** none
- **Risk:** low
- **Fix:** none

### Sunnah

#### `app/sunnah.tsx` — Sunnah practices (V1: required)

- **Tables queried:** `sunnah_categories`, `sunnah_practices`
- **Both exist:** ✅ 10 categories, **365 practices** (full year already populated)
- **Fallback:** `lib/sunnah/sunnahFallbackData.ts` (Rule 030) — currently used only when live count is 0. Live data wins.
- **Failure mode (current):** none. Live data renders.
- **Risk:** low
- **Fix:** none

### Learn

#### `app/(tabs)/learn.tsx` — Path list (V1: required)

- **Tables queried:** `learning_paths`
- **Exists:** ✅ 6 paths
- **Risk:** low

#### `app/learn/[pathId].tsx` — Path detail (V1: required)

- **Tables queried:** `learning_paths`, `path_lessons` join `lessons`
- **All exist:** ✅ 6 paths, 10 path-lesson links, 10 lessons
- **Risk:** low
- **Content gap:** only ~1.7 lessons per path on average. UX-bounded, not schema-bounded.

#### `app/learn/lesson/[lessonId].tsx` — Lesson detail (V1: required)

- **Tables queried:** `lessons` by id, `lesson_hadith` join `hadiths` (deferred), `user_lesson_progress` (mirror via service)
- **Lessons exist:** ✅ 10 rows
- **Failure mode (current):** Same `.single()` risk as story screens — bad lessonId → throw → blank screen. Also returns `null` on missing lesson (silent blank screen, no message). Rule 028 + Rule 005 violations.
- **Risk:** medium
- **Fix strategy:** harden with `.maybeSingle()` + clear "Lesson not found" empty state.
- **Content gap:** `lesson_hadith` is empty; lessons currently show only their own `content` text. Acceptable for V1; richer hadith linking is a content task.

### Collections / Hadith

#### `app/(tabs)/collections.tsx`, `app/collection/[slug].tsx`, `app/book/[id].tsx`, `app/chapter/[id].tsx`, `app/hadith/[id].tsx`

- **Tables:** `collections`, `books`, `chapters`, `hadiths`, `hadith_tags`, `tags`, `saved_hadiths`, `hadith_views`
- **All exist:** ✅
- **Risk:** low
- **Fix:** none for V1

### Redeem / Promo

#### `app/redeem/index.tsx` — Redeem code (V1: required)

- **RPC:** `redeem_promo_code(p_code)` — defined in `998-redeem-function.sql`
- **Tables touched by RPC:** `promo_codes` (read), `redemptions` (write)
- **Both exist:** ✅ 3 promo codes, 0 redemptions
- **Risk:** low

#### `app/redeem/my-code.tsx` — User's referral code (V1: required)

- **Tables queried:** `promo_codes` filtered by `created_by`
- **Exists:** ✅
- **Risk:** low

---

## V1 Tables Created In This Sprint

### `quiz_questions` (NEW)

**Purpose:** support authored quiz content for the quiz screen and lesson-attached quizzes.

**Why now:** the current quiz screen generates questions dynamically from random hadith metadata. KP wants the option to publish authored questions tied to lessons or specific hadiths. Creating the table now unblocks future content authoring without schema migration churn close to launch.

**App alignment for V1:** none required. The quiz screen continues to work dynamically. When authored content is seeded, the screen can be extended to prefer authored questions.

### `study_notes` (NEW)

**Purpose:** entity-flexible user notes — attach a note to any hadith, lesson, story, or sunnah practice.

**Why now:** reflections currently piggyback on `saved_hadiths.notes`, which only supports hadith-attached notes. To support notes on lessons, stories, and sunnah practices in V1+, we need a polymorphic table.

**App alignment for V1:** none required. Reflections screen continues to use `saved_hadiths.notes`. New surfaces (e.g. "Add Note" on a lesson) can write to `study_notes` when introduced.

### `user_progress_events` (NEW)

**Purpose:** unified Supabase mirror for progress events across all completion types.

**Why now:** the existing per-type mirrors (`prophet_reading_progress`, `sahaba_reading_progress`, `user_lesson_progress`) are siloed. A unified events table enables badge eligibility, streak calculation, and timeline rendering from one source — useful for the next progress UX iteration.

**App alignment for V1:** none required. Local-first progress service is unchanged. Future enhancement: extend `syncCompletionToSupabase` in `lib/progress/progressService.ts` to also write to `user_progress_events`.

---

## App Alignment Changes (Phase 5 / Phase 6)

### Hardened screens

| File | Change | Reason |
|---|---|---|
| `app/stories/prophet/[slug].tsx` | `.single()` → `.maybeSingle()` + non-null guard for parts query | Rule 028 — avoid PGRST116 throw on bad slug |
| `app/stories/companion/[slug].tsx` | `.single()` → `.maybeSingle()` + non-null guard | Rule 028 |
| `app/learn/lesson/[lessonId].tsx` | `.single()` → `.maybeSingle()`, replace silent `return null` with empty-state UI | Rule 028 + Rule 005 — no blank screen |

### Verified-correct (no change needed)

| File | Backing table | Already correct? |
|---|---|---|
| `app/(tabs)/my-hadith.tsx`, `lib/api/my-hadith.ts` | `hadith_folders`, `saved_hadiths.folder_id` | ✅ |
| `app/redeem/index.tsx` | `promo_codes` via RPC | ✅ |
| `app/sunnah.tsx` | `sunnah_categories`, `sunnah_practices` (with fallback) | ✅ |
| `app/quiz.tsx` | `hadiths`, `quiz_attempts` (dynamic generation) | ✅ |
| `app/reflections.tsx` | `saved_hadiths.notes` | ✅ |
| `app/achievements.tsx` | local progress service (FIX-032) | ✅ |
| `app/progress.tsx` | local progress service (FIX-032) | ✅ |

---

## Seed Content Status

### Has real content (no seed required)

- 8 collections, 410 books, 735 chapters, 31,886 hadiths
- 25 prophets, 13 sahaba, 43 prophet stories, 36 companion story parts
- 365 sunnah practices, 10 sunnah categories
- 6 learning paths, 10 lessons, 10 path-lesson links
- 3 promo codes, 33 achievements

### Needs seed content (V1 acceptable as empty with intentional empty state)

| Table | V1 status | Path forward |
|---|---|---|
| `quiz_questions` | empty — quiz screen runs dynamically against `hadiths` | Author content post-launch; screen does not depend on it for V1 |
| `study_notes` | empty — reflections screen uses `saved_hadiths.notes` | User-created when "Add Note" surfaces are added to lessons/stories |
| `user_progress_events` | empty — local-first progress is canonical | User-created when service is extended to mirror here |
| `lesson_hadith` | empty — lessons show their own `content` text | Content task: link hadiths to existing 10 lessons |

### Must NOT be faked

- **No invented Islamic content.** Quiz questions, study notes, and any future authored content must be sourced from KP / scholars / approved references.
- **Musnad Ahmad (393 / 27,647 hadiths)** is a content gap, not a schema gap. Do not bulk-import from unverified sources. If filling this is a V1 priority, source from sunnah.com API or another verified provider with KP approval.

---

## Application Order

The new migration is `100-v1-schema-alignment.sql` at `authentichadithapp/supabase/migrations/`. The numeric prefix is intentionally above 999 so it applies after all existing migrations.

**To apply to production (KP runs):**

1. Open Supabase dashboard for project `nqklipakrfuwebkdnhwg`
2. SQL Editor → New query
3. Paste contents of `authentichadithapp/supabase/migrations/100-v1-schema-alignment.sql`
4. Review the migration's `BEGIN` / `COMMIT` block — every statement is `IF NOT EXISTS` / `DO $$ BEGIN ... EXCEPTION` so re-running is safe
5. Run
6. Verify with the post-apply checks below

**Post-apply verification (anon key, run from local shell):**

```bash
SUPABASE_URL="https://nqklipakrfuwebkdnhwg.supabase.co"
ANON_KEY="<anon-key-from-lib/supabase/config.ts>"
for tbl in quiz_questions study_notes user_progress_events; do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/${tbl}?select=*&limit=1" \
    -H "apikey: ${ANON_KEY}")
  echo "$tbl HTTP=$code"
done
# All three should return 200 (or 200 with empty array).
```

**Expected after apply:**

- `quiz_questions` → HTTP 200, 0 rows (empty until authored)
- `study_notes` → HTTP 200, 0 rows (RLS-protected — user-owned)
- `user_progress_events` → HTTP 200, 0 rows (RLS-protected — user-owned)

---

## Remaining V1 Risks

| Risk | Severity | Owner | Notes |
|---|---|---|---|
| Active Reanimated 4.1.1 warm-relaunch hang (ERROR_REPORT.md) | **Critical — blocks ship** | KP | Schema sprint did not touch this. Decide Option A/B/C from ERROR_REPORT before submission. |
| Musnad Ahmad has 393 of 27,647 hadiths | High (collection looks broken in UI) | KP / data | Content task, not schema |
| `lesson_hadith` join table is empty | Medium (lessons are read-only, no inline hadiths) | Content team | UX still functions |
| `quiz_questions` empty until authored | Low (quiz works dynamically) | Content team | Forward-compatible schema in place |
| Folder collaboration UI not wired | Low (deferred) | Engineering | Tables exist; collab features are post-V1 |

---

## Documentation Updates From This Sprint

- `BUILD_FIX_LOG.md` → FIX-035 entry
- `SYSTEM_RULES.md` → Rule 032 (table-name aliases must be documented; no new tables when an existing one serves)
- `APP_LAUNCH_PLAYBOOK.md` → V1 schema gate checklist
- `ERROR_REPORT.md` → unchanged (active reanimated bug remains the gate to ship)
- `V1_SCHEMA_ALIGNMENT_AUDIT.md` → this file

---

## Sprint Outcome

| Phase | Status |
|---|---|
| 1. Route-to-schema audit | ✅ Complete (this file) |
| 2. V1 schema contract | ✅ 3 new tables defined: `quiz_questions`, `study_notes`, `user_progress_events` |
| 3. Migration file | ✅ `100-v1-schema-alignment.sql` |
| 4. Minimum seed content | ✅ Intentionally none — content tables are user-owned or authored-later |
| 5. App query alignment | ✅ Verified all V1 routes hit existing tables; alias map documented |
| 6. UI hardening | ✅ `.maybeSingle()` + empty states added to 3 detail screens |
| 7. Verification | ✅ tsc clean, package-lock valid, expo-doctor (see BUILD_FIX_LOG FIX-035) |
| 8. Documentation | ✅ BUILD_FIX_LOG / SYSTEM_RULES / APP_LAUNCH_PLAYBOOK updated |
| 9. Commit | ✅ Committed on `claude/objective-raman-d86066`. Push-to-main requires KP approval. |
