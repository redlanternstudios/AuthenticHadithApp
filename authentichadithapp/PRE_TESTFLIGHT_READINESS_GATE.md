# PRE_TESTFLIGHT_READINESS_GATE.md — Authentic Hadith iOS App

## Purpose

This is the pre-TestFlight readiness gate. Before any `eas build --profile production` (App Store) or any internal-device build handed to a real-device QA tester (RoPhone, KP's iPhone, anyone outside this repo), every item below must be confirmed in writing. The gate exists because the failures that have shipped in past builds — empty env vars (FIX-040), stale build numbers, drifted RevenueCat config (FIX-006), warm-relaunch hangs (FIX-036), broken backend routes (ERROR_REPORT 🔴) — were all individually invisible to local tooling. A green `tsc --noEmit` and a green `expo-doctor` do **not** prove the .ipa will launch.

This gate is owned by KP. Claude Code may run the checks and report the result; Claude Code may not unilaterally declare a build "ready" without an explicit KP signoff.

---

## Lessons (Permanent — read before every build)

### Lesson #1 — EAS build profiles do not implicitly inherit a named EAS Environment

Source: FIX-040 (2026-05-18).

EAS Build binds a profile to a named EAS Environment in one of two ways:
1. The profile name is exactly `development`, `preview`, or `production`. EAS matches by name.
2. The profile declares `"environment": "<name>"` explicitly inside the profile block in `eas.json`.

Any other profile name (`internal-device`, `qa-*`, `staging-*`, anything custom) with no `environment` field resolves to **no named environment**, which means every `EXPO_PUBLIC_*` value stored as an EAS Environment Variable is **empty at build time**. The .ipa builds successfully and then crashes on launch — no warning, no failed build, no `expo-doctor` flag.

**Gate**: every non-standard profile in `eas.json` MUST declare `environment` explicitly. Internal-device builds are pinned to `production` so QA exercises the same runtime surface as App Review.

**Side effect** of pinning internal-device to `production`: those builds now talk to **production Supabase** and **production RevenueCat**. QA must use the Apple review demo account or dedicated QA Supabase users. Any RevenueCat purchase made from a QA build is a real production purchase and must be refunded. This trade-off is intentional but must be communicated with every internal-device .ipa handed to a tester.

### Lesson #2 — Major version downgrades leave abandoned peers

Source: FIX-036 (2026-05-08).

Downgrading Reanimated 4 → 3 left `react-native-worklets` (a Reanimated 4-only peer) installed, which produced 20 duplicate-symbol linker errors on the next EAS build. Major-version downgrades of native modules require an explicit "what peers did the new version add that the old version doesn't need?" audit before the next build.

### Lesson #3 — Out-of-repo backend routes can break the app without any mobile-code change

Source: FIX-037 / ERROR_REPORT 🔴.

`/api/mobile-chat` returning HTTP 404 on the deployed Vercel host crippled three mobile features (AI Summary on Home, AI Summary on hadith detail, Assistant tab). No mobile code change can fix that — restoration is a web-deploy problem. The mobile lane's responsibility is bounded: validate the URL, validate the payload shape, validate the friendly fallback. Do not pursue backend route restoration from the mobile lane.

---

## Gate Checklist

Every item must be ✅ before a build is handed to QA or submitted to App Review. A single ⚠️ blocks the build.

### 1. EAS Profile Environment Binding (FIX-040)

- [ ] Open `authentichadithapp/eas.json`. For the profile about to be built, confirm one of:
  - Profile name is exactly `development`, `preview`, or `production`, **OR**
  - Profile block declares `"environment": "<name>"` pointing to a real, populated EAS Environment.
- [ ] Open the EAS dashboard → Environment Variables → `<name>` environment. Confirm all six `EXPO_PUBLIC_*` values listed in `app.config.js` are present and non-empty:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_APP_ENV`
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
  - `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- [ ] After build starts, open the EAS build's "Environment variables" panel in the dashboard and visually confirm the same six values are listed for this build. If the panel is empty, abort and re-check the `environment` field.

### 2. Build Number / Version Hygiene

- [ ] `app.json` `ios.buildNumber` is monotonically greater than the highest build number in App Store Connect for this version. (See FIX-008.)
- [ ] If this is a TestFlight upload, `production` profile in `eas.json` has `"autoIncrement": true` (already set).
- [ ] If this is an internal-device build, the build number does not have to advance, but record the resolved value in the QA handoff note.

### 3. Dependency Stack Sanity

- [ ] `package-lock.json` is valid JSON: `node -e "JSON.parse(require('fs').readFileSync('authentichadithapp/package-lock.json','utf8'))"` exits 0. (Rule 031, FIX-034.)
- [ ] `npx expo-doctor` from `authentichadithapp/` is 17/17 green.
- [ ] `npx tsc --noEmit` from `authentichadithapp/` is 0 errors.
- [ ] No major-version downgrade has happened in this branch without a peer-cleanup audit (Lesson #2, FIX-036).

### 4. Native Module Lifecycle

- [ ] Reanimated version in `package.json` is `~3.18.x`. (Do **not** upgrade to 4 without a full warm-relaunch verification — FIX-036.)
- [ ] `react-native-worklets` is **not** listed in `dependencies` (FIX-036 follow-up).
- [ ] RevenueCat config lives only in `lib/revenuecat/config.ts`. No hardcoded API keys anywhere else (Rule from FIX-006).

### 5. Runtime Smoke (Simulator)

- [ ] On a freshly booted simulator: cold launch, warm relaunch #1, warm relaunch #2 all reach the Home tab with no SIGABRT and no splash hang (matches FIX-036 verification protocol).
- [ ] No new `AuthenticHadith-*.ips` crash reports appear in `~/Library/Logs/DiagnosticReports/` during the verification window.
- [ ] Home tab shows the live production hadith count (currently `31,886` — FIX-037). If it shows a stale hardcode, that is a content-audit blocker but does not block App Review.

### 6. Backend Reachability (Mobile-Lane Bounds)

- [ ] `curl -sS https://www.authentichadith.app/api/mobile-chat -X POST -H "content-type: application/json" -d '{}'` returns JSON (not HTML 404). If it returns 404, ERROR_REPORT.md is still 🔴 and AI Summary will fall back to the friendly inline error block (FIX-037). This blocks AI Summary functional QA but does **not** block App Review — the friendly fallback is the user-visible path.
- [ ] Document the current state of the `/api/mobile-chat` route in the QA handoff so the tester does not flag the friendly fallback as a regression.

### 7. QA Handoff Note (for internal-device builds only)

When handing a build to a tester, the handoff message must include:
- Build profile used (`internal-device` or otherwise) and the EAS Environment it was pinned to.
- A reminder that the build talks to **production Supabase** and **production RevenueCat** if pinned to `production` (Lesson #1).
- The Apple review demo account credentials or the dedicated QA Supabase user account — **never** a real KP / Rory / family account.
- The current state of any 🔴 ACTIVE entries in `ERROR_REPORT.md` so the tester knows what is a known issue vs. a fresh regression.

### 8. Documentation Closure

After the build is uploaded:
- [ ] `BUILD_FIX_LOG.md` has an entry for any new fix that went into this build (Rule from CLAUDE.md's mandatory documentation protocol).
- [ ] `ERROR_REPORT.md` reflects the current state — flipped to 🟢 only when the underlying bug is verified resolved, not when the fix is merely deployed.
- [ ] `APP_LAUNCH_PLAYBOOK.md` is updated if the build/launch process itself changed.

---

## Gate Status Template

Copy this block into the build's handoff note (Notion / chat / wherever the tester reads it):

```
PRE_TESTFLIGHT_READINESS_GATE — Build <buildId>
Profile: <profile-name>
EAS Environment: <production | preview | other>
EXPO_PUBLIC_* surface (from EAS dashboard): <count>/6 populated
Build number: <ios.buildNumber>
expo-doctor: <pass | fail>
tsc --noEmit: <pass | fail>
Warm-relaunch smoke (3 cycles): <pass | fail>
/api/mobile-chat reachability: <200 | 404 | other>
Active ERROR_REPORT entries: <none | summary>
QA account to use: <demo-account-id>
Signoff: KP / <date>
```

A build with any line not signed off does not go to a tester.

---

## Maintenance

Add a new lesson to the "Lessons" section above whenever a BUILD_FIX_LOG entry surfaces a class of failure that this gate did not catch. Treat every new lesson as load-bearing: the gate exists to prevent the next instance of the bug we just fixed.
