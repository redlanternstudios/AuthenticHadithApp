# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟡 ROOT CAUSE FOUND, FIX APPLIED — 3rd EAS build queued

### Root cause (confirmed from KP-pasted EAS log)

`package-lock.json` was corrupted JSON. The EAS log showed:
```
npm verbose shrinkwrap failed to load package-lock.json
Expected ',' or '}' after property value in JSON at position 112804
while parsing near "...=0.65 <1.0\"\n        \"react-native\": \"^0...."
```

Local inspection confirmed at least TWO corruption sites:
1. **char 112804** — duplicate `"react-native"` peer dep in `node_modules/@react-native-async-storage/async-storage` with no comma between them
2. **char 532824** — missing `}` and `,` between `peerDependenciesMeta` block and `"node_modules/zod"` entry

`npm install --dry-run` had been silently lenient about this corruption locally (because it could fall back to cached node_modules). `npm ci` (which EAS uses) is strict and fails immediately.

### Fix applied

Regenerated the lockfile from scratch:
```bash
rm package-lock.json
npm install --ignore-scripts
```

Result:
- 14,311 lines → 13,440 lines (corruption was bloating it with duplicate entries)
- `python3 -c "import json; json.load(...)"` → ✅ valid JSON
- TypeScript clean (0 errors)
- expo-doctor 17/17 passed
- **`npm ci` replay in a sandbox dir installed 639 packages cleanly** — exactly what EAS will run

### Original failures (preserved)

| # | Build ID | Commit | Outcome | Cause |
|---|---|---|---|---|
| 1 | aa4e7b45-475c-4546-9d2f-8e52bbe3f00f | 6fef914 | ❌ Install dependencies | Corrupted lockfile |
| 2 | 3fa1f5e1-7237-4a33-8e66-e43e6a7aae8a | ac6c0ea | ❌ Install dependencies | Same corrupted lockfile (orphan-removal didn't touch it) |
| 3 | (pending) | (post-fix) | (pending) | Should succeed |

### Why we missed it earlier

The orphan-`expo-sqlite` hypothesis seemed compelling because of the long-standing TS warning. It was the wrong hypothesis. The actual cause was lockfile JSON corruption that `npm install --dry-run` silently tolerated. Lesson: when EAS install dependencies fails, **the corruption is almost always in `package-lock.json` or `package.json`**, not in JS source. Validate JSON first.

### Headline (UPDATED)

Build #2 (`3fa1f5e1-7237-4a33-8e66-e43e6a7aae8a`, commit `ac6c0ea`) errored with the SAME generic "Unknown error in Install dependencies build phase" as Build #1 (`aa4e7b45-...`, commit `6fef914`). Removing the orphan `lib/offline/` directory (which had the `expo-sqlite` import that wasn't in package.json) did NOT change the outcome.

`--verbose-logs --build-logger-level debug` flags do NOT surface additional detail in CLI output — they only affect what EAS records server-side for the web log viewer.

**STOPPED retrying.** Two builds consumed without diagnostic ground truth. Continuing without the actual error log would be guessing.

### Required from KP — the only path forward

Open the build URL in a browser and paste the actual error from the **Install dependencies** phase:

→ https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/3fa1f5e1-7237-4a33-8e66-e43e6a7aae8a

1. Click the red "Install dependencies" phase to expand
2. Scroll to the bottom of that phase's log
3. Copy the last 30-50 lines (the failure tail)
4. Paste in next message

With that text we can fix the root cause in one pass. Without it we're burning EAS build credits guessing.

### What's been ruled out
- Lockfile drift (local `npm install --dry-run` says "up to date")
- TS errors (`tsc --noEmit` clean after orphan removal)
- expo-doctor (17/17 passed both before and after orphan removal)
- Auth (eas-cli whoami → redlantern, working)
- Orphan `expo-sqlite` import (REMOVED in commit `ac6c0ea`, build still fails)

### What's still possible
- `react-native-purchases` postinstall script failing on EAS macOS workers
- A specific package version conflict EAS resolves differently
- An Expo plugin failing to load on the EAS worker
- Memory/disk constraint on the EAS worker
- A bug in EAS itself (rare but happens)

### Builds attempted
| # | Build ID | Commit | Outcome | Duration |
|---|---|---|---|---|
| 1 | aa4e7b45-475c-4546-9d2f-8e52bbe3f00f | 6fef914 | ❌ Install dependencies failure | 67s |
| 2 | 3fa1f5e1-7237-4a33-8e66-e43e6a7aae8a | ac6c0ea | ❌ Install dependencies failure | similar |

---

## ORIGINAL FAILURE (preserved for next session context)

**Build:** aa4e7b45-475c-4546-9d2f-8e52bbe3f00f
**Status was**: 🔴 ACTIVE — EAS preview iOS build failing in "Install dependencies" phase

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
