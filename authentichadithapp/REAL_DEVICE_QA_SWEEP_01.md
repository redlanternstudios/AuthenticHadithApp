# Real Device QA Sweep 01

**Device:** RoPhone / iPhone 16 Pro Max
**Build:** Internal-device build
**Bundle ID:** com.byred.authentichadith
**Tester:** KP
**QA Lead:** Runtime QA Commander (Claude)
**Date opened:** 2026-05-09
**Repo state at start:** clean, branch `main`, HEAD `efb4870`

## Status Scale
- PASS — works as expected
- FAIL — broken, captured with evidence
- BLOCKER — launch blocker, app cannot ship until fixed
- NEEDS_RETEST — inconclusive, must rerun
- NOT_TESTED — not yet attempted

---

## Sweep 1: App Lifecycle

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Cold launch app | NOT_TESTED | |
| 2 | Splash dismisses | NOT_TESTED | |
| 3 | Home renders | NOT_TESTED | |
| 4 | Force quit | NOT_TESTED | |
| 5 | Relaunch | NOT_TESTED | |
| 6 | Force quit again | NOT_TESTED | |
| 7 | Relaunch again | NOT_TESTED | |
| 8 | Lock, unlock, reopen | NOT_TESTED | |
| 9 | Background 30s, return | NOT_TESTED | |

**Sweep 1 result:** NOT_TESTED

---

## Sweep 2: Core Navigation

| Screen | Opens | Content loads | Clean route | No redbox | No stuck loading | No raw errors | Back works | Status | Notes |
|--------|-------|---------------|-------------|-----------|------------------|---------------|------------|--------|-------|
| Home | | | | | | | | NOT_TESTED | |
| Today | | | | | | | | NOT_TESTED | |
| Collections | | | | | | | | NOT_TESTED | |
| Search | | | | | | | | NOT_TESTED | |
| My Hadith | | | | | | | | NOT_TESTED | |
| Learn | | | | | | | | NOT_TESTED | |
| Assistant | | | | | | | | NOT_TESTED | |
| Profile | | | | | | | | NOT_TESTED | |
| More (if present) | | | | | | | | NOT_TESTED | |

**Sweep 2 result:** NOT_TESTED

---

## Sweep 3: Hadith Content

| # | Step | Status | Evidence |
|---|------|--------|----------|
| 1 | Home Hadith of the Moment | NOT_TESTED | |
| 2 | Read Full Hadith | NOT_TESTED | |
| 3 | Collections list | NOT_TESTED | |
| 4 | Sahih Bukhari | NOT_TESTED | |
| 5 | Sahih Muslim | NOT_TESTED | |
| 6 | Other collections (incomplete?) | NOT_TESTED | |
| 7 | Search "prayer" | NOT_TESTED | |
| 8 | Search "intention" | NOT_TESTED | |
| 9 | Open hadith detail | NOT_TESTED | |
| 10 | Save/bookmark hadith | NOT_TESTED | |

**Collection counts vs UI claim:** _to be captured_
**Pagination:** _to be captured_
**Missing-content collections:** _to be captured_

**Sweep 3 result:** NOT_TESTED

---

## Sweep 4: Stories + Completion

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Open Prophet story | NOT_TESTED | |
| 2 | Open Companion story | NOT_TESTED | |
| 3 | Mark as Complete | NOT_TESTED | |
| 4 | Leave and return | NOT_TESTED | |
| 5 | Force quit and reopen | NOT_TESTED | |
| 6 | Completion persists | NOT_TESTED | |

**Sweep 4 result:** NOT_TESTED

---

## Sweep 5: Sunnah + Progress + Badges

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Open Sunnah | NOT_TESTED | |
| 2 | 365 practices or fallback | NOT_TESTED | |
| 3 | Open categories | NOT_TESTED | |
| 4 | Visual formatting | NOT_TESTED | |
| 5 | Open Progress | NOT_TESTED | |
| 6 | Open Badges | NOT_TESTED | |
| 7 | Badges screen no crash | NOT_TESTED | |
| 8 | Complete an item | NOT_TESTED | |
| 9 | Progress updates | NOT_TESTED | |

**Sweep 5 result:** NOT_TESTED

---

## Sweep 6: AI Summary + Assistant

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Home AI Summary button | NOT_TESTED | |
| 2 | Hadith detail AI Summary | NOT_TESTED | |
| 3 | Assistant tab | NOT_TESTED | |
| 4 | Query: "Summarize the hadith about intentions." | NOT_TESTED | |
| 5 | Response appears | NOT_TESTED | |
| 6 | Fallback appears | NOT_TESTED | |
| 7 | No raw API errors | NOT_TESTED | |

**Endpoint failure messages captured:** _none yet_
**User-facing copy quality:** _not yet captured_

**Sweep 6 result:** NOT_TESTED

---

## Sweep 7: Profile / Subscription / Account

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Profile opens | NOT_TESTED | |
| 2 | Settings opens | NOT_TESTED | |
| 3 | Subscription screen opens | NOT_TESTED | |
| 4 | Restore Purchases | NOT_TESTED | |
| 5 | Delete Account route reachable | NOT_TESTED | |
| 6 | Logout/sign-in behavior | NOT_TESTED | |

**RevenueCat errors captured:** _none yet_
**Product/offering availability:** _not yet captured_

**Sweep 7 result:** NOT_TESTED

---

## Sweep 8: Visual / UX Polish

| Issue | Found? | Where | Severity |
|-------|--------|-------|----------|
| Text cut off | NOT_TESTED | | |
| Icons rendering as words | NOT_TESTED | | |
| Weird spacing | NOT_TESTED | | |
| Mobile width issues | NOT_TESTED | | |
| Unreadable dark mode | NOT_TESTED | | |
| Too many tabs | NOT_TESTED | | |
| Placeholder screens | NOT_TESTED | | |
| Route names in headers | NOT_TESTED | | |
| Broken images | NOT_TESTED | | |
| Stale app name | NOT_TESTED | | |

**Sweep 8 result:** NOT_TESTED

---

## Final Output

### 1. Executive Result
NOT_TESTED — sweep in progress.

### 2. Critical Blockers Found
_to be filled_

### 3. High Priority Issues
_to be filled_

### 4. Medium Issues
_to be filled_

### 5. Screens Passed
_to be filled_

### 6. Screens Failed
_to be filled_

### 7. Handoffs
- **Content + AI Backend Engineer:** _to be filled_
- **Manual Release Ops:** _to be filled_
- **Release Control:** _to be filled_

### 8. Exact Next Step
_to be filled_

### 9. Safety Classification
_to be filled_

---

**Final classification:** TBD
