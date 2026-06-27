# OPEN BUGS — TestFlight Submit Gate Ledger

> **THIS FILE IS A HARD GATE.** A self-firing PreToolUse hook
> (`~/.claude/hooks/testflight-submit-gate.mjs`) blocks any `eas submit`
> (TestFlight upload) while ANY bug below has status `OPEN`. No spotted bug
> reaches TestFlight until it is closed end to end with a receipt.
>
> **Status values:** `OPEN` | `CLOSED`
> **A bug closes only when:** the fix is committed AND verified with a real
> receipt (tsc/lint/test exit code, grep gate, logic proof, or device QA).
> Mark closure honestly per the TruthSerum protocol — never on a guess.
>
> **Format the gate parses:** each bug header is `## <ID> | <STATUS>`.
> The gate greps for `| OPEN`. Keep that exact shape.
>
> **Two-gate model (do not conflate):**
> 1. THIS gate = pre-TestFlight. No OPEN code/logic bug ships to testers.
> 2. `SYSTEM_RULES.md` Rule 040 = pre-App-Store-Review device QA on the
>    actual TestFlight build. Device confirmation lives there, not here.

---

## BUG-138 | CLOSED
- **Spotted:** 2026-06-26. User report: saving a hadith into a folder doesn't stick —
  the hadith does not appear in the folder.
- **Root cause:** Production project `nqklipakrfuwebkdnhwg` had `saved_hadiths` UPDATE
  RLS policy missing. Upsert on conflict resolved to UPDATE of `folder_id`, silently
  denied → row kept `folder_id = NULL`.
- **Fix applied (production):** Idempotent SQL run via Supabase Management API
  2026-06-26. RLS enabled, deduplication run, unique constraint added, 4 clean policies
  (SELECT/INSERT/UPDATE/DELETE) created.
- **Receipt (Verified):**
  - `rowsecurity = true` ✅ — `pg_tables` probe confirmed
  - Unique constraint `saved_hadiths_user_id_hadith_id_key UNIQUE (user_id, hadith_id)` ✅
  - 4 policies (DELETE, INSERT, SELECT, UPDATE) ✅ — `pg_policies` confirmed
  - Management API HTTP 201 on execution ✅
- **Remaining (KP only):** device round-trip — bookmark a hadith, Save-to-folder, confirm it appears.

## BUG-125 | CLOSED
- **Spotted:** 2026-06-25. Build 83 crashed whenever user tapped subscription/manage button.
- **Root cause:** Three SCREENSHOT-BYPASS lines left active in `lib/revenuecat/RevenueCatProvider.tsx`:
  (1) `isPro = true` hardcoded → every user appeared premium → Profile showed "Manage Subscription"
  (2) `init()` only called `setLogLevel` + `setIsLoading(false)`, never `configureRevenueCat()` → SDK never initialized
  (3) `return` early-exited the retry `useEffect` → no recovery path.
  Result: `CustomerCenterScreen` mounted `RevenueCatUI.CustomerCenterView` against an unconfigured RC SDK → crash.
- **Fix:** Reverted all 3 bypass blocks in `RevenueCatProvider.tsx` to the proper production init.
  Also: added `purchasesAvailable` guard before opening CustomerCenter modal in `profile.tsx`;
  wrapped `CustomerCenterView` in `ErrorBoundary`; fixed stale test mock in `error-boundary.test.tsx`.
- **Receipt:** `grep "isPro = true\|SCREENSHOT-BYPASS" lib/revenuecat/RevenueCatProvider.tsx` = GATE_EXIT:1 (no matches) ·
  `tsc --noEmit` EXIT:0 · `expo lint` EXIT:0 · `jest` 135/135 · 14/14 suites.

## BUG-124 | CLOSED
- **Spotted:** 2026-06-25. Build 82 hard-crashed on launch / on any error.
- **Root cause:** root `ErrorBoundary` sits above `ThemeProvider` in `_layout.tsx`;
  its `ThemedErrorFallback` called `useTheme()`, which throws when `ThemeContext`
  is undefined. The throw from inside the fallback was uncaught → app crash.
- **Fix:** commit `3a6592c` — `ThemedErrorFallback` now uses
  `useContext(ThemeContext)` with `?? false`; `ThemeContext` exported from
  `lib/theme/ThemeProvider.tsx`.
- **Receipt:** `npx tsc --noEmit` EXIT:0 · hook-safety grep
  `grep "useTheme()\|useAuth()\|useRevenueCat()\|useLanguage()" components/common/ErrorBoundary.tsx`
  = no matches (GATE_EXIT:1) · throw path eliminated at the logic level.
- **Device QA (Rule 040, separate gate):** confirm no-crash cold launch on Build 83 on a physical iPhone.

## BUG-123 | CLOSED
- **Spotted:** 2026-06-25 (SwarmClaw audit). Dark mode broken on SaveHadithModal,
  PaywallScreen, CustomerCenterScreen; bookmarks hardcoded fonts; auth cache not
  cleared on signout; missing a11y labels; unguarded API calls.
- **Fix:** FIX-123 batch, commits `5604f7f` + `212d1cf`.
- **Receipt:** lint EXIT:0 (0 warnings), tsc EXIT:0, 135/135 tests, expo-doctor 18/18,
  static-COLORS grep CLEAN across all 8 component targets.

## BUG-139 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Keyboard Audit. `Input.tsx` exported as plain function component; `ref` prop silently no-op, blocking all focus-chain wiring.
- **Fix:** Wrapped `Input` with `React.forwardRef<TextInput, InputProps>`. Added `ref` passthrough to underlying `<TextInput>`. Added `displayName = 'Input'`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-140 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Keyboard Audit. `app/auth/login.tsx` bare `<View>` container; keyboard covers Sign In button on small iPhones (SE/mini). No `returnKeyType`, no focus chain, no `autoCorrect={false}`.
- **Fix:** Outer `<View>` → `<KeyboardAvoidingView behavior="padding">`; email `returnKeyType="next"` + `onSubmitEditing`→focus password; password `ref={passwordRef}` + `returnKeyType="done"` + `onSubmitEditing={handleLogin}`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-141 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Keyboard Audit. `app/auth/signup.tsx` same bare `<View>` pattern; 3-field form (name/email/password) with no focus chain, no `autoCapitalize="words"` on name field.
- **Fix:** `<KeyboardAvoidingView>`; `emailRef` + `passwordRef`; full name→email→password chain wired with `returnKeyType` + `onSubmitEditing`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-142 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Audit. `app/stories/index.tsx` both `useQuery` calls silently swallowed Supabase errors; `isError` never set; users saw empty screen on network failure with no retry.
- **Fix:** Added `if (error) throw error` to both `queryFn` bodies; imported `QueryErrorBanner`; rendered it when `isError`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-143 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Audit. `app/(tabs)/search.tsx` search Input missing `returnKeyType="search"` and `clearButtonMode="while-editing"`.
- **Fix:** Added both props to the search `<Input>`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-144 | CLOSED
- **Spotted:** 2026-06-26 — Enterprise Audit. `app/onboarding.tsx` name `TextInput` missing `autoCapitalize="words"`, `autoCorrect={false}`, `returnKeyType="done"`.
- **Fix:** Added all three props.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-145 | CLOSED
- **Spotted:** 2026-06-26. `today.tsx` daily hadith queryFn and `progress.tsx` stats queryFn used `{ data }` destructuring without checking Supabase error object — service errors silently dropped, `isError` never fired even though `QueryErrorBanner` was wired in the render.
- **Fix:** Destructure `error` from both Supabase calls and `throw` on error. `today.tsx` countQuery + rowQuery; `progress.tsx` user_stats query.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-146 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit PAY-001). RevenueCat configure failure locked ALL paying subscribers to the paywall — `customerInfo` stayed null, `isPro=false`, NavigationGate redirected every user to /paywall. No cached entitlement fallback.
- **Fix:** Added `AsyncStorage` cache in `RevenueCatProvider.tsx` — writes `isPro` to `@ah/rc_entitlement_active` on every successful `getCustomerInfo` and on every listener push. Reads cache on configure failure (both the `!ok` path and the thrown-error path). `isPro` computed as `reviewer || liveIsPro || (!isConfigured && !isLoading && cachedIsPro)`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-147 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit PAY-002). `profile.tsx` restorePurchases always showed 'Restore Complete' regardless of whether entitlement was active. Return value discarded.
- **Fix:** Capture returned `CustomerInfo`, check `entitlements.active` — show 'No Active Subscription' if empty.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-148 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit QIZ-001). Free-tier '1 quiz per day' limit was cosmetic text only — no enforcement. `startQuiz` had no daily count check.
- **Fix:** Added `useQuery` for `quiz_attempts` count today; disabled Start Quiz button and updated copy when `dailyLimitReached` for free users.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-149 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit MH-001). Every folder card showed '0 hadiths'. `getUserFolders` selects `saved_hadiths(count)` via PostgREST which returns `[{count:N}]`, but code cast directly to `HadithFolder[]` where `saved_hadiths_count` was always undefined.
- **Fix:** Map rows in `getUserFolders` to extract `saved_hadiths_count = row.saved_hadiths?.[0]?.count ?? 0` before cast.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-150 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit MH-002). Share button generated a new token on every double-tap. After `generateShareToken` wrote token to DB, React Query cache was never invalidated — `folder?.share_token` was still null in stale cache.
- **Fix:** After `generateShareToken`, call `queryClient.invalidateQueries({ queryKey: ['folder', id] })`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-151 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit CD-002). `app/book/[id].tsx` — empty-state guard at line 64 (`hadiths.length === 0`) fired before `isError` check. `QueryErrorBanner` at line 91 was dead code on error because early return was hit first.
- **Fix:** Added explicit `isError` escape before the empty-state guard to return `QueryErrorBanner` on error.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-152 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit CD-003). `app/topics/[slug].tsx` — both tag and hadiths queries had no `isError` tracking. Tag failure showed dead-end 'Topic not found' with no retry. Hadiths failure showed empty list silently.
- **Fix:** Added `isError: tagError, refetch: refetchTag` to tag query; `isError: hadithsError, refetch: refetchHadiths` to hadiths query; `QueryErrorBanner` imported; tag error state returns banner; hadiths error renders banner above `HadithList`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-153 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit CD-004). `app/chapter/[id].tsx` — `parentBook` query had no `isError` tracking. parentBook failure left `hadiths` query permanently disabled (`enabled: !!parentBook`) and screen showed empty `HadithList` forever.
- **Fix:** Added `isError: parentBookError, refetch: refetchParentBook` to parentBook query; `isError: hadithsError, refetch: refetchHadiths` to hadiths query; parentBook error renders banner before main view; hadiths error renders banner inside main view.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-154 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit LRN-003). `app/learn/lesson/[lessonId].tsx` queryFn caught Supabase error and returned `null` instead of throwing — React Query never entered error state. Null check then showed 'Lesson not found' on transient network failure with no retry.
- **Fix:** Changed `return null` to `throw error` in the error path. Added `isError, refetch` destructuring. Added `isError` guard before the `!lesson` check to show `QueryErrorBanner` with retry.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-155 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit KBD-003). `app/auth/forgot-password.tsx` missing `KeyboardAvoidingView`. Email Input missing `returnKeyType="go"` and `onSubmitEditing={handleReset}`.
- **Fix:** Wrapped outer `<View>` in `<KeyboardAvoidingView behavior="padding">`. Added `autoCorrect={false}`, `returnKeyType="go"`, `onSubmitEditing={handleReset}` to email Input.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

## BUG-156 | CLOSED
- **Spotted:** 2026-06-26 (workflow audit A11Y). `app/(tabs)/assistant.tsx` send button (icon-only `TouchableOpacity` with `Ionicons`) missing `accessibilityLabel` and `accessibilityRole`.
- **Fix:** Added `accessibilityLabel="Send message"` and `accessibilityRole="button"`.
- **Receipt:** `tsc --noEmit` EXIT:0 · `npm test` 135/135.

---

## How to add a bug (do this the MOMENT one is spotted)
```
## BUG-<id> | OPEN
- Spotted: <date> — <what/where>
- Root cause: <why>
- Fix: <pending | commit hash>
- Receipt: <pending | proof>
```
Add it as `OPEN`. The gate will block TestFlight submit until you flip it to
`CLOSED` with a receipt. That is the whole point — it is the forcing function.
