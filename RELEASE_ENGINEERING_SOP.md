# Enterprise Release Engineering Standard Operating Protocol (SOP)
## Authentic Hadith & RedLantern Studios Canonical Release Operating System

> **Canonical Engineering Invariant:**  
> **Code completion ≠ engineering completion.**  
> A change is complete only when the expected behavior has been demonstrated with empirical evidence in the actual environment where users experience it.

---

## 1. Universal Release Lifecycle

Every application build, hotfix, feature release, and platform submission must strictly progress through the canonical 8-stage release lifecycle:

$$\text{Fix} \longrightarrow \text{Prove} \longrightarrow \text{Package} \longrightarrow \text{Distribute} \longrightarrow \text{Install} \longrightarrow \text{Re-Test} \longrightarrow \text{Evidence} \longrightarrow \text{Release}$$

For mobile applications (iOS / TestFlight / App Store) specifically:

$$\text{Repo Fixed} \longrightarrow \text{Build Passes} \longrightarrow \text{Upload Passes} \longrightarrow \text{TestFlight Processing Passes} \longrightarrow \text{Physical Install Passes} \longrightarrow \text{User Journey Verified} \longrightarrow \text{Evidence Captured} \longrightarrow \text{SHIP}$$

No engineer or autonomous AI agent may treat code compilation, passing local tests, successful CI runs, or TestFlight uploads as equivalent to a release.

---

## 2. Enterprise Release State Model

Agents and engineers must never use vague status labels such as "done," "fixed," or "production ready." Every release task must declare its exact canonical state from this model:

| Release State | Required Prerequisites | Canonical Output Gate |
| :--- | :--- | :--- |
| **STATE 0: ISSUE IDENTIFIED** | Exact problem, expected vs. actual behavior, affected environment, affected user flow, severity (P0–P4), business/revenue/security impact. | `ISSUE CONFIRMED` |
| **STATE 1: ROOT CAUSE CONFIRMED** | Root cause identified, related dependencies mapped, symptoms distinguished from causes, invalidated past assumptions documented. No premature patching without containment need. | `ROOT CAUSE CONFIRMED` |
| **STATE 2: FIX IMPLEMENTED** | Smallest coherent change, zero unnecessary refactoring, zero unrelated file changes, zero temporary production bypasses, deterministic logic. | `FIX IMPLEMENTED — NOT YET VERIFIED` |
| **STATE 3: LOCAL VERIFIED** | All local gates pass: release guard, TypeScript compilation, ESLint, automated unit/regression tests, route integrity, dependency audit. Command, result, and exit code recorded. | `LOCAL VERIFIED` |
| **STATE 4: REMOTE VERIFIED** | Git commit created, branch pushed to origin, remote HEAD SHA matches local HEAD, PR diff inspected, CI results evaluated, branch remains isolated from production branch. | `REMOTE VERIFIED — READY FOR RELEASE CANDIDATE` |
| **STATE 5: RELEASE CANDIDATE BUILT** | Production config confirmed, bundle ID verified, version/build number incremented, environment secrets active, build succeeds for verified commit SHA. | `RELEASE CANDIDATE BUILT` |
| **STATE 6: DISTRIBUTION VERIFIED** | Build uploaded to App Store Connect, TestFlight processing completes, binary becomes available to internal testers, correct build selected. | `TESTFLIGHT DISTRIBUTION VERIFIED` |
| **STATE 7: PHYSICAL DEVICE VERIFIED** | Installed via TestFlight on physical hardware; cold launch, auth persistence, gating, sandbox purchase, UI update, relaunch persistence, restore purchase, and failure paths proven. | `PHYSICAL DEVICE VERIFIED` |
| **STATE 8: RELEASE APPROVED** | All states 0–7 have empirical evidence recorded in a formal receipt. Sign-off granted by product owner / CEO. | `SHIP APPROVED` |

**Invariant:** No AI agent may output `SHIP`, `PRODUCTION READY`, or equivalent before achieving **STATE 8 (`SHIP APPROVED`)**.

---

## 3. Release Gate Architecture

Every release candidate build must clear this sequential 9-gate chain before deployment:

```
[ Gate 0: Forbidden Release State ]  ──► (Machine-enforced: qa-release-guard.mjs)
                 │
                 ▼
[ Gate 1: Static Analysis ]          ──► (Machine-enforced: tsc --noEmit + expo lint)
                 │
                 ▼
[ Gate 2: Automated Tests ]          ──► (Machine-enforced: jest --coverage)
                 │
                 ▼
[ Gate 3: Environment & Security ]   ──► (Machine-enforced: secret scan + qa-audit-env)
                 │
                 ▼
[ Gate 4: Integration & Topology ]   ──► (Machine-enforced: routes & deps audit)
                 │
                 ▼
[ Gate 5: Production Build ]         ──► (EAS iOS build --profile production)
                 │
                 ▼
[ Gate 6: Distribution ]             ──► (App Store Connect / TestFlight processing)
                 │
                 ▼
[ Gate 7: Physical Device ]          ──► (Real iOS device: install, purchase, restore)
                 │
                 ▼
[ Gate 8: Evidence Review ]          ──► (Receipt inspection, zero blockers, human sign-off)
                 │
                 ▼
           [ SHIP APPROVED ]
```

### Gate 0: Forbidden Release State (Automated Enforcement)
Machine-enforced via `scripts/qa-release-guard.mjs`. The build process immediately halts if runtime or configuration code contains temporary markers or overrides, including:
- `SCREENSHOT-BYPASS`
- `REVERT BEFORE COMMIT`
- Forced premium entitlement: `const/let/var isPro = true` or `isPremium = true`
- Disabled RevenueCat initialization or retry markers
- Mocked production API endpoints in release configuration
- Bundled private secrets (`sk_`, `gsk_`, service-role keys, private keys)

---

## 4. Critical Engineering Principles

1. **Context $\rightarrow$ Task $\rightarrow$ Proof:** Every engineering action must state why the change exists (Context), what exact edit is authorized (Task), and what empirical evidence proves it works (Proof). Never report completion without Proof.
2. **Architecture Before Editing:** Inspect UI/component, state management, navigation hierarchy, backend schema, auth lifecycle, RevenueCat SDK, StoreKit, Expo config, EAS configuration, and CI/CD workflows before modifying code.
3. **Smallest Coherent Fix:** Apply the minimal targeted change that completely resolves the root cause. Opportunistic refactoring, cleanup, and dependency updates during release recovery are strictly forbidden.
4. **Deterministic Critical Controls:** Paywalls, entitlement evaluation, routing gates, and reviewer allowlists must be deterministic and inspectable. No fuzzy heuristics or heuristic bypasses.
5. **Golden Path + Failure Path Validation:** Always test both paths:
   - *Monetization:* Purchase $\rightarrow$ unlock $\rightarrow$ relaunch $\rightarrow$ restore vs. Cancel $\rightarrow$ timeout $\rightarrow$ missing offering $\rightarrow$ expired state.
   - *Auth:* Sign in $\rightarrow$ session persistence $\rightarrow$ logout vs. Invalid credentials $\rightarrow$ network outage $\rightarrow$ expired token.
   - *Data:* Read $\rightarrow$ write $\rightarrow$ sync vs. RLS denied $\rightarrow$ offline $\rightarrow$ stale cache.
6. **Fail Closed for Premium & Security:** If subscription or entitlement status cannot be determined, access **must fail closed** (default to Free tier). Never unlock premium on network failure or uncaught exceptions.
7. **Zero Leak Observability:** Log sufficient diagnostic context (subsystem, environment, state, request) to isolate bugs without leaking passwords, tokens, API secrets, or PII.
8. **Rollback Discipline:** Always record the previous known-good commit SHA and verify whether any remote configuration or database changes are reversible before applying release changes.
9. **Release Artifact Traceability:** Every production build must be unambiguously traceable to a specific Git commit SHA, app version, and build number.
10. **No False Receipts (TruthSerum™ Standard):** Never claim a build, upload, test, or feature is working without direct proof. Claims without receipts are treated as invalid.

---

## 5. Security Standard

Before releasing any build candidate, verify:
- Zero `.env` or `.env.local` files tracked in git.
- Zero Supabase `service_role` keys bundled in the mobile app.
- Zero private RevenueCat keys (client bundle must strictly use public SDK keys starting with `appl_` on iOS or `goog_` on Android).
- Zero LLM API secrets (Groq, OpenAI, Anthropic) bundled client-side (all inference routes must terminate at backend API endpoints).
- Zero reviewer passwords or Apple developer private keys (`.p8`, `.p12`) committed to source.
- Supabase Row-Level Security (RLS) enabled and verified on all production tables.
- Mobile client communicates exclusively using `EXPO_PUBLIC_SUPABASE_ANON_KEY` and public client APIs.

---

## 6. RevenueCat & In-App Purchase (IAP) Standard

Every subscription build must validate the end-to-end purchasing pipeline:

$$\text{App Store Connect Product} \longrightarrow \text{RevenueCat Product} \longrightarrow \text{RevenueCat Offering} \longrightarrow \text{RevenueCat Entitlement} \longrightarrow \text{App Product ID} \longrightarrow \text{Purchase Flow} \longrightarrow \text{CustomerInfo} \longrightarrow \text{Entitlement State} \longrightarrow \text{UI State}$$

### App Store Reviewer Allowlist Standards
- Exact email match only via `lib/revenuecat/config.ts` (`isReviewerEmail`).
- Must strictly reject lookalike emails, subdomains, prefix/suffix alterations, empty strings, and null inputs.
- Must be explicitly covered by automated regression tests in `__tests__/revenuecat.test.ts`.
- Reviewer accounts must never bypass security boundaries or expose production admin operations.

---

## 7. App Store Release 21-Step SOP (iOS)

```
 1. Establish release candidate branch & PR (isolated from main).
 2. Run repository QA chain: npm run qa:release.
 3. Confirm environment variables and API keys for production.
 4. Confirm app.json version and buildNumber incrementation.
 5. Confirm signing credentials and native entitlements in EAS/Apple Developer.
 6. Trigger production build: npx eas-cli build --platform ios --profile production.
 7. Confirm artifact matches verified Git commit SHA.
 8. Upload binary to App Store Connect (automated via EAS or manual submission).
 9. Confirm TestFlight processing completes with status "Ready to Test".
10. Install TestFlight build on a physical iOS device.
11. Execute cold-launch smoke test (app opens cleanly, splash dismisses).
12. Execute monetization flow: fresh user redirected to /paywall; purchase completed in Apple Sandbox.
13. Execute post-purchase refresh: entitlement updates, UI unlocks, redirects to /(tabs).
14. Execute relaunch persistence: force quit app, reopen, verify Pro features remain unlocked.
15. Execute restore purchase flow: test "Restore Purchases" in Settings -> Subscription.
16. Execute reviewer account test: log in with authorized demo account, verify auto-unlock.
17. Inspect RevenueCat dashboard: confirm Sandbox purchase event logged against customer ID.
18. Inspect Supabase backend: confirm profile subscription status synchronized.
19. Capture empirical verification receipts (screenshots, logs, transaction IDs).
20. Re-run impacted gates if any defect required code changes.
21. Only then submit build for App Store Review.
```

---

## 8. Release Severity Classification

- **P0 — Critical (Immediate Blocker):** Security breach, data loss, production outage, severe payment failure. Blocks all releases; requires emergency containment.
- **P1 — Release Blocker:** App crash, broken auth, broken in-app purchases, universal premium bypass, App Store rejection risk, missing account deletion/privacy policy. Blocks release candidate.
- **P2 — High:** Major feature degraded or unavailable, but core application operates safely. Requires fix prior to public store release.
- **P3 — Medium:** Minor UI/UX anomaly, data display inconsistency, or edge-case glitch with existing workaround.
- **P4 — Polish:** Cosmetic improvement, non-blocking copy adjustment, or internal code refactor.

**Rule:** Any open P0 or P1 issue immediately places the release candidate in **`BLOCKED`** status.

---

## 9. Definition of Done for Releases

A release task is **NOT** done at `CODE WRITTEN` or `BUILD SUCCESSFUL`. The Definition of Done requires:
- [x] Authorized implementation complete.
- [x] Release guard passes cleanly (`npm run qa:release-guard`).
- [x] Static type checking passes cleanly (`npm run qa:types`).
- [x] Lint passes cleanly (`npm run qa:lint`).
- [x] Automated test suite passes with 100% success (`npm run qa:test`).
- [x] Route and dependency audits pass (`npm run qa:audit:routes`, `qa:audit:deps`).
- [x] Code pushed to remote branch and remote PR verified.
- [x] CI workflows pass on GitHub.
- [x] Production release candidate binary built via EAS.
- [x] TestFlight processing completes.
- [x] Physical device verification completed across all core flows.
- [x] Verification receipts and customer history recorded.
- [x] Zero open P0/P1 blockers.
- [x] Explicit `SHIP APPROVED` decision granted.

---

## 10. Agent Handoff Protocol

Every release-related AI agent (Claude Code, Gemini, Codex, Antigravity) must document its session using this exact format:

```markdown
### 1. Change
[Summary of code and configuration changes]

### 2. Why
[Root cause, business context, or bug reference]

### 3. Files
[Exact file paths touched]

### 4. Tests
[Exact commands executed with exit codes]

### 5. Evidence
[Command outputs, test results, receipts, and diff summaries]

### 6. State
[One canonical state: e.g. REMOTE VERIFIED — READY FOR RELEASE CANDIDATE]

### 7. Risks
[Remaining operational, platform, or environment risks]

### 8. Blockers
[Any blocking dependencies or human gates]

### 9. Rollback
[Known-good commit SHA and rollback instructions]

### 10. Next Move
[Single, unambiguous next action required]
```

---

## 11. Permanent Incident Case Study: The RevenueCat Screenshot Bypass

### Incident Summary
During pre-submission preparation, temporary test code was introduced into `app/_layout.tsx` to force `isPro = true` and bypass RevenueCat configuration so screenshots could be captured on a simulator. Comments in the code stated `REVERT BEFORE COMMIT`. 

However, the change was committed and merged to the default branch. This resulted in:
1. Complete bypass of the paywall for all users.
2. Disabling of the RevenueCat SDK initialization.
3. Total failure of the in-app subscription monetization model.

### Permanent Engineering Lesson
> **If temporary code can damage a release, preventing it from shipping must never depend solely on human memory.**

Comments reminding humans to revert code are fundamentally unreliable. Dangerous temporary states must be caught by automated, machine-enforced gates (`qa-release-guard.mjs`) that block CI and release pipelines deterministically.
