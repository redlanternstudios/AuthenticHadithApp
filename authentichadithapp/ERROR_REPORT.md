# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🔴 ACTIVE — CRITICAL: App hangs on warm-relaunch (Reanimated 4 + New Architecture + Hermes)

### Headline

The EAS preview iOS build (`7f408c96-a815-4de4-820d-2b3a317b7b54`, commit `9a93dbf`) **installs and first-launches successfully** but **silently hangs on every subsequent launch**. The dark splash screen never dismisses and the JS bundle never finishes initializing.

This is the production-bundle manifestation of the Reanimated warm-relaunch issue first surfaced in VERIFY-033 (where dev-client mode showed it as a SIGABRT in `[ReanimatedModule installTurboModule]`). Same root cause; production builds don't have assertion crashes so it presents as a silent hang instead.

**This is a ship blocker.** Real users would experience: app works on first install → force-quit (or device sleep) → relaunch → app stuck on splash forever. App Store review would catch this within 30 seconds of opening the app twice.

### Reproduction (100%)

```bash
# 1. Boot simulator
xcrun simctl boot F5384F69-2BE1-40DC-806B-B4C45F03736A
open -a Simulator

# 2. Install fresh
xcrun simctl install booted /tmp/AuthenticHadith.app
xcrun simctl launch booted com.byred.authentichadith
# → first launch: tab bar renders, content loads, briefly visible

# 3. Terminate
xcrun simctl terminate booted com.byred.authentichadith
sleep 2

# 4. Relaunch
xcrun simctl launch booted com.byred.authentichadith
# → HANG: black screen, spinner, no tab bar, no content. Indefinite.
```

### What was verified

- App process alive (PID 42589) — not crashed
- No iOS DiagnosticReport crash dump generated
- No React `ErrorBoundary` fallback shown (would display "⚠️ Something went wrong" — confirmed not on screen)
- No JS / Hermes / RCTBridge errors in `xcrun simctl spawn booted log show`
- Only benign `BoardServices XPCErrors Connection interrupted` and `RunningBoard Memorystatus` simulator-level messages
- First launch DID render the bottom tab bar (Home/Today/Coll.../Search/My H.../Learn/Assis.../Profile) — proves the bundle, providers, and Expo Router all initialized once
- Splash background showing is `#000000` (the `dark` variant of our splash config in app.json), even though `simctl ui booted appearance` reports `light` — likely an Expo splash quirk where iOS picks the dark variant for some reason on warm-relaunch

### Root cause hypothesis

Reanimated 4.1.1 + New Architecture (`RCTNewArchEnabled = true`) + Hermes JS engine has a known issue where module-init / TurboModule installation in a JS context that's been seen before by the same OS process leaves state that prevents fresh re-init. Same bug class as VERIFY-033 dev-client `[ReanimatedModule installTurboModule] +__assert_rtn` SIGABRT — but in production where asserts are stripped, the code instead deadlocks waiting on a pre-existing state.

iOS doesn't kill our process between simulator app terminations the way it would kill a real-device app on memory pressure, which is why this manifests so consistently in the simulator. **Real-device behavior may differ** — but until verified, must be treated as a 100% blocker.

### Build identity (the build that has this issue)

| | |
|---|---|
| Build URL | https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/7f408c96-a815-4de4-820d-2b3a317b7b54 |
| Build ID | `7f408c96-a815-4de4-820d-2b3a317b7b54` |
| Commit | `9a93dbf` |
| Bundle | `https://expo.dev/artifacts/eas/gHoFdJunVtDYkm7KYv8bpf.tar.gz` (33 MB tar.gz) |
| Profile | `preview` (simulator-only) |
| Reanimated version | `~4.1.1` per package.json |
| New Architecture | enabled (`RCTNewArchEnabled = true` in pbxproj from prebuild) |
| Hermes | enabled per `Podfile.properties.json` |

### Classification (per WORKFLOW_ROUTER.md)

**EXPO_HYBRID_LAYER** — config + native module interaction. Fix lives in either `package.json` (downgrade reanimated) or `app.json`/native config (disable new arch).

### Severity

**Critical** — blocks every TestFlight/App Store submission. App Store reviewers will hit this on their second launch. 100% reproducible in simulator.

### Recommended fix paths (KP picks one)

**Option A — Downgrade `react-native-reanimated` to 3.18.x (recommended).**
Reanimated 3.x is stable across both old and new architectures, doesn't have this warm-relaunch issue, and is what most production Expo apps ship with as of this date.

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo install react-native-reanimated@~3.18.0
# Verify lockfile valid
python3 -c "import json; json.load(open('package-lock.json'))"
git diff package.json package-lock.json
git commit -am "fix: downgrade react-native-reanimated to 3.x to resolve warm-relaunch hang"
git push
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build --platform ios --profile preview --non-interactive
```

Risk: any code using Reanimated 4-only APIs would break. Likely none in this codebase given how recently we started — verify by `grep -rln "react-native-reanimated" --include="*.ts*" lib/ app/ components/ hooks/ | xargs grep -l "useAnimatedProps\|useDerivedValue\|withSpring"` and check for v4-only patterns.

**Option B — Disable New Architecture in Expo config.**
```json
// app.json — add under expo:
"newArchEnabled": false
```
Or in `app.json.expo.plugins`, configure `expo-build-properties` (would require installing it first) with `ios.newArchEnabled: false`.

Risk: forfeits Fabric / TurboModules performance. Some Expo SDK 54 packages may not work as well. Reanimated 4 is designed for new arch — could surface different bugs.

**Option C — Verify on real device first, then decide.**
Add an `internal-device` profile to `eas.json`, build, install on KP's real iPhone via TestFlight or QR. If real-device cold-launch + force-quit + relaunch all work cleanly, the simulator issue is sim-specific and we can ship. If real-device shows the same hang, it's confirmed and we MUST fix per Option A or B before submission.

### What's been ruled out

- App crashing (process stays alive PID 42589, no DiagnosticReport)
- ErrorBoundary catch (its fallback UI is not what's on screen)
- Bundle/JS errors (logs are clean of RN/Hermes/RCTBridge errors)
- Network issue (the prior screenshots showed home actually loaded once)
- macOS Automation/Accessibility permission (not relevant to this — simctl install/launch don't need them)

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. **Read this file FIRST.**
2. The status is 🔴 ACTIVE with a clear reproducer.
3. Pick Option A, B, or C based on KP's instruction.
4. After fix is applied + new build succeeds + warm-relaunch verified clean: reset this file to 🟢.
5. Do NOT install packages without explicit KP approval — Option A requires `expo install react-native-reanimated@~3.18.0` which changes a major dependency.
