# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟢 No active errors

> EAS preview build succeeded on commit `9a93dbf` after regenerating the corrupted `package-lock.json`. Build artifact: `https://expo.dev/artifacts/eas/gHoFdJunVtDYkm7KYv8bpf.tar.gz`. Full history in `EAS_PREVIEW_BUILD_01.md`.

---

## INSTRUCTIONS FOR CLAUDE (EVERY SESSION)

1. **Read this file first.** If Status is 🔴 ACTIVE — this is your #1 priority.
2. **Inspect the repo** before guessing. Run ls, check package.json, check app.json.
3. **Check BUILD_FIX_LOG.md** — the fix may already be documented from a prior session.
4. **Diagnose root cause** — don't patch symptoms. Trace the error to its source.
5. **Fix it, verify it, log it** — after fixing, run the verification command, then log the full fix to BUILD_FIX_LOG.md.
6. **Reset this file** — set Status back to 🟢 No active errors and clear the sections.

---

## Lesson from this loop (2026-05-08)

When EAS Build's "Install dependencies" phase fails with an opaque "Unknown error" via the CLI:

1. **Validate `package-lock.json` JSON FIRST**: `python3 -c "import json; json.load(open('package-lock.json'))"`
2. If invalid, regenerate: `rm package-lock.json && npm install --ignore-scripts`
3. Re-run EAS build
4. Don't guess at JS source issues until the lockfile is verified clean

`npm install --dry-run` is silently lenient about lockfile JSON corruption (it falls back to cached node_modules). `npm ci` (what EAS uses) is strict and aborts immediately. Two failed EAS builds were burned guessing before the KP-pasted log surfaced the parse error at character 112804.

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
