# EAS_PREVIEW_BUILD_01.md — Authentic Hadith iOS App
## EAS Preview Build History

## ✅ Build #3 — SUCCESS (current)

| | |
|---|---|
| **Build URL** | https://expo.dev/accounts/redlantern/projects/authentichadithapp/builds/7f408c96-a815-4de4-820d-2b3a317b7b54 |
| **Build ID** | `7f408c96-a815-4de4-820d-2b3a317b7b54` |
| **Build Status** | ✅ **finished** |
| **Profile** | `preview` (simulator-only IPA per `eas.json`) |
| **Distribution** | `internal` |
| **Commit** | `9a93dbf0fc2cdf9bead3466bc6f3ae478e717141` (lockfile regenerated) |
| **Version** | `1.0.0` |
| **Build number** | `10` (EAS remote-versioning) |
| **Bundle ID** | `com.byred.authentichadith` |
| **SDK Version** | `54.0.0` |
| **Fingerprint** | `5da28e88e4a085c3ccb85ed401b376d1cf4d8838` |
| **Started at** | 2026-05-08 17:29:46 PT |
| **Finished at** | 2026-05-08 17:40:19 PT |
| **Duration** | 10 min 33 s |
| **Application Archive URL** | https://expo.dev/artifacts/eas/gHoFdJunVtDYkm7KYv8bpf.tar.gz |
| **Installable for real-device QA** | ❌ **No — this is a SIMULATOR-only IPA.** Drag-drop the `.tar.gz` onto a booted iOS simulator to test. For real-device testing, a separate `internal-device` profile is needed (see *Next steps* below). |

## What got past the install dependencies phase

After regenerating `package-lock.json` (commit `9a93dbf`), `npm ci` parsed cleanly on EAS workers and the build proceeded through:
- Install dependencies ✅
- Prebuild ✅
- Native iOS compile (xcodebuild) ✅
- Code signing (development cert) ✅
- Archive ✅
- Total: 10:33

## How to install on the simulator

```bash
# Boot the simulator if not already booted
xcrun simctl boot F5384F69-2BE1-40DC-806B-B4C45F03736A 2>/dev/null
open -a Simulator

# Download the artifact
curl -L -o /tmp/authentichadith-preview.tar.gz \
  https://expo.dev/artifacts/eas/gHoFdJunVtDYkm7KYv8bpf.tar.gz

# Extract and install
tar -xzf /tmp/authentichadith-preview.tar.gz -C /tmp/
xcrun simctl install booted /tmp/AuthenticHadith.app

# Launch
xcrun simctl launch booted com.byred.authentichadith
```

This installs the EAS-built bundle directly — no Metro, no dev client, no warm-relaunch dev artifacts. This is the best approximation of production behavior achievable on a simulator.

## Real-Device QA Checklist (when KP later builds an internal-device profile)

For a real-device IPA, add this to `eas.json` (separate from this build):

```json
"internal-device": {
  "distribution": "internal",
  "ios": {
    "simulator": false
  }
}
```

Then `npx eas-cli build --platform ios --profile internal-device --non-interactive` produces a real-device IPA.

Real-device test priorities:
1. Cold launch — confirm home screen renders, no crash
2. **Force-quit + relaunch** — answers the open Reanimated warm-relaunch SIGABRT question (VERIFY-033)
3. Tap Badges → confirm renders
4. Complete a story → confirm persistence across navigation + app restart
5. Tap a lesson → Mark Complete
6. Open Sunnah → verify 7 categories + 35 practices (or live Supabase data)
7. Home → AI Summary on Hadith of the Moment card

## Blockers Before TestFlight (unchanged from prior status)

| Blocker | Owner | Status |
|---|---|---|
| Apple Developer Portal IAP capability | KP — manual external | Open |
| App Store Connect product IDs | KP — manual external | Open |
| RevenueCat dashboard mapping | KP — manual external | Open |
| Supabase demo review account | KP — manual external | Open |
| Privacy policy URL deployment | KP — manual external | Open |
| Reanimated warm-relaunch real-device test | KP — install + force-quit | Open |
| Internal-device EAS profile for real-device QA | KP — eas.json edit + new build | Open |

---

## ❌ Build #2 — FAILED (historical)

| | |
|---|---|
| Build ID | `3fa1f5e1-7237-4a33-8e66-e43e6a7aae8a` |
| Commit | `ac6c0ea` (orphan `lib/offline/` removed) |
| Status | errored — Install dependencies phase |
| Cause | Same lockfile corruption as Build #1 — orphan removal didn't touch package-lock.json |
| Duration | ~67s |

---

## ❌ Build #1 — FAILED (historical)

| | |
|---|---|
| Build ID | `aa4e7b45-475c-4546-9d2f-8e52bbe3f00f` |
| Commit | `6fef914` |
| Status | errored — Install dependencies phase |
| Cause | `package-lock.json` corrupted JSON (duplicate `react-native` peerDep keys, missing braces near zod entry). KP-pasted EAS log revealed the precise error: *"Expected ',' or '}' after property value in JSON at position 112804 while parsing near '...=0.65 <1.0\n        \"react-native\": \"^0...'"* |
| Fix | Build #3 (commit `9a93dbf`) — regenerated `package-lock.json` from scratch via `rm package-lock.json && npm install --ignore-scripts`. New lockfile valid JSON, 871 lines smaller. |
| Duration | ~67s |
