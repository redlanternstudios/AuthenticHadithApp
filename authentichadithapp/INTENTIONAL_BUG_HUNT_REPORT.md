# Intentional Bug Hunt Report — Pre-Submission Full Audit
**Date:** 2026-06-25  
**Build:** 68 (in progress)  
**Audited by:** SwarmClaw 4-agent parallel audit  
**Verdict:** FIX REQUIRED before next App Store submission

---

## PRIORITY LEGEND
- **P0** — App Store rejection risk / crash / data loss
- **P1** — Visible broken UX / revenue leak / silent failure  
- **P2** — Degraded UX / edge case crash
- **P3** — Code quality / minor risk

---

## P0 — FIX BEFORE ANY SUBMISSION

### P0-1: No dismiss button on paywall — user trapped
**File:** `app/paywall.tsx`  
**Issue:** Non-premium users redirected to `/paywall` have no close/dismiss button and no back navigation (`headerShown: false`, fullScreenModal). If RC fails to load offerings, the "Plans Temporarily Unavailable" state has only a Restore button — no exit. Apple HIG + Guideline 3.1.1 both require dismissibility.  
**Fix:** Add an `X` close button (`router.replace('/auth/signup')` for unauthenticated, `router.back()` if reachable via a premium gate) visible in ALL paywall states including the unavailable-offerings fallback.

---

### P0-2: Duplicate route — `app/collections/index.tsx` shows HIDDEN collections
**File:** `app/collections/index.tsx`  
**Issue:** Two separate collections screens exist: `app/(tabs)/collections.tsx` (tab, applies `filterVisibleCollections`) and `app/collections/index.tsx` (non-tab, does NOT apply `filterVisibleCollections`). The non-tab version exposes all collections including Sunan Abu Dawud, Muwatta Malik, etc. that are explicitly hidden in V1. Any deep link or nav push to `/collections` (non-tab path) leaks the hidden content.  
**Fix (immediate):** Add `filterVisibleCollections` import and apply it in `app/collections/index.tsx`, OR delete the file and redirect all nav to `/(tabs)/collections`.

---

### P0-3: Conversation leaks across user accounts — AI Assistant
**File:** `app/(tabs)/assistant.tsx` line 38  
**Issue:** `messages` state is held in component state. Tab screens in Expo Router's `(tabs)` layout are NOT unmounted on tab switch — they stay mounted indefinitely. If user A logs out and user B logs in without killing the app, user A's full conversation is visible.  
**Fix:** Add `useEffect` watching `user?.id` — on change (or null), call `setMessages([])` and reset `setFreeUsed(0)`.

---

### P0-4: Story hard crash — `content_en` null causes `TypeError: Cannot read properties of null (reading 'split')`
**Files:** `app/stories/companion/[slug].tsx` (line ~454), `app/stories/prophet/[slug].tsx` (line ~440)  
**Issue:** `content_en` is typed as non-nullable `string` but fetched with `select('*')` and no null filter. If any `story_parts` or `prophet_story_parts` row has `content_en = null` in the DB, calling `content.split('\n\n')` inside `renderContentParagraphs` throws a hard crash. **One bad DB row crashes the entire reader for all users.**  
**Fix:** Change every call to `renderContentParagraphs(part.content_en ?? '', ...)`.

---

### P0-5: `progressLoading` infinite spinner — stories index
**File:** `app/stories/index.tsx` lines 72, 100, 113, 121  
**Issue:** `progressLoading` is initialized `true` and only set to `false` inside `loadProgress()`. The `useEffect` returns early without calling `setProgressLoading(false)` when `companions` is an empty array or undefined (error state). Result: users with no data in the sahaba table OR any network failure see a permanent spinner with no recovery.  
**Fix:** Change the guard to `if (!companions) return` (wait for initial load), and call `setProgressLoading(false)` in the else branch when `companions.length === 0`.

---

### P0-6: No sign-out in Settings — App Store rejection risk
**File:** `app/settings/index.tsx`  
**Issue:** The Settings screen contains zero sign-out or account management UI. Sign-out lives only in `app/(tabs)/profile.tsx` (a separate tab). Apple Guideline 5.1.1 requires apps with accounts provide easily discoverable sign-out and account deletion mechanisms. A reviewer navigating to Settings will find neither.  
**Fix:** Add an Account section to `settings/index.tsx` with: Sign Out row (calls `signOut()`) + Delete Account link → `/settings/delete-account`.

---

### P0-7: `handleSignOut` — unhandled rejection + double-tap race
**File:** `app/(tabs)/profile.tsx` lines 74–77  
**Issue:** `handleSignOut` has no try/catch. If `signOut()` throws (Supabase network failure), it's an unhandled rejection that silently fails — user taps Sign Out and nothing happens. Also no loading state prevents multiple rapid taps.  
**Fix:** Wrap in `try/catch`, show Alert on failure, add `isSigningOut` state to disable the button during the call.

---

### P0-8: Duplicate Alert collision on account deletion (Session Expired + Account Deleted shown simultaneously)
**File:** `app/settings/delete-account.tsx` + `lib/auth/AuthProvider.tsx`  
**Issue:** `delete-account.tsx` calls `supabase.auth.signOut()` which fires `onAuthStateChange('SIGNED_OUT')` in AuthProvider. AuthProvider's listener shows a "Session Expired" alert when `hadSessionRef.current` is true — firing AT THE SAME TIME as the "Account Deleted" alert. On iOS, two simultaneous `Alert.alert()` calls suppress one. The reviewer sees "Session Expired" instead of "Account Deleted."  
**Fix:** Move `supabase.auth.signOut()` inside the OK button handler of the "Account Deleted" alert, so it fires only after the user dismisses the deletion confirmation. Or temporarily set a `isDeletingRef` flag that suppresses the session-expiry alert.

---

## P1 — FIX BEFORE NEXT BUILD COMMIT

### P1-1: Onboarding — Supabase upsert errors silently swallowed
**File:** `app/onboarding.tsx` lines 91–109  
**Issue:** Neither the `profiles` nor `user_preferences` upsert result is checked. Supabase JS client returns `{ data, error }` — does NOT throw. If DB calls fail (RLS rejection, network drop), execution continues to `AsyncStorage.setItem('onboarded', 'true')` and `router.replace('/paywall')`. User is marked onboarded locally with NO profile or preferences row in the DB.  
**Fix:** Destructure `{ error }` from both upserts. If error is non-null, show an Alert and return (do not proceed to paywall).

---

### P1-2: Story "Complete" fires at wrong part — premature completion
**Files:** `app/stories/companion/[slug].tsx` line 627, `app/stories/prophet/[slug].tsx` line 572  
**Issue:** Complete button condition is `currentPart >= parts.length` (actual fetched rows), but dots navigation uses `totalParts` (DB metadata column). If `parts.length < totalParts` (some parts unpublished in DB), Complete appears at part 3 of a 5-part story. Story gets permanently marked done in AsyncStorage; user never sees parts 4–5.  
**Fix:** Change both to `currentPart >= totalParts`.

---

### P1-3: Grade quiz — marks WRONG answer as correct for unrecognized grades
**File:** `lib/hadith/generateQuiz.ts` line 107  
**Issue:** `const correct = (hadith.grade && gradeDisplay[hadith.grade]) || 'Sahih (Authentic)'` — if `grade` is null or outside `{sahih, hasan, daif}`, the fallback is `'Sahih (Authentic)'`. A da'if hadith question then tells the user Sahih is the correct grade. This is factually wrong, not just broken UX — it's incorrect Islamic content.  
**Fix:** Skip grade question generation entirely when `!hadith.grade || !gradeDisplay[hadith.grade]`.

---

### P1-4: `syncSubscriptionToSupabase` — silent Supabase write failure
**File:** `lib/purchases/revenuecat.ts` lines 238–252  
**Issue:** The Supabase `.update()` call return value is discarded. If the profile update fails (RLS, network), the IAP is confirmed locally but Supabase never reflects premium. Server-side entitlement checks (web app, future API) see the user as free despite a real purchase.  
**Fix:** `const { error } = await supabase.from('profiles').update(...).eq(...)` — log or throw if `error` is non-null.

---

### P1-5: Splash screen stays up forever if auth never resolves
**File:** `app/_layout.tsx` lines 158–162  
**Issue:** `SplashScreen.hideAsync()` only fires when `(fontsLoaded || fontError) && authReady`. If Supabase hangs on first launch (cold start + no network), `authReady` never becomes true → splash stays up permanently. No timeout fallback exists.  
**Fix:** Add an 8-second timeout that calls `SplashScreen.hideAsync()` unconditionally and routes to `/auth/signup` with a "Connection issue" toast.

---

### P1-6: `delete-account.tsx` — apex domain fallback (W-01 — carried from prior audit)
**File:** `app/settings/delete-account.tsx` line 9  
**Issue:** `const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://authentichadith.app'` — fallback is the apex domain which can 307-redirect, dropping POST body and Authorization header on iOS.  
**Fix:** `import { normalizeApiBaseUrl } from '@/lib/config/constants'` and `const API_URL = normalizeApiBaseUrl(Constants.expoConfig?.extra?.apiUrl)`.

---

### P1-7: `restorePurchases` swallows StoreKit errors — shows misleading alert
**Files:** `lib/purchases/revenuecat.ts` line 231–234, `lib/revenuecat/RevenueCatProvider.tsx` lines 192–206  
**Issue:** Both `restorePurchases` implementations catch all errors and return `null`/`defaultStatus` instead of rethrowing. A genuine StoreKit failure (no network, Apple ID not signed in) shows the same "Nothing to Restore" alert as a real empty restore. User believes they have no subscription when the real issue is network.  
**Fix:** Distinguish `PurchasesErrorCode` network/auth errors from "no entitlements" and rethrow them so callers can show a differentiated error message.

---

### P1-8: Manage Subscription deep-link missing
**File:** `app/settings/subscription.tsx`  
**Issue:** No "Manage Subscription" button linking to `https://apps.apple.com/account/subscriptions`. Apple Guideline 3.1.2(a) requires auto-renewable subscription apps provide a mechanism to manage subscriptions.  
**Fix:** Add button: `Linking.openURL('https://apps.apple.com/account/subscriptions')`.

---

### P1-9: Quick action routes not confirmed in root Stack layout
**File:** `app/(tabs)/index.tsx` lines 35–41  
**Issue:** Home screen quick actions push to `/quiz`, `/sunnah`, `/progress`, `/achievements`. These are root-level `app/*.tsx` files that must be declared in `app/_layout.tsx`'s Stack navigator. If any are missing from the Stack, Expo Router sends the user to `+not-found`.  
**Fix:** Confirm all 4 routes (`quiz`, `sunnah`, `progress`, `achievements`) are declared in `app/_layout.tsx`. Add any missing.

---

### P1-10: ErrorBoundary console.error not gated by `__DEV__` (W-02 — carried from prior audit)
**File:** `components/common/ErrorBoundary.tsx` line 25  
**Issue:** `console.error('ErrorBoundary caught an error:', error, errorInfo)` fires in production. Leaks internal stack traces to device logs.  
**Fix:** `if (__DEV__) { console.error(...) }`.

---

## P2 — FIX BEFORE SUBMISSION

### P2-1: `slug` param as `string[]` breaks collection queries
**File:** `app/collection/[slug].tsx` lines 103, 137, 148  
**Issue:** `useLocalSearchParams<{ slug: string }>()` types `slug` as `string` but Expo Router can return `string[]` for params in some navigation patterns. `slug as string` cast suppresses TS error but doesn't guard runtime. A bad slug causes all queries to silently fail or return wrong results.  
**Fix:** `const resolvedSlug = Array.isArray(slug) ? slug[0] : slug` and use `resolvedSlug` throughout.

---

### P2-2: `signup.tsx` — profile insert race condition
**File:** `app/auth/signup.tsx` + `lib/auth/AuthProvider.tsx` lines 73–99  
**Issue:** `signUp()` immediately fires `onAuthStateChange('SIGNED_IN', session)` BEFORE the profile insert completes. Any screen that reacts to `user` being set can find no profile row yet. Not a crash today (signup navigates to login after success), but will bite if auto-login flow is ever enabled.  
**Fix:** Use a database trigger (Supabase) to create the profile on `auth.users` insert, removing the race entirely.

---

### P2-3: `PremiumGate` opens RC UI paywall which can be blank if no offerings
**File:** `components/premium/PremiumGate.tsx` lines 55–68  
**Issue:** `PremiumGate` modal opens `RevenueCatUI.Paywall` (RC-hosted paywall). If RC is in degraded mode or offerings are null, `RevenueCatUI.Paywall` renders a blank sheet with no dismiss affordance visible to the user.  
**Fix:** Check `currentOffering` from `useRevenueCat()` before opening the modal. If null, `router.push('/paywall')` to the custom paywall instead.

---

### P2-4: AI Assistant — no `KeyboardAvoidingView`
**File:** `app/(tabs)/assistant.tsx` line 163  
**Issue:** The message input at the bottom has no `KeyboardAvoidingView`. On iPhone with software keyboard open, the input is covered by the keyboard. Critical for usability — the entire feature is a text input.  
**Fix:** Wrap in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>`.

---

### P2-5: LessonQuiz error state silent — shows nothing instead of error
**File:** `components/learn/LessonQuiz.tsx` lines 28–31, 48  
**Issue:** When the `learning_quiz_questions` query fails, `questions` is undefined, component returns `null`, and the lesson silently shows no quiz. Network failure and "no questions" look identical to the user.  
**Fix:** Track `isError` from `useQuery` and render a short error message: "Quiz unavailable — try again later."

---

### P2-6: Bookmark duplicate insert risk
**File:** `lib/services/bookmark-service.ts` + `app/hadith/[id].tsx`  
**Issue:** Rapid double-tap can bypass the `isTogglingBookmark` disabled state within one React render cycle. `BookmarkService.add` uses raw `.insert()` with no `ON CONFLICT DO NOTHING`. A duplicate row could result in phantom bookmarks that don't un-bookmark correctly on removal.  
**Fix:** Change to `.upsert({hadith_id, user_id}, {onConflict: 'hadith_id,user_id', ignoreDuplicates: true})`.

---

### P2-7: `status` initialized to `null` causes "Premium" flash in subscription screen
**File:** `app/settings/subscription.tsx` line 118  
**Issue:** `const [status, setStatus] = useState<SubscriptionStatus | null>(null)` — before `getSubscriptionStatus()` resolves, `status?.tier` is undefined, which falls through to show "Premium" in the UI. Then it flips to "Free" for non-subscribers. Flash is visible.  
**Fix:** Initialize with `defaultStatus` from `lib/purchases/revenuecat.ts` instead of `null`.

---

### P2-8: `setTimeout` in quiz `handleAnswer` — no cleanup on unmount
**File:** `app/quiz.tsx` lines 108–125  
**Issue:** 1500ms timeout fires after answer selection with no `useRef` cancel on unmount. If user navigates back within 1500ms of answering, sets state on unmounted component — React warning and potential router inconsistency.  
**Fix:** Store in `useRef<ReturnType<typeof setTimeout>>`, clear in `useEffect` cleanup.

---

### P2-9: `collection/[slug].tsx` — full hadith table scan for book derivation
**File:** `app/collection/[slug].tsx` lines 147–150  
**Issue:** The books fallback fetches ALL hadiths for the collection via `select('book_number').eq('collection_slug', slug)`. For Sahih al-Bukhari (7,000+ rows), this is a massive unfiltered scan with no `.limit()`.  
**Fix:** Use `SELECT DISTINCT book_number` via Supabase RPC or `.limit(1000)` as a stopgap.

---

## P3 — HOUSEKEEPING (do not block submission, clean up post-launch)

| # | File | Issue |
|---|---|---|
| P3-1 | `app/paywall.tsx` line 13 | Dead `AsyncStorage` import — remove |
| P3-2 | `components/premium/PremiumGate.tsx` lines 89–96 | Uses static `COLORS` not theme-aware `getColors(isDark)` — text wrong color in dark mode |
| P3-3 | `lib/learning/staticLearningContent.ts` | Orphaned dead code — no consumer imports it |
| P3-4 | `app/quiz.tsx` line 165 | Hardcoded "10 Qs" badge — replace with `{questions.length} Qs` |
| P3-5 | `app/settings/delete-account.tsx` | No fetch timeout — hangs indefinitely on bad network. Add AbortController 15s |
| P3-6 | `app/settings/delete-account.tsx` line 111 | Pasted lowercase "delete" from clipboard won't match — normalize: `v.toUpperCase()` in onChangeText |
| P3-7 | `app/(tabs)/assistant.tsx` | Retry button doesn't auto-retry — just restores input. Rename to "Edit & Resend" |
| P3-8 | `app/collections/index.tsx` line 12 | Uses `useColorScheme()` not `useTheme()` — ignores app-level manual dark mode toggle |
| P3-9 | `app/stories/companion/[slug].tsx` | Hardcoded safe-area padding — use `useSafeAreaInsets()` instead |
| P3-10 | `app/(tabs)/index.tsx` line 163 | `refreshing={isLoading}` shows spinner on first load too — use `isFetching` instead |
| P3-11 | `components/ErrorBoundary.tsx` lines ~61, ~68 | Rule 042: styles.title and styles.message missing fontFamily declarations |
| P3-12 | `app/learn/lesson/[lessonId].tsx` | Duplicate RN imports (View as RNView, Text as RNText) — remove aliases |
| P3-13 | `app/progress.tsx` | No sign-in prompt for unauthenticated users — shows Level 1 / 0 XP with no explanation |

---

## CRITICAL PRE-SUBMISSION CHECKLIST

Per SYSTEM_RULES.md Rules 034 and 040:

- [ ] **P0-1** Paywall dismiss button added
- [ ] **P0-2** Hidden collections leak fixed
- [ ] **P0-3** AI conversation cross-account leak fixed
- [ ] **P0-4** Story `content_en` null crash fixed
- [ ] **P0-5** Stories index infinite spinner fixed
- [ ] **P0-6** Sign-out added to Settings
- [ ] **P0-7** `handleSignOut` error handling added
- [ ] **P0-8** Account deletion dual-Alert collision fixed
- [ ] **P1-1** Onboarding upsert errors checked
- [ ] **P1-2** Story complete button uses `totalParts`
- [ ] **P1-3** Grade quiz skips unknown grades
- [ ] **P1-4** syncSubscriptionToSupabase checks Supabase error
- [ ] **P1-5** Splash timeout fallback added
- [ ] **P1-6** delete-account.tsx normalizeApiBaseUrl
- [ ] **P1-7** restorePurchases distinguishes StoreKit errors
- [ ] **P1-8** Manage Subscription deep-link added
- [ ] **P1-9** Quick action routes confirmed in root Stack
- [ ] **Rule 034** Live probes: reviewer login + RC premium + /api/mobile-chat
- [ ] **Rule 040** 8-item device QA on physical iPhone with Build 68
- [ ] **Submit** KP's finger only

---

## FILES CONFIRMED CLEAN (no bugs found)

- `app/auth/login.tsx` — validation, double-tap guard, error handling all correct
- `app/settings/notifications.tsx` — static screen, no async ops
- `lib/revenuecat/config.ts` — product IDs, entitlement, reviewer emails all correct
- `app/paywall.tsx` (null priceString) — no crash, blank price cell max
- `app/paywall.tsx` (hardcoded prices) — none found, all dynamic from RC
- `app/paywall.tsx` (savings language) — none found, Apple 2.3.7 clean
- `app/paywall.tsx` (Restore button visibility) — present in ALL states
- `lib/services/bookmark-service.ts` (getAll) — correct maybeSingle() usage
- `app/learn/[pathId].tsx` — invalid pathId handled, not-found state correct
- `lib/learning/staticQuizContent.ts` — all correctIndex values in range, IDs unique
- `lib/progress/progressService.ts` — AsyncStorage failure safe, listener errors isolated
- `app/(tabs)/assistant.tsx` (empty send) — `!text.trim()` guard present
- `lib/api/groq.ts` — all console statements __DEV__ gated, 12s timeout present
