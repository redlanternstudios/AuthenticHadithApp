# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟢 No active errors

> Resolved by FIX-031 (2026-05-08). Previous startup blockers — GROQ_API_KEY module-load throw, RevenueCat singleton-not-configured, i18next pluralResolver — are all gone. App launches to home screen cleanly. See BUILD_FIX_LOG.md FIX-031 for the full resolution and SYSTEM_RULES Rules 023-025 for the permanent rules added.

---

## INSTRUCTIONS FOR CLAUDE (EVERY SESSION)

1. **Read this file first.** If Status is 🔴 ACTIVE — this is your #1 priority.
2. **Inspect the repo** before guessing. Run ls, check package.json, check app.json.
3. **Check BUILD_FIX_LOG.md** — the fix may already be documented from a prior session.
4. **Diagnose root cause** — don't patch symptoms. Trace the error to its source.
5. **Fix it, verify it, log it** — after fixing, run the verification command, then log the full fix to BUILD_FIX_LOG.md.
6. **Reset this file** — set Status back to 🟢 No active errors and clear the sections.

---

## Status Template (for next failure)

When a bug occurs, replace the Current Error block above with:

```
**Status**: 🔴 ACTIVE

### What I Ran
[paste command here]

### Full Error Output
[paste full error output here]

### Files Possibly Related
- ...

### Classification (per WORKFLOW_ROUTER.md)
- VS_CODE_APP_LAYER / EXPO_HYBRID_LAYER / XCODE_NATIVE_LAYER / UNKNOWN_NEEDS_TRIAGE

### Severity
- Critical / High / Medium / Polish
```
