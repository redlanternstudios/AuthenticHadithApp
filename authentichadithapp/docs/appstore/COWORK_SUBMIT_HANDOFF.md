# COWORK HANDOFF — Switch to Build 41 + resubmit to Apple

**For:** Cowork (browser/ASC UI agent). **Self-contained.**
**Context:** Authentic Hadith build 40 was rejected (3.1.2c + 2.3.7). The metadata fixes are
already done (description EULA link, "Save 50%" removed, privacy field, review notes, new
price-free screenshots, Resolution Center reply drafted). **Build 41** (the fix build, with the
nav fix + live pricing) is now in TestFlight. Goal: attach build 41 to the version and resubmit.

- App: **Authentic Hadith** · Apple ID **6764673665** · team **By red llc / redlantern**
- New build: **1.0.0 (41)** · EAS build ID `8b0b281f-d78b-4127-afb0-14e1eb8b856b`
- Rejection submission ID: `96f2f1c8-b353-4646-95ae-64fc08cc145b`

---

## TASK A — Attach build 41 to the version
1. ASC → Apps → Authentic Hadith → version **1.0** (the rejected version) → **Build** section.
2. If it shows build **40**, remove it and **select build 41** (1.0.0, 41). Confirm TestFlight
   processing is complete (build shows as available, not "Processing").
3. Save. Verify the version now shows **Build 41**, not 40.

## TASK A2 — Set Premium Monthly subscription Description (cosmetic, no rebuild)
The in-app paywall renders each tier's description from its ASC product Description field
(`pkg.product.description`). **Premium Monthly** (`ah_monthly_premium`) currently has an EMPTY
Description, so it shows no subtitle while Annual/Lifetime do. Set it to this EXACT value:
- ASC → Monetization → Subscriptions → group "Premium" → **Premium Monthly** → Localization (English) → **Description**:
  ```
  Premium access month to month. Cancel anytime.
  ```
- ⚠️ **Must be DISTINCT from Premium Annual.** Annual reads "Unlimited AI assistant, learning
  paths & quizzes." Do NOT copy that into Monthly — two identical subtitles = a duplicate. The
  value above is the agreed Monthly line and matches the app's code fallback exactly. If a prior
  pass already set Monthly to the Annual text, REPLACE it with the value above.
- No price/discount/"free" language (2.3.7-safe). Not a submission blocker; metadata only, no new build.

## TASK B — Resolution Center reply + screen recording  ⚠️ NEEDS KP'S FILE
1. The reply is already drafted in Resolution Center (from the prior handoff).
2. **Attach KP's screen recording** (KP provides the file — it shows the paywall with each
   subscription's title/length/price and tapping the Terms of Use (EULA) + Privacy Policy links).
   **Apple explicitly required this** — do not send the reply without it.
3. Send the reply.
> If KP has not provided the screen recording yet, STOP at this task and tell KP — do not submit
> without it, and do not send the reply empty.

## TASK C — Submit for Review
1. Only after Task A (build 41 attached) and Task B (reply + recording sent).
2. Confirm the attached build is **41**, screenshots are the new price-free set, description has
   the EULA link, and the Annual subscription description has no "Save 50%".
3. Submit for Review.

---

## GUARDRAILS
- **Verify build 41 is the attached build before submitting.** Never submit with build 40 still attached (R-004 wrong-build).
- Do not send the Resolution Center reply without KP's screen recording attached.
- Make ONLY these actions. If any screen differs or anything is ambiguous, STOP and report to KP.
- Do not echo the demo password anywhere.

## KP's pre-submit gate (recommended, Rule 040)
Before Cowork submits, a 5-min smoke test of build 41 in TestFlight on a physical device:
reviewer login + premium shows, paywall renders the live localized price, Progress screen's
"Home" control works (FIX-092), Restore Purchases works. Then record the ~30s screen recording
for Task B from that same build.
