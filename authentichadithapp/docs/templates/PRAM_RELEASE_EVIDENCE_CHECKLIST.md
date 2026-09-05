# PRAM Release Evidence Checklist

Copy this file for each material production release or critical incident.

## Release Identity
- Release / Incident ID:
- Application / Service:
- Repository:
- Branch / PR:
- Commit SHA:
- Version:
- Build number:
- Release owner:
- Validation owner:
- Risk classification: P0 / P1 / P2 / P3

## Objective
- Business/user objective:
- Expected production behavior:
- Systems affected:

## Gate 1 — Source Truth
- [ ] Canonical repo confirmed
- [ ] Canonical branch confirmed
- [ ] Canonical runtime directory confirmed
- [ ] Version/build confirmed
- [ ] Relevant IDs/configuration recorded

Evidence:

## Gate 2 — Dependency Map
Production path:

`User -> UI -> Client -> SDK/API -> External Platform -> Backend/System of Record -> User Result`

Dependencies / risks:

## Gate 3 — Automated Validation
- [ ] Dependency install
- [ ] Typecheck
- [ ] Lint
- [ ] Unit/integration tests
- [ ] Route/navigation integrity if applicable
- [ ] Feature regression tests
- [ ] Config/ID assertions
- [ ] Secret/security checks if applicable

CI/run evidence:

## Gate 4 — External Configuration Truth
| System | Setting/Identifier | Expected | Actual | PASS/FAIL |
|---|---|---|---|---|
| | | | | |

Evidence:

## Gate 5 — Production-Equivalent Artifact
- [ ] Correct production profile
- [ ] Signing/package identity confirmed
- [ ] Correct environment/configuration
- [ ] Build completed
- [ ] Artifact available in production-equivalent distribution environment

Build ID / URL / receipt:

## Gate 6 — Happy-Path Acceptance
Preconditions:

Steps:
1.
2.
3.

Expected result:

Actual result:

- [ ] PASS

Evidence:

## Gate 7 — Negative / Degraded Tests
| Scenario | Expected | Actual | PASS/FAIL |
|---|---|---|---|
| No network / dependency outage | | | |
| User cancellation / invalid action | | | |
| Missing/empty external state | | | |
| Other critical failure mode | | | |

Evidence:

## Gate 8 — Persistence / Recovery
- [ ] Force quit / restart
- [ ] Session rehydration
- [ ] Logout/login if relevant
- [ ] Reinstall if relevant
- [ ] Restore/recovery if relevant
- [ ] Retry after transient failure

Evidence:

## Gate 9 — Dual-Surface Proof
User-visible outcome:

System-of-record/backend outcome:

- [ ] Both prove the same state

## Gate 10 — Release Decision
Decision: GO / CONDITIONAL GO / NO-GO

Known residual risks:

Rollback / recovery plan:

Decision owner:

Decision timestamp:

## Post-Release Learning
What failed or nearly failed?

What permanent control prevents recurrence?
- [ ] test
- [ ] CI gate
- [ ] runtime assertion
- [ ] monitoring/alert
- [ ] schema/permission control
- [ ] checklist/rule
- [ ] architecture change
- [ ] other:

Follow-up owner / deadline:
