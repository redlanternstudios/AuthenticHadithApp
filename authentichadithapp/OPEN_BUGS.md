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
