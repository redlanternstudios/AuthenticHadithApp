# EAS_PREVIEW_QA_02.md — Authentic Hadith iOS App
## Reanimated Warm-Relaunch Verification (FIX-036)

**QA date:** 2026-05-08
**Operator:** KP + Claude Code (Senior Release Engineer)
**Scope:** Verify that FIX-036 (Reanimated 4 → 3.18 downgrade + react-native-worklets removal) eliminates the warm-relaunch hang documented previously in `ERROR_REPORT.md` and `EAS_PREVIEW_BUILD_01.md`.

**Outcome:** ✅ **PASSED.** ERROR_REPORT.md flipped 🔴 → 🟢.

---

## Build Under Test

| | |
|---|---|
| Build ID | `809cceba-69f6-4f2d-892f-7ac0120be1af` |
| Build URL | https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/809cceba-69f6-4f2d-892f-7ac0120be1af |
| Status | FINISHED (success) |
| Profile | `preview` (simulator-only IPA per `eas.json`) |
| Distribution | `internal` |
| Git commit | `7d5d4e1f2b2cc2df213d7952e128e81fc5e83e4d` (FIX-036 follow-up — react-native-worklets removed) |
| Git branch | `main` |
| App version | `1.0.0` |
| Build number | `10` (EAS remote-versioning) |
| Bundle ID | `com.byred.authentichadith` |
| SDK Version | `54.0.0` |
| Started at | 2026-05-09T04:48:12Z |
| Finished at | 2026-05-09T04:55:38Z |
| Duration | 6 min 37 s |
| Application Archive URL | https://expo.dev/artifacts/eas/gT8Mj77TpiE437TR5xtxZ2.tar.gz |
| Project size | 19.5 MB (uploaded in 35s) |

---

## Fix Inventory in This Build

The verified build includes both FIX-036 commits:

| Commit | Change |
|---|---|
| `b0c694e` | `react-native-reanimated`: `~4.1.1` → `~3.18.0`. Installed: 3.18.2. `expo.install.exclude` added for reanimated. Removed Expo template files `components/hello-wave.tsx` and `components/parallax-scroll-view.tsx` (used Reanimated 4-only APIs). |
| `7d5d4e1` | `npm uninstall react-native-worklets@0.5.1` (Reanimated 4 peer; conflicted with Reanimated 3 internal worklets — resolved 20 duplicate symbols that aborted EAS build `3d6ba8dd`). |

The merge commit `707e0d8` (FIX-035 V1 Schema Alignment Sprint) is also in this build but does not touch native code or animation paths and is not in the warm-relaunch failure path.

---

## Test Environment

| | |
|---|---|
| Host | Keymons-MacBook-Air (KP local Mac) |
| macOS | (host-controlled) |
| Xcode | 26 (per build SDK iOS 26.0) |
| Simulator UDID | `F5384F69-2BE1-40DC-806B-B4C45F03736A` |
| Simulator device | iPhone 17 Pro |
| Simulator iOS runtime | 26.4 (build 23E244 / 23E254a) |
| Build's `MinimumOSVersion` | 15.1 — runs on iPhone 6s (2015) and newer |
| App `.app` location | `/tmp/AuthenticHadith.app` (extracted from `gT8Mj77TpiE437TR5xtxZ2.tar.gz`) |

---

## QA Sequence

### 1. Pre-flight — simulator state reset

The first install attempt failed with `FBSOpenApplicationServiceErrorDomain code=5: SpringBoard probably crashed`. Diagnosis: `xcrun simctl boot ... 2>/dev/null || true` silently swallowed a boot-failure error, then `simctl install booted` had no booted device to install into. The SpringBoard crash reports at `~/Library/Logs/DiagnosticReports/SpringBoard-2026-05-08-22:11:05.ips` and `2026-05-08-22:16:48.ips` correspond to this pre-reset state, not to the app.

Resolved by an explicit shutdown + boot cycle without `2>/dev/null` suppression:

```bash
xcrun simctl shutdown booted || true
sleep 3
xcrun simctl boot F5384F69-2BE1-40DC-806B-B4C45F03736A
open -a Simulator
sleep 10
```

After reset: `xcrun simctl list devices booted` confirmed `iPhone 17 Pro (F5384F69-2BE1-40DC-806B-B4C45F03736A) (Booted)`.

### 2. Install

```bash
xcrun simctl install booted /tmp/AuthenticHadith.app
# exit=0
```

App appeared on the simulator home screen. No install errors.

### 3. Cold launch

```bash
xcrun simctl launch booted com.byred.authentichadith
# exit=0 — returned PID 66686
xcrun simctl spawn booted launchctl list | grep -i authentichadith
# 66686  0  UIKitApplication:com.byred.authentichadith[42a3][rb-legacy]
```

KP visually confirmed:
- Splash dismissed within ~2s
- Home tab rendered with hadith content
- No redbox / yellow box / error overlay

### 4. Warm relaunch #1

```bash
xcrun simctl terminate booted com.byred.authentichadith
sleep 3
xcrun simctl launch booted com.byred.authentichadith
# exit=0 — process re-spawned (PID 66631 in KP's run, 66776 in test bench)
xcrun simctl spawn booted launchctl list | grep -i authentichadith
# UIKitApplication confirmed alive
```

KP visually confirmed:
- Splash dismissed
- Home rendered
- No black screen
- No splash hang
- No SIGABRT

### 5. Warm relaunch #2

```bash
xcrun simctl terminate booted com.byred.authentichadith
sleep 3
xcrun simctl launch booted com.byred.authentichadith
# exit=0 — process re-spawned (PID 66879 in KP's run, 66814 in test bench)
xcrun simctl spawn booted launchctl list | grep -i authentichadith
# UIKitApplication confirmed alive
```

KP visually confirmed: same clean re-launch behavior as cycle #1.

### 6. Crash report check

```bash
ls -lt ~/Library/Logs/DiagnosticReports/AuthenticHadith-* 2>/dev/null
# 2 entries, both from 2026-05-08 16:07 and 16:21 — pre-FIX-036 (Reanimated 4 era)
# 0 new entries from the 22:21+ verification window
```

No new `AuthenticHadith-*.ips` crash reports were generated during the verification window. The two existing entries are historical.

---

## Result Summary

| Test | Status | Process state | Visual state |
|---|---|---|---|
| Cold launch (post-reset) | ✅ PASS | UIKitApplication alive | Home rendered, splash dismissed |
| Warm relaunch #1 | ✅ PASS | UIKitApplication alive after terminate+relaunch | Home rendered, no splash hang |
| Warm relaunch #2 | ✅ PASS | UIKitApplication alive after second terminate+relaunch | Home rendered, no SIGABRT |
| New crash reports (window 22:21+) | 0 | n/a | n/a |

**The Reanimated warm-relaunch hang is not reproducible on build `809cceba`.** FIX-036 is verified end-to-end on simulator.

---

## What This Verification Does NOT Cover

1. **Real-device behavior.** This was simulator-only (preview profile). Real-device warm-relaunch could differ. Recommended next: add an `internal-device` EAS profile (`"internal-device": { "distribution": "internal", "ios": { "simulator": false } }` in `eas.json`) and run the same reproducer on KP's real iPhone.
2. **Older iOS runtimes.** Verified only against iOS 26.4 simulator. The build's `MinimumOSVersion` is 15.1, so a sanity test on an iOS 17 or 18 sim is recommended before App Store submission.
3. **TestFlight pipeline.** Preview profile is internal/simulator-only. A separate `production` EAS build is required for TestFlight upload.

---

## Status Updates Triggered by This Verification

| File | Change |
|---|---|
| `ERROR_REPORT.md` | 🔴 ACTIVE → 🟢 No active errors |
| `BUILD_FIX_LOG.md` | FIX-036 entry added with full verification narrative |
| `EAS_PREVIEW_QA_02.md` | This file (new) |

---

## Next Release Gates

Per `RELEASE_GAP_AUDIT.md`:

1. **Apply Supabase migration** `100-v1-schema-alignment.sql` in the dashboard (KP).
2. **Add `internal-device` EAS profile** and run a real-device build for warm-relaunch verification on physical iPhone.
3. **Apple Developer Portal:** enable In-App Purchase capability for `com.byred.authentichadith`.
4. **App Store Connect:** create the three IAP products (`ah_monthly_premium`, `ah_annual_premium`, `ah_lifetime_premium` — code-aligned convention).
5. **RevenueCat:** map products to `premium` entitlement, create offering.
6. **Supabase:** create `applereview@byredllc.com` demo account for Apple Review.
7. **Generate screenshots** + complete App Store Connect metadata.
8. **Run `production` EAS build** + `eas submit` → TestFlight.
