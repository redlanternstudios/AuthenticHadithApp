# Device QA — Build 44 (v1.1.0) — Rule 040 receipt

**Build:** v1.1.0, build 44 (EAS `2ff84ece`, commit `93f567a`). **Device:** KP's physical iPhone via TestFlight.
**Rule:** every item must be GREEN on the real device before Submit for Review. New feature this build = **Learn v2**.
**Date:** 2026-06-23. Fill RESULT per item as we go.

| # | Item | What to do | PASS looks like | RESULT |
|---|------|-----------|-----------------|--------|
| 1 | Cold launch & icon | Install build 44 from TestFlight. Look at the home-screen icon. Tap to open. | Correct Authentic Hadith icon (gold, not the default blue Expo icon). App opens with no crash. | ✅ PASS (1.1.0/44, gold icon, clean launch) |
| 2 | Reviewer login + premium | Log out if needed. Log in with the reviewer account `apple.reviewer+20260604@authentichadith.app` (password in ASC → App Review Information). | Login succeeds. Premium shows active (no paywall blocking premium screens). | ☐ |
| 3 | Learn v2 (NEW) | Open the **Learn** tab → tap a path → see its modules → tap a module → tap a lesson → read it → take the in-lesson quiz. | Paths load, modules show under them, a lesson opens with content, the quiz renders, tapping an answer shows correct/incorrect + a score. No blank/empty screens. | ☐ |
| 4 | AI assistant | Open the AI assistant, ask one question (e.g. "what does Islam say about kindness"). | A grounded answer comes back (cites real hadith), no error/spinner-forever. | ☐ |
| 5 | Paywall prices + links | Trigger the paywall (a premium-gated action while logged out / non-premium). | Shows live prices (real $ amounts, not $0 or blank). The EULA (Terms) and Privacy Policy links open. | ☐ |
| 6 | Restore Purchases | On the paywall / settings, tap Restore Purchases. | Completes without error (restores entitlement or says "nothing to restore" cleanly). | ☐ |
| 7 | Account deletion | Go to settings/profile, find Delete Account. | A reachable in-app Delete Account path exists (you do NOT have to actually delete). | ☐ |
| 8 | Stability sweep | Tap through all bottom tabs and back out of a few screens. | No crash, no dead/blank/broken screen anywhere. | ☐ |

**Verdict:** ☐ ALL GREEN → clear to Submit for Review · ☐ Any RED → fix before submit (note which item + what failed).
