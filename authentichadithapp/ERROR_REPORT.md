# ERROR_REPORT.md — Authentic Hadith iOS App
## Active Bug Intake

> **PURPOSE**: Live error intake. Every Claude session reads this file FIRST. If Status is 🔴 ACTIVE, that is the current problem — fix it before doing anything else.

---

## CURRENT ERROR

**Status**: 🟢 No active errors

The Reanimated 4 warm-relaunch hang (previous active blocker) was resolved by **FIX-036** (Reanimated 4 → 3.18 downgrade) and its **follow-up** (removal of the conflicting `react-native-worklets` peer-dependency package). Verification was performed on EAS preview build `809cceba-69f6-4f2d-892f-7ac0120be1af` against simulator `F5384F69-2BE1-40DC-806B-B4C45F03736A` (iPhone 17 Pro, iOS 26.4) on 2026-05-08 — see `EAS_PREVIEW_QA_02.md` for the full verification log and `BUILD_FIX_LOG.md` FIX-036 for the fix narrative.

Cold launch and two consecutive warm relaunches all reached the Home tab without splash hang, SIGABRT, redbox, or new crash reports. The previous SpringBoard diagnostic noise (FBSOpenApplicationServiceErrorDomain code=5) was traced to a stale simulator boot state, not the app — a clean `simctl shutdown` + `simctl boot` cycle resolved it and is documented in EAS_PREVIEW_QA_02.md.

---

## INSTRUCTIONS FOR CLAUDE (NEXT SESSION)

1. If a new error appears, replace this entire file with a 🔴 ACTIVE intake matching the prior format (Headline, Reproduction, Root cause hypothesis, Build identity, Classification, Severity, Recommended fix paths, Ruled-out items).
2. Do NOT delete or edit `BUILD_FIX_LOG.md` historical entries.
3. Before declaring a 🔴 status resolved, verify the fix end-to-end (build + install + reproducer) and reset this file via the same protocol used for FIX-036.
