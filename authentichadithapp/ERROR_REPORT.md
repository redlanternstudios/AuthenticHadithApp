# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🔴 ACTIVE

### Headline
`xcodebuild` fails because Expo's slug-derived workspace `ios/AuthenticHadithApp.xcworkspace` references a non-existent `AuthenticHadithApp.xcodeproj`. The actual project is `AuthenticHadith.xcodeproj` (derived from `expo.name = "Authentic Hadith"`). The slug `authentichadithapp` is unchanged from before the rename, producing the mismatched `AuthenticHadithApp` workspace path.

### What I Ran
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx expo run:ios
```

### Full Error Output
```
› Planning build
› 0 error(s), and 0 warning(s)

CommandError: Failed to build iOS project. "xcodebuild" exited with error code 65.

Command line invocation:
    /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild
        -workspace /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/ios/AuthenticHadithApp.xcworkspace
        -configuration Debug
        -scheme AuthenticHadith
        -destination id=F5384F69-2BE1-40DC-806B-B4C45F03736A

xcodebuild: error: The workspace named "AuthenticHadithApp" does not contain a scheme named "AuthenticHadith".
            The "-list" option can be used to find the names of the schemes in the workspace.

Build logs written to /Users/kp/Projects/AuthenticHadithApp/authentichadithapp/.expo/xcodebuild.log
```

### Diagnostic Evidence

```
ios/
├── AuthenticHadith.xcodeproj/         ← actual project (correct, expo.name-derived)
├── AuthenticHadith.xcworkspace/       ← correct workspace, references AuthenticHadith.xcodeproj
└── AuthenticHadithApp.xcworkspace/    ← STALE, references AuthenticHadithApp.xcodeproj (does not exist)
    └── contents.xcworkspacedata:
        <FileRef location="group:AuthenticHadithApp.xcodeproj">  ← broken reference
```

```
app.json:
  expo.name: "Authentic Hadith"     ← drives xcodeproj name → AuthenticHadith.xcodeproj
  expo.slug: "authentichadithapp"   ← drives xcworkspace name → AuthenticHadithApp.xcworkspace
```

The previous successful `expo run:ios` (FIX-029, 2026-05-07) used `AuthenticHadith.xcworkspace` because we had just `rm -rf`'d the stale `AuthenticHadithApp.xcworkspace` and Expo's internal prebuild step did not regenerate it on that run. This run, Expo's internal prebuild DID regenerate `AuthenticHadithApp.xcworkspace` with the broken xcodeproj reference, and Expo CLI selected that slug-derived path over the correct one.

### Classification (per WORKFLOW_ROUTER.md)

**EXPO_HYBRID_LAYER**

The failure originates in Expo CLI's path-derivation logic during the internal prebuild step that runs as part of `expo run:ios`. It is not a JS/RN code issue (not VS_CODE_APP_LAYER), not a Swift/native compile issue (not XCODE_NATIVE_LAYER), and not unknown (not UNKNOWN_NEEDS_TRIAGE). The mitigation lives in Expo config or local workspace state.

### Severity

**High** — blocks every local `expo run:ios` run. Does NOT block EAS production builds (EAS CI environment has fresh `ios/` regeneration each build, so the stale workspace artifact does not persist).

### Files Involved

- `app.json` — `expo.name` vs `expo.slug` mismatch is the underlying cause
- `ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata` — broken project reference
- `ios/AuthenticHadith.xcworkspace/contents.xcworkspacedata` — correct, references AuthenticHadith.xcodeproj
- `.expo/prebuild/cached-packages.json` — Expo's internal prebuild cache (timestamp matches the broken regeneration)

### Constraints (per current KP authorization)

- Do NOT run `npx expo prebuild --clean` (would otherwise resolve everything in one shot)
- Do NOT install/upgrade packages
- Do NOT modify feature code
- Do NOT change `expo.slug` casually (slug changes affect EAS dev URL and deep linking)

### Recommended Next Safe Action (KP decides)

Three options, ordered by safety:

**Option A — Edit the broken workspace's `contents.xcworkspacedata` (lowest risk)**

The workspace file is in a gitignored directory. The edit is one line:
```bash
# Patch the stale workspace to point at the real project
sed -i '' 's|AuthenticHadithApp.xcodeproj|AuthenticHadith.xcodeproj|g' \
  ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata

# Verify
cat ios/AuthenticHadithApp.xcworkspace/contents.xcworkspacedata
# Should show: <FileRef location="group:AuthenticHadith.xcodeproj">

# Re-run
npx expo run:ios
```

Risk: Expo's internal prebuild may re-overwrite the file on a future run. If that happens, repeat the sed command. Document the recurrence in BUILD_FIX_LOG so a future session recognizes it.

**Option B — Delete the stale workspace and run again**

```bash
rm -rf ios/AuthenticHadithApp.xcworkspace
npx expo run:ios
```

Risk: Expo CLI may regenerate `AuthenticHadithApp.xcworkspace` again with the same broken content (this is what happened between FIX-029 and now). If that happens, Option A is the fallback.

**Option C — Run `npx expo prebuild --clean` (KP-approved only, currently disallowed)**

This is the only option that fixes the root cause permanently in one operation. It regenerates `ios/` from scratch, and the resulting workspace will reference the correct xcodeproj. SYSTEM_RULES Destructive Commands list flags this as KP-approval-required. KP's current authorization explicitly says no.

If KP later authorizes prebuild --clean, the path is:
```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo prebuild --clean
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 cd ios && pod install --repo-update && cd ..
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
```

**Option D — Permanent fix via slug change (high risk)**

Change `expo.slug` from `authentichadithapp` to `AuthenticHadith` in `app.json`. This aligns the slug with `expo.name` so Expo's path derivation produces consistent workspace + xcodeproj names. Side effects: changes the Expo dev URL (`exp://exp.host/@owner/<slug>`) which can affect deep linking and EAS metadata. Not recommended without further analysis. EAS project linkage is by `eas.projectId` UUID, so EAS itself would not break, but other tooling that reads slug might.

### Build State After Failure

- `ios/Pods/`, `ios/Podfile.lock`, `ios/AuthenticHadith.xcworkspace/` — intact, correct
- `ios/AuthenticHadithApp.xcworkspace/` — present, broken
- DerivedData app bundle from FIX-029 — still installed on simulator F5384F69-2BE1-40DC-806B-B4C45F03736A
- Working tree — clean (no commits made for this failure beyond ERROR_REPORT.md)
- Stash `stash@{0}` — preserved, untouched

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. Read this file FIRST.
2. Confirm the workspace mismatch still exists: `ls ios/*.xcworkspace`
3. If KP has approved Option A, run the sed command and re-run `expo run:ios`.
4. If KP has approved Option C, run prebuild --clean per the playbook (UTF-8 locale set first).
5. After successful build, log the resolution to BUILD_FIX_LOG.md as the next FIX ID and reset this file's status to 🟢.
