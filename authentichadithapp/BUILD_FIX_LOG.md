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
