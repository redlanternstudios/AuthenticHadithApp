# APP_STORE_RELEASE_BLOCKERS.md — Authentic Hadith iOS App
## Final Production Readiness Audit — 2026-05-07

> **PURPOSE**: Comprehensive pre-submission audit based on full codebase review of all 48 route files, all lib/ services, all hooks, config files, assets, and navigation paths. Every finding is grounded in actual file content with line numbers.

---

## RELEASE READINESS SCORE: 6.5 / 10

The app is functional and the core user journey works. But there are 4 items that risk App Store rejection, several screens unreachable by users, and a layer of unfinished polish that would hurt first impressions in a 27-country launch.

---

## CRITICAL BLOCKERS (Fix before submission)

These will cause App Store rejection, crashes, or broken revenue.

### CB-01: Delete Account Screen Unreachable
**Risk**: APP STORE REJECTION
**File**: `settings/delete-account.tsx` exists but ZERO navigation links point to it
**Why it matters**: Apple requires apps with account creation to offer account deletion (App Store Review Guideline 5.1.1). The screen exists and works, but users cannot reach it. No button in settings or profile navigates here.
**Fix**: Add a "Delete Account" row in the profile or settings screen that calls `router.push('/settings/delete-account')`.

### CB-02: Subscription Screen Unreachable
**Risk**: REVENUE BLOCKED
**File**: `settings/subscription.tsx` exists but ZERO navigation links point to it
**Why it matters**: Users cannot access the paywall or manage subscriptions. RevenueCat is configured but the purchase flow is a dead end. This directly blocks monetization.
**Fix**: Add subscription management link in profile screen. Also wire up any "Upgrade" or "Premium" CTAs to this route.

### CB-03: Bookmarks Screen Unreachable
**Risk**: BROKEN FEATURE
**File**: `bookmarks/index.tsx` exists but ZERO navigation links point to it
**Why it matters**: Users can save hadiths via bookmark buttons throughout the app, but they cannot view their saved bookmarks anywhere. The feature is half-built.
**Fix**: Add a bookmarks link in the profile screen or my-hadith tab.

### CB-04: Subscription Screen Crash on RevenueCat Failure
**Risk**: CRASH
**File**: `settings/subscription.tsx` lines 25-30
**Why it matters**: The `useEffect` async IIFE has no `.catch()`. If RevenueCat fails to initialize (network error, wrong API key, first-time cold start), the Promise rejects unhandled. Loading state never resolves, user sees infinite spinner or crash.
**Fix**: Add `.catch()` to the async IIFE. Set `loading` to false and show error state on failure.

### CB-05: modal.tsx is Expo Template Boilerplate
**Risk**: APP STORE REJECTION (unprofessional)
**File**: `modal.tsx` — displays "This is a modal" with a link back to home
**Why it matters**: If an Apple reviewer navigates to this screen, it signals an unfinished app. It is registered in `_layout.tsx` line 48 and technically reachable.
**Fix**: Delete `modal.tsx` and remove its Stack.Screen entry from `_layout.tsx`.

---

## MEDIUM ISSUES (Fix before or immediately after submission)

These cause degraded UX, visual bugs, or silent data loss.

### MI-01: Dark Mode Broken on 6 Screens
**Screens affected**: `collections.tsx`, `search.tsx`, `learn.tsx`, `my-hadith.tsx`, `assistant.tsx`, `bookmarks/index.tsx`
**Root cause**: These screens import the static `COLORS` object (always light mode) instead of calling `getColors(isDark)` like `profile.tsx` and `hadith/[id].tsx` do correctly.
**Impact**: If a user has dark mode enabled on their device, these 6 screens render with incorrect color contrast. Text may be invisible or backgrounds may clash.
**Fix**: Replace `COLORS` import with `getColors(useColorScheme() === 'dark')` pattern on each screen.

### MI-02: 17 console.log/error/warn Statements Ship to Production
**Files**: `lib/purchases/revenuecat.ts` (5), `lib/storage/theme-storage.ts` (3), `lib/storage/language-storage.ts` (2), `lib/revenuecat/RevenueCatProvider.tsx` (2), `lib/offline/sync-manager.ts` (1), `lib/api/my-hadith.ts` (2), `lib/theme/ThemeProvider.tsx` (1), `lib/auth/AuthProvider.tsx` (1)
**Impact**: Debug output leaks to device console in production. Security scanners and Apple reviewers flag this. Some log internal error details that should not be visible.
**Fix**: Replace with a logger utility gated behind `__DEV__`, or remove entirely.

### MI-03: No Error States on 6 Tab Screens
**Screens**: `index.tsx`, `today.tsx`, `collections.tsx`, `search.tsx`, `learn.tsx`, `my-hadith.tsx`
**Impact**: If Supabase is unreachable (network down, maintenance, regional outage), these screens show a blank white area after the spinner disappears. No retry button, no "Something went wrong" message.
**Fix**: Add error UI with retry button to each screen's query result handling.

### MI-04: AI Assistant Daily Quota Not Enforced
**File**: `assistant.tsx` lines 9, 28
**Root cause**: `FREE_DAILY_LIMIT = 3` is defined and the quota banner displays a countdown, but the send button is never disabled when the limit is reached. `freeUsed` resets to 0 on every component mount (not persisted to AsyncStorage).
**Impact**: The quota is purely cosmetic. Free users get unlimited AI queries. This burns Groq API tokens with no revenue gate.
**Fix**: Persist `freeUsed` to AsyncStorage with a date key. Check `freeUsed >= FREE_DAILY_LIMIT` in `sendMessage` and disable the send button.

### MI-05: Hardcoded Supabase Anon Key in Source
**File**: `lib/supabase/client.ts` lines 8-9
**Content**: Full Supabase URL and anon JWT hardcoded as fallback values
**Impact**: The anon key is a client-side key (not a server secret), so this is not a credential leak. But it means the app silently connects to production Supabase even if env config is broken, masking misconfiguration. Security scanners also flag hardcoded JWTs.
**Fix**: Gate the fallback behind `__DEV__` or remove it entirely and throw if env vars are missing.

### MI-06: Duplicate QueryClientProvider Wrapping
**File**: `_layout.tsx` lines 59 and 64
**Impact**: Both `QueryClientProvider` and `ReactQueryProvider` wrap the app. One creates its own client, potentially shadowing the other. This can cause cache inconsistencies where queries in some components use a different cache than others.
**Fix**: Remove one of the two providers. Keep whichever one all existing hooks reference.

### MI-07: appEnv Defaults to "development"
**Files**: `app.json` line 55, `app.config.js` line 27
**Impact**: If `EXPO_PUBLIC_APP_ENV` is not set in EAS build secrets, the production app ships with `appEnv: "development"`. Any code branching on this value will take the dev path.
**Fix**: Verify `EXPO_PUBLIC_APP_ENV=production` is set in EAS production environment secrets. Or change the default to `'production'`.

### MI-08: 4 Routes Missing from Root Stack Configuration
**Routes**: `topics/`, `bookmarks/`, `book/`, `chapter/`
**Impact**: These screens work via Expo Router auto-discovery, but they lack the `headerShown: false` setting that every other route gets. Users see the default Expo header on these 4 screens while all others have custom headers. Visual inconsistency.
**Fix**: Add Stack.Screen entries for these routes in `_layout.tsx` with `headerShown: false`.

### MI-09: today.tsx Unhandled Promise Rejection
**File**: `today.tsx` lines 123-130
**Root cause**: `handleSave` has no try/catch. If the Supabase upsert fails, the promise rejects unhandled.
**Impact**: On some React Native builds, unhandled promise rejections cause a yellow box warning or crash.
**Fix**: Wrap in try/catch with error feedback to user.

### MI-10: Home Screen Random Offset Crash Risk
**File**: `index.tsx` line 50
**Root cause**: `Math.floor(Math.random() * 1000)` generates an offset. If the hadiths table has fewer than 1000 rows, `.range(offset, offset).single()` returns no rows and throws.
**Impact**: The "Hadith of the Moment" section crashes silently and shows blank content.
**Fix**: Query the count first, or use `.maybeSingle()` with a fallback, or cap the random offset to the actual row count.

### MI-11: Silent Error Drops in Gamification
**File**: `lib/gamification/track-activity.ts` lines 39, 47, 91, 101
**Impact**: XP, streak, and stat updates silently fail if Supabase returns errors. Users do not know their progress was not saved.
**Fix**: Check error returns on update/insert calls.

### MI-12: Signup Profile Insert Silently Fails
**File**: `lib/auth/AuthProvider.tsx` line 75
**Impact**: If the profiles table insert fails after account creation, the user has an auth account but no profile row. Downstream queries on profiles will fail.
**Fix**: Check error return and handle (retry or show error).

### MI-13: 8 Tabs in Tab Bar
**Impact**: Apple's HIG recommends a maximum of 5 tabs. 8 tabs crowds the tab bar, especially on smaller devices (iPhone SE). Apple reviewers may flag this.
**Fix**: Consider consolidating to 5 tabs. Move Learn, Assistant, and My Hadith behind a "More" tab or integrate them into existing tabs.

---

## POLISH IMPROVEMENTS (Post-launch or v1.1)

These are not blockers but improve the professional quality of the app.

### PI-01: Template Leftover Images in Bundle
**Files**: `assets/images/react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`, `partial-react-logo.png`
**Impact**: Dead weight in the app bundle. No code references them.
**Fix**: Delete all 4 files.

### PI-02: Bookmarks Show "Unknown" for Collection Name
**File**: `bookmarks/index.tsx` line 56
**Root cause**: `item.hadith?.collection?.name` assumes a nested collection object, but the hadiths table has no FK to collections. The join returns flat data with `collection_slug` as a string.
**Impact**: Every bookmark displays "Unknown" as the collection name.
**Fix**: Display `item.hadith?.collection_slug` or do a separate collection lookup by slug.

### PI-03: Lesson Detail Blank Screen on Not Found
**File**: `learn/lesson/[lessonId].tsx` line 34-35
**Impact**: `return null` gives user a blank white screen with no way to navigate back.
**Fix**: Show "Lesson not found" message with a back button.

### PI-04: Missing Empty List States
**Screens**: `collections.tsx`, `learn.tsx`, `learn/[pathId].tsx`
**Impact**: FlatLists with no `ListEmptyComponent`. If data is empty, user sees blank space.
**Fix**: Add `ListEmptyComponent` with contextual message.

### PI-05: Lesson "Mark as Complete" Button is a No-Op
**File**: `learn/lesson/[lessonId].tsx` lines 61-63
**Root cause**: TODO comment: `// TODO: Implement lesson completion`. Button just calls `router.back()`.
**Impact**: Users think they completed the lesson but nothing is recorded.
**Fix**: Implement `lesson_progress` table write, or remove the button for v1.

### PI-06: today.tsx Share Error Swallowed
**File**: `today.tsx` line 120
**Root cause**: Empty catch block `} catch {}` on Share.share().
**Fix**: At minimum log to error boundary. Or just let it propagate.

### PI-07: Notifications and Sync "Coming Soon" Stubs
**Files**: `settings/notifications.tsx`, `settings/sync.tsx`
**Impact**: Disabled switches with "coming soon" text. Apple may ask why these exist. Low rejection risk but unprofessional.
**Fix**: Either hide these routes for v1 or add a cleaner "planned feature" UI.

### PI-08: Duplicate RevenueCat Entitlement Definition
**Files**: `lib/revenuecat/config.ts` line 1, `lib/purchases/revenuecat.ts` line 40
**Impact**: Two definitions of the same constant. Risk of drift if one is updated without the other.
**Fix**: Single source of truth in config.ts, import everywhere else.

---

## SAFE FOR LAUNCH

These areas passed audit with no issues.

| Area | Status | Notes |
|------|--------|-------|
| All 48 route files export valid components | PASS | Every .tsx in app/ has a default export |
| Zero broken navigation links | PASS | All router.push/Link targets map to real files |
| Auth flow (login, signup, forgot password) | PASS | Error handling, loading states, navigation all correct |
| Hadith detail screen | PASS | Loading, error, empty states. Bookmark toggle works |
| Collection detail screen | PASS | Loading, error, empty states. Book list renders |
| Book detail screen | PASS | Loading, error, empty states |
| Chapter detail screen | PASS | Loading, error, empty states. 3-hop filter chain works |
| Achievements screen | PASS | Loading state, category filter, empty state |
| Progress screen | PASS | All stats default to 0 safely |
| Sunnah practices screen | PASS | Loading, empty states for categories and practices |
| Topics screens | PASS | Tag grid, hadith list, not-found handling |
| My-Hadith folder management | PASS | Create, view, share folders. All mutations work |
| Stories screens | PASS | Prophet and companion story routes valid |
| Profile screen | PASS | Dark mode correct, guest handling, restore purchases |
| Settings screens (language, appearance, about, privacy) | PASS | All functional |
| Supabase hooks (use-hadith, use-hadiths) | PASS | FK joins removed, correct column names |
| Bookmark service | PASS | Full error handling on all Supabase calls |
| Level calculator | PASS | Pure math, no side effects |
| EAS build config | PASS | Auto-increment, submit config, correct ascAppId |
| No localhost/127.0.0.1 references | PASS | Zero matches in codebase |
| No test API keys (sk_test, pk_test) | PASS | Zero matches in codebase |
| No broken imports detected | PASS | All import paths resolve |
| Assets (icon, splash, favicon) | PASS | All present and referenced |

---

## APP STORE REJECTION RISKS (Ranked)

| Risk | Guideline | Likelihood | Mitigation |
|------|-----------|-----------|------------|
| No account deletion accessible | 5.1.1 (Account Deletion) | **HIGH** | Wire delete-account screen to settings/profile nav |
| Boilerplate modal screen | 2.1 (App Completeness) | **MEDIUM** | Delete modal.tsx and Stack entry |
| 8 tabs in tab bar | HIG (Tab Bar) | **LOW-MEDIUM** | Consolidate to 5 or justify in App Review notes |
| "Coming soon" stub screens | 2.1 (App Completeness) | **LOW** | Hide or improve the messaging |
| Unreachable bookmarks/subscription | 2.1 (App Completeness) | **LOW** | Wire navigation paths |

---

## HIGHEST-RISK AREAS

1. **Orphan screens** — 4 functional screens with zero navigation paths. The delete-account one is a potential rejection.
2. **Dark mode inconsistency** — 6 of 8 tab screens break in dark mode. If a reviewer tests with dark mode on, the app looks broken.
3. **Revenue flow dead** — Subscription screen exists but nothing navigates to it. RevenueCat is configured but users cannot buy.
4. **Silent failures** — Gamification, profile creation, and activity tracking all silently swallow errors. Users think their data saved when it did not.

---

## FINAL STABILIZATION RECOMMENDATIONS

### Before submission (do these now):
1. Wire navigation to delete-account, subscription, and bookmarks screens
2. Delete modal.tsx and its Stack.Screen entry
3. Add .catch() to subscription.tsx useEffect
4. Fix random offset crash risk on home screen

### Before wide launch (do within 48 hours):
5. Fix dark mode on 6 screens (swap COLORS for getColors pattern)
6. Add error states with retry buttons to tab screens
7. Enforce AI assistant daily quota with AsyncStorage persistence
8. Remove or gate console.log statements behind __DEV__

### v1.1 priorities:
9. Consolidate to 5 tabs
10. Implement lesson completion tracking
11. Fix bookmarks collection name display
12. Clean up template leftover assets

---

## DOCUMENT MAINTENANCE

This file is a point-in-time snapshot. After fixes are applied:
1. Log each fix to BUILD_FIX_LOG.md
2. Update the status of each item in this file (append "FIXED — [date]")
3. Re-audit any area that received significant changes
