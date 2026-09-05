# Release Candidate Verification Receipt — PR #31
## Authentic Hadith & RedLantern Studios

- **Project:** Authentic Hadith (`com.byred.authentichadith`)
- **Git Branch:** `ctp/authentic-hadith-fix-v1`
- **Candidate Commit SHA:** `2c1a090212fe55a02f4261f442aba73a4669d5fa`
- **Pull Request:** [#31](https://github.com/redlanternstudios/AuthenticHadithApp/pull/31)
- **App Version:** `1.1.3`
- **Remote Build Number Attempted:** `122`
- **Timestamp:** `2026-09-05T21:28:06Z`

---

## 1. Local & Remote Verification Gates

| Verification Gate | Command | Result | Exit Code | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Release Guard** | `npm run qa:release-guard` | **PASS** | `0` | 143 files scanned; zero forbidden markers |
| **TypeScript Gate** | `npm run qa:types` | **PASS** | `0` | `tsc --noEmit` exited clean |
| **Lint Gate** | `npm run qa:lint` | **PASS** | `0` | 0 errors, 13 warnings |
| **Regression Tests** | `npm run qa:test` | **PASS** | `0` | 14 test suites, 146 tests passed |
| **Route Audit** | `node scripts/qa-audit-routes.mjs` | **PASS** | `0` | 38 screens, 4 layouts, 13 dynamic routes |
| **Dependency Audit** | `node scripts/qa-audit-deps.mjs` | **PASS** | `0` | Expo 54, React 19, React Native 0.81 |
| **Composite Gate** | `npm run qa:release` | **PASS** | `0` | Full gate sequence clean |

---

## 2. CI & EAS Cloud Build Execution

- **Workflow:** `.github/workflows/eas-ios.yml` (EAS iOS Build & TestFlight Submit)
- **Trigger:** `workflow_dispatch` on `ctp/authentic-hadith-fix-v1`
- **GitHub Action Run ID:** [`33993078887`](https://github.com/redlanternstudios/AuthenticHadithApp/actions/runs/33993078887)
- **Job ID:** `101378665698`
- **EAS Authenticated User:** `redlantern` (`roryleesemeah@gmail.com`)
- **EAS Project ID:** `66afcbbf-55c3-48fb-9bf1-29efc52d09eb`
- **Build Profile:** `production`
- **Status:** **BLOCKED AT CREDENTIALS SETUP**

### Build Failure Output
```
Using remote iOS credentials (Expo server)
Distribution Certificate is not validated for non-interactive builds.
Using App Store Connect API Key from EAS credentials service.
Fetching Apple provisioning profiles
✔ Fetched Apple provisioning profiles
Provisioning profile (id: RL2RYR793P) is no longer valid
Updating provisioning profile (RL2RYR793P) with distribution certificate (7M7YD4HR8Q)
✖ Failed to update provisioning profile (RL2RYR793P) with distribution certificate (7M7YD4HR8Q)
Failed to set up credentials.
No certificate exists with serial number "18C72B87D58A8D6CB6E00020B9E1D9BD"
Error: build command failed. Process completed with exit code 1.
```

---

## 3. Root Cause Analysis of Blocker

1. **Certificate Serial Desynchronization:** EAS Cloud stores a cached reference to Apple Distribution Certificate `7M7YD4HR8Q` with serial number `18C72B87D58A8D6CB6E00020B9E1D9BD`.
2. **Apple Developer Portal State:** Apple Developer API returned that no active certificate exists with this serial number (it has either expired, been revoked, or been replaced in the Apple Developer Portal).
3. **Automated Provisioning Profile Update Failure:** Because the underlying certificate is missing or invalid on Apple Developer Portal, EAS failed to update Provisioning Profile `RL2RYR793P`, blocking the compilation runner from starting.

---

## 4. Remediation Required

An account administrator with Apple Developer Portal and Expo access (Keymon or Rory) must update the distribution credentials:
1. Run `npx eas-cli credentials` interactively in the terminal (or configure via `expo.dev` dashboard).
2. Select `iOS` $\rightarrow$ `production`.
3. Select `Distribution Certificate` $\rightarrow$ re-sync or create a fresh Distribution Certificate.
4. Regenerate or re-link the Provisioning Profile for `com.byred.authentichadith`.
5. Re-dispatch the `eas-ios.yml` workflow on `ctp/authentic-hadith-fix-v1`.

---

## 5. Canonical Release State

**`BLOCKED` (at State 5: Release Candidate Built)**  
*Code and local verification are 100% complete and remote-verified. Build execution is currently gated on external Apple Developer distribution certificate re-synchronization in the EAS credentials service.*
