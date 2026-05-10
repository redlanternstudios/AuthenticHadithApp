# Project Playbook

## Purpose

This file is the universal operating playbook for this project.

Claude Code must reference this file during every session after reading:

1. `PROJECT_CONTEXT.md`
2. `ERROR_REPORT.md`
3. `BUILD_FIX_LOG.md`
4. `SYSTEM_RULES.md`

This file defines how to safely run, build, test, debug, deploy, and maintain this project.

Claude Code must not treat this file as optional project documentation. This is an operating standard.

---

## Relationship to Existing Playbooks

This repo already contains `APP_LAUNCH_PLAYBOOK.md`, which is the deep, project-specific build/launch reference for the Authentic Hadith iOS app.

`PROJECT_PLAYBOOK.md` (this file) is the universal operating standard that applies across KP’s repos. It points at the project-specific playbook for detailed iOS build steps.

- Use `PROJECT_PLAYBOOK.md` for: identity, tech stack summary, startup review, layer routing summary, safety/approval gates, debugging protocol, memory update rules, multi-LLM handoff summary.
- Use `APP_LAUNCH_PLAYBOOK.md` for: full local dev setup, EAS build flows, TestFlight/App Store submission, prebuild rules, build profile detail.
- Use `WORKFLOW_ROUTER.md` for: classifying a problem before any fix.

If the two playbooks ever conflict, `APP_LAUNCH_PLAYBOOK.md` wins for iOS build/release detail and `PROJECT_PLAYBOOK.md` wins for cross-cutting operating rules. Reconcile and update both.

---

## Project Identity

**Project Name:** Authentic Hadith (slug: `authentichadithapp`) — verified in `app.json` and `package.json`.

**Project Owner:** KP / Keymon Penn unless `PROJECT_CONTEXT.md` says otherwise.

**Project Type:** iOS-first cross-platform mobile app (Expo / React Native, also targets Android and web per `package.json` scripts).

**Bundle Identifier:** `com.byred.authentichadith` (verified in `app.json`).

**EAS Project ID:** `66afcbbf-55c3-48fb-9bf1-29efc52d09eb` (verified in `app.json`).

**App Store Connect App ID:** `6764673665` (verified in `eas.json` submit profile).

**Primary Goal:** Provide a trustworthy Islamic mobile app experience centered on authentic hadith access, study, and user engagement. Source: `PROJECT_CONTEXT.md`.

**Current Status:** Read `ERROR_REPORT.md` at session start. If 🔴 ACTIVE, that issue is the priority.

**Business / Product Context:** Authentic Hadith is Rory's product unless KP explicitly states otherwise. Not owned by Penn Enterprises LLC by default. KP is acting as AI operator, technical orchestrator, and launch execution support. Current phase is setup, stabilization, and iOS launch pipeline. Source: `PROJECT_CONTEXT.md`.

---

## Tech Stack

Document only what is visible in the repo. Versions taken from `package.json`.

| Layer | Tool / Framework / Service | Version / Notes |
|---|---|---|
| Frontend (UI) | React + React Native | React 19.1.0, React Native 0.81.5 |
| Mobile framework | Expo SDK | ~54.0.34 |
| Routing | Expo Router | ~6.0.23 (file-based, `app/` directory) |
| State / data | Zustand, TanStack React Query | Zustand 5.0.2, React Query 5.62.11 |
| Database | Supabase | @supabase/supabase-js 2.48.1 (migrations in `supabase/migrations/`) |
| Auth | Supabase auth + Expo Secure Store | expo-secure-store 15.0.8 |
| Payments | RevenueCat | react-native-purchases 9.9.0, react-native-purchases-ui 9.9.0 |
| AI / LLM | Vercel AI SDK + Groq provider | ai 4.3.19, @ai-sdk/groq 1.2.9 |
| i18n | i18next + react-i18next | i18next 23.16.8, react-i18next 14.1.3 |
| Native UI | React Navigation, Reanimated, Gesture Handler, Safe Area, Screens, SVG, QR | Versions per `package.json` |
| Tooling | TypeScript, ESLint (eslint-config-expo) | TypeScript ~5.9.2, ESLint 9.25.0 |
| Build pipeline | EAS Build | CLI `>= 16.0.0`, profiles: development, preview, internal-device, production |
| Submit pipeline | EAS Submit | iOS App Store ASC App ID `6764673665` |
| Package Manager | npm | `package-lock.json` present |

Notes:
- `react-native-reanimated` is excluded from Expo install upgrade per `package.json` `expo.install.exclude`.
- Web target uses Metro bundler (`app.json.web.bundler = "metro"`).

Do not guess versions beyond what is in the repo.

---

## Standard Startup Review

Before modifying code, Claude Code must review:

1. `CLAUDE.md`
2. `PROJECT_CONTEXT.md`
3. `ERROR_REPORT.md`
4. `BUILD_FIX_LOG.md`
5. `SYSTEM_RULES.md`
6. `PROJECT_PLAYBOOK.md`
7. `AI_OPERATOR_HANDOFF_PROTOCOL.md`
8. `CURRENT_MODEL_ASSIGNMENTS.md`
9. `WORKFLOW_ROUTER.md`

`MODEL_AUDIT_LOG.md` is required only when reviewing, changing, or questioning model/tool assignments.

`APP_LAUNCH_PLAYBOOK.md` is required reading whenever the task touches local dev setup, EAS Build, prebuild, TestFlight, or App Store submission.

---

## Workflow Layer Classification

Before touching files, classify the task using `WORKFLOW_ROUTER.md`. The layers below mirror that file exactly.

| Layer | Meaning | Typical Files / Areas | Default Operator |
|---|---|---|---|
| `VS_CODE_APP_LAYER` | App-level JS/TS, UI, theming, routing, Supabase queries, RevenueCat logic, AI calls | `app/`, `components/`, `hooks/`, `lib/`, `constants/`, `types/`, `supabase/`, `package.json`, `tsconfig.json` | Claude Code in VS Code |
| `EXPO_HYBRID_LAYER` | Expo config that affects native output, plugins, permissions, native dependency adds | `app.json`, `app.config.js`, `eas.json`, plugin sections, package adds with native code | Claude Code in VS Code → Expo CLI / EAS |
| `XCODE_NATIVE_LAYER` | Provisioning, signing, archive, pods, Swift/ObjC, entitlements, native crashes | `ios/` (generated), Xcode workspace, Apple Developer portal | Xcode / EAS Build, KP approval for any edit |
| `UNKNOWN_NEEDS_TRIAGE` | Issue cannot be safely classified yet | Any unclear issue | Claude Code must inspect logs and history before risky changes; ask KP if classification stays unknown |

`WORKFLOW_ROUTER.md` is authoritative. If it changes, mirror updates here.

---

## Local Development

Commands taken only from `package.json` scripts and `APP_LAUNCH_PLAYBOOK.md`.

| Action | Command | Source |
|---|---|---|
| Install dependencies | `npm install` | `package-lock.json` (npm), `APP_LAUNCH_PLAYBOOK.md` |
| Start dev server (Metro) | `npx expo start -c` | `APP_LAUNCH_PLAYBOOK.md`, `WORKFLOW_ROUTER.md` |
| Start (no cache clear) | `npm run start` (`expo start`) | `package.json` scripts |
| Run iOS | `npm run ios` (`expo run:ios`) | `package.json` scripts |
| Run Android | `npm run android` (`expo run:android`) | `package.json` scripts |
| Run web | `npm run web` (`expo start --web`) | `package.json` scripts |
| Lint | `npm run lint` (`expo lint`) | `package.json` scripts |
| Typecheck | `npx tsc --noEmit` | `WORKFLOW_ROUTER.md` Section 6 |
| Health check | `npx expo doctor` | `APP_LAUNCH_PLAYBOOK.md`, `WORKFLOW_ROUTER.md` |
| Build (cloud) | `npx eas build --platform ios --profile <preview|production|internal-device|development>` | `eas.json`, `APP_LAUNCH_PLAYBOOK.md` |
| Reset project (DESTRUCTIVE — ask KP) | `npm run reset-project` (`node ./scripts/reset-project.js`) | `package.json` scripts |

Do not create new scripts without KP approval.

---

## Build Process

Source: `APP_LAUNCH_PLAYBOOK.md`, `WORKFLOW_ROUTER.md`, `eas.json`.

### Safe Build Steps

1. Confirm working directory: `/Users/kp/Projects/AuthenticHadithApp/authentichadithapp`.
2. Verify `ERROR_REPORT.md` is 🟢 before starting a release build.
3. Run `npx tsc --noEmit` — clean.
4. Run `npx expo doctor` — clean.
5. For App Store uploads, increment `ios.buildNumber` in `app.json` (production profile in `eas.json` also has `autoIncrement: true`).
6. Run the appropriate EAS profile:
   - Internal sim test: `npx eas build --platform ios --profile preview`
   - Internal device test: `npx eas build --platform ios --profile internal-device`
   - Production / TestFlight / App Store: `npx eas build --platform ios --profile production`
7. Submit when ready: `npx eas submit --platform ios` (ASC App ID `6764673665`).

### Build Verification

1. EAS build log shows success.
2. Build installs on simulator or device per profile distribution.
3. Smoke test golden paths (auth, navigation, Supabase data, RevenueCat paywall, AI request).
4. Pre-submission gates from `APP_LAUNCH_PLAYBOOK.md` Section 5: green `ERROR_REPORT`, clean `tsc --noEmit`, clean `expo doctor`, build number incremented, console statement audit, orphan route audit.

### Build Failure Protocol

1. Stop and read `ERROR_REPORT.md`.
2. Search `BUILD_FIX_LOG.md` for matching errors.
3. Check `SYSTEM_RULES.md` for permanent rules.
4. Classify the issue with `WORKFLOW_ROUTER.md`.
5. Apply the smallest safe fix.
6. Verify the fix with the layer-appropriate verification (see Verification Rules in `WORKFLOW_ROUTER.md`).
7. Update project memory per the Project Memory Update Rules below.

---

## Testing Protocol

### Test Commands

| Test Type | Command | Source |
|---|---|---|
| Unit tests | UNKNOWN — no script found | `package.json` has no `test` script |
| Integration tests | UNKNOWN — no script found | `package.json` has no `test` script |
| E2E tests | UNKNOWN — no script found | `package.json` has no `test` script |
| Lint | `npm run lint` (`expo lint`) | `package.json` |
| Typecheck | `npx tsc --noEmit` | `WORKFLOW_ROUTER.md` |
| Health check | `npx expo doctor` | `APP_LAUNCH_PLAYBOOK.md` |
| Manual QA | Real device + simulator smoke tests; see `REAL_DEVICE_QA_SWEEP_01.md`, `RUNTIME_SMOKE_TEST_01.md`, `EAS_PREVIEW_QA_02.md` | Repo QA docs |

### If No Tests Exist

No automated test command is configured. Claude Code must rely on:

1. `npx tsc --noEmit` for type-level verification.
2. `expo lint` for static lint checks.
3. `expo doctor` for SDK health.
4. Manual QA documents in repo root.
5. EAS preview / internal-device builds for runtime verification.

Do not add a test framework without KP approval.

---

## Deployment / Release Process

Source: `eas.json`, `app.json`, `APP_LAUNCH_PLAYBOOK.md`.

| Environment | Command / Process | Source | Approval Required |
|---|---|---|---|
| Local sim/device | `npx expo start -c` then `i` / `a`, or `npm run ios` / `npm run android` | `package.json`, `WORKFLOW_ROUTER.md` | No |
| EAS Development build | `npx eas build --platform ios --profile development` | `eas.json` | No |
| EAS Preview (sim) | `npx eas build --platform ios --profile preview` | `eas.json` | No |
| EAS Internal device | `npx eas build --platform ios --profile internal-device` | `eas.json` | No |
| EAS Production | `npx eas build --platform ios --profile production` | `eas.json` (`autoIncrement: true`) | Yes — KP |
| App Store submit (TestFlight + App Store) | `npx eas submit --platform ios` | `eas.json` (ASC App ID `6764673665`) | Yes — KP |
| Web hosting | UNKNOWN — KP confirmation required | No deploy script in repo | Yes |

If the deployment target is not in this table, write `UNKNOWN — KP confirmation required` and stop.

---

## Environment Variables and Secrets

Claude Code must never expose, print, commit, or invent secrets.

| File / Source | Purpose | Notes |
|---|---|---|
| `.env.local` | Local development environment values | Present in repo, not committed (per `.gitignore`). Do not read or print contents unless explicitly required. |
| `.env.example` | Template documenting required env var names | Present in repo. Safe template, no real values. |
| `app.json` `extra` | Static public config exposed via `expo-constants` | Includes `apiUrl`, `appEnv`, `eas.projectId`. Never put secrets here. |
| `app.config.js` | Dynamic config keyed off `EXPO_PUBLIC_*` env vars | Use this for environment-driven values. Never commit secrets. |
| EAS Build secrets | Stored remotely in EAS, not in repo | Manage via `eas secret:*` commands; do not echo values. |

Rules:

1. Never commit real API keys.
2. Never print full secrets.
3. Never place secrets in `app.json` or any committed file.
4. Use existing env naming conventions (`EXPO_PUBLIC_*` for client-readable values).
5. If a required env var is missing, report the variable name without inventing a value.

---

## Dependency Rules

Universal rules:

1. Check `package.json` and `package-lock.json` before adding dependencies.
2. Do not install packages without KP approval.
3. Do not upgrade major framework versions (React, React Native, Expo) without KP approval.
4. Prefer Expo-compatible / managed packages.
5. If dependency conflicts appear, check Expo SDK 54 docs and the lock file first.
6. Never delete `package-lock.json` without KP approval.
7. Never run destructive dependency resets (`rm -rf node_modules package-lock.json`) without KP approval.

Project-specific rules:

1. Use `npx expo install <package>` for any Expo-managed dependency, not raw `npm install`.
2. Do not change `react-native-reanimated`. It is intentionally excluded from `expo install` upgrades (`package.json` `expo.install.exclude`).
3. Bundle ID `com.byred.authentichadith`, EAS Project ID, and ASC App ID `6764673665` are immutable without KP approval.
4. Build number must increment in `app.json.ios.buildNumber` for App Store uploads (production profile also has `autoIncrement: true`).
5. CLAUDE.md File Priority Order is binding: `ERROR_REPORT` → `BUILD_FIX_LOG` → `SYSTEM_RULES` → `APP_LAUNCH_PLAYBOOK` → multi-LLM files → `WORKFLOW_ROUTER` → `MODEL_AUDIT_LOG` (conditional) → package files.

---

## Safety and Approval Gates

Claude Code must ask KP before:

1. Running destructive commands.
2. Deleting files or folders.
3. Rewriting native/generated folders (especially `ios/`).
4. Changing package manager or lock files.
5. Upgrading major dependencies (React, React Native, Expo, Supabase major, RevenueCat major).
6. Changing deployment configuration (`eas.json`, `app.json` `ios`, `extra`, plugins).
7. Modifying production environment settings.
8. Changing database schemas or migrations (`supabase/migrations/`).
9. Touching billing/payment logic (RevenueCat product IDs, entitlement IDs, paywall configuration).
10. Changing authentication logic (Supabase auth, secure store keys).
11. Changing model/tool assignments (`CURRENT_MODEL_ASSIGNMENTS.md`).
12. Making architectural changes that affect multiple systems.

---

## Destructive Commands

Never run these without KP approval:

```bash
rm -rf node_modules package-lock.json
rm -rf ios android
npx expo prebuild --clean
git reset --hard
git clean -fd
```

Also requires KP approval (per `WORKFLOW_ROUTER.md` and `CLAUDE.md`):

- Any version upgrade of React, React Native, or Expo SDK
- Any command that deletes generated native folders
- Any command that rewrites native project structure
- `npm run reset-project` (runs `scripts/reset-project.js`)

---

## Debugging Protocol

When debugging:

1. Confirm current error status in `ERROR_REPORT.md`.
2. Search `BUILD_FIX_LOG.md` for similar fixes.
3. Check `SYSTEM_RULES.md`.
4. Classify the workflow layer using `WORKFLOW_ROUTER.md` (`VS_CODE_APP_LAYER` / `EXPO_HYBRID_LAYER` / `XCODE_NATIVE_LAYER` / `UNKNOWN_NEEDS_TRIAGE`).
5. Identify the smallest safe fix.
6. Avoid broad rewrites.
7. Verify the fix with the layer-appropriate verification (see `WORKFLOW_ROUTER.md` Section 11).
8. Update project memory per the next section.

Claude Code must not complete a debugging task without documenting the result.

---

## Project Memory Update Rules

After fixing any bug:

1. Update `BUILD_FIX_LOG.md` with a full entry (Fix ID, date, root cause, files changed, exact fix, verification, lesson learned, pattern category).
2. Reset `ERROR_REPORT.md` status to 🟢 only if the bug is fully resolved.
3. Update `SYSTEM_RULES.md` if the pattern has appeared 2 or more times.
4. Update `PROJECT_PLAYBOOK.md` if build, deploy, architecture, or operating behavior changed.
5. Update `APP_LAUNCH_PLAYBOOK.md` if iOS-specific build/release behavior changed.
6. Update `CLAUDE.md` only if onboarding/startup behavior changed.
7. Update `WORKFLOW_ROUTER.md` if a new workflow layer or classification rule is discovered.

The system must improve after every fix.

---

## Multi-LLM Handoff Rules

Use `AI_OPERATOR_HANDOFF_PROTOCOL.md` for full routing detail and `CURRENT_MODEL_ASSIGNMENTS.md` for current operator/tool mapping.

Summary routing table:

| Task Type | Route To |
|---|---|
| Repo-level code / debug / build work | Claude Code |
| Strategy, SOPs, business planning, prompts | ChatGPT |
| Current research, market scans, docs lookup | Gemini |
| UI prototypes, screens, dashboard concepts | v0 |
| Workflow automation, integrations | Make.com |
| Source-of-truth storage / SOP records | Notion / Google Drive / By Red OS |
| Model/tool assignment review | ChatGPT or Gemini, then KP approval |

Claude Code must generate a handoff prompt instead of guessing outside its lane.

Claude Code may recommend a model/tool assignment change but must not update `CURRENT_MODEL_ASSIGNMENTS.md` without explicit KP approval in the current session.

---

## Known Risks

Project-specific risks found in this repo:

1. Authentic Hadith is Rory's product, not Penn Enterprises LLC. Claude Code must not blur ownership. If a decision affects both Authentic Hadith and Penn Enterprises, Penn Enterprises revenue protection wins unless Authentic Hadith has a hard external deadline. Source: `PROJECT_CONTEXT.md`.
2. No automated test command exists in `package.json`. Verification depends on `tsc --noEmit`, `expo lint`, `expo doctor`, manual QA docs, and EAS preview builds. A regression that types correctly but breaks at runtime can ship.
3. `ios/` is a generated folder. Editing inside `ios/` is erased by `expo prebuild`. Native fixes must be mirrored back into Expo config (per `WORKFLOW_ROUTER.md` Sections 8–9).
4. RevenueCat payment logic is in production (`react-native-purchases` + `react-native-purchases-ui`). Any change to product IDs, entitlement IDs, or paywall flow requires KP approval and TestFlight verification.
5. Supabase migrations live in `supabase/migrations/`. Schema changes against the live DB require KP approval and a documented rollback path.
6. RevenueCat 9.9.0 is a major version line. Upgrades must be tested against Expo SDK 54 compatibility before production.

Common risk categories to watch for during any fix:

- Dependency mismatch
- Environment variable missing
- Deployment misconfiguration
- Database schema mismatch
- Native build issue
- Authentication breakage
- Payment / revenue logic issue
- API contract mismatch
- UI regression
- Model/tool routing drift

---

## Operating Standard

Classify before acting. Verify before declaring done. Document after every fix.

The system improves with every session. No exceptions.
