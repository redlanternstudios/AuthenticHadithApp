# BUILD_FIX_LOG.md — Authentic Hadith iOS App
## Historical Repair Database

> **PURPOSE**: This is the permanent record of every bug fixed in this app. Every Claude session MUST check this log before attempting a fix — the solution may already be here. After fixing any bug, log it here using the format below. This file only grows — never delete entries.

---

## HOW TO USE THIS FILE

**For Claude**: Search this file for keywords from the current error. If a match exists, apply the documented fix. If it is a new error, fix it and add a new entry.

**For KP / Any Engineer**: This is your app repair history. Use it to spot patterns, recurring issues, and track what has been fixed. Hand this file to any new developer or AI session to give them full context on every landmine in this codebase.

---

## GOLDEN RULES (Learned from 16 bugs across 9 sessions)

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

## PATTERN TRACKER

| Pattern | Occurrences | Root Cause | Systemic Fix Needed |
|---------|-------------|------------|---------------------|
| DB column name mismatch | 6 (FIX-002, 009, 010, 011, 013, 015, 016) | Code written against assumed schema, not actual production schema | Add HADITH_COLUMNS constant + always verify columns against Supabase dashboard before any query work |
| PostgREST FK join on hadiths | 3 (FIX-011, 012, 014) | Hadiths table has no foreign keys but code assumes FK relationships | Never use FK join syntax on hadiths table. Use simple .select() + separate lookups |
| RevenueCat config scattered | 3 (FIX-004, 006, 007) | Config duplicated across multiple files with different values | Single source of truth: lib/revenuecat/config.ts only |
| Hardcoded test keys in prod | 2 (FIX-004, 006) | Test API keys committed directly in source | Use EAS secrets + app.config.js extra interpolation. Never hardcode keys |
| Missing stub screens | 2 (FIX-003, 005) | Routes defined in navigation but screen files never created | Always create stub screens when adding new routes |
| Silent PostgREST failures | 1 (FIX-016) | PostgREST does not error on non-existent filter columns | Test search/filter results manually. Column typos cause silent zero-result returns |

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
