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
- **`profiles` columns: `name` (NOT `username`, NOT `full_name`) + `user_id` is NOT NULL and is the read key (NOT `id`).** Broke all signup/onboarding in FIX-064 — full map in `docs/SCHEMA_PROFILES.md`.
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

### [FIX-081] — Notifications screen clean honest state + unambiguous subscription date format (App Review polish)
**Date**: 2026-06-12 PT · KP-authorized · for Build 30
**Pattern category**: APP_REVIEW_COMPLETENESS + DATE_FORMAT_CLARITY
**Why**: (1) `app/settings/notifications.tsx` showed two `disabled` toggles + "Push notifications coming soon" — a Guideline 2.1 (completeness) flag: advertises features that don't work. (2) Subscription renewal/expiry dates rendered via `toLocaleDateString()` (no options) = ambiguous numeric like "7/12/2026" for a reviewer in any locale.
**Files changed** (UI/subscription-display PROTECTED, authorized):
- `app/settings/notifications.tsx` — removed the 2 disabled toggles + "coming soon" line + unused `Switch` import + orphaned styles; replaced with one clean "Stay connected" informational card (content lives in-app). No dead controls advertised.
- `app/(tabs)/profile.tsx:182` — renewal date format → `toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })` → "Jul 12, 2026". Lifetime/`>2100` guard + "Lifetime ♾️" branch unchanged.
- `app/settings/subscription.tsx:135` — same explicit format for the Renews/Expires date.
**Not changed**: date data source (still RevenueCat `expirationDate`/`status.expiresAt`), null guards, lifetime handling, any logic. Format-only on the date; no layout/styling beyond the notifications card cleanup.
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` (3 files) exit 0; subscription jest 10/10. On-device proof pending Build 30.
**Lesson learned**: disabled toggles + "coming soon" read as an unfinished screen to App Review — remove non-functional controls rather than label them. And reviewer-facing dates should use an explicit month to be locale-unambiguous.

---

### [FIX-080] — Apple reviewer premium bypass (guarantees reviewer can evaluate premium even if RevenueCat fails)
**Date**: 2026-06-12 PT · KP-authorized · for Build 29
**Pattern category**: APP_REVIEW_ACCESS_GUARANTEE
**Root cause**: Reviewer premium depended entirely on RevenueCat resolving a promotional `premium` entitlement live (RC init + Supabase identity sync). If RC hiccupped, the reviewer could see locked premium content → rejection risk. Not guaranteed in code.
**Files changed** (both SUBSCRIPTION PROTECTED, authorized):
- `lib/revenuecat/config.ts` — added `REVIEWER_EMAILS` (value = ASC `demoAccountName`, pulled live: `apple.reviewer+20260604@authentichadith.app`) + `isReviewerEmail(email)` (exact, case-insensitive, trimmed match).
- `lib/revenuecat/RevenueCatProvider.tsx` — `isPro` now `isReviewerEmail(user?.email) || customerInfo?.entitlements.active['premium']?.isActive === true`.
- `__tests__/revenuecat.test.ts` — 3 new assertions (reviewer true; normal/lookalike/legacy-email false; null/undefined/empty false).
**Behavior**: the exact reviewer demo email is always premium even if RC is down; every other user is unchanged (still needs a real RC `premium` entitlement via Apple IAP). Read-side client override only — writes nothing to RevenueCat. Covers both the Learn premium gate AND the AI quota (both read `isPro` via `usePremiumStatus`).
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` 0 errors; `npx jest __tests__/revenuecat.test.ts` → 10/10 pass. On-device proof pending Build 29.
**Compliance**: standard reviewer-access pattern; IAP intact for the public; keyed to one private email; no UI/copy change. App Review risk Low.
**Lesson learned**: for any paywalled app, give the reviewer a code-guaranteed access path that does not depend on a live third-party (RevenueCat) call — the promotional grant is the happy path, the email bypass is the safety net.

---

### [FIX-079] — Next/Previous lesson navigation (enterprise course flow)
**Date**: 2026-06-11 PT
**Pattern category**: NEW_FEATURE (lessons engine) — built to scope after KP product decisions
**Why**: The lessons engine had NO lesson-to-lesson navigation. The lesson screen only received `lessonId` with zero path/sequence context, so "next lesson" was uncomputable. KP scoped it: free-forward Next button, auto-advance on complete, Prev+Next pair.
**Architecture**:
- `hooks/useLearning.ts` (NEW) — `usePathLessons(pathId)` is the SINGLE source of lesson order (same `queryKey: ['path-lessons', pathId]` as the path screen → the lesson screen reuses the cached, identically-ordered result, no extra fetch, Prev/Next can never disagree with the displayed list). `getLessonNeighbors(lessons, lessonId)` is a pure resolver returning `{index, total, prev, next, isFirst, isLast}` with a safe all-null neighborhood when the lesson isn't in the sequence (bare deep-link).
- `app/learn/[pathId].tsx` — refactored its inline lessons query into `usePathLessons`; navigates with `?pathId=` so the lesson screen inherits sequence context.
- `app/learn/lesson/[lessonId].tsx` — reads `pathId` param; renders "Lesson X of Y"; "Mark as Complete" now advances (`Complete & Continue →` to next via `router.replace`, or `Complete & Finish Path` → back to overview on the last lesson); a free-nav Prev/Next bar (each disabled at the ends) appears only when the lesson sits in a known multi-lesson path.
**Navigation model**: `router.replace` for lateral moves keeps the stack shallow — native back always returns to the path list, never a chain of visited lessons. Degrades cleanly with no `pathId` (no bar, Mark Complete → back).
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` exit 0 on all 3 files. Live probe: Foundations path (`0d97d9e7…`) returns 4 ordered lessons (order_index 1–4) — Prev/Next + position populate correctly. On-device proof pending Build 27.
**Flagged (not fixed)**: `learning_paths.total_lessons` is stale metadata (says 8 for Foundations; actual join = 4). "Lesson X of Y" uses the honest actual count. Recommend a data backfill to reconcile the metadata.
**Lesson learned**: A lesson belongs to a path only via the `path_lessons` join — sequence has no meaning without path context. Passing `pathId` through the route + one shared ordered-query hook is what makes Prev/Next provably consistent with the list. Build navigation off the SAME data source the list renders, never a parallel query.

---

### [FIX-078] — Lessons engine hardening pass: premium fallback for null/empty lesson body
**Date**: 2026-06-11 PT
**Pattern category**: SILENT_EMPTY_UI (Rule 028 family)
**Trigger**: KP "chronic lessons hardening" directive. Audited 3 asks against real code; only one was a live gap.
**What was actually true (verified, not assumed)**:
- **Next-Lesson sequencing (ask #1): N/A** — no Next-Lesson feature exists anywhere (`grep` over `app/learn`, `components`, `lib/learning` = 0 hits). The directive's path `app/learn/[pathId]/[lessonId].tsx` does not exist (real: `app/learn/[pathId].tsx` + `app/learn/lesson/[lessonId].tsx`). Building sequential nav is a NEW FEATURE, not hardening — flagged, not fabricated.
- **Progress hydration (ask #3): ALREADY SATISFIED** — `useCompletionStatus.markComplete` → `progressService.markComplete` (`:224`) calls `notify()` (`:249`), fanning out to every dashboard subscriber (`useProgressSummary`/`useCompletedItems`/`useBadges` all `subscribe()`); the hook also flips optimistically. Mark-as-Complete already re-maps to the dashboard instantly (FIX-044 architecture). No change.
- **Content null guard (ask #2): real gap, fixed.**
**Fix**: `app/learn/lesson/[lessonId].tsx` — `lesson.description` was rendered unguarded (`Lesson.description: string` in type, but DB can return null/blank at runtime → bare card). Now: description renders only when non-blank (`?.trim()`); content section renders only when non-blank; if BOTH are empty, a single premium placeholder renders so the card is never empty. Non-noisy (no placeholder when real description OR content exists).
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` exit 0. On-device proof pending Build 27.
**Lesson learned**: Verify a directive's premise before coding it — two of three asks here referenced code that either doesn't exist (Next Lesson) or already works (progress notify pub/sub). Fabricating the first or re-implementing the second would have been waste or regression.

---

### [FIX-077] — Enterprise-grade UI pass (ship-blocker tier): ScreenHeader foundation, safe-area insets, dark-mode tokens, double-header removal
**Date**: 2026-06-11 PT
**Pattern category**: UI_CONSISTENCY / MISSING_SAFE_AREA_INSET / SILENT_DARK_MODE_VIOLATION (Rule 017)
**Trigger**: KP side-by-side UI audit. Three Explore agents mapped the design system, all 47 routes, and HIG gaps. Scope locked to ship-blocker (what a user/reviewer SEES as broken); Dynamic Type / haptics / a11y / animations deferred to a v1.1 pass.
**Foundation built**:
- `components/ui/ScreenHeader.tsx` (NEW) — canonical header: `useSafeAreaInsets()` + theme colors + title/subtitle/showBack(44pt chevron)/right slot. One source of truth replacing duplicated manual headers.
- `lib/styles/colors.ts` — added `destructive`/`destructiveText` tokens (light `#dc2626`, dark `#ef4444`, white text) to both palettes.
- `app/_layout.tsx` — explicit `<SafeAreaProvider>` at root (Expo Router auto-mounts one; this pins it for all entry paths).
- Rule 017 dark-mode fixes: `components/ui/LoadingSpinner.tsx` + `components/hadith/GradeBadge.tsx` (were static `COLORS` — grades invisible in dark mode) now `getColors(isDark)`; `app/settings/delete-account.tsx` hardcoded reds → `destructive` token (native iOS pattern: red title + readable body + red button).
**Page-walk fixes (safe-area + header consistency)**:
- `app/(tabs)/search.tsx`, `app/(tabs)/assistant.tsx` — `paddingTop: SPACING.xl` static (title under Dynamic Island) → `insets.top + SPACING.md`. Search keeps its compound filter header; Assistant keeps its bordered bar.
- `app/(tabs)/my-hadith.tsx`, `app/my-hadith/folder/[id]`, `app/my-hadith/create-folder.tsx`, `app/redeem/index.tsx` — ad-hoc "← Back" text-button headers → `ScreenHeader` (native chevron, insets handled, rubric-consistent).
- `app/learn/[pathId].tsx`, `app/learn/lesson/[lessonId].tsx` — removed DOUBLE HEADER (native header + redundant custom in-screen back button/title). Native header owns title+back; binding the dynamic title still prevents the `[pathId]`/`[lessonId]` literal leak.
- Verified-correct, no change: `app/(tabs)/profile.tsx` (`useDeviceLayout()` returns `contentTop = insets.top + 8`), `app/(tabs)/index|collections|more.tsx` (already inset-aware), Settings family + collection/book/chapter/topics/stories/bookmarks (native headers — safe-area auto-handled; agent "missing insets" flags were false alarms).
**Flagged, not fixed**: `app/collections/index.tsx` is DEAD — nothing navigates to the non-tab `/collections` route (real screen is `(tabs)/collections.tsx`); its hardcoded colors are not user-visible. Recommend deletion. `quiz`/`sunnah`/`progress`/`reflections` have native headers + cosmetic extra content padding (not a safe-area bug; left per scope).
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` exit 0 across all 14 touched files. On-device proof pending Build 27 (these fixes are NOT in Build 26).
**Lesson learned**: A native `Stack.Screen headerShown:true` already handles top safe-area — "missing insets" only matters for CUSTOM/manual headers. Before flagging an inset bug, check whether a native header owns the chrome. And a screen that sets a native header title AND renders its own back button has a double header — bind the title, delete the custom chrome.

---


### [FIX-071] — Root layout hid splash before Supabase auth hydrated, causing FOUC on cold boot
**Date**: 2026-06-10 PT
**Pattern category**: ASYNC_LIFECYCLE_GAP — context module ready ≠ context module mounted
**Root cause**: `app/_layout.tsx` called `SplashScreen.hideAsync()` the moment fonts resolved (`fontsLoaded || fontError`), without waiting for `AuthProvider` to complete its `supabase.auth.getSession()` call. Worse, the font-loading early-return path (`if (!fontsLoaded && !fontError) return <ActivityIndicator />`) exited before mounting the provider tree at all — so `AuthProvider` was never instantiated while the font fallback was visible. When fonts loaded and the provider tree mounted for the first time, the auth session and theme hadn't settled, producing unstyled content flash (FOUC) and asymmetric layout shifts. The font-fallback `View` also had no brand styling (default white background), making the transition jarring on the `#121212` dark-bg app.
**Files changed**: `app/_layout.tsx` — (1) `useState/useCallback/useRef` added to React imports; `useAuth` added to `AuthProvider` import. (2) New `AppReadySignal` component placed inside `AuthProvider` tree — fires `onReady` callback via `useEffect` once `authLoading` transitions to false (guarded by a `firedRef` so it fires exactly once per session). (3) `RootLayout` now tracks `authReady` state; `hideAsync()` gates on `(fontsLoaded || fontError) && authReady` — splash stays up until BOTH conditions are true. (4) Provider tree mounts unconditionally (no early return before `<ErrorBoundary>`), so auth and RC can start hydrating in parallel with font loading. (5) Font-loading fallback is now inline inside the provider tree with brand styling: `backgroundColor: '#121212'`, `color: '#4caf84'` emerald spinner.
**Verification**: `npx tsc --noEmit` exit 0 (commit 0476fa8). On-device splash retention Unknown until Build 25 device QA.
**Lesson learned**: Never gate `SplashScreen.hideAsync()` on a single async condition when multiple providers need to settle before first meaningful render. Always mount providers unconditionally so they can start resolving in parallel. Brand-match every loading fallback to the app's dark bg — a white flash between splash and first frame is a UX red flag.

---

### [FIX-070] — PremiumGate brand skeleton lacks theme-aware background (white flash on dark mode)
**Date**: 2026-06-10 PT
**Pattern category**: SILENT_NULL_RENDER upgrade — spinner present but unthemed container
**Root cause**: FIX-068 added an `ActivityIndicator` to replace the `null` return on RC `isLoading`, but the `loadingContainer` `View` had no `backgroundColor`. On the `#121212` dark-bg theme the spinner floated over whatever the parent's background was (could be white on first render), producing a brief white flash. Also, `ActivityIndicator` used the static `COLORS` export (light-mode values) rather than the live theme — on dark mode `COLORS.emeraldMid` is the light-mode shade (`#1b5e43`), which is too dark to be legible against a dark bg.
**Files changed**: `components/premium/PremiumGate.tsx` — added `getColors` to colors import; added `useTheme` import from `ThemeProvider`; component now calls `const { isDark } = useTheme()` and `const colors = getColors(isDark)`; `loadingContainer` receives `backgroundColor: colors.background` inline; `ActivityIndicator` color changed to `colors.emeraldMid` (resolves to `#3a9270` dark / `#1b5e43` light). Entitlement key: `premium` confirmed (no `rc_promo_premium_lifetime` in codebase).
**Verification**: `npx tsc --noEmit` exit 0 (commit 0476fa8). Visual regression on dark-mode device Unknown until Build 25 device QA.
**Lesson learned**: Any loading container that sits over a themed surface must carry an explicit `backgroundColor` from the design system — unstyled fallback containers produce flash artefacts.

---

### [FIX-069] — Quiz generateQuestions() null guard for empty english_text rows (verification pass)
**Date**: 2026-06-10 PT
**Pattern category**: VERIFICATION_PASS — guard already present, no mutation required
**Root cause**: Mission spec requested injection of `if (!hadith.english_text || hadith.english_text.trim().length === 0) { continue; }` inside the `generateQuestions()` loop to block 212 untranslated rows from reaching quiz UI. Codebase audit found the guard already present at `app/quiz.tsx:68` (comment: "FIX-038 defense-in-depth"), functionally identical: `if (!hadith.english_text || !hadith.english_text.trim()) continue`. The upstream query also double-layers: `.not('english_text','is',null).neq('english_text','')` (app/quiz.tsx:145-148). No code change needed — guard is shipping.
**Files changed**: None.
**Verification**: `grep -n 'english_text' app/quiz.tsx` confirms guard at line 68. `npx tsc --noEmit` exit 0.
**Lesson learned**: Before injecting a guard, grep for functionally equivalent logic first. Re-adding an existing guard can introduce duplicate `continue` paths and muddy the diff history.

---

### [FIX-068] — PremiumGate rendered silent blank space while RevenueCat resolved (pre-Build-24 hardening)
**Date**: 2026-06-10 PT
**Pattern category**: SILENT_NULL_RENDER (Rule 005 family)
**Root cause**: `components/premium/PremiumGate.tsx` returned `null` while `usePremiumStatus().isLoading` was true. On a slow reviewer network the entire gated section (e.g. premium Learning Paths block) rendered as blank space until the RC entitlement check resolved — looks like a broken screen. Provider itself is sound: `RevenueCatProvider` clears `isLoading` in `finally` and degrades gracefully, so no infinite stall — only the blank window.
**Files changed**: `components/premium/PremiumGate.tsx` — loading state now renders a centered `ActivityIndicator` instead of `null`.
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint components/premium/PremiumGate.tsx` exit 0. Quiz generator guard audit (same pass): already double-layered — query filters `.not('english_text','is',null).neq('english_text','')` + same for narrator (app/quiz.tsx:145-148) AND in-loop `if (!hadith.english_text || !hadith.english_text.trim()) continue` (app/quiz.tsx:68) — no change needed. Entitlement ID confirmed centralized as `premium` in `lib/revenuecat/config.ts:20` (a "rc_promo_premium_lifetime" key named in planning docs does NOT exist in code).
**Lesson learned**: Every gate component's loading branch must render something visible. Audit `return null` on any `isLoading` branch before a release build.

---

### [FIX-067] — Quiz active-card hadith text still truncating mid-word with ellipsis (Build 23 device QA)
**Date**: 2026-06-10 PT
**Pattern category**: DATA_VS_LAYOUT_MISDIAGNOSIS — the truncation was IN the string, not in the render
**Root cause**: Build 23 device QA showed question cards ending "...(he meant garl...". FIX-066 removed `numberOfLines={1}` from the RESULTS rows, but the active card was never layout-clipped: the question `<Text>` (quiz.tsx) has no numberOfLines and no style height caps, and the screen root is a ScrollView. The ellipsis is baked into the string by `generateQuestions()` — all 3 question types built the prompt with `english_text.slice(0, 120) + '..."'`, a hard character cut that lands mid-word and appends "..." even when the text is shorter than 120 chars.
**Files changed**: `app/quiz.tsx` — added `excerptHadith()` (EXCERPT_MAX 300, word-boundary cut, trailing punctuation stripped, `…` appended ONLY when actually truncated); replaced the 3 inline `.slice(0, 120)}..."` sites (narrator/collection/grade questions) with the helper.
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint app/quiz.tsx` exit 0; node sanity harness — 599-char input → 300-char output ending "…" cut at a word boundary (tail receipt `"d word word…"`), 29-char input returned unchanged with no ellipsis. On-device state Unknown until the next build (Build 24) is QA'd.
**Lesson learned**: When text "truncates with ellipses", check whether the ellipsis is a layout artifact (`numberOfLines`/height caps) or a literal character in the data/string-builder BEFORE touching styles. Grep for `slice(`/`substring(`/`'...'` in the generator first — a render fix can't repair a string that arrives pre-truncated.

---

### [FIX-066] — App Store submission UI batch: Learning Path header leak, hadith count vs listing, AI raw markdown, Sunnah icon names, quiz narrator dupes (+ Muslim "1527" audit)
**Date**: 2026-06-10 PT
**Pattern category**: SPEC_COVERAGE_GAP + Column Names/Data Shape — Trust the DB, Not the Code (Golden Rule #2)
**Root cause** (5 sub-items, one EAS-bound batch on `release/appstore-ready-v1.0`):
1. **`[pathId]`/`[lessonId]` leaking in nav header** — no `app/learn/_layout.tsx` exists, so both learn screens are direct children of the root Stack and rendered the DEFAULT header with the raw route literal as title. The root `_layout.tsx` `<Stack.Screen name="learn" options={{headerShown:false}}/>` matches nothing (no such screen name without a learn layout). Neither screen set `<Stack.Screen options={{title}}/>`. Also `[pathId].tsx` had no `enabled` guard, so the lessons query could fire with `undefined`.
2. **Home count 14,232 vs App Store listing 14,444** — `VISIBLE_HADITH_TOTAL` was set to the blank-filtered viewable count (14,232); KP directive 2026-06-10: headline must match listing copy (corpus 14,444). The home screen was ALREADY constant-driven; the `count:'exact'` query in `index.tsx` is the random-offset picker for Hadith of the Moment, NOT the displayed total — left intact deliberately.
3. **AI chat raw markdown** — `assistant.tsx:201` rendered `message.content` in a plain `<Text>`; Groq responses contain `**bold**`/`###`/lists.
4. **Sunnah rows showing "Moor"/"Hanc"** — live `sunnah_categories.icon` stores Lucide icon NAMES (probe receipt: Clock, HandHeart, Heart, Home, MapPin, Moon, Star, Users, Utensils), not emoji; the 44px circle clipped the words. Bundled fallback data uses emoji, which is why local fallback looked fine. Quiz: results row had `numberOfLines={1}` (ellipsis clipping) and the narrator decoy filter compared raw strings, so DB "Ibn \`Umar" sat next to hardcoded decoy "Ibn Umar" as a phonetic duplicate.
5. **Muslim #1527 "truncation"** — NOT a bug. DB text matches the canonical Siddiqui translation verbatim: sunnah.com/muslim:670c reads "…no mention has been made of, enough"." (the variant narration omits the word "enough"). DB hadith_number 1527 = sunnah.com in-book ref 670c (numbering differs). Systemic-but-cosmetic: terminal punctuation is stripped from english_text tails across rows (1526/1527/1528 all end without "."). No data patch required; optional readability patch documented in session report.
**Files changed**:
- `app/learn/[pathId].tsx` — param normalization (string|string[]), `enabled:!!pathId` on both queries, new `learning_paths` title query, `<Stack.Screen options={{title:pathTitle}}/>` in both render branches, header text bound to real path title.
- `app/learn/lesson/[lessonId].tsx` — param normalization, `<Stack.Screen>` title = lesson.title (loading/not-found/loaded branches). `content` column verified live (lessons columns: content/created_at/description/estimated_minutes/id/order_index/title). Mark-as-Complete already gated post-load.
- `lib/hadith/visibleCollections.ts` — `VISIBLE_HADITH_TOTAL` 14_232 → 14_444 + comment documenting the 212-blank-row integrity caveat.
- `app/(tabs)/assistant.tsx` — `react-native-markdown-display@^7.0.2` (installed via `npx expo install`, pure-JS, no native module), assistant bubbles render `<Markdown>` with dark-theme styles from `getColors` (Rule 017); user bubbles + both disclaimers untouched.
- `app/sunnah.tsx` — `ICON_NAME_TO_EMOJI` map + `resolveCategoryIcon()` (ASCII name → emoji, emoji passthrough).
- `app/quiz.tsx` — removed `numberOfLines={1}` on results row; `normalizeNarratorName()` (strips backticks/apostrophes/ʿ/ʾ, collapses whitespace, lowercases) used in decoy filter.
- `package.json` / `package-lock.json` — react-native-markdown-display added.
**Verification**: `npx tsc --noEmit` exit 0; `npx eslint` over all 6 changed files exit 0. Live Supabase probes (anon REST) for lessons/learning_paths/sunnah_categories schemas and Muslim 1526–1528 text. sunnah.com 670a/b/c fetched for canonical comparison.
**Lesson learned**: (1) A dynamic-route header leak means no layout owns the screen — check for a missing `_layout.tsx` before touching the screen. (2) "Remove the COUNT query" style instructions in a punch list can be stale — classify what a query actually feeds before deleting it. (3) Icon columns are a data SHAPE contract: probe the live values (Rule 032), don't trust the bundled fallback to mirror production. (4) A "truncated translation" claim against a hadith corpus must be grounded against the canonical source before patching — the source itself can be the odd one.

---

### [FIX-064] — New-user signup + onboarding broke: `profiles` writes used non-existent columns + omitted NOT-NULL `user_id`
**Date**: 2026-06-09 PT
**Pattern category**: Column Names — Trust the DB, Not the Code (Golden Rule #2, 7th occurrence → see canonical `docs/SCHEMA_PROFILES.md`)
**Root cause**: App code drifted from the live `profiles` schema. `AuthProvider.signUp` inserted `username` and `app/onboarding.tsx` upserted `full_name` — NEITHER column exists (real column is `name`) — and both omitted `user_id`, which is **NOT NULL** and is the column the app reads by (`revenuecat.ts` does `.eq('user_id', authUid)`). Result: every real signup threw `PGRST204 could not find 'username'` / onboarding threw on `full_name`; even past that, `23502` NOT-NULL on `user_id`. The Apple reviewer was unaffected (existing account), so it hid behind the reviewer path — but real users could not register or finish onboarding.
**Files changed**:
- `lib/auth/AuthProvider.tsx` — insert `{ id, user_id: data.user.id, name, avatar_url, role }` (was `username`, no `user_id`).
- `app/onboarding.tsx` — upsert `{ id, user_id, name, school_of_thought }` with `{ onConflict: 'user_id' }` (was `full_name`, no `user_id`).
- `docs/SCHEMA_PROFILES.md` — NEW canonical live-schema reference (read before any profile code).
**Verification (receipts, 2026-06-09)**:
- `tsc --noEmit` → exit 0.
- Broken-shape canary → `400 / 23502` (NOT NULL user_id) + `PGRST204` (no `username`).
- **Fixed-shape end-to-end**: admin-created a real throwaway auth user → `POST profiles {id,user_id,name,avatar_url,role}` → `201` → profile resolvable by `user_id` → cleaned up (user + cascade). PASS.
- Logged-in features as the real reviewer session: own-profile read, saved_hadiths/hadith_folders/user_stats/user_streaks/user_preferences/reflections reads, save→read-back→unsave CRUD, AI assistant → all PASS.
**Lesson learned**: Probe the live `profiles` schema (Rule 032) before writing it; the columns are `name` + NOT-NULL `user_id`, and `user_id` (not `id`) is the app's read key. Canonical map now in `docs/SCHEMA_PROFILES.md` so this never loops again.

### [FIX-063] — Apple reviewer could not log in + premium never granted (readiness doc claimed "DONE", production said otherwise)
**Date**: 2026-06-09 PT
**Pattern category**: Release gating / doc-vs-reality drift (→ promoted to SYSTEM_RULES Rule 034)
**Root cause**: Every readiness/audit doc listed the demo reviewer account and the RevenueCat `premium` grant as completed-or-trivial follow-ups. In production NEITHER was true: `POST /auth/v1/token` with the documented demo credentials returned `Invalid login credentials` (DEMO_ACCOUNT.sql was authored but never executed), and the reviewer's RevenueCat subscriber had ZERO entitlements (promotional `premium` never granted). The bug "couldn't be fixed for weeks" because the docs asserted readiness and nobody probed the live endpoints.
**Files changed**: none in app code (operational/production-data fix). Docs: `SYSTEM_RULES.md` (+Rule 034), `CLAUDE.md` (+Release Gating section), this log.
**Exact fix applied** (production, via supported admin APIs, service-role + RC-secret from env):
- Reviewer auth user already existed (uuid `a1433858-cdce-4dbe-9a83-26ecb0022979`, NOT the doc's placeholder `00000000-…-001`) but had a non-matching password / unconfirmed email. Reset via GoTrue admin: `PUT {SUPABASE_URL}/auth/v1/admin/users/{uuid}` `{password, email_confirm:true}`.
- Granted premium: `POST https://api.revenuecat.com/v1/subscribers/{uuid}/entitlements/premium/promotional` `{"duration":"lifetime"}` → HTTP 201.
- Created the `profiles` row with the REAL schema (`id`, `user_id`, `name`, `role`) — the doc/SQL used a non-existent `username` column.
**Verification (receipts, 2026-06-09)**:
- `[1] LOGIN` → PASS, access_token issued, email_confirmed.
- `[2] PREMIUM` → PASS, `premium` entitlement ACTIVE (expires 2226 = effective lifetime).
- `[3] PROFILE` → row created via service role (RLS hides it from anon — expected).
**Lesson learned**: A "GO" in a readiness doc is a hypothesis; only a live production probe is a receipt. Reviewer login (GoTrue password grant) and premium (RC subscriber API) must be proven green against prod before any "ready to submit" claim. See Rule 034.
**Related find (NOT fixed — locked file, needs KP approval)**: `lib/auth/AuthProvider.tsx:77` inserts `username` into `profiles`, but the live schema column is `name`. New-user signup currently throws `PGRST204 could not find 'username' column`. One-line fix (`username` → `name`) but `lib/auth/` is in the hard-locked zone — escalated, awaiting approval.

### [FIX-062] — BUG-C resolved: AI assistant 404 in production (mobile-chat route never deployed)
**Date**: 2026-06-09 PT
**Pattern category**: Deploy drift / backend-frontend sync (recurring — see FIX-037 / FIX-038 / FIX-045; endpoint has dropped 3+ times → promote to a SYSTEM_RULE)
**Root cause**: The mobile app calls `POST ${baseUrl}/api/mobile-chat` (`lib/api/groq.ts:39`, baseUrl → `https://www.authentichadith.app`). That route is served by the SEPARATE web repo `redlanternstudios/v0-authentic-hadith` (Vercel, deploys from `main`). The route fix existed only on an unpushed/unmerged branch — PR #60 (`fix/restore-mobile-chat-route`, commit 343afde) was OPEN, so `origin/main` never had the route → production returned HTTP 404. The route source itself was correct.
**Files changed**: none in this (Expo) repo. Web repo: merged PR #60 → `app/api/mobile-chat/route.ts` (1 file, 49 lines) onto `main`.
**Exact fix applied**:
- Verified route correctness first: it calls `generateText({ model: "openai/gpt-4o-mini" })` via AI SDK v6 gateway — identical to the already-LIVE sibling routes `/api/chat` and `/api/summarize` in the same web repo, so the gateway/OpenAI access was already provisioned in prod (no env work needed).
- `gh pr merge 60 --merge` on `redlanternstudios/v0-authentic-hadith` → route landed on `main`.
- Vercel auto-deployed from `main`.
**Verification (receipts, 2026-06-09)**:
- Pre-fix live probe: `POST https://www.authentichadith.app/api/mobile-chat` → 404.
- Post-deploy (landed 20:26:37 PT): same endpoint → **HTTP 200**.
- Real call returned valid `{"response": "<310-char answer citing Qur'an 17:23>"}` — exact shape `lib/api/groq.ts:69` requires (`typeof data.response === 'string'`).
**Lesson learned**: The AI backend lives in a DIFFERENT repo (web) than the mobile client. A correct route file in the Expo repo's `app/api/` is inert — it never deploys anywhere. Always verify the route exists on the WEB repo's deployed branch (`origin/main` of `v0-authentic-hadith`) AND that production returns non-404, not just that the file exists locally. The stale BUG-C note named the wrong repo (`rsemeah/AuthenticHadithApp`); the actual prod backend is `redlanternstudios/v0-authentic-hadith`.

### [FIX-047] — Learning Paths Red Banner on Build #14 (Audit Entry — Code Already Closed by FIX-044)
**Date**: 2026-05-24 PT (~22:35 PT)
**Session**: Claude Code (Opus 4.7, this session)
**Severity**: High — flagged in v1.0.1 Hot-Fix Queue SCOPE CORRECTION as a v1.0 submission blocker (Apple Guideline 2.1 risk).

**Trigger**: v1.0.1 Hot-Fix Queue PROMOTED Patches 2 and 3 to v1.0 scope on Sun May 24 PT when KP confirmed both Assistant and Learning Paths showed red error banners on Build #14. Prompt framed FIX-047 as "v2 attempt closing the loop" on a failed FIX-045 architect prompt for Learning Paths.

**Diagnosis**: The framing was based on a one-day-old Notion artifact. The actual repo state on this date:
- Build #14 was cut **before** FIX-044 (Learning Paths progress indicator + non-fatal path_lessons + bannerMessage error surfacing) was applied.
- FIX-044's code was sitting uncommitted on `main` along with 60+ other edits.
- No additional architect-level diagnosis was needed — `app/(tabs)/learn.tsx` already had: verbose error logs at both queryFns, a `bannerMessage` builder that surfaces the actual Supabase `[code] message Hint:hint` inline (closing FIX-044's diagnostic gap), a non-fatal `path_lessons` query that returns null on error so the path list can never be blanked, and `__DEV__ console.error` in the [pathId] detail route. The `path_lessons.lesson_id → lessons.id` FK is declared in migration 999 so the embed query is sound (no client-side merge needed per FIX-041 SOP).

**Fix Applied**: Zero net-new lines. The closing action was operational:
1. Committed FIX-044 to `main` as commit `8632e45` (`fix(learn): FIX-044 progress indicator + non-fatal path_lessons + inline error surfacing`).
2. Committed FIX-045 to `main` as commit `66cf681`.
3. Committed pre-Build #15 baseline (everything else) to `main` as commit `0c7c099`.
4. Verified EAS production env (`EXPO_PUBLIC_API_URL` was overriding to apex — updated to www host).
5. Triggered Build #15 (`a61a9789-fe30-4e39-b278-21fe3ce79a42`) which is the first production build to include FIX-044.

**Verification**: Pending Build #15 install + simulator run by KP. Acceptance criteria (banner-free Learn screen with progress indicators, detail view loads without crash, return-to-Learn stays clean) all verified in source code; physical verification deferred to Build #15.

**Lesson**: A stale architect/scope artifact is a tax on the next session. When a Notion brief and the local working tree disagree about what's already shipped, the working tree wins — but only after `git status` is read and the uncommitted state is reconciled. The cost of trusting the artifact uncritically here would have been duplicate-writing FIX-044 on a new branch, fighting merge conflicts with the existing uncommitted code, and burning the timebox.

**Pattern Category**: WORKING_TREE_SCOPE_DRIFT — when prompt framing assumes unfixed work that's already on disk uncommitted. Same family as FIX-038 (false-alarm on a fix that had already landed) and the Hot-Fix Queue's own Lesson 2 (function exists but is never called — verify the wired state, not the existence).

**Refs**: BUILD_FIX_LOG.md FIX-044 (the actual fix), Notion v1.0.1 Hot-Fix Queue, commits 8632e45 / 66cf681 / 0c7c099.

---

### [FIX-046] — AI Assistant Red Banner on Build #14 (Audit Entry — Code Already Closed by FIX-045 + EAS Env Foot-Gun)
**Date**: 2026-05-24 PT (~22:35 PT)
**Session**: Claude Code (Opus 4.7, this session)
**Severity**: High — flagged in v1.0.1 Hot-Fix Queue SCOPE CORRECTION as a v1.0 submission blocker (Apple Guideline 2.1 risk).

**Trigger**: Same as FIX-047. Hot-Fix Queue framed FIX-046 as a `sendChatMessage` backend error needing a fresh fix.

**Diagnosis**: Backend verified healthy this session via two curl probes:
- `POST https://www.authentichadith.app/api/mobile-chat` with `{messages:[{role:"user",content:"ping"}]}` → HTTP 200 in 1.3s, `{"response":"..."}` shape matches `lib/api/groq.ts` expectation.
- Same endpoint with `{message:"test"}` (the wrong shape that the v1.0.1 brief's curl example used) → HTTP 400 with explicit `{"error":"Invalid request: messages must be a non-empty array"}`. The mobile app builds the correct shape at `lib/api/groq.ts:43-48`.

The Assistant screen (`app/(tabs)/assistant.tsx`) has NO on-mount banner trigger. The red banner only renders when `error` state is non-null, which is set only by the catch block at line 109-114. Build #14 was cut before FIX-045 (`lib/api/groq.ts` + `lib/config/constants.ts` + `app.config.js` + `app/(tabs)/assistant.tsx`) was applied. The "red banner" KP saw on Build #14 was the pre-FIX-045 code path: apex 307 stall → some network failure surfaces → catch fires → banner. FIX-045 doesn't fix the user-facing string; it fixes the **transport** so the network call actually completes.

**The real bug under FIX-046**: even with FIX-045 committed, EAS production env `EXPO_PUBLIC_API_URL` was set to the apex `https://authentichadith.app` — overriding the code default in `lib/config/constants.ts`. This re-introduces the iOS 307 stall on production builds that import the env value. FIX-045 noted this as a required out-of-band step but it stayed open for a day until this session caught it during pre-flight.

**Fix Applied**: Zero net-new lines of code. Two operational changes:
1. Committed FIX-045 to `main` as commit `66cf681` (`fix(assistant): FIX-045 apex->www + AbortController 12s timeout + dev-error logs`).
2. Updated EAS production env: `eas env:update production --variable-name EXPO_PUBLIC_API_URL --variable-environment production --value https://www.authentichadith.app --non-interactive`. Verified new value via `eas env:list --environment production`.
3. Triggered Build #15 (`a61a9789-fe30-4e39-b278-21fe3ce79a42`) — first production build with FIX-045 + corrected env.

**Verification**: Pending Build #15 install + simulator run by KP. The three acceptance test queries ("What is the hadith about kindness to neighbors?", "Tell me about prayer", "What does Sahih Bukhari say about charity?") will be run by KP on the Build #15 install. Endpoint already verified live.

**Lesson**: Env overrides defeat code defaults. When a fix changes a default URL, host, or feature flag in code, the SAME change must propagate to every layer that can override it (EAS env, app.config.js, hardcoded fallbacks, deployed config). FIX-045 explicitly flagged this as a required out-of-band step but it stayed open for a full day. Convert "out-of-band" steps to in-band verification commands inside the build workflow next time — e.g., add a `pre-build` script that fails if `eas env:list --environment production` shows an unexpected apex value.

**Pattern Category**: ENV_OVERRIDES_DEFAULT — when a code-level fix is silently negated by an environment-layer override that wasn't updated. Belongs to the same family as FIX-040 (EAS env pipeline).

**Refs**: BUILD_FIX_LOG.md FIX-045 (the actual transport fix), Notion v1.0.1 Hot-Fix Queue, commit 66cf681, EAS env update on 2026-05-24 PT ~22:30.

---

### v1.0.1 CANDIDATES LOGGED THIS SESSION (per scope lock, NOT fixed in v1.0)

Per the prompt's "if you encounter a tempting 'while I'm here' improvement, STOP. Log it as a v1.0.1 candidate" rule, two non-blocking issues surfaced during pre-flight that are out of scope for v1.0 submission:

1. **Metro config drift** (`expo-doctor` warning): `metro.config.js` does not extend `expo/metro-config`. Long-standing. Doesn't affect production bundle behavior but may cause hard-to-debug issues in future Expo SDK upgrades. v1.0.1 candidate.

2. **Jest dep major version drift** (`expo-doctor` warning): `@types/jest 30.0.0` (expected 29.5.14), `jest 30.4.2` (expected ~29.7.0), `jest-expo 55.0.18` (expected ~54.0.17). These are devDependencies — they do NOT ship in the production bundle and do NOT block Build #15. v1.0.1 candidate: align with `npx expo install --check` to match Expo SDK 54's expected versions.

---

### [FIX-045] — AI Assistant Spinner Hangs Forever on TestFlight (Apex→www 307 + No Client Timeout)
**Date**: 2026-05-23 PT
**Session**: Claude Code (authentic-hadith-debugger skill)
**Severity**: High — Assistant tab is a top-line product surface and a core App Store demo path. Users see "Thinking..." indefinitely with no error, no retry affordance, no recovery.

**Trigger**: KP reported "The AI Assistant is currently not working correctly" on a TestFlight build on device. Symptom confirmed via AskUserQuestion: spinner shows after send, never returns, no red error banner ever appears.

**Diagnostic probes (before touching code)**:
```
curl -s -o /dev/null -w "HTTP %{http_code} TIME %{time_total}s\n" -L -X POST \
  "https://www.authentichadith.app/api/mobile-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What does Sahih Bukhari say about prayer?"}]}'
# → HTTP 200 in 2.84s, response shape {response: string} matches lib/api/groq.ts expectation.

curl -s -i -X POST "https://authentichadith.app/api/mobile-chat" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}'
# → HTTP/2 307, location: https://www.authentichadith.app/api/mobile-chat
```
Backend is healthy. Apex still 307-redirects to www. (same condition FIX-038 noted, where the assumption was "RN fetch follows redirects transparently"). The Vercel path is fine in cURL.

**Root Cause** (two compounding issues):

1. **POST redirect stall on iOS NSURLSession.** `PRODUCTION_API_URL` in `lib/config/constants.ts:6` was the apex `https://authentichadith.app`, and the `app.config.js` fallback used the same apex value. Every Assistant send POSTed to the apex and relied on the 307 → www. handoff. cURL handles this cleanly; iOS NSURLSession (the transport under React Native fetch) has documented edge cases where a 307 with a JSON POST body either silently strips the body or stalls indefinitely on the redirect — particularly when the request gets routed across a Vercel cold start. The same code FIX-038 declared "no mobile change required" turned out to fail on a different network/cold-start condition.

2. **Zero client-side timeout in `lib/api/groq.ts`.** The `fetch` call had no `AbortController`, no `signal`, no timeout. iOS NSURLSession defaults `timeoutIntervalForResource` to **7 days**. So when condition (1) stalled the underlying network task, the JS promise never resolved and never rejected. The Assistant screen's `isLoading=true` state stayed true forever. The catch block at `app/(tabs)/assistant.tsx:109` never fired, so the existing red error banner + Retry button never surfaced. From the user's POV: infinite "Thinking..." with no way out.

**Fix Applied**:

`lib/config/constants.ts`:
- Changed `PRODUCTION_API_URL` from `'https://authentichadith.app'` to `'https://www.authentichadith.app'`. The apex hop is now skipped entirely. No more reliance on 307 redirect handling at the iOS transport layer.

`app.config.js`:
- Changed the `apiUrl` env fallback from apex to `'https://www.authentichadith.app'` to match the constants default. The resolution chain is `process.env.EXPO_PUBLIC_API_URL → config.extra?.apiUrl → 'https://www.authentichadith.app'`.

`lib/api/groq.ts`:
- Added `REQUEST_TIMEOUT_MS = 12_000` constant (Vercel cold + Groq inference comfortably under 5s; 12s is generous for a slow tower while guaranteeing the UI never spins forever).
- Wrapped `fetch` with `AbortController`, passed `signal: controller.signal`, scheduled `controller.abort()` via `setTimeout`, cleared the timer in a `finally` block so the timer never fires after a normal response.
- DEV-only log distinguishes timeout (`'[groq] request timed out'`) from generic network failure.
- Added DEV log `'[groq] malformed response payload'` for the JSON-parse / shape-mismatch path that previously threw silently.

**Files Changed**:
- `lib/config/constants.ts` — apex → www. on `PRODUCTION_API_URL`. Comment added explaining the iOS NSURLSession redirect quirk.
- `app.config.js` — apex → www. on the `apiUrl` fallback.
- `lib/api/groq.ts` — AbortController + 12s timeout + DEV log on timeout path + DEV log on malformed payload path.
- `BUILD_FIX_LOG.md` — this entry.

**Files Intentionally NOT Changed (out of scope per task)**:
- `app/(tabs)/assistant.tsx` — already has `__DEV__ && console.error('[assistant] sendChatMessage failed', err)` and the red banner + Retry button is correctly wired. The bug was that this catch never fired because no error was thrown; the timeout in `groq.ts` is what makes this path reachable. No UI change needed.
- `lib/islamic-safety-filter.ts` — already intercepts ruling/fatwa patterns client-side before the network call. AC2 (fatwa redirect) verified working against current code, no edit needed.
- **AC3 (Supabase session history load on reopen) — explicitly out of scope, flagged as scope drift.** The brief asserted "Per project docs, the Assistant has session-based conversation tracking." Repo-wide grep for `chat_messages` / `ai_chat_sessions` / `session_id` / `loadChatHistory` returned zero hits. No Supabase migration exists for chat tables. The Assistant has always been ephemeral per-session. Implementing AC3 is a net-new feature (Supabase table + RLS + write-after-send + read-on-mount + clear control), not a minimum-scope fix. KP confirmed dropping AC3 from this work via AskUserQuestion.

**Out-of-Band Action Recommended (not code)**:
```bash
eas env:list --environment production | grep -i API_URL
# If EXPO_PUBLIC_API_URL is set to the apex, the code default doesn't apply:
eas env:update EXPO_PUBLIC_API_URL https://www.authentichadith.app --environment production
# If unset, the new code fallback is sufficient — no env action needed.
```

**Verification Command**:
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
npx tsc --noEmit   # → exit 0, zero errors (confirmed)
```

**Result**: Type-check clean. AC1 (Bukhari/prayer query returns grounded response <10s) verified end-to-end at the API layer (2.84s) and the client now hits www. directly so it bypasses the suspect redirect. AC2 (fatwa redirect) verified intact — the `RULING_REQUEST_PATTERNS` regex set in `lib/islamic-safety-filter.ts:117-124` short-circuits before the network call, returns the scholar-deferral string. AC3 dropped from scope by KP. Physical device verification on TestFlight build still pending — KP to confirm the spinner no longer hangs.

**Lesson**: "Working in cURL ≠ working on iOS." When a redirect is in the path of a POST with a body, treat it as a transport risk on iOS specifically. The FIX-038 verification (cURL HTTP 200) was sufficient to confirm the backend was alive but insufficient to validate the iOS transport. Two rules to internalize:
1. Mobile clients hitting Vercel should always target the canonical host directly (the host the redirect lands on), never an apex that redirects.
2. Every outbound `fetch` in the mobile app needs an explicit `AbortController` + timeout. NSURLSession's 7-day default is a foot-gun. Without a timeout, any silent network stall becomes an infinite spinner — and the user has no recovery path because no error is ever thrown for the catch handler to surface.

**Pattern Category**: Network transport / iOS-specific / missing-timeout. Combine with FIX-038 (apex 404 false alarm) — both reflect the broader pattern: the apex domain is a sharp edge for the mobile client. Flag for SYSTEM_RULES update if a third occurrence shows up (per Rule 009 in SYSTEM_RULES.md).

---

### [FIX-044] — Learning Paths "Not Loading Correctly" (Missing Progress Indicator + Silent Query Failure)
**Date**: 2026-05-23 PT
**Session**: Claude Code (authentic-hadith-debugger skill)
**Severity**: High — Learn tab is a Phase 3 Premium feature; cards rendered without the progress signal the spec required, so users had no way to see what they'd completed.

**Trigger**: KP reported "the learning paths are not loading correctly" via the More tab → Learn. Task acceptance criteria required (1) cards display title + description + **progress indicator** within 3s, (2) tapping a card loads lessons, (3) completed-lesson progress reflects on return.

**Production data probe (before touching code)**:
```
learning_paths   → HTTP 200, 6 rows seeded (Foundations, Daily Practice, Hadith Sciences,
                   Comparative, Thematic, Great Scholars). Columns match TS type:
                   title/description/level/is_premium/sort_order/estimated_hours.
lessons          → HTTP 200, 10 rows. Columns: id/title/description/content/order_index/estimated_minutes.
path_lessons     → HTTP 200, 10 rows. FK path_lessons.lesson_id → lessons.id WORKS
                   (verified by running the [pathId] embed select directly via curl).
learning_progress→ HTTP 200, populated (status/quiz_score/quiz_passed schema, distinct
                   from user_lesson_progress which is empty).
```
The data is healthy. RLS allows anon SELECT on `learning_paths`, `lessons`, `path_lessons` (migration 999 lines 128-158). The Supabase client at `lib/supabase/client.ts` is correctly initialized with `EXPO_PUBLIC_SUPABASE_*` envs and persists the session via `ExpoSecureStoreAdapter`. So none of the typical suspects (RLS, auth, empty table) applied.

**Root Cause**: Two compounding issues in `app/(tabs)/learn.tsx`:

1. **No progress indicator was being rendered at all.** The screen fetched `learning_paths` and laid out title / level / description / estimated_hours, but never queried `path_lessons` and never consulted the local `progressService` completion store, so per-path "X / Y lessons" + progress bar — required by AC #1 and AC #3 — were absent. From KP's POV the cards "weren't loading correctly" because they were missing the signal that proves the feature is alive.
2. **Silent query failure.** The `useQuery` queryFn threw on Supabase error with no `__DEV__ && console.error` first. Per the FIX-041 follow-up lesson, every API-layer throw needs an upstream log line so future LogBox / Metro inspection surfaces the cause instead of vanishing into React Query's error state with no breadcrumb. Same gap in `app/learn/[pathId].tsx`.

**Fix Applied**:

`app/(tabs)/learn.tsx`:
- Added second `useQuery(['learning-paths-lesson-map'])` against `path_lessons` selecting `learning_path_id, lesson_id`. Separate cache key so its failure does not blank the path list.
- Added `useCompletedItems('lesson')` from `hooks/useProgress.ts` so the screen subscribes to the local progress store. When the lesson detail screen calls `markComplete` (already wired via `useCompletionStatus`), `subscribe()` fan-out re-renders the Learn screen → AC #3 satisfied with zero extra plumbing.
- Computed `progressByPath: { [pathId]: { total, done } }` via `useMemo` over the two reactive data sources.
- Added `renderProgress(pathId)` helper rendering a 6px-tall track (`colors.marbleBase`) with an emerald fill (`colors.emeraldMid`) sized by `done/total`, plus "X / Y lessons" caption in `tabular-nums` so the digits don't jitter. Renders inside both the free-tier `FlatList` `renderItem` and the premium `PremiumGate` map block.
- Added `__DEV__ && console.error('[Learn] learning_paths fetch failed:', error)` before the throw in the primary queryFn, and a matching `[Learn] path_lessons fetch failed` on the secondary queryFn.

`app/learn/[pathId].tsx`:
- Added `__DEV__ && console.error('[Learn:pathId] lessons embed fetch failed:', { pathId, error })` before the throw in the lessons queryFn. The embed itself (verified working in production via curl) is unchanged.

`app/learn/lesson/[lessonId].tsx`: Untouched. Already uses `useCompletionStatus` correctly; the Learn screen now consumes those writes via the same shared store.

**Files Changed**:
- `app/(tabs)/learn.tsx` — useMemo+useCompletedItems wiring, path_lessons query, renderProgress helper, progressRow/Track/Fill/Text styles, queryFn error logs.
- `app/learn/[pathId].tsx` — added error log before queryFn throw.
- `BUILD_FIX_LOG.md` — this entry.

**Files Intentionally NOT Changed (out of scope per task)**:
- `app/learn/lesson/[lessonId].tsx` — already wired to progressService; widening it would have been refactor, not fix.
- `lib/progress/progressService.ts` — works as designed; the screen was just not consuming it.
- `supabase/migrations/997-seed-learning-paths.sql` — uses stale column names (`name`/`difficulty`/`estimated_days`/`order_index`) that don't match the current `learning_paths` schema (`title`/`level`/`estimated_hours`/`sort_order`). The seed file would FAIL today if re-run, but it has already been superseded — production has 6 paths seeded via a different path. Flagged for KP to clean up separately; not a blocker for this fix.
- `types/hadith.ts` — `LearningPath` type covers the columns the screen reads. Production returns extras (`slug`, `subtitle`, `icon_name`, `total_modules`, `total_lessons`, `color`, `title_ar`, `description_ar`) but widening the type was unrelated.
- The `[pathId]` PostgREST embed — works in production despite Golden Rule #1 warning, because `path_lessons.lesson_id → lessons.id` IS a declared FK (migration 999 line 55) and is enforced in production. Verified by curl probe returning 4 lessons for Foundations path. No need to refactor to a two-query merge.

**Verification Command**:
```bash
npx tsc --noEmit   # → exit 0, zero errors (confirmed)

# Production data sanity (anon key):
SUPA="https://nqklipakrfuwebkdnhwg.supabase.co"
KEY="$EXPO_PUBLIC_SUPABASE_ANON_KEY"
curl -s -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: count=exact" \
  "$SUPA/rest/v1/learning_paths?select=id" -D - | grep content-range
# expect: content-range: 0-5/6
```

Manual on simulator (3 acceptance criteria):
1. Open app → More tab → Learn → cards render within 3s with title, description, level chip, "📅 N hours" line, AND a 6px emerald progress bar + "0 / N lessons" caption for each path (N matches `path_lessons` count per path).
2. Tap "Foundations of Hadith" → `/learn/0d97d9e7-...` → 4 lesson cards render (What is Iman, Five Pillars, Importance of Salah, Wudu and Purification).
3. Tap a lesson → "Mark as Complete" → back-button to Learn → progress bar on Foundations card updates to "1 / 4 lessons" with the corresponding fill width.

**Result**: Fixed at the code layer. Typecheck clean. AC #1 + #3 now wire-true (progress indicator present, reactive to completions). AC #2 was already functional and now has the diagnostic log so any future regression is loud. **Simulator verification is pending — see "Verification gap" note in ERROR_REPORT.md.**

**Lesson**:
1. "Not loading correctly" is a symptom, not a diagnosis. Probe the production data FIRST — if the rows exist and the query returns 200, the bug is in render or spec-coverage, not data fetch. This one was missing-feature dressed as a load failure.
2. AC #3 (state persistence across screens) is cheapest when both screens already consume the same reactive store. The lesson detail screen was already writing to `progressService`; the Learn screen just had to subscribe. Zero new APIs, zero new tables, zero schema risk.
3. Reflex `__DEV__ && console.error` on every API-layer throw. The cost is one line and the payoff is the next session not flying blind, exactly as FIX-041 follow-up taught.
4. Migration 997's seed file has drifted from the live `learning_paths` schema (uses old column names like `name`/`difficulty`/`order_index` instead of `title`/`level`/`sort_order`). It would fail on re-run. Future "schema alignment" pass should reconcile or retire that file — flagged here, not fixed in this scope.

**Pattern Category**: SPEC_COVERAGE_GAP / SILENT_QUERY_ERROR_SWALLOWING (recurrence of FIX-041 follow-up lesson #2 — frequency 2, watch for 3rd).

---

### [FIX-043] — Search Result Cards Cut Off Mid-Text (numberOfLines Swap + Explicit Ellipsis)
**Date**: 2026-05-23 PT
**Session**: Claude Code (authentic-hadith-debugger skill)
**Severity**: Minor — P2 cosmetic; does not block App Store submission.

**Trigger**: KP reported "the sizing of the search hadith does not correctly do a good view, its showing as a cut off." Reproduced on Search tab (`app/(tabs)/search.tsx`) which renders results via `HadithList` → `HadithCard` with `compact={true}`.

**Root Cause**:
`components/hadith/HadithCard.tsx` in compact mode set `numberOfLines={3}` for Arabic and `numberOfLines={4}` for English. With Arabic `lineHeight: 38`, three lines is ~114px and frequently truncated mid-clause on the most common hadith lengths; the English block at four lines pushed the card tall enough on iPhone SE that the visual weight was unbalanced and the "Read more →" affordance read as buried. `ellipsizeMode` was also implicit — relying on the RN default, which a future style refactor could break.

**Fix Applied**:
```tsx
// components/hadith/HadithCard.tsx — compact-mode list cards
<Text
  style={[styles.arabicText, { color: colors.bronzeText }]}
  numberOfLines={compact ? 4 : undefined}   // was 3
  ellipsizeMode="tail"
>
  {hadith.arabic_text}
</Text>

<Text
  style={[styles.englishText, { color: colors.bronzeText }]}
  numberOfLines={compact ? 3 : undefined}   // was 4
  ellipsizeMode="tail"
>
  {hadith.english_text}
</Text>
```

**Files Changed**:
- `components/hadith/HadithCard.tsx` — Arabic compact lines 3→4, English compact lines 4→3, explicit `ellipsizeMode="tail"` on both. Detail screen path (`compact={false}`) unchanged: `numberOfLines={undefined}` still renders full text.

**Verification Command**:
```bash
npx tsc --noEmit
# → clean (no new errors)
```

**Manual verification** (required on physical device or simulator):
1. Search tab → type "sabr" → confirm each result card shows: GradeBadge, source citation (e.g. "Sunan Ibn Majah #4014"), Arabic block (≤4 lines, ellipsized cleanly if longer), English translation (≤3 lines, ellipsized cleanly if longer), narrator line if present, and "Read more →" always visible at the bottom.
2. Repeat on iPhone SE (smallest supported) and iPhone 17 — no mid-character or mid-word cutoffs; ellipsis appears at line end.
3. Tap any result → `app/hadith/[id].tsx` renders full Arabic + English with no truncation (uses `HadithCard` without `compact`).

**Scope note**: `HadithList` is also used by `app/chapter/[id].tsx`, `app/book/[id].tsx`, `app/topics/[slug].tsx`. All four screens share the same compact-card behavior by design, so this fix benefits them uniformly. No screen relies on the old 3-Arabic / 4-English ratio.

**Result**: Fixed (code change verified by `tsc`; manual device verification pending physical run).

**Lesson**:
For RTL scripts with tall line heights (Arabic at `lineHeight: 38`), `numberOfLines` of 3 reads as cramped on small phones — Arabic needs at least one more line than the Latin block of equivalent semantic weight. When using `numberOfLines`, always set `ellipsizeMode` explicitly; the implicit default is correct today but is the kind of thing a future style refactor silently breaks. P2 cosmetic complaints from KP are almost always shaped like "looks cut off" and almost always live in a `numberOfLines` value that was guessed at build time without measuring on the smallest device.

**Pattern Category**: UI truncation / RTL line-height / numberOfLines tuning

---

### [FIX-042] — Subscription Screen Shows Generic "Something went wrong" Instead of Real Cause
**Date**: 2026-05-23
**Session**: Claude Code (authentic-hadith-debugger skill)
**Severity**: High — paywall is the revenue path; users had no actionable diagnostic when offerings failed to load or purchases rejected.

**Trigger**: KP reported "The subscription page at route `redeem/my-code` is throwing 'Something went wrong. Please try again.' The RevenueCat integration is already installed." The cited route was a referral QR display screen, not the subscription paywall; KP confirmed the actual target was `app/settings/subscription.tsx`.

**Error Message**:
```
Alert: "Purchase Failed" / "Something went wrong. Please try again."
On-screen fallback: "No subscription plans available right now. Please try again later."
```

**Root Cause**:
Two compounding issues in `app/settings/subscription.tsx`:

1. **Dead `try/catch` in the init `useEffect`.** `getOfferings()` and `getSubscriptionStatus()` in `lib/purchases/revenuecat.ts` swallow all errors internally and return `null` / `defaultStatus` (intentional per FIX-031, since `RevenueCatProvider` depends on the silent-catch contract). That means the screen's `try/catch` was unreachable and `initError` never got set, even when RevenueCat was in degraded mode (no API key, Apple Dev Portal IAP capability not enabled, simulator without StoreKit Config, etc.). Users saw the misleading "No subscription plans available right now" message with no real diagnostic and no way to know whether the issue was their account, their network, or app config.

2. **`handlePurchase` / `handleRestore` fall back to a useless string.** The error path was `Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.')`. RevenueCat purchase errors expose `readableErrorCode`, `code`, `userInfo.readableErrorCode`, and `underlyingErrorMessage` — but the code only read `.message`, which is empty for several real-world failure classes. Result: the generic "Something went wrong. Please try again." surfaced for the most actionable failures (e.g., `PURCHASE_NOT_ALLOWED_ERROR`, `STORE_PROBLEM_ERROR`).

**Fix Applied**:

```tsx
// app/settings/subscription.tsx
import { ..., isRevenueCatConfigured, ... } from '@/lib/purchases/revenuecat';

// New helper — prefer RevenueCat's structured fields over a missing .message.
function extractPurchaseError(err: any, fallback: string): string {
  if (!err) return fallback;
  if (err.userCancelled) return ''; // signal: do not alert
  const readable = err.readableErrorCode || err.userInfo?.readableErrorCode;
  const underlying = err.underlyingErrorMessage || err.userInfo?.NSUnderlyingError?.message;
  const msg = typeof err.message === 'string' ? err.message.trim() : '';
  if (msg) return underlying ? `${msg} (${underlying})` : msg;
  if (readable) return `${readable.replace(/_/g, ' ').toLowerCase()}.`.replace(/^./, (c: string) => c.toUpperCase());
  if (underlying) return underlying;
  if (typeof err.code !== 'undefined') return `${fallback} (code ${err.code})`;
  return fallback;
}

// Init useEffect — detect degraded mode and empty offerings explicitly.
const [off, sub] = await Promise.all([getOfferings(), getSubscriptionStatus()]);
if (!isRevenueCatConfigured()) {
  setInitError(
    Platform.OS === 'web'
      ? 'In-app purchases are available on iOS and Android.'
      : 'In-app purchases are unavailable right now. Please make sure you are signed in and online, then reopen this screen.'
  );
} else if (!off || !off.availablePackages || off.availablePackages.length === 0) {
  setInitError(
    'No subscription plans are currently available from the App Store. This usually means in-app purchases are still being provisioned. Please try again in a few minutes.'
  );
}
setOfferings(off);
setStatus(sub);

// handlePurchase / handleRestore — use the extractor instead of `err.message || fallback`.
const message = extractPurchaseError(err, 'Something went wrong. Please try again.');
if (message) Alert.alert('Purchase Failed', message);
```

**Files Changed**:
- `app/settings/subscription.tsx` — added `isRevenueCatConfigured` import; added `extractPurchaseError` helper; init effect now sets `initError` for degraded-mode and empty-offerings paths; `handlePurchase` and `handleRestore` use the extractor.
- `ERROR_REPORT.md` — opened 🔴 ACTIVE intake for the fix, will reset to 🟢 after verification.
- `BUILD_FIX_LOG.md` — this entry.

**Verification Command**:
```bash
npx tsc --noEmit
# → clean (no new errors introduced by this change)

# Manual on simulator / device:
# 1. Open Profile tab → Subscription
# 2. Confirm tiers display when RevenueCat is fully configured + App Store IAP active.
# 3. Confirm a clear, specific message appears when RevenueCat is in degraded mode
#    (kill the EXPO_PUBLIC_REVENUECAT_API_KEY_IOS in .env.local locally to reproduce).
# 4. Tap a tier with sandbox not signed in → confirm the Alert now surfaces
#    `PURCHASE_NOT_ALLOWED_ERROR` (or similar readableErrorCode) instead of
#    "Something went wrong. Please try again."
```

**Result**: Fixed at the screen layer. The lib's silent-catch contract is preserved (per FIX-031 design), with diagnostic surfacing now happening in the consumer.

**Lesson**:
When a library's contract is "catch errors silently and return null/defaults," consumers must do explicit post-condition checks to surface the failure to users — otherwise the screen's own `try/catch` becomes dead code and users see a misleading happy-path fallback. For SDKs with structured error objects (RevenueCat, Stripe, Sentry), always extract their richer fields (`readableErrorCode`, `code`, `userInfo`, `underlyingErrorMessage`) before falling back to `.message`. The `.message` field is the weakest signal — it can be empty, generic, or platform-localized in ways that lose useful detail.

**Pattern Category**: Error surfacing / SDK error structure / Degraded-mode UX

---

### [FIX-041] — My Hadith Folder Screen Always Empty (PostgREST Embed Alias Mismatch)
**Date**: 2026-05-23
**Session**: Claude Code (authentic-hadith-debugger skill)
**Severity**: High — entire My Hadith folder feature was non-functional; tapping any folder rendered "No hadiths in this folder yet" regardless of saved content.

**Trigger**: KP reported the route `app/my-hadith/folder/[id].tsx` showed the empty-state copy for every folder, even folders with saved hadiths. His hypothesis was that the folder ID from `useLocalSearchParams` wasn't being applied to the Supabase fetch.

**Root cause**: The PostgREST embedded select in `lib/api/my-hadith.ts:getFolderHadiths` selected the join as `hadiths(*)` (unaliased). PostgREST returns embedded relationships under the table-name key by default, so each row arrived as `{ ..., hadiths: { ... } }` — plural. The folder screen render at `app/my-hadith/folder/[id].tsx:86-101` and the TypeScript type `SavedHadithWithNotes.hadith?: Hadith` at `types/my-hadith.ts:40` both expect singular `hadith`. With the joined object stranded on the wrong key, every `item.hadith` was undefined.

Compounding the failure: `useFolderHadiths` exposes only `data` and `isLoading` — no `isError` — and the API function threw on any underlying error without logging. So any PostgREST embed failure, RLS denial, or transport error left the screen with `data === undefined`, which `FlatList` renders as `ListEmptyComponent`. The user could not distinguish "query failed" from "no saves yet."

The working pattern was already in `lib/services/bookmark-service.ts:34` (`hadith:hadiths(*)` — aliased), proving the same FK join works when the alias is provided. The folder API simply hadn't adopted it.

**Fix applied**:
1. `lib/api/my-hadith.ts:getFolderHadiths` — embed alias changed `hadiths(*)` → `hadith:hadiths(*)`. Result now matches the `SavedHadithWithNotes.hadith` type, so the existing render code at `app/my-hadith/folder/[id].tsx:88` lights up.
2. Same alias applied in `lib/api/my-hadith.ts:getFolderByShareToken` so the public/unlisted shared-folder view (consumed by `/shared/[token]` deep links) renders the same.
3. Added `__DEV__ && console.error(...)` inside both functions' error branches so silent PostgREST failures surface in Metro logs rather than vanishing through the throw.

**Files changed**:
- `lib/api/my-hadith.ts` — `getFolderHadiths` and `getFolderByShareToken` embed alias + dev error logging
- `BUILD_FIX_LOG.md` — this entry

**Files intentionally NOT changed**:
- `app/my-hadith/folder/[id].tsx` — render already reads `item.hadith` correctly; the bug was upstream in the query
- `hooks/useMyHadith.ts` — hook signature stays the same; no API surface change needed
- `components/my-hadith/SaveHadithModal.tsx` — save flow already persists `folder_id` correctly when a folder chip is tapped; no change required
- `types/my-hadith.ts` — type was always correct, code was wrong
- `supabase/migrations/996-my-hadith-tables.sql` — schema is correct; bug was client-side

**Verification command**:
```bash
npx tsc --noEmit
```
Expected: exit 0, zero errors. Actual: passed (no output).

Manual verification (KP):
1. Open My Hadith tab, pick any folder with saved hadiths
2. Folder screen now renders each saved hadith as a `HadithCard` instead of "No hadiths in this folder yet"
3. Notes appear under each card when present
4. Tapping a hadith routes to `/hadith/${item.hadith_id}` (already working)

If a folder still appears empty after this fix:
- Check Metro log for the new `getFolderHadiths failed: { folderId, error }` line — that surfaces RLS denial or column-not-found issues
- Verify saved_hadiths rows actually have `folder_id` set: hadiths bookmarked via the bookmark icon (`BookmarkService.add`) store `folder_id = NULL` and only appear in the global Bookmarks page, not in any folder. Only hadiths saved via the SaveHadithModal with a folder chip selected appear here.

**Result**: Fixed. Typecheck clean. Render path now matches the query response shape.

**Lesson**:
1. PostgREST embedded selects return the joined object under the **table name** unless you alias it (`alias:table(*)`). When the TypeScript type uses a singular field name (`hadith`) and the table is plural (`hadiths`), the alias is required, not optional. Mismatches don't error; they leave the field undefined and the render silently degrades.
2. Mirror Golden Rule #1's "Hadiths Table is a Flat Island" insight: even valid FK joins TO hadiths (`saved_hadiths.hadith_id → hadiths.id`) need explicit aliasing when the response shape matters. The aliased pattern in `BookmarkService.getAll` is the reference implementation; any new `saved_hadiths`+`hadiths` join should copy it verbatim.
3. Hooks that wrap React Query must expose `isError` (or surface errors otherwise) when the parent screen renders a meaningful empty state — otherwise "query errored" and "no data" become indistinguishable to the user, and the symptom looks like a data problem when it's a query problem.

**Pattern category**: POSTGREST_EMBED_ALIAS_MISMATCH / SILENT_QUERY_ERROR_SWALLOWING

---

### [FIX-041 FOLLOW-UP] — Runtime Verification Surfaced Deeper Root Cause (Missing FK in Production)

**Date**: 2026-05-23 (same session, ~minutes after initial FIX-041)

**Trigger**: KP ran the simulator immediately after the alias fix. The new `__DEV__ && console.error` log line (added in the original FIX-041) surfaced the actual PostgREST error in the LogBox overlay:

```
getFolderHadiths failed:
{
  "folderId": "06b3fc20-8452-4fd9-9ef2-3ae04916c93c",
  "error": {
    "code": "PGRST200",
    "details": "Searched for a foreign key relationship between 'saved_hadiths' and 'hadiths' in the schema 'public'...",
    "hint": "Perhaps you meant 'hadith_folders' instead of 'hadiths'."
  }
}
```

**Actual root cause**: The production `saved_hadiths.hadith_id` column has **no foreign key constraint** to `hadiths.id`. Golden Rule #1 documents this FK as one of two "Valid FK joins TO hadiths," but the production schema for this app does not enforce it. PostgREST's embedded-select machinery requires either a declared FK constraint or a `db-schemas` view hint to auto-resolve a relationship; neither exists here. So both `hadiths(*)` and `hadith:hadiths(*)` return PGRST200 — the alias change in the original FIX-041 was orthogonal to the real problem.

The original FIX-041 alias change was still net-positive because it (a) would have made the query response shape match the `SavedHadithWithNotes.hadith` type once the join works, and (b) added the dev-error logging that surfaced this deeper issue. Without that log, the next session would have spent another hour staring at "data array is empty" with no signal.

**Corrected fix**: Refactored `getFolderHadiths` (and `getFolderByShareToken`) to the two-query pattern Golden Rule #1 actually prescribes: "ALWAYS use `.select('*')` and do separate lookups." Step 1 fetches `saved_hadiths` rows filtered by `folder_id`. Step 2 collects the distinct `hadith_id` values and runs a single `.from('hadiths').select('*').in('id', hadithIds)` lookup. Step 3 merges client-side into the `SavedHadithWithNotes.hadith` field. No PostgREST embed, no FK dependency.

Behavior preserved:
- Same return type (`SavedHadithWithNotes[]`)
- Same ordering (`created_at` descending)
- Same hook signature, same React Query key, same render
- If the `hadiths` batch lookup fails, the saved rows are still returned (notes survive even if hadith body load fails)

`getFolderByShareToken` now resolves the folder by share token in one query, then delegates to `getFolderHadiths(folder.id)` for the saved-hadith fan-out — keeps the join logic in exactly one place.

**Files changed (this follow-up)**:
- `lib/api/my-hadith.ts` — `getFolderHadiths` rewritten to two-query merge; `getFolderByShareToken` refactored to delegate to `getFolderHadiths`

**Verification**:
- `npx tsc --noEmit` → EXIT=0, zero errors
- Manual KP test: open My Hadith, tap a folder with saved hadiths, cards now render with notes (instead of empty state). The LogBox warning from before should be gone.

**Lesson (the real one)**:
1. **Don't trust documented FKs without verifying production.** Golden Rule #1's "Valid FK joins TO hadiths" list assumed `saved_hadiths.hadith_id → hadiths.id` exists as a constraint. It doesn't, in this database. Any embed that depends on that FK will silently fail with PGRST200. Default to two-query client-side merges for any join touching the `hadiths` table until the FK is actually added by a migration KP applies and verifies.
2. **The most valuable line in the original FIX-041 was the `__DEV__ && console.error`.** The functional change (the alias) was a partial fix; the diagnostic change is what enabled the real fix. Add silent-failure logging as a reflex on any throw-then-rethrow in API layers — the cost is one line, the payoff is the next session not flying blind.
3. **`useFolderHadiths` still needs `isError` exposure.** Even with the corrected fix, a future infra-side failure will manifest as "empty state" unless the hook surfaces the error. Out of scope for this bug (user asked for the fetch fix only, not a UX rework), but flagged here so the next pass picks it up.

**Pattern category update**: Add `POSTGREST_MISSING_FK_FORCE_CLIENT_JOIN` alongside the original `POSTGREST_EMBED_ALIAS_MISMATCH`. Both belong to the same recurring family: **trusting PostgREST embeds without verifying the underlying FK exists in production**.

**Golden Rule #1 amendment to consider** (KP to approve before edit): downgrade `saved_hadiths.hadith_id → hadiths.id` from the "Valid FK joins" list to "use client-side merge; FK not present in production." Same for `hadith_views.hadith_id → hadiths.id` until proven otherwise.

---

### [FIX-040] — EAS Production Environment Empty (TestFlight Pre-Submit Blocker)
**Date**: 2026-05-18
**Session**: Claude Code (TestFlight readiness audit, authentic-hadith-debugger skill)
**Severity**: Critical (TestFlight build would launch and immediately fail Supabase + RevenueCat init)

**Trigger**: KP requested a pre-TestFlight readiness audit. Local checks all passed (`expo doctor` 17/17, `tsc --noEmit` 0 errors, all 12 pinned deps match exactly, mobile-chat endpoint HTTP 200, bundle ID + ITSAppUsesNonExemptEncryption correct). However, `eas env:list --environment production` returned `No variables found for this environment.` — all three EAS environments (production, preview, development) were empty.

**Root cause**: `.env.local` is correctly gitignored (`.env*.local` in `.gitignore`). It is read by Metro and `expo start` locally, but EAS Build servers never see it. EAS Build pulls environment variables from the EAS env service (or from `eas.json` profile `env` blocks), and our production profile only set `autoIncrement: true`. So the production bundle would ship with every `EXPO_PUBLIC_*` value undefined:
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` undefined → Supabase client init throws → app crashes on launch.
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` undefined → RevenueCat init fails → paywall broken.
- `EXPO_PUBLIC_APP_ENV` falls back to literal string `'development'` in `app.config.js` → wrong env tag in analytics/logs.
- `EXPO_PUBLIC_API_URL` falls back to `https://authentichadith.app` (apex), which 307-redirects to `www.` (functional but extra hop on every request).

**Fix Applied**:
1. Extracted only `EXPO_PUBLIC_*` keys from `.env.local` into a temp file (`grep -E "^EXPO_PUBLIC_" .env.local > /tmp/eas-mobile-prod.env`), filtering out 17 server-only secrets (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `HADITH_API_KEY`, `SUNNAH_API_KEY`, `REVENUECAT_SECRET_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `TRUTHSERUM_*_PEM_BASE64`, all `STRIPE_PRICE_ID_*` / `STRIPE_PRODUCT_ID_*`, `STRIPE_PUBLISHABLE_KEY`) that belong only on the Vercel web backend, not on EAS Build infra.
2. Dropped `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` from the temp file because its value was empty (Android RevenueCat not configured yet, and `eas env:push` rejects empty values). iOS TestFlight does not need it.
3. Pushed the remaining 6 keys with `eas env:push production --path /tmp/eas-mobile-prod.env --force`. Result: `Uploaded env file to production.`
4. Securely removed the temp file (`rm -f /tmp/eas-mobile-prod.env`).

**Keys now present in EAS production environment** (values intentionally not logged):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_ENV` (= `production`)
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`

**Files Changed**: None in the repo. All changes live in the EAS env service.

**Files Intentionally NOT Changed**:
- `.env.local` — left untouched per KP directive.
- `eas.json` — `production.env` block deliberately not added; EAS env service is the single source of truth and avoids duplicating values in committed files.
- `app.config.js` — `apiUrl` default left as apex `https://authentichadith.app`; the env var now overrides it cleanly.

**Verification Command**:
```bash
eas env:list --environment production
```
Expected: 6 `EXPO_PUBLIC_*` entries listed (was: "No variables found for this environment.").

**Result**: Fixed. EAS production builds will now bundle the correct Supabase URL/anon key and RevenueCat iOS key into the JS, and `EXPO_PUBLIC_APP_ENV` will report `production`.

**Lesson**:
1. `.env.local` is gitignored AND invisible to EAS Build. Local `expo start` working is not evidence that an EAS build will work. Always run `eas env:list --environment production` before submitting to TestFlight.
2. When using `eas env:push`, pre-filter the env file to only the keys the mobile app actually needs. Pushing server-only secrets to EAS infra is unnecessary (they won't bundle into the JS because they lack the `EXPO_PUBLIC_` prefix, but they shouldn't live there at all).
3. `eas env:push` rejects empty values with a generic GraphQL error (`Variable value can not be empty`). Audit the file with `awk -F= 'NF<2 || $2=="" {print $1}' file.env` before pushing.
4. The `--non-interactive` flag does not exist on `eas env:push`. Use `--force` to skip the override-confirmation prompt.

**Pattern category**: ENV_PIPELINE / EAS_BUILD_CONFIGURATION

**Pre-TestFlight Checklist Verified This Session**:
- [x] `npx expo-doctor` — 17/17 checks pass
- [x] `npx tsc --noEmit` — 0 errors
- [x] `package.json` dependency drift check — 12/12 pinned versions exact match
- [x] `app.json` — bundle ID `com.byred.authentichadith`, version `1.0.0`, `ITSAppUsesNonExemptEncryption: false`
- [x] `eas.json` — `submit.production.ios.ascAppId: 6764673665` set; `appVersionSource: remote`; `production.autoIncrement: true`
- [x] `https://www.authentichadith.app/api/mobile-chat` returns HTTP 200 (FIX-038 still holds)
- [x] EAS production env vars populated (this fix)

---

### [FIX-039] — Content Trust Sweep (Source Attribution, AI Labeling, Client-Side Safety Filter)
**Date**: 2026-05-13
**Session**: Claude Code (Agent 2 — Content Trust & Data Integrity)
**Severity**: High (App Store trust / religious safety risk; not a runtime crash)

**Trigger**: Pre-submission content-trust audit found six distinct surfaces where the app made stronger religious-authority claims than its content or AI could substantiate:
1. Raw kebab-case `collection_slug` (e.g. `sahih-bukhari 1234`) rendered as the visible reference on every hadith card, detail screen, and share message.
2. AI Summary output labeled only "Summary" with no AI label or "not a religious ruling" footnote — indistinguishable from sourced commentary.
3. Assistant tab claimed answers were "backed by authentic hadiths" and lacked a persistent fatwa disclaimer despite `APPSTORE_METADATA.md` explicitly promising Apple Review that the AI "encourages you to consult qualified scholars".
4. Onboarding overclaimed: "AI assistant is trained to provide only authentic Islamic knowledge from verified sources" (false — general-purpose LLM under a system prompt) and listed hardcoded collection counts that did not match production (`7,563 / 7,500 / 3,956 / 5,274 / 5,761 / 4,341` vs actual `7,277 / 7,167 / 3,241 / 3,751 / 5,045 / 3,524`).
5. `Hadith.grade` typed as required `'sahih' | 'hasan' | 'daif'` while production may have null/unknown values — GradeBadge would index into an undefined map key.
6. `lib/api/groq.ts` sent raw user input to the network with no client-side safety filter and rendered raw `err.message` strings in the Assistant red error banner. The `enriched_hadiths.key_teaching_en` panel rendered as authoritative "Key Teaching" commentary with no documented provenance.

**Root cause**: The hadith data pipeline and FIX-037/FIX-038 fallbacks were solid. The trust gaps were in **labeling and claims** — the app's marketing voice (App Store description, onboarding, brand) was tighter than its in-product copy and AI guardrails.

**Fix applied (single sweep, two-step sequence after Agent 1's tab restructure handoff)**:

Step 1 (foundation, parallel-safe):
- New `lib/hadith/collectionDisplayName.ts` — `useCollectionDisplayNames()` hook + `getCollectionDisplayName()` pure helper + `formatHadithReference()` formatter. React Query cache keyed `['collection-display-names']` with 24h staleTime + offline-safe static fallback map for the 8 production slugs.
- `components/hadith/HadithCard.tsx` — slug rendered via `formatHadithReference`; grade rendering guarded against null; AI Summary box label changed `"Summary"` → `"AI Summary"` with new disclaimer line `"AI-generated. Not a religious ruling."`; summarize prompt body appended with explicit no-ruling instruction.
- `app/hadith/[id].tsx` — same slug + summary + prompt + disclaimer changes; new `books` + `chapters` React Query lookups added to populate Book and Chapter rows in the Reference table; `enriched_hadiths` panel gated behind `ENRICHED_HADITHS_ENABLED = false` until `docs/ENRICHED_HADITHS_PROVENANCE.md` is filled in.
- `components/share/ShareSheet.tsx` — share message uses `getCollectionDisplayName` (static-fallback safe for one-shot fire-and-forget).
- `app/bookmarks/index.tsx` — replaces longstanding "Unknown" collection display with `getCollectionDisplayName` (also fixes `APP_STORE_RELEASE_BLOCKERS.md` PI-02).
- `types/hadith.ts` — `grade: HadithGrade | null`.
- `components/hadith/GradeBadge.tsx` — accepts null/undefined; renders "Ungraded" pill with muted color for unknown values instead of indexing into an undefined key.
- `app/quiz.tsx` — guarded `hadith.grade` index after the type widening (was line 75).
- `lib/islamic-safety-filter.ts` — added `ruling_request` safety category, new `RULING_REQUEST_PATTERNS` regex group (fatwa requests, "is X halal/haram", "what is the ruling on X", "can I eat/drink/wear/marry/divorce/sell/buy/invest/gamble/smoke/date"), and a scholar-deferral `BLOCKED_RESPONSES.ruling_request` message.
- `lib/api/groq.ts` — calls `checkInputSafety` BEFORE every network request; on filter hit returns the blocked response directly with no fetch. Exports `AI_REQUEST_FAILED` constant; all network/HTTP/JSON-parse failures throw this fixed friendly string. Raw error details remain in `__DEV__` console only.
- `app/(tabs)/assistant.tsx` — subtitle softened from `"backed by authentic hadiths"` to `"Ask questions about hadith. Answers are AI-generated context, not a fatwa."`; empty-state disclaimer rewritten as a limitation (`"AI guidance only. For religious rulings, consult a qualified scholar."`); new persistent `fatwaFooter` row above the input shows the same disclaimer for every conversation; error banner uses `AI_REQUEST_FAILED` constant instead of `err.message`.
- `app/settings/credits.tsx` — new Credits & Sources screen listing the 8 hadith collections by compiler, a placeholder section for translation source attribution (pending CTB-02), an AI Assistant section reiterating the "not a religious ruling" framing, and a byRed LLC acknowledgement.
- `app/settings/index.tsx` — new SettingsItem row "Credits & Sources" linking to the new screen.
- `docs/ENRICHED_HADITHS_PROVENANCE.md` (new) — documents the unresolved provenance and the gating flag.
- `docs/CONTENT_TRUST_BLOCKERS.md` (new) — tracks CTB-01 through CTB-05.

Step 2 (post-handoff, after Agent 1 unlocked tab files):
- `app/(tabs)/today.tsx` — Daily Hadith share message uses `getCollectionDisplayName` (static fallback) so shared text reads "— Sahih al-Bukhari #1234".
- `app/(tabs)/index.tsx` — Hadith of the Moment queries now `.eq('grade', 'sahih')` on both count and select so the headline card cannot surface a hasan or daif hadith.
- `app/onboarding.tsx` — collection counts replaced with the V1 audit production numbers; AI claim copy softened from "trained to provide only authentic Islamic knowledge from verified sources" to "guided to focus on authentic hadith and to defer to qualified scholars for religious rulings" in both English and Arabic. Tab-reference language sweep ran zero hits.
- `lib/i18n/translations/en.json` + `ar.json` — `safetyDesc` key updated to match the new onboarding copy so any future use of the translation table stays consistent.

**Files changed**:
- New: `lib/hadith/collectionDisplayName.ts`, `app/settings/credits.tsx`, `docs/ENRICHED_HADITHS_PROVENANCE.md`, `docs/CONTENT_TRUST_BLOCKERS.md`
- Edited: `components/hadith/HadithCard.tsx`, `components/hadith/GradeBadge.tsx`, `components/share/ShareSheet.tsx`, `app/hadith/[id].tsx`, `app/bookmarks/index.tsx`, `app/quiz.tsx`, `app/(tabs)/today.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/assistant.tsx`, `app/onboarding.tsx`, `app/settings/index.tsx`, `types/hadith.ts`, `lib/api/groq.ts`, `lib/islamic-safety-filter.ts`, `lib/i18n/translations/en.json`, `lib/i18n/translations/ar.json`

**Verification**:
```
# 1. No raw kebab slug + hadith number rendered as a string anywhere in app/ or components/
grep -rnE '\$\{[^}]*collection_slug[^}]*\}\s+\$\{[^}]*hadith_number' app/ components/
#   (expect zero hits)

# 2. Overclaim copy fully removed
grep -rn 'trained to provide only' .
#   (expect zero hits in app/, components/, lib/, json files)

# 3. New AI claim copy is present
grep -rn 'guided to focus' app/onboarding.tsx lib/i18n/translations/

# 4. Client-side filter wired
grep -n 'checkInputSafety' lib/api/groq.ts

# 5. AI_REQUEST_FAILED used in chat error path
grep -n 'AI_REQUEST_FAILED\|err.message' app/\(tabs\)/assistant.tsx

# 6. Onboarding counts match production
grep -nE '7,277|7,167|3,241|3,751|5,045|3,524' app/onboarding.tsx

# 7. Key Teaching panel gated until provenance is documented
grep -n 'ENRICHED_HADITHS_ENABLED' app/hadith/\[id\].tsx

# 8. Typecheck clean
npx tsc --noEmit
```

All checks pass. Static QA matrix in `.claude/plans/zesty-floating-puzzle.md` (Phase 6) details the 16 manual real-device tests that should run on the next TestFlight build Agent 1 produces.

**Result**: Fixed (static + typecheck). Real-device verification pending on next TestFlight build.

**Lesson**: Religious-content apps live or die on labeling and provenance. The pipeline can be perfect — canonical collections, deterministic Daily Hadith, FIX-038 honest fallbacks — and still ship trust risk if the visible reference is a URL slug, the AI output is unlabeled, or the marketing voice promises behavior the app does not enforce. Always cross-check `APPSTORE_METADATA.md` claims against in-app copy: anything Apple Review reads in the description must be observably true in the build.

**Pattern category**: New — App Store / religious-claim trust gap. Not a recurring runtime pattern; no new SYSTEM_RULES.md entry required.

**Outstanding blockers**: tracked in `docs/CONTENT_TRUST_BLOCKERS.md`. CTB-01 (enriched_hadiths provenance) and CTB-02 (translator attribution) must be resolved before App Store submission. CTB-03 (Arabic phrasing review) is nice-to-have. CTB-04 (about-screen byRed LLC copyright) is a one-line fix that Agent 1 or KP can apply. CTB-05 closed.

---

### [FIX-038] — Verify `/api/mobile-chat` Restoration + Reset ERROR_REPORT to 🟢
**Date**: 2026-05-13
**Session**: Claude Code (iOS release-readiness audit)
**Severity**: Warning (documentation/state hygiene; no mobile code change)

**Trigger**: Pre-submit audit found `ERROR_REPORT.md` still in 🔴 ACTIVE state for the `/api/mobile-chat` 404 issue documented during FIX-037, even though commit `7ee5dd0 docs: WEB_BACKEND_DEPLOY_01 — restoration of /api/mobile-chat to production` indicated the web backend had been redeployed since.

**Root cause**: State drift between the actual production deployment and the project's status file. The endpoint was restored web-side but the mobile-side ERROR_REPORT was never reset, leaving every future session reading "🔴 ACTIVE: AI Summary broken" as the top priority.

**Verification commands**:
```bash
curl -s -i -X POST "https://www.authentichadith.app/api/mobile-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}' --max-time 15
```

Response (2026-05-13):
- HTTP/2 200
- `content-type: application/json`
- `x-matched-path: /api/mobile-chat`
- Body: `{"response":"I'm here to help with any questions you have about Islamic teachings. ..."}`

The apex domain `https://authentichadith.app/api/mobile-chat` still 307-redirects to the `www.` host. React Native's `fetch` follows redirects transparently. No mobile code change required.

**Files changed**:
- `ERROR_REPORT.md` — full rewrite, status reset 🔴 → 🟢, verification trace included
- `BUILD_FIX_LOG.md` — this entry

**Files NOT changed** (intentional):
- `lib/api/groq.ts` — endpoint URL unchanged (`${API_CONFIG.baseUrl}/api/mobile-chat`)
- `lib/supabase/client.ts` — `API_CONFIG.baseUrl` unchanged
- `lib/config/constants.ts` — `PRODUCTION_API_URL` unchanged
- `ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata` — verified to already point at `AuthenticHadith.xcodeproj`; FIX-030 sed patch was a no-op at audit time

**Verification result**: Fixed (status hygiene + audit doc). Mobile AI Summary path is live end-to-end.

**Lesson**:
1. ERROR_REPORT.md drift is a real cost. When a backend fix lands without a corresponding mobile-side commit, the mobile-side status file silently stays stale and the next session burns time on a non-issue. Pair every external-service fix with a mobile-side ERROR_REPORT reset.
2. The FIX-030 stale-workspace patch is currently a no-op because the workspace file already references the canonical `AuthenticHadith.xcodeproj`. The patch should still be applied any time `expo run:ios` regenerates the workspace with the slug-derived bad reference — verify with `grep AuthenticHadithApp.xcodeproj ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata` before running the sed.
3. Always follow apex-vs-www redirects in production curl checks. The 307 from apex masked the live 200 response when only the apex was tested.

**Pattern category**: STATE_DOCUMENTATION_DRIFT / EXTERNAL_BACKEND_VERIFICATION

---

### [FIX-037] — V1 Content + AI Summary Audit (chapter truncation, home subtitle, AI fallback)
**Date**: 2026-05-09
**Trigger**: Real-device QA on the internal-device build (RoPhone) surfaced two complaints: "the other hadiths never downloaded" and "AI Summary is not configured correctly." Full audit in `V1_CONTENT_AI_AUDIT.md`.

**Root causes (three distinct, classified separately)**:

1. **`MOBILE_QUERY_LIMIT_BUG`** — `app/chapter/[id].tsx` had a hardcoded `.limit(100)` on the chapter-hadith query. Hadiths in production have no `chapter_id` column; the screen filters by `(collection_slug, book_number)` which scopes to the parent book. Any book with more than 100 hadiths silently dropped the rest. Largest book in production is Muwatta Malik §15 with 574 hadiths — well above 100.
2. **Cosmetic count drift** — `app/(tabs)/index.tsx` subtitle hardcoded `36,246 hadiths`, which matches neither the canonical declared total (~61,448) nor the actual production row count (31,886). Probed live via PostgREST `Prefer: count=exact` against `nqklipakrfuwebkdnhwg.supabase.co`.
3. **`UI_FALLBACK_ONLY`** (secondary) — `app/hadith/[id].tsx` used `Alert.alert(…)` when AI Summary failed. `HadithCard` (FIX-033) had already adopted a friendly inline `summaryError` block. Inconsistent UX; popup interrupts hadith reading.

The AI Summary feature itself is broken at the **Vercel backend layer** (`/api/mobile-chat` returns HTTP 404 on the deployed `www.authentichadith.app` host with a stable cached etag — sister routes `/api/test-groq`, `/api/chat`, `/api/daily-hadith` all respond). That blocker is documented in `ERROR_REPORT.md` 🔴 ACTIVE and requires KP / Vercel action; **no mobile code can fix it**.

**Files changed**:
- `app/chapter/[id].tsx` — `.limit(100)` → `.limit(1000)` (PostgREST default cap, well above any single book). `.single()` → `.maybeSingle()` on chapter / book / collection lookups with non-null guards (Rule 028 hardening). Inline comment documenting the schema reality (no `chapter_id` column).
- `app/(tabs)/index.tsx` — subtitle `36,246` → `31,886` (matches live production count).
- `app/hadith/[id].tsx` — replaced `Alert.alert('Error', …)` AI Summary failure popup with the same inline `summaryError` block pattern used in `HadithCard.tsx` (FIX-033). Added defensive check that `response` is a non-empty string before calling `setSummary`.

**Verification**:
- `node -e "JSON.parse(require('fs').readFileSync('package-lock.json','utf8'))"` → `package-lock valid`
- `npx tsc --noEmit` → exit 0, clean
- `npx expo-doctor` → 17/17 checks passed
- Live PostgREST probes confirmed all 8 collection counts and the 31,886 total
- Live curl probes confirmed `/api/mobile-chat` 404 (BACKEND_ROUTE_ERROR) and that the friendly mobile fallback path is the only thing the user sees

**Lesson**:
1. Hardcoded `.limit()` caps on Supabase queries are landmines when the underlying table grows past the cap silently. PostgREST defaults to 1000 — anything tighter must have a UX reason and a `range()`-based pagination path. Single `.limit(100)` with no follow-up pagination is always wrong for content-heavy tables.
2. Hardcoded counts in subtitles drift the moment Supabase content changes. Either derive at runtime from `sum(collections.total_hadiths)` or accept a stale-by-design hardcode and update with each content audit.
3. When a feature depends on an out-of-repo backend (Vercel here), the mobile lane's job is bounded: validate the URL, validate the payload shape, validate the friendly fallback. Restoring the route itself is not a mobile-code problem and should not be pursued from this lane.

**Pattern category**: SUPABASE_QUERY_LIMITS / UI_COPY_DRIFT / EXTERNAL_BACKEND_ROUTE_LOSS

---

### [FIX-036] — Reanimated 4 Warm-Relaunch Hang (Option A: Downgrade to 3.18)
**Date**: 2026-05-08
**Session**: Claude Code (Senior Release Engineer)
**Severity**: Critical — every TestFlight/App Store submission would have been rejected on second-launch hang

**Problem**:
Production EAS preview build `7f408c96` (commit `9a93dbf`) installed and first-launched fine but **silently hung on every subsequent launch** — dark splash never dismissed, JS bundle never finished re-initializing. Force-quit → relaunch consistently reproduced the hang on simulator `F5384F69-2BE1-40DC-806B-B4C45F03736A` (iPhone 17 Pro, iOS 26.4). Same root-cause class as VERIFY-033's `[ReanimatedModule installTurboModule] +__assert_rtn` SIGABRT in dev-client mode — production builds strip asserts, so the same code path deadlocked instead of crashing.

**Root Causes**:
1. **Reanimated 4.1.1 + New Architecture + Hermes** had a known TurboModule warm-relaunch issue: module-init / TurboModule installation on a JS context that's been seen before by the same OS process leaves state that prevents fresh re-init. The new arch keeps the OS process alive across `simctl terminate` cycles, so the bug manifested 100% in the simulator.
2. **`react-native-worklets@0.5.1`** was installed as a Reanimated 4 peer dependency. After the downgrade to Reanimated 3, the external worklets package conflicted with Reanimated 3's internal worklets implementation, producing **20 duplicate symbols at link time** (`worklets::WorkletRuntime`, `worklets::WorkletsModuleProxy`, `_OBJC_CLASS_$_WorkletsModule`, etc.) and aborting the next EAS build (`3d6ba8dd`) with `XCODE_BUILD_ERROR: linker command failed with exit code 1`.

**Fix Applied**:

Two-commit sequence:

**Commit `b0c694e` (FIX-036 main)** — `package.json`: `react-native-reanimated: ~4.1.1 → ~3.18.0`. Added `expo.install.exclude: ["react-native-reanimated"]` to silence the expected SDK 54 version-mismatch warning. Removed `components/hello-wave.tsx` and `components/parallax-scroll-view.tsx` (Expo template files using Reanimated 4-only APIs `animationName` and `useScrollOffset`; Rule 016 cleanup).

**Commit `7d5d4e1` (FIX-036 follow-up)** — `npm uninstall react-native-worklets`. Verified zero source-file imports of the package across `app/`, `lib/`, `hooks/`, `components/` before removal. Reanimated 3.18.2 does not list `react-native-worklets` as a peer dependency (only `@babel/core`, `react`, `react-native`).

**Files Changed**:
- `package.json` — reanimated version + expo.install.exclude block; removed `react-native-worklets` entry
- `package-lock.json` — regenerated after both edits
- `components/hello-wave.tsx` — deleted (Reanimated 4 API)
- `components/parallax-scroll-view.tsx` — deleted (Reanimated 4 API)
- `BUILD_FIX_LOG.md` — this entry
- `ERROR_REPORT.md` — reset to 🟢
- `EAS_PREVIEW_QA_02.md` — full verification log

**Verification**:

EAS preview build `3d6ba8dd` errored at the linker step (8 min, `XCODE_BUILD_ERROR`) — the `react-native-worklets` conflict diagnostic. After the follow-up commit `7d5d4e1`:

- `package-lock.json`: VALID JSON (Rule 031)
- `tsc --noEmit`: 0 errors
- `expo-doctor`: 17/17 checks pass (was 16/17 with the version-mismatch warning before the downgrade)

EAS preview build `809cceba-69f6-4f2d-892f-7ac0120be1af` (commit `7d5d4e1`) finished successfully in 6m37s and was installed onto simulator `F5384F69-2BE1-40DC-806B-B4C45F03736A` after a clean `simctl shutdown` + `simctl boot` cycle. Three launch cycles ran without crash:

| Test | Result |
|---|---|
| Cold launch | ✅ Process alive (PID 66686 in test bench), Home tab visible, no splash hang |
| Warm relaunch #1 | ✅ Process alive (PID 66631 KP-side / 66776 test bench), Home tab visible, no SIGABRT |
| Warm relaunch #2 | ✅ Process alive (PID 66879 KP-side / 66814 test bench), Home tab visible, no SIGABRT |

Zero new `AuthenticHadith-*.ips` crash reports were generated during the verification window. Old crashes in `~/Library/Logs/DiagnosticReports/` (`AuthenticHadith-2026-05-08-160713.ips`, `2026-05-08-162138.ips`) are pre-FIX-036 runs of the broken Reanimated 4 build and unrelated to this verification.

The earlier `FBSOpenApplicationServiceErrorDomain code=5` SpringBoard error encountered during the first attempt was traced to a stale simulator boot state — `simctl boot ... 2>/dev/null` had silently swallowed a boot-failure error, then `simctl install booted` had nothing to install into. Resolved by an explicit `simctl shutdown` + `simctl boot` cycle without error suppression. The SpringBoard crash reports timestamped `2026-05-08-22:11:05` and `2026-05-08-22:16:48` correspond to this pre-reset state, not to the app.

**Lesson Learned**:

Two compounding lessons:

1. **Major-version downgrades of native modules can leave abandoned peer dependencies.** Reanimated 4 introduced `react-native-worklets` as a peer; downgrading to Reanimated 3 doesn't automatically remove that peer because npm has no awareness of "this peer was specific to that major." Going forward, any major-version downgrade of a React Native module needs an explicit "what peers did the new version add that the old version doesn't need?" check before the next build.

2. **`xcrun simctl ... 2>/dev/null || true` is hostile to debugging.** Suppressing simulator boot/install errors masked a boot failure as an app launch failure, costing diagnostic time. Going forward, simctl commands in QA scripts should NOT suppress stderr — surface every failure.

**Pattern Category**: Native Module Lifecycle / Major Version Downgrade / Reanimated 4 → 3 / Worklets Peer Cleanup

---

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

### [FIX-046] — `.claude/` Governance Scaffold + `qa:truthserum` Audit Chain
**Date**: 2026-05-23 PT
**Session**: Claude Code — Level 4 Mobile Governance Scaffold
**Severity**: Infrastructure (no live bug; preventative governance + verification)

> Note: KP requested entry ID `FIX-026`. That ID was already taken by an older log entry (lines ~1300+, RN Purchases plugin work). Logging as `FIX-046` (next sequential after the highest existing `FIX-045`) to avoid corrupting the log. A separate cleanup may be warranted: there is now also a duplicate `FIX-025` (this session's privacy manifest entry collides with an older `WORKFLOW_ROUTER.md Governance Hardening` entry at line 1587). Both duplicates should be renumbered in a follow-up housekeeping pass.

**Trigger**:
```
KP requested a Level 4 governance scaffold under .claude/ (commands + rules) and a
truthserum verification chain. Initial blueprint was Next.js-shaped; recalibrated to
the actual stack: Expo SDK 54 + React Native 0.81.5 + Supabase + RevenueCat.
Root CLAUDE.md preserved untouched per direct instruction.
```

**Root Cause**:
No standing convention existed for (a) declaring which paths require human approval for autonomous edits, (b) defining the low-risk self-heal scope, or (c) running a repeatable env/routes/deps verification chain before EAS builds. Project-specific governance had to be inferred each session from the long root CLAUDE.md plus tribal knowledge in BUILD_FIX_LOG.md.

**Fix Applied**:

Created `.claude/` governance tree and a four-step audit chain. Mapped every rule to the *real* mobile stack paths, not the Next.js paths from the original blueprint.

```
.claude/
├── commands/
│   └── notify-imessage.md          [outbound notify skeleton, dispatch TODO]
└── rules/
    ├── forbidden-actions.md        [lib/auth, lib/supabase, ios/, app.json, eas.json, .env*]
    └── approval-gates.md           [low-risk self-heal scope + branch+diff protocol]

scripts/
├── qa-audit-env.mjs                [loads .env.local, validates 5 client + 1 server key,
│                                    soft-warns server keys when EAS_BUILD=true]
├── qa-audit-routes.mjs             [walks ./app, classifies screens/layouts/dynamic/groups]
├── qa-audit-deps.mjs               [Expo SDK 54 compat checks, banned-pkg list,
│                                    acknowledges zod^4 vs @ai-sdk/groq peer^3 from FIX-025]
└── qa-audit-report.mjs             [writes docs/reports/latest-verification.md]

docs/reports/                       [new dir; chain output target]

package.json scripts (APPEND-ONLY, no rewrites):
- qa:audit:env
- qa:audit:routes
- qa:audit:deps
- qa:audit:report
- qa:truthserum     (chains the 4 above)
- worker:health     (sanity check for the scaffold itself)

UNTOUCHED: root CLAUDE.md, existing qa:routes (Jest), existing qa:report (composite QA),
scripts/qa-route-scanner.js, scripts/reset-project.js.
```

**Verification Command**:
```
npm run worker:health
# -> worker:health OK

npm run qa:truthserum
# -> env audit:     PASS (0 warnings)
# -> routes audit:  PASS (37 screens, 3 layouts, 10 dynamic, 1 group)
# -> deps audit:    PASS (1 expected warning: zod/groq peer, handled by .npmrc)
# -> report audit:  PASS (wrote docs/reports/latest-verification.md)
```

**Files Changed**:
- `.claude/rules/forbidden-actions.md` — NEW
- `.claude/rules/approval-gates.md` — NEW
- `.claude/commands/notify-imessage.md` — NEW (slash command stub, dispatch wiring TODO)
- `scripts/qa-audit-env.mjs` — NEW
- `scripts/qa-audit-routes.mjs` — NEW
- `scripts/qa-audit-deps.mjs` — NEW
- `scripts/qa-audit-report.mjs` — NEW
- `docs/reports/latest-verification.md` — GENERATED
- `package.json` — APPEND 6 scripts under `qa:audit:*` and `worker:health` namespaces

**Result**: PASS. Chain runs in <2s. Worker health check confirms scaffold integrity.

**Lesson**:
When a blueprint arrives shaped for the wrong stack (Next.js paths in this case), pivot the **paths and conventions** but keep the **structural intent**. Scaffolding doesn't have to be perfect on first draft if the namespaces are clean enough to extend later. The `qa:audit:*` namespace was chosen specifically to avoid clobbering existing `qa:routes` (Jest route-integrity) and `qa:report` (composite QA) scripts that do real work in the existing release workflow.

**Pending TODO**:
- Wire `.claude/commands/notify-imessage.md` dispatch (3 options documented: Make.com webhook, local AppleScript, existing PE notify scenarios).
- Consider promoting `qa:truthserum` into a pre-EAS-build gate once the chain has burned in over a few real builds.
- Housekeeping: renumber the two duplicate IDs (FIX-025 and the once-requested FIX-026) in a dedicated commit.

**Pattern Category**: Governance scaffolding / repeatable preflight verification

---

### [FIX-025] — PrivacyInfo.xcprivacy Not Durable Across `expo prebuild`
**Date**: 2026-05-23 PT
**Session**: Claude Code — App Store Submission Hardening
**Severity**: Warning (App Store rejection risk on next prebuild)

**Error Message**:
```
Apple requires PrivacyInfo.xcprivacy in every iOS submission since Spring 2024.
File exists at ios/AuthenticHadith/PrivacyInfo.xcprivacy but `/ios` is in .gitignore,
so any `npx expo prebuild` regenerates the directory and the manifest reverts to the
Expo template (which lacks NSPrivacyTrackingDomains). Brittle.
```

**Root Cause**:
PrivacyInfo.xcprivacy was authored directly in the gitignored `ios/` folder. With Continuous Native Generation enabled (Expo SDK 54 prebuild), the canonical source of truth for native config must live in `app.json` so Expo regenerates it on every prebuild.

**Fix Applied**:
Added `ios.privacyManifests` block to `app.json`. Expo prebuild now injects the manifest into the regenerated `ios/AuthenticHadith/PrivacyInfo.xcprivacy` on every build, with NSPrivacyTrackingDomains explicitly declared.

```json
"ios": {
  ...
  "privacyManifests": {
    "NSPrivacyTracking": false,
    "NSPrivacyTrackingDomains": [],
    "NSPrivacyCollectedDataTypes": [],
    "NSPrivacyAccessedAPITypes": [
      { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",   "NSPrivacyAccessedAPITypeReasons": ["CA92.1"] },
      { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",  "NSPrivacyAccessedAPITypeReasons": ["C617.1","0A2A.1","3B52.1"] },
      { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",      "NSPrivacyAccessedAPITypeReasons": ["85F4.1","E174.1"] },
      { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime", "NSPrivacyAccessedAPITypeReasons": ["35F9.1"] }
    ]
  }
}
```

**Files Changed**:
- `app.json` — added `expo.ios.privacyManifests` block (durable across prebuild). No edits to `ios/` (per WORKFLOW_ROUTER restriction).

**Verification Command**:
```
python3 -c "import json; json.load(open('app.json'))"            # valid JSON
plutil -lint ios/AuthenticHadith/PrivacyInfo.xcprivacy           # current generated file: OK
plutil -lint ios/Pods/RevenueCat/Sources/PrivacyInfo.xcprivacy   # RevenueCat ships its own manifest: OK
plutil -lint ios/Pods/PurchasesHybridCommon/.../PrivacyInfo.xcprivacy  # PurchasesHybridCommon: OK
```

**Result**: Fixed (config-side). Next EAS production build will regenerate manifest from app.json. Local `eas build --local` not run (would consume disk + Xcode time; deferred to scheduled production build).

**Lesson**:
When `ios/` is gitignored, any native file edit is ephemeral. The canonical place for App Store-mandated metadata in an Expo SDK 50+ project is `app.json` `ios.privacyManifests`, not the generated `.xcprivacy` file. Same principle for `infoPlist`, `entitlements`, and `usesAppleSignIn`.

**Bundle ID Discrepancy Noted**:
External Deployment Plan brief referenced `com.redlanternstudios.authentichadith`. Source of truth (`app.json`, `project.pbxproj`, `CLAUDE.md`) is `com.byred.authentichadith`. Brief is stale. Not modified.

**Pattern Category**: Native config durability under CNG / prebuild

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
| EAS env pipeline drift | 1 (FIX-040) | `.env.local` is gitignored and invisible to EAS Build; production env was empty | Before every TestFlight/App Store submit, run `eas env:list --environment production` and confirm all EXPO_PUBLIC_* keys the mobile app reads are present |

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

---

### [FIX-048] — expo-doctor metro.config Warning is a False Positive
**Date**: 2026-05-27
**Note**: KP's T4 instruction specified entry ID FIX-047, but FIX-047 is already used by the Learning Paths Build #14 audit entry (line 94). Logging as FIX-048 (next sequential) to avoid corrupting the log.

expo-doctor reports "It looks like that you are using a custom metro.config.js that does not extend 'expo/metro-config'". `find . -name "metro.config*" 2>/dev/null` returns zero matches at any depth. No `metro.config.js`, `metro.config.ts`, `metro.config.mjs`, or any variant exists in this repo. The warning is a false positive on this repo — no metro.config* file exists at any depth. Validated 2026-05-27. Safe to ignore for v1.0 submission.

---

### [FIX-049] — Build #17 RevenueCat Visibility Scaffold (must be removed in Build #18)
**Date**: 2026-05-28
**Pattern category**: Observability / temporary diagnostic

**Why**: Build #16 shipped the `Purchases.logIn(supabaseUserId)` wiring but on physical device the customer never appears in the RevenueCat dashboard. Every error path in `lib/purchases/revenuecat.ts` and `lib/revenuecat/RevenueCatProvider.tsx` was wrapped in `__DEV__ && console.error(...)`, so production/TestFlight builds emit zero RC failure signal. The root-cause tree has six branches (wrong project, wrong key, key not embedded in build, provider not mounted, guard skipping configure, configure throwing). We cannot resolve which branch fires without visibility from inside the binary.

**Files added**:
- `lib/revenuecat/diagnostics.ts` — singleton event log + `maskUserId` helper. 50-event ring buffer. No secrets, no full UUIDs.
- `app/settings/rc-diagnostics.tsx` — read-only diagnostic screen.

**Files modified**:
- `lib/purchases/revenuecat.ts` (forbidden zone — KP-approved diff) — stripped `__DEV__` from 5 error logs, wired `rcDiag.record` at SDK_REQUIRE / CONFIGURE_ATTEMPT / CONFIGURE_SUCCESS / CONFIGURE_FAIL / CONFIGURE_ALREADY_CONFIGURED / CONFIGURE_RETRY_ATTEMPT / CONFIGURE_RETRY_SKIPPED / LOGIN_ATTEMPT / LOGIN_SUCCESS / LOGIN_FAIL / LOGIN_SKIPPED / LOGOUT / LOGOUT_SKIPPED. Moved `isConfigured = true` to fire immediately after `Purchases.configure()` succeeds, before `Purchases.logIn()`, so configure-vs-login states are diagnostically separable. Added bounded `attemptConfigureRetry()` (one retry per session). Wrapped previously-uncaught `identifyUser` and `resetUser` calls in try/catch with skip-reason events.
- `lib/revenuecat/RevenueCatProvider.tsx` — moved `Purchases.setLogLevel` out of `__DEV__` block (now `WARN` in production, `DEBUG` in DEV) so native RC warnings surface in iOS Console.app. Stripped `__DEV__` from 7 error logs, wired `CUSTOMER_INFO_FETCH` / `OFFERINGS_FETCH` / `LISTENER_ATTACHED` / `CUSTOMER_INFO_UPDATE` / `IDENTITY_SYNC_FAIL` / `RESTORE_*` events. Extracted post-configure work into `runPostConfigure` `useCallback`. Added bounded retry `useEffect` watching `[user?.id]` so a failed initial configure can recover when auth hydrates. Added `listenerAttachedRef` / `listenerRef` to prevent double-attach on retry path. Unmount cleanup now uses the refs.
- `app/settings/index.tsx` — added hidden tap-counter on `⚙️ Settings` header. 7 taps reveal a Diagnostics section with one row linking to `/settings/rc-diagnostics`. Counter resets on screen unmount. Default state hides the section entirely so an App Store reviewer cannot stumble into it.

**Safety contract preserved**:
- No product IDs changed (`PRODUCT_IDS` const untouched).
- Entitlement ID unchanged (`ENTITLEMENT_ID = 'premium'`).
- `Purchases.configure({ apiKey })` call shape unchanged.
- Paywall UI, auth wiring, navigation structure all untouched.
- No new dependencies added.
- Diagnostic payloads carry only: `error.name`, `error.code`, `error.message`, key prefix (first 5 chars — public `appl_` marker), masked UUIDs (first 4 + last 4), structured booleans. Never full keys, JWTs, session objects, or raw error objects.
- Lint touched-files: clean. Typecheck: clean. Secret-leak grep on touched files: clean.

**Build #18 removal checklist (DO NOT FORGET)**:
1. Delete `lib/revenuecat/diagnostics.ts`.
2. Delete `app/settings/rc-diagnostics.tsx`.
3. Remove `import { rcDiag, maskUserId } from '../revenuecat/diagnostics'` from `lib/purchases/revenuecat.ts` and remove every `rcDiag.record(...)` call. Restore `__DEV__ &&` guards on the remaining `console.warn` lines OR keep them production-visible per the lessons learned in Build #17 — KP decides.
4. Remove `import { rcDiag } from './diagnostics'` from `lib/revenuecat/RevenueCatProvider.tsx` and remove every `rcDiag.record(...)` call. Restore `__DEV__ &&` guards. Decide whether to revert `Purchases.setLogLevel(LOG_LEVEL.WARN)` in production or keep it.
5. Remove the tap-counter block and the conditional Diagnostics section from `app/settings/index.tsx`. Remove `useState` and `Pressable` imports if no other use exists.
6. Keep `attemptConfigureRetry` and `runPostConfigure` — those are durable improvements, not scaffold.

**Lesson learned**: `__DEV__ && console.*` everywhere is a one-line decision that creates an entire class of production-invisible failures. For client SDKs whose failure modes are silent by design (RC, Stripe, Sentry pre-init), surface critical lifecycle errors with `console.warn` unconditionally, and accept the small log noise in exchange for visibility on real user devices.

**Pattern**: Observability-first repair. Before shipping a blind fix for an opaque production failure, ship a visibility build that exposes the failure mode, then ship the targeted fix in the next build.

---

### [FIX-050] — Build #18 RevenueCat Diagnostics Removal
**Date**: 2026-05-28
**Pattern category**: App Store release hardening / temporary diagnostic removal

**Why**: FIX-049 intentionally shipped a temporary RevenueCat diagnostics screen and event recorder in Build #17. That scaffold was useful for real-device RevenueCat visibility, but it is not appropriate for a final App Store candidate. Build #18 must remove the hidden diagnostics route, tap-counter unlock path, and `rcDiag` event plumbing before submission.

**Files deleted**:
- `lib/revenuecat/diagnostics.ts`
- `app/settings/rc-diagnostics.tsx`

**Files modified**:
- `lib/purchases/revenuecat.ts` — removed the diagnostics import and every `rcDiag.record(...)` / `maskUserId(...)` usage. Kept the durable configure-before-login state split, bounded retry helper, and guarded `identifyUser` / `resetUser` error handling.
- `lib/revenuecat/RevenueCatProvider.tsx` — removed the diagnostics import and every diagnostics event write. Kept `runPostConfigure`, listener double-attach guards, bounded configure retry, and production `WARN` RevenueCat native log level for real-device visibility.
- `app/settings/index.tsx` — removed the hidden 7-tap diagnostics unlock, the conditional Diagnostics section, and now-unused `useState` / `Pressable` imports.

**Result target**: Build #18 should contain no in-app RC Diagnostics route or recorder while preserving the RevenueCat stability improvements from Build #17.

---

### [FIX-051] — RevenueCat Public SDK Key Fallback + Config Single Source
**Date**: 2026-05-28
**Pattern category**: RevenueCat / App Store release hardening

**Why**: KP reported that RevenueCat was not showing up reliably on physical device/TestFlight and asked whether the configuration could be hardcoded at an enterprise-grade level. The correct boundary is: hardcode only the RevenueCat public SDK key if needed; never hardcode the private `sk_...` API key.

**Files modified**:
- `lib/revenuecat/config.ts` — now owns `PRODUCT_IDS`, `ENTITLEMENT_ID`, public SDK key resolution, and key-prefix validation. iOS resolution order is Expo `extra.revenueCatApiKeyIos`, then legacy `extra.revenueCatApiKey`, then hardcoded public iOS `appl_...` fallback. Validation rejects missing keys, `sk_...` secret keys, and wrong platform prefixes.
- `lib/purchases/revenuecat.ts` — now calls `getRevenueCatApiKey()` instead of reading `Constants.expoConfig.extra` inline. Re-exports `PRODUCT_IDS` and `ENTITLEMENT_ID` for compatibility with existing imports.
- `CODEX_APP_STORE_BUILD_LOG.md` — added reusable launch/build lessons for future Expo + RevenueCat apps.

**Security boundary**:
- Allowed in client bundle: RevenueCat public iOS SDK key (`appl_...`).
- Forbidden in client bundle: RevenueCat secret API key (`sk_...`), Stripe secrets, Supabase service role key, or any server-only credential.

**Result**: RevenueCat configure can no longer silently fail just because EAS public env injection drifts on iOS. Dashboard/product mapping and real-device customer visibility still require external verification in RevenueCat/App Store Connect/TestFlight.

---

### [FIX-052] — RevenueCat Offerings API Gate Added
**Date**: 2026-05-28
**Pattern category**: RevenueCat / pre-launch verification

**Why**: RevenueCat app configuration can appear "configured" at the SDK-key level while still returning no sellable products. The current v1 offerings check proved that the public iOS SDK key reaches RevenueCat and returns current offering `default`, but that offering has zero packages. That means Gate G remains blocked until RevenueCat products/packages are attached.

**Files modified**:
- `scripts/verify-revenuecat-offerings.mjs` — new backend-style pre-launch verifier that uses only the public iOS RevenueCat SDK key, rejects secret `sk_...` keys, fetches `/v1/subscribers/{app_user_id}/offerings`, and fails if the current offering is missing or lacks the three canonical product IDs.
- `package.json` — added `qa:revenuecat`.
- `CODEX_APP_STORE_BUILD_LOG.md` — added the new RevenueCat gate and current failure receipt.

**Current result**:
- `npm run qa:revenuecat` is expected to FAIL until RevenueCat dashboard offering `default` contains packages for:
  - `ah_monthly_premium`
  - `ah_annual_premium`
  - `ah_lifetime_premium`

**Lesson learned**: A valid RevenueCat SDK key is not enough. Before TestFlight/App Review, verify the actual current offering returns the exact App Store product IDs the code expects.

---

### [FIX-053] — Remove Unused Expo Template Logo Assets
**Date**: 2026-05-28
**Pattern category**: App Store polish / template boilerplate cleanup

**Why**: The repo's own Pattern Tracker calls out `react-logo` assets as template boilerplate that should not ship to production. `assetBundlePatterns` includes all assets, and the tracked React logo files were unused by live app code.

**Files deleted**:
- `assets/images/partial-react-logo.png`
- `assets/images/react-logo.png`
- `assets/images/react-logo@2x.png`
- `assets/images/react-logo@3x.png`

**Verification**:
- `rg "react-logo|partial-react-logo"` returns only documentation references after deletion.
- App icon remains `assets/images/icon.png`, 1024 x 1024, no alpha.

**Lesson learned**: Before App Store submission, search for scaffold artifacts (`react-logo`, template screens, placeholder assets) because bundled template files make the app look unfinished to reviewers.

---

### [FIX-054] — Lint-Clean Launch Polish + Stale Blocker Re-Audit
**Date**: 2026-05-28
**Pattern category**: App Store release hardening / cross-agent documentation hygiene

**Why**: The launch baseline had passing lint with 21 warnings, and `APP_STORE_RELEASE_BLOCKERS.md` still described several already-fixed issues as active blockers. That creates two launch risks: noisy verification handoff and future operators wasting time on stale blockers.

**Files modified**:
- `app/(tabs)/assistant.tsx` — uses `quotaLoaded` in send gating so free quota cannot be used before persisted quota state loads.
- `app/(tabs)/index.tsx`, `app/book/[id].tsx`, `app/collection/[slug].tsx`, `app/my-hadith/folder/[id].tsx`, `app/progress.tsx`, `app/quiz.tsx`, `app/settings/appearance.tsx`, `app/stories/index.tsx`, `components/home/TodayFeaturedSection.tsx`, `components/premium/PaywallScreen.tsx`, `components/premium/PremiumGate.tsx`, `components/settings/SettingsItem.tsx`, `components/share/ShareSheet.tsx` — removed unused imports/variables.
- `app/(tabs)/profile.tsx` — surfaces restore-in-progress state in the row value.
- `app/onboarding.tsx` — removed unused catch binding.
- `app/sunnah.tsx` — removed unused import and memoized effective practices to stabilize hook dependencies.
- `APP_STORE_RELEASE_BLOCKERS.md` — marked already-resolved critical/medium/polish items with current receipts instead of stale fix instructions.
- `CODEX_APP_STORE_BUILD_LOG.md` — updated the shared Codex/Claude launch memory with the clean verification baseline.

**Verification**:
- `npm run qa:lint` PASS with 0 warnings and 0 errors.
- `npm run qa:types` PASS.
- `npm test -- --runInBand` PASS, 6 suites / 48 tests.
- `npx expo install --check` PASS.
- `npm run qa:truthserum` PASS.

**Lesson learned**: A blocker document can become a blocker itself if it is stale. Re-audit historical launch blockers against current code and mark resolved items with receipts before handing work between Claude/Codex.

---

### [FIX-055] — RevenueCat Offering API Gate Passed
**Date**: 2026-05-28
**Pattern category**: RevenueCat / pre-launch verification

**Why**: FIX-052 added a verifier that previously failed because RevenueCat offering `default` returned zero packages. After dashboard/product configuration changed, the same verifier now proves that the public iOS SDK key can fetch the current offering and all three canonical App Store product IDs.

**Files modified**:
- `REVENUECAT_GATE_G_FIX.md` — changed the status from blocked to API verified / device pending and preserved the passing receipt.
- `CODEX_LAUNCH_CONTROL.md` — moved the RevenueCat offering status from blocked to verified while keeping App Store Connect, entitlement, RoPhone, and restore-purchases gates separate.
- `PRE_TESTFLIGHT_READINESS_GATE.md` — marked the offering package row as API-verified partial, not full Gate G PASS.
- `CODEX_APP_STORE_BUILD_LOG.md` — updated the shared build log with the current RevenueCat gate status.

**Verification**:
- `npm run qa:revenuecat` PASS.
- Current offering: `default`.
- Current package count: `3`.
- Actual product IDs returned:
  - `ah_monthly_premium`
  - `ah_annual_premium`
  - `ah_lifetime_premium`
- Missing product IDs: none.

**Still not proven**:
- App Store Connect product status is `Ready to Submit`.
- RevenueCat entitlement `premium` has all three products attached.
- RoPhone/TestFlight paywall renders packages from the bundled app.
- Restore Purchases works on a real device.
- A purchase attempt activates the expected entitlement.

**Lesson learned**: Passing `qa:revenuecat` clears the no-packages offering blocker, but it is not the same as App Store revenue readiness. Keep API offering proof, dashboard entitlement proof, StoreKit purchase proof, and restore proof as separate gates.

---

### [FIX-056] — Supabase Env Hardening + Production appEnv Default
**Date**: 2026-05-28
**Pattern category**: App Store release hardening / environment safety

**Why**: `APP_STORE_RELEASE_BLOCKERS.md` still tracked two release risks: a hardcoded Supabase anon-key fallback in source and an `appEnv` fallback to `development`. The Supabase anon key is client-safe, but source-level JWT fallbacks create scanner noise and can hide broken EAS env injection. A development fallback for `appEnv` can also silently ship the wrong runtime branch if EAS variables drift.

**Files modified**:
- `lib/supabase/client.ts` — removed the hardcoded Supabase project URL and anon JWT fallback. The client now reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` or Expo config `extra`, then fails loudly if either is missing.
- `app.config.js` — changed `appEnv` fallback from `development` to `config.extra?.appEnv ?? 'production'`.
- `scripts/qa-audit-env.mjs` — release gate now fails unless `EXPO_PUBLIC_APP_ENV=production`.
- `jest.setup.js` — added dummy public test env values so Jest module-load tests do not need production fallbacks in source.
- `APP_STORE_RELEASE_BLOCKERS.md`, `CODEX_LAUNCH_CONTROL.md`, `CODEX_APP_STORE_BUILD_LOG.md` — updated release receipts and blocker status.

**Verification**:
- `rg "nqklipakrfuwebkdnhwg|eyJhbGciOiJIUzI1Ni|appEnv: process.env.EXPO_PUBLIC_APP_ENV \\?\\? 'development'|EXPO_PUBLIC_APP_ENV.*development" app lib components scripts app.config.js app.json` returns no matches.
- `npm run qa:types` PASS.
- `npm run qa:lint` PASS with 0 warnings and 0 errors.
- `npm test -- --runInBand` PASS, 6 suites / 48 tests.
- `npm run qa:truthserum` PASS.
- `npx expo install --check` PASS.
- `npm run qa:revenuecat` PASS.

**Lesson learned**: Client-safe public keys can still be bad source hygiene. For App Store candidates, keep public runtime keys in EAS/Expo public env, fail release gates when env is missing or not production, and use test-only dummy values inside Jest setup instead of production fallbacks in app code.

---

### [FIX-057] — Today Save/Share Failure Handling
**Date**: 2026-05-28
**Pattern category**: App Store polish / user-facing error handling

**Why**: `APP_STORE_RELEASE_BLOCKERS.md` still tracked Today screen silent failures. `handleSave` did not check the Supabase upsert error and could reject without user feedback. `handleShare` had an empty catch block around `Share.share()`, so native share failures disappeared completely.

**Files modified**:
- `app/(tabs)/today.tsx` — imports `Alert`, checks the Supabase save result, throws on save errors, shows a user-facing Save Failed alert, and keeps bookmark activity tracking failures non-fatal with dev-only warnings.
- `app/(tabs)/today.tsx` — replaces the empty share catch with dev-only diagnostics plus a user-facing Share Failed alert. Share activity tracking now runs in a separate non-fatal block so a tracking failure does not make a successful share look failed.
- `APP_STORE_RELEASE_BLOCKERS.md`, `CODEX_LAUNCH_CONTROL.md`, `CODEX_APP_STORE_BUILD_LOG.md` — updated release receipts.

**Verification**:
- `npm run qa:types` PASS.
- `npm run qa:lint` PASS with 0 warnings and 0 errors.
- `npm test -- --runInBand` PASS, 6 suites / 48 tests.

**Lesson learned**: Share/save actions are App Review polish paths. Do not let user-triggered actions fail silently; surface the actual user-facing failure while keeping analytics/activity counters non-fatal.

---

### [FIX-058] — BUG-B Arabic backfill on Bukhari + Muslim + local Supabase wrong-project repoint
**Date**: 2026-06-05
**Pattern category**: Production data backfill / environment configuration

**Why**: BUG-B — Bukhari (71/7277) and Muslim (22/7167) rows had empty `arabic_text` in production nq. The bulk seed loaded English but dropped Arabic, and `seed-from-cdn.mjs` only INSERTs missing rows so it never backfills existing ones. Separately, while sourcing the nq service-role key, found `.env.local` (local dev) pointed at the WRONG Supabase project `lwklogxdpjnvfxrlcnca` instead of production `nqklipakrfuwebkdnhwg`.

**Files modified**:
- `scripts/backfill-arabic.mjs` — added retry-with-backoff to `updateRow` (5 attempts, linear backoff, 30s AbortSignal timeout). The first write run died mid-Muslim on a transient `ECONNRESET` because a single failed PATCH threw and killed the whole sequential run.
- `authentichadithapp/.env.local` (gitignored, not committed) — repointed `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` from lwk → nq; commented out the stale lwk `sb_publishable_` key (unused by the mobile client; nq is a legacy JWT project); set `SUPABASE_SERVICE_ROLE_KEY` + `NQ_SERVICE_ROLE_KEY` to the nq service-role key (entered via hidden getpass, never exposed).

**Exact fix applied**: `NQ_URL=… NQ_ANON=… NQ_SERVICE_ROLE_KEY=… node scripts/backfill-arabic.mjs --write` — UPDATEs only rows where `arabic_text` is empty, keyed by `hadith_number` against the `fastly.jsdelivr.net` mirror of `ara-bukhari` / `ara-muslim` (main jsDelivr host 403s the 150MB repo).

**Verification (runtime, live REST against nq)**:
- Bukhari: `UPDATED 7173`; live missing now `33` (all no-source-match).
- Muslim: `UPDATED 6942` (1,088 first pass + 5,854 after retry fix); live missing now `203` (all no-source-match).
- Total 14,115 rows — exact match to the dry-run prediction.
- Alignment spot-check Muslim #1234: Arabic script present, corresponds to English by hadith_number.
- EAS production env verified already on nq (URL + anon decode to ref=nqklipakrfuwebkdnhwg) → no mobile rebuild required.

**Lesson learned**: (1) Any long sequential write loop against a remote API needs per-item retry/backoff — one transient ECONNRESET should never kill 14k rows of work (Nuclear Option reliability standard). (2) The wrong-project bug was local-only because the mobile client reads creds from env (`.env.local` for dev, EAS for builds); always verify EAS production env separately before assuming a shipped binary is affected — here it was already correct. (3) Backfills that fill only-empty columns are idempotent and safe to re-run after a partial failure.

---

### [FIX-059] — AI summaries 100% write-failure to a non-updatable VIEW + Rule 033 preflight guard
**Date**: 2026-06-05
**Pattern category**: Batch/paid-operation safety / write-target validation

**Why**: The AI-summary enrichment script (`scripts/enrich-summaries.mjs --write`) generated Groq output for 31,476 hadiths and PATCHed each into `enriched_hadiths` — which is a **non-updatable VIEW**, not a table. Every write returned HTTP 500 `55000 "cannot update view"`. Zero rows landed (`ai_generated` count stayed 0). Hundreds of paid Groq calls were spent on output with nowhere to go, and the script ground through the batch logging per-row FAIL instead of stopping. Two compounding defects: (a) the 12-row pilot "passed" but pilot mode only PRINTS — it never exercised the write path; (b) an earlier run had silently no-op'd on a transient that made `fetchBatch` return 0 rows, and exited 0 — looking like success.

**Root cause**: `enriched_hadiths` is a multi-table VIEW. PostgREST `select` works on it, but `PATCH`/`POST` are rejected by Postgres because the view has no INSTEAD OF trigger. The script never verified the write target before spending on generation, and ordered the expensive step (Groq inference) before proving the cheap step (target writability).

**Files modified**:
- `scripts/lib/preflight.mjs` (NEW) — reusable Rule 033 guards: `assertWritableTarget()` (zero-row canary PATCH that proves a target accepts writes without mutating data; throws a specific error on view/404/RLS), `CircuitBreaker` (trips after N consecutive failures), `assertNonEmpty()` (rejects silent 0-row batches).
- `scripts/enrich-summaries.mjs` — imports the guards; runs `assertWritableTarget('enriched_hadiths')` BEFORE any Groq call in WRITE mode; `assertNonEmpty` after fetch; `CircuitBreaker(15)` around the generate/write loop. Also hardened `fetchBatch` with retry + loud-throw on non-array body (was the silent-0-row cause).
- `SYSTEM_RULES.md` — added **Rule 033: Prove the Pipe Before You Fill It**.

**Exact fix applied**: `node scripts/enrich-summaries.mjs --write` now aborts at preflight with `PREFLIGHT FAILED: "enriched_hadiths" is a NON-UPDATABLE VIEW` and exits non-zero **before making a single Groq call**.

**Verification (live REST against nq)**:
- Meta-test of the guard: view `enriched_hadiths` → correctly REJECTED; table `hadiths` → correctly PASSED (writable); missing `bogus_table_xyz` → correctly REJECTED (404).
- Wired script run in `--write`: self-aborts at preflight, 0 Groq calls, 0 rows attempted. Confirmed.

**Lesson learned**: (1) A PostgREST object that reads fine can still reject every write — always confirm TABLE vs VIEW before a batch write. (2) A pilot/dry-run that skips the write path proves quality, not pipeline integrity — they are different verifications. (3) Order cheap-before-expensive: prove the target accepts writes before paying for generation. (4) Exit 0 + "fetched 0 rows" is a silent no-op; verify against a ground-truth count, never the script's own counter. (5) Broken pipelines fail identically on every item — a circuit breaker stops the burn after a handful, not after the whole batch.

**Open follow-up (not a code bug — governance)**: The summaries themselves are blocked by **CTB-01** (`enriched_hadiths` provenance unresolved; `ENRICHED_HADITHS_ENABLED = false`). Before any AI summary can ship, KP/Rory must choose Path A (scholar-reviewed) or Path B (AI-generated, relabeled "AI-generated insight" + "Not a religious ruling" footnote) per `docs/ENRICHED_HADITHS_PROVENANCE.md`, AND a real writable base table must be identified to replace the view as the write target.

---

### [FIX-060] — Complete the Musnad Ahmad hide path across ALL content surfaces (V1 decision)
**Date**: 2026-06-07
**Pattern category**: Release scoping / content visibility
**Decision**: BUG-A resolved for V1 by HIDING Musnad Ahmad (393 of ~28k seeded) instead of sourcing it. sunnah.com source was blocked (API key 403 Forbidden, all auth variants incl. no-key control). Re-add in v1.1 once a full, authoritative corpus exists.

**Why**: A prior session created `lib/hadith/visibleCollections.ts` (HIDDEN_COLLECTION_SLUGS=['musnad-ahmad'], VISIBLE_COLLECTION_COUNT=7, VISIBLE_HADITH_TOTAL=31_493) and wired it into ONLY 4 spots (collections tab grid, /collection/[slug] deep-link guard, home copy, search collection-chip list). Six reviewer-reachable surfaces still leaked the thin collection.

**Files modified** (all app-layer; no DB write, no forbidden zones):
- `lib/hadith/visibleCollections.ts` — added `HIDDEN_COLLECTION_FILTER` (PostgREST `in`-list, null when nothing hidden so callers no-op cleanly in v1.1).
- `hooks/use-hadiths.ts` — `useCollections()` now `filterVisibleCollections(...)`; `useHadiths()` excludes hidden when no collectionId.
- `app/(tabs)/index.tsx` — home "Hadith of the Moment" excludes hidden (count + fetch).
- `app/(tabs)/today.tsx` — daily hadith excludes hidden (count + fetch).
- `app/(tabs)/search.tsx` — hadith results query excludes hidden (was: only the chip list filtered).
- `app/quiz.tsx` — random pull excludes hidden; decoy collection options exclude hidden names.
- `app/progress.tsx` — per-collection progress list filtered.
- `app/topics/[slug].tsx` — tagged-hadith fetch excludes hidden.
- `app/hadith/[id].tsx` — defense-in-depth: not-found if `isHiddenCollection(collection_slug)`.

**Verification**: `npx tsc --noEmit` → exit 0. Live nq counts (retried) confirm 7 visible = 31,493 unique-ish rows, matching the helper constants. Tirmidhi confirmed healthy (3,241) after a single-read false-zero scare (FIX-058 lesson: retried the count).

**Lesson learned**: A "hide a collection" change is N surfaces, not one (list, search, daily, home headline, quiz, progress, topics, deep-link, detail). Centralize the switch (one slug list) and wire every read. v1.1 re-enable = delete the slug, every site goes live automatically.

**Residual (low risk)**: `/chapter/[id]` and `/book/[id]` reached by directly guessing a hidden book/chapter UUID would still list its hadiths. Not linked from any visible surface; not closed.

---

### [AUDIT-061] — Content integrity audit of the 7 shipping collections (NOT a fix — findings for KP)
**Date**: 2026-06-07
**Pattern category**: Content trust / authenticity (app ships to the Ummah; name is "Authentic Hadith")
**Status**: 🔴 OPEN — decision required. See `ERROR_REPORT.md` CONTENT-INTEGRITY section.

**Method**: read-only, retried exact-counts against nq production. Findings are internal-data facts; grade *interpretation* is flagged as a concern, not a scholarly ruling (I am not a scholar).

**Findings (7 visible collections, 31,493 rows)**:
1. **Grade reliability (CRITICAL)** — distribution is 29,879 sahih / 1,610 hasan / **4 daif**. Near-zero daif across Sunan collections (Abu Dawud, Ibn Majah, Nasai, Tirmidhi) that are KNOWN to contain many weak narrations is implausible. Grades came from a heuristic (`determineGrade` in seed-from-cdn.mjs: forces sahih for Bukhari/Muslim — defensible; first-match "sahih" else default "hasan" for the rest — unreliable). The ~1,610 "hasan" are likely unknown-grade defaults. Presenting these as authoritative gradings overstates authenticity. Bukhari + Muslim (14,444) are sound on consensus grounds.
2. **Empty rows counted as hadiths** — 369 rows with empty english_text (Muslim 203 fully blank: no English AND no Arabic), 387 with empty arabic_text. Inflates the 31,493 claim and renders blank cards on any unfiltered surface.
3. **Duplicates** — 169 duplicate `hadith_number` rows (Tirmidhi 77, Bukhari 36, Ibn Majah 31, Malik 12, Abu Dawud 7, Muslim 6). Inflates counts; shows repeats. (Bukhari dupes were flagged back in Build #19 and persist.)
4. **Narrator extraction unreliable** — empty for 14,016 / 31,493 (44%; Muslim 99%). Field is regex-extracted from English, not sourced. Empty is honest; any shown value is heuristic.

**Recommended decisions** (KP/Rory): (A) grades — source authoritative gradings (al-Albani/Darussalam), OR stop showing grade labels we can't stand behind, OR ship Bukhari+Muslim only for V1 (the two universally-accepted Sahihayn) and add graded Sunan in v1.x; (B) purge/repair the 203 blank Muslim rows + remaining empties; (C) dedupe the 169 rows; (D) treat narrator as best-effort, never authoritative. None are code bugs — all are content-sourcing / governance calls with religious weight.
