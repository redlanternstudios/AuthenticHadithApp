# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟡 PROBABLE FIX APPLIED — re-run EAS preview build to confirm

> Removed orphan `lib/offline/` directory (sqlite-db.ts + sync-manager.ts) that imported the un-installed `expo-sqlite` package. Was the strongest hypothesis for the build failure. TypeScript now clean (0 errors), expo-doctor 17/17 passes. Awaiting re-run with `--verbose-logs` to either confirm the fix or surface the next layer.

---

## ORIGINAL FAILURE (preserved for next session context)

**Build:** aa4e7b45-475c-4546-9d2f-8e52bbe3f00f
**Status was**: 🔴 ACTIVE — EAS preview iOS build failing in "Install dependencies" phase

### Headline
First EAS preview iOS build (`aa4e7b45-475c-4546-9d2f-8e52bbe3f00f`) errored after 67 seconds in the **Install dependencies** phase. EAS only surfaces a generic "Unknown error" via the CLI; detailed logs are only available at the build URL in a browser.

### What I Ran
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build --platform ios --profile preview --non-interactive
```

### Build Identity
- **Build URL:** https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/aa4e7b45-475c-4546-9d2f-8e52bbe3f00f
- **Profile:** `preview` (simulator-only output: `eas.json.build.preview.ios.simulator = true`)
- **Commit:** `6fef914990ab3ace6672b1a41f5a3920e131128d`
- **Version 1.0.0 / Build 10** (auto-incremented by EAS remote versioning)
- **SDK 54.0.0**

### Pre-flight that Passed
- `git status` clean, in sync with origin/main
- `npx eas-cli whoami` → `redlantern`
- `npm install --dry-run` → "up to date"
- Local Node v20.19.4
- `npx expo-doctor` → 17/17 checks passed

### Most Likely Root Cause
`lib/offline/sqlite-db.ts:1` imports `expo-sqlite`, but `expo-sqlite` is NOT in `package.json` dependencies. This has been the pre-existing TypeScript warning since FIX-028 across multiple sessions (`error TS2307: Cannot find module 'expo-sqlite'`). EAS install/autolink/bundle resolves all imports during the install dependencies phase — a missing module would error there.

Other candidates (less likely):
- `react-native-purchases` postinstall failure
- Expo plugin resolution failure
- EAS macOS worker locale issue (similar to FIX-028)

### Classification (per WORKFLOW_ROUTER.md)

**EXPO_HYBRID_LAYER** — config / dependency issue affecting the EAS Build pipeline. Not a JS runtime issue (not VS_CODE_APP_LAYER), not native compile (not XCODE_NATIVE_LAYER), and not unknown.

### Severity

**Critical** — blocks every IPA build (preview, production) until resolved. Does NOT block local `expo start --dev-client` or `expo run:ios` — those use Metro and don't fail on the missing import in the same way.

### Files Possibly Involved
- `lib/offline/sqlite-db.ts` — imports unresolved package
- `package.json` — missing `expo-sqlite` dependency
- `package-lock.json` — would need updating if package added

### Constraints
- Do not install packages without KP approval (per current task spec)
- Do not run prebuild
- Do not modify feature code unless confirmed blocker

### Recommended Next Safe Actions (KP decides)

**Option A — paste the EAS build log so we have ground truth:**
1. Open https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/aa4e7b45-475c-4546-9d2f-8e52bbe3f00f
2. Click the "Install dependencies" phase
3. Copy the last ~30-50 lines of the log
4. Paste here so the next session can fix the actual root cause, not the suspected one

**Option B — install `expo-sqlite` (if KP wants the offline feature alive):**
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo install expo-sqlite
```
Then re-run the EAS build. Adds a real package dependency. ~2 MB native module.

**Option C — remove the dormant `lib/offline/sqlite-db.ts` import (if KP doesn't want offline yet):**
Either delete the file or comment out the import. Removes a known TS error and likely the EAS install failure. Lowest-risk path.

**Option D — re-run with verbose logging** to expose the failure in the CLI output:
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build \
  --platform ios --profile preview --non-interactive \
  --verbose-logs --build-logger-level debug
```

### State After Failure
- No artifact produced (Application Archive URL is null)
- No EAS credit fully consumed (failed builds typically don't count, but check expo.dev billing)
- Git clean, working tree unchanged
- Stash `stash@{0}` preserved
- `EAS_PREVIEW_BUILD_01.md` documents the attempt

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. **Read this file FIRST.**
2. If KP has pasted the EAS build log: parse it, identify the exact failure line, fix it surgically.
3. If not, recommend Option A (paste the log) or Option C (remove the orphan import).
4. Do NOT install packages without explicit KP approval.
5. Do NOT retry the EAS build until the root cause is identified — wastes time.
6. After fix is applied: re-run EAS build with `--verbose-logs` so the next failure (if any) is visible in the CLI.
7. Reset this file to 🟢 once the next EAS build succeeds.
