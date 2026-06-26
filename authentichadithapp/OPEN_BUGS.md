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
