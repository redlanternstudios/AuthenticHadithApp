# EAS_PREVIEW_BUILD_01.md — Authentic Hadith iOS App
## First EAS Preview Build Attempt

| | |
|---|---|
| **Build URL** | https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/aa4e7b45-475c-4546-9d2f-8e52bbe3f00f |
| **Build ID** | `aa4e7b45-475c-4546-9d2f-8e52bbe3f00f` |
| **Build Status** | ❌ **errored** |
| **Profile used** | `preview` |
| **Distribution** | `internal` (simulator-only — `eas.json.build.preview.ios.simulator = true`) |
| **Commit SHA** | `6fef914990ab3ace6672b1a41f5a3920e131128d` |
| **Version** | `1.0.0` |
| **Build number** | `10` (auto-incremented from `app.json`'s `4` because EAS uses remote versioning per `eas.json.cli.appVersionSource`) |
| **Bundle ID** | `com.byred.authentichadith` |
| **SDK Version** | `54.0.0` |
| **Started at** | 2026-05-08 16:58:24 PT |
| **Finished at** | 2026-05-08 16:59:31 PT |
| **Duration** | 67 seconds (early failure) |
| **Started by** | redlantern |
| **Application Archive URL** | null (no artifact produced) |
| **Installable for real-device QA** | ❌ no — even if it had succeeded, the `preview` profile produces a simulator-only IPA |

---

## What EAS Surfaced

```
🍏 iOS build failed:
  Unknown error. See logs of the Install dependencies build phase for more information.
```

The 67-second total runtime indicates failure in the **Install dependencies** phase (the first major phase after upload). EAS does not expose detailed logs via the CLI; the logs are only viewable at the build URL.

## Pre-flight Status (verified before launch)

| Check | Result |
|---|---|
| `git status` clean (in sync with origin/main) | ✅ |
| `npx eas-cli whoami` | `redlantern / roryleesemeah@gmail.com` ✅ |
| Local `npm install --ignore-scripts --dry-run` | ✅ "up to date" — lockfile and package.json consistent |
| Local Node | v20.19.4 (Expo SDK 54-compatible) |
| Local `npx expo-doctor` | ✅ 17/17 checks passed |

So the local environment is healthy. The failure is EAS-side.

## Likely Causes (ranked)

1. **`lib/offline/sqlite-db.ts` imports a package not in `package.json`.**
   Line 1: `import * as SQLite from 'expo-sqlite'` — but `expo-sqlite` is NOT in dependencies. This is the same pre-existing TypeScript warning we've been ignoring across FIX-028 → FIX-033. On EAS, the bundle/autolinking step may fail to resolve this import.
   - Fix: either install `expo-sqlite` (`npx expo install expo-sqlite`, KP-approved) or remove/comment the file (it's clearly a dormant feature stub)
2. **`react-native-purchases` postinstall script** failing on EAS macOS workers.
   - Fix: check the build URL log for "react-native-purchases" or "postinstall" lines
3. **Expo plugin resolution failure.** A plugin in `app.json.expo.plugins` failing to load on the EAS worker. Currently registered: `expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-web-browser`. None recently changed.
4. **Locale issue on EAS workers** (similar to FIX-028 CocoaPods UTF-8). Less likely — EAS should have correct locale by default.

## Definitive Diagnosis Requires the EAS Web Log

The CLI does not expose `build:logs`. Two paths to the actual error:

**Path 1 — KP opens the build URL in a browser:**
1. Open https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/aa4e7b45-475c-4546-9d2f-8e52bbe3f00f
2. Click the "Install dependencies" phase
3. Scroll to the bottom of the log
4. Copy the last ~30-50 lines and paste them here

**Path 2 — re-run with verbose logs**:
```bash
cd /Users/kp/Projects/AuthenticHadithApp/authentichadithapp
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx eas-cli build \
  --platform ios --profile preview --non-interactive \
  --verbose-logs --build-logger-level debug
```
Then KP can paste the failure tail when it errors.

## Real-Device QA Checklist (for when build succeeds)

When the next build produces a usable IPA (preview SIM IPA OR a new device-installable profile):

For simulator IPAs (`preview` profile):
1. Drag-drop the `.app.tar.gz` onto the booted iOS simulator
2. Cold launch → home screen renders, no redbox
3. Force-quit (cmd+shift+H twice, swipe up) and relaunch — confirm Reanimated warm-relaunch finding (still pending verification)
4. Tap Badges tile → screen renders
5. Tap a Prophet/Companion story → tap Mark Complete → "✅ Completed" persists across navigation and restart
6. Tap a lesson → Mark Complete
7. Open Sunnah → confirm 7 categories + 35 practices (or live Supabase data)
8. Home → scroll to AI Summary button → tap → loading → summary or friendly fallback

For device IPAs (would require a new `internal-device` profile in `eas.json` — see prior turn):
- All of the above, plus the actual cold-launch + force-quit + relaunch behavior in production conditions, which is what answers the Reanimated warm-relaunch question definitively

## Blockers Before TestFlight

| Blocker | Owner | Status |
|---|---|---|
| **EAS preview build is failing** | Engineering — needs log inspection | 🔴 ACTIVE (this doc) |
| `expo-sqlite` orphan import | Engineering — install or remove | Likely cause of build failure |
| Apple Developer Portal IAP capability not enabled | KP — manual external | Open |
| App Store Connect product IDs unverified | KP — manual external | Open |
| RevenueCat dashboard product mapping unverified | KP — manual external | Open |
| Supabase demo review account not created | KP — manual external | Open |
| Privacy policy URL not deployed | KP — manual external | Open |
| Reanimated warm-relaunch SIGABRT (dev-only finding from VERIFY-033) | Real-device verification once IPA is available | Open |
| Preview profile is simulator-only — won't help real-device test | KP — decide whether to add `internal-device` profile to eas.json | Open |
