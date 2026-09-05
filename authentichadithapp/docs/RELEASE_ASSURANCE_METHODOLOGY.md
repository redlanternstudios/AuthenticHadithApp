# Production Release Assurance Methodology (PRAM)

## Purpose
PRAM is the default release methodology for all future production builds. It converts a code change into a verified production release through explicit gates, evidence, and stop conditions.

Use PRAM for payments, authentication, onboarding, AI features, notifications, data migrations, integrations, permissions, security-sensitive changes, and any feature whose failure could affect revenue, access, user trust, compliance, or data integrity.

---

## Core Principle
A change is not "fixed" because the code looks correct. A release is only considered verified when the full production path proves the expected behavior.

**Required chain:**

Source Truth -> Automated Validation -> Configuration Truth -> Production Build -> Environment Validation -> End-to-End Acceptance -> Persistence/Recovery -> Evidence -> Release Decision

If any gate fails, the release is NO-GO until the failure is understood and resolved at the correct system layer.

---

## Gate 0 — Change Classification
Before implementation, classify the change:

- P0 / Critical: revenue, auth/access control, security, privacy, data loss, release-blocking crash
- P1 / High: major workflow failure, broken integration, repeated user-impacting errors
- P2 / Medium: degraded UX, non-critical functional defect
- P3 / Low: cosmetic, copy, low-risk UI refinement

Critical and high-risk changes require all PRAM gates. Medium/low-risk changes may use a reduced test matrix only when the omitted gates cannot materially affect production behavior.

Document:
- business/user objective
- affected system(s)
- dependencies
- failure modes
- rollback/recovery path
- release owner
- validation owner

---

## Gate 1 — Source Truth
Establish the authoritative source before changing anything.

Verify:
- canonical repository and branch
- canonical runtime/app directory
- version/build number
- relevant feature files
- configuration files
- product/API/entitlement/route identifiers
- prior fixes and known regressions

Do not patch a symptom before identifying which layer owns the behavior.

**Exit criteria:** source-of-truth matrix is unambiguous.

---

## Gate 2 — Dependency & System Map
Map the production path as a workflow.

Example:

User Action -> App UI -> Client Logic -> SDK -> External Platform -> Backend State -> Entitlement/Data -> Navigation/Result

For each dependency, record:
- expected input
- expected output
- failure behavior
- evidence source

This prevents fixing the frontend when the real defect is App Store Connect, RevenueCat, Supabase, an API, signing, environment variables, or another external dependency.

**Exit criteria:** every critical dependency and handoff is named.

---

## Gate 3 — Automated Validation
Every critical regression must become an enforceable test or release guard whenever technically feasible.

Minimum validation for production code:
- dependency install succeeds
- TypeScript/type validation succeeds
- lint succeeds
- route/navigation integrity succeeds when applicable
- unit/integration tests succeed
- feature-specific regression tests succeed
- configuration/identifier assertions succeed
- security/secret checks succeed when applicable

A test existing in the repository is not sufficient. Critical tests should be executed automatically in CI before merge.

**Rule:** If a temporary bypass is ever required for screenshots, demos, debugging, mocks, or local QA, production CI must fail if that bypass appears in a releasable branch.

**Exit criteria:** automated checks are green and the target regression is covered.

---

## Gate 4 — Configuration Truth
Verify all external configuration that affects runtime behavior.

Examples:
- App Store Connect / Google Play
- RevenueCat / Stripe
- Supabase
- Vercel / cloud environment variables
- OAuth providers
- push notification credentials
- database migrations / RLS
- API provider settings

Create a configuration matrix:

| System | Identifier / Setting | Expected | Verified |
|---|---|---|---|
| App | canonical ID | expected value | yes/no |
| External platform | mapped ID | expected value | yes/no |
| Backend | entitlement/state | expected value | yes/no |

Never assume code proves an external configuration state.

**Exit criteria:** all cross-system identifiers and critical settings match.

---

## Gate 5 — Production-Equivalent Build
Validate the actual release artifact, not only development or simulator behavior.

Use the same:
- build profile
- native dependencies
- signing configuration
- bundle/package identifier
- environment configuration
- release mode
- distribution path

Examples:
- iOS: EAS production build -> TestFlight
- Android: production build -> internal/closed track
- Web: production deployment/preview using production-equivalent environment

**Rule:** Simulator, Expo Go, localhost, preview-only, or mocked success is supporting evidence, not final release evidence when the production environment materially differs.

**Exit criteria:** production-equivalent artifact is successfully built and available for validation.

---

## Gate 6 — End-to-End Acceptance Test
Test the exact customer/user journey from the beginning.

For each critical workflow define:
- precondition
- user action
- system response
- expected result
- failure criteria

Example pattern:

Fresh User -> Signup -> Onboarding -> Feature Gate -> External Transaction/Action -> Backend Confirmation -> App State Update -> User Outcome

Test the primary happy path using a fresh identity/state whenever stale state could hide a defect.

**Exit criteria:** end-to-end journey succeeds in the production-equivalent environment.

---

## Gate 7 — Negative & Degraded-Mode Tests
Critical systems must fail safely.

Test relevant conditions such as:
- no network
- external API unavailable
- missing offering/configuration
- user cancellation
- expired session
- invalid credentials
- duplicate submission
- empty data
- partial backend failure
- permission denied

Principles:
- no crash
- no false success
- no false entitlement/access
- no silent data loss
- no misleading confirmation
- useful recovery path when possible

**Exit criteria:** expected failures are controlled and observable.

---

## Gate 8 — Persistence, Restart & Recovery
A workflow that works only in the current session is not production-complete.

For stateful features test, when applicable:
- force quit / restart
- session rehydration
- logout/login
- reinstall
- restore/recovery
- retry after transient failure
- backend/source-of-truth reconciliation

**Exit criteria:** correct state survives or can be correctly recovered.

---

## Gate 9 — Evidence & Receipts
Do not close a production incident or declare release success without evidence.

Acceptable receipts include:
- CI run and passing checks
- commit SHA / PR
- build ID
- TestFlight/internal-track version
- device screenshots or screen recording
- logs
- API responses
- backend state / entitlement confirmation
- migration receipt
- external platform configuration confirmation

Record both:
1. user-visible outcome
2. backend/system-of-record outcome

**Exit criteria:** evidence proves the same expected state from at least the user surface and the authoritative system when applicable.

---

## Gate 10 — Release Decision
Use explicit status:

### GO
All required gates passed. No unresolved critical ambiguity.

### CONDITIONAL GO
Only non-critical known issues remain, risk is understood, rollback exists, and release owner explicitly accepts the risk.

### NO-GO
Any critical gate fails, evidence is missing, configuration is unverified, production behavior differs from expected, or root cause remains uncertain.

Never label a release "fixed" when the status is only "code changed," "build succeeded," or "works locally."

---

## Definition of Done — Production Change
A critical change is DONE only when:

- [ ] source of truth confirmed
- [ ] system/dependency map completed
- [ ] root cause established
- [ ] fix implemented at correct layer
- [ ] regression test/guard added where feasible
- [ ] automated validation green
- [ ] external configuration verified
- [ ] production-equivalent artifact built
- [ ] end-to-end acceptance passed
- [ ] negative/degraded behavior passed
- [ ] restart/persistence/recovery passed where applicable
- [ ] user-visible result verified
- [ ] backend/system-of-record result verified
- [ ] receipts recorded
- [ ] rollback/recovery path understood
- [ ] release decision explicitly recorded as GO / CONDITIONAL GO / NO-GO

---

## The PRAM Operating Loop

### NOW — Before Coding
1. Define objective and expected production behavior.
2. Classify risk.
3. Establish source truth.
4. Map dependencies and failure modes.
5. Define acceptance tests before implementation.

### NEXT — During Implementation
1. Fix the correct layer.
2. Add regression protection.
3. Run automated checks.
4. Verify external configuration.
5. Build production-equivalent artifact.

### LATER — Before Release Closure
1. Execute fresh-state end-to-end test.
2. Execute failure-path tests.
3. Execute persistence/recovery tests.
4. Collect evidence.
5. Record release decision.
6. Convert any newly discovered failure pattern into a permanent test, rule, or checklist item.

---

## Non-Negotiable Rules
1. Never confuse code correctness with production correctness.
2. Never use a simulator as the only proof when native/external systems matter.
3. Never hardcode external commercial values that should come from the authoritative platform unless explicitly required and controlled.
4. Never allow screenshot/demo/debug bypasses into release branches.
5. Never report success from a UI confirmation alone when a backend/system-of-record receipt is available.
6. Never silently ignore ambiguous failures.
7. Never merge a critical change solely because the diff looks correct.
8. Always test the full lifecycle: first use, success, restart, and recovery.
9. Every repeated failure should produce a stronger system control.
10. Production release state must have one canonical truth document or source.

---

## Example: Payment / Paywall Application

Code -> Product IDs -> Payment SDK -> Store Platform -> Offering -> Purchase -> Entitlement -> Navigation -> Restart -> Restore

Required evidence:
- source product IDs match external platform
- offering exists
- price/trial metadata verified externally
- production build loads offering
- native purchase UI appears
- transaction succeeds
- backend entitlement activates
- app unlocks
- restart retains access
- restore recovers access

Only after all required evidence is obtained may the incident be marked RESOLVED.

---

## Continuous Improvement Rule
Every production defect must answer:

**"What permanent control would have prevented this from shipping?"**

Possible outputs:
- automated test
- CI gate
- schema constraint
- lint rule
- runtime assertion
- monitoring/alert
- release checklist item
- documentation rule
- permission control
- architecture change

The goal is not merely to fix defects faster. The goal is to make the same class of defect increasingly difficult to reintroduce.
