# Build 28 — Device QA Walkthrough (Rule 040 Hard Gate)

**Build:** 1.0.0 (28) · commit `db2fe8f` · TestFlight VALID
**Rule:** No Submit for Review until all 8 are ✅ with a KP device screenshot. QA does NOT carry forward from Build 27 — re-run the full list on this build.
**Status key:** ⬜ Unknown (default) · ✅ Pass (KP receipt) · ❌ Fail · ⚠️ Needs investigation

> Each item: do it on the phone → compare to EXPECT → mark status → save the screenshot.

| # | Check | Status |
|---|---|---|
| 1 | Cold launch | ⬜ |
| 2 | Reviewer login + **premium unlock** ← at-risk | ⬜ |
| 3 | Account deletion | ⬜ |
| 4 | AI Assistant | ⬜ |
| 5 | Paywall prices | ⬜ |
| 6 | Restore Purchases | ⬜ |
| 7 | Lessons / Learn + Next/Prev | ✅ (KP confirmed) |
| 8 | App icon | ⬜ |

---

### 1 — Cold launch
- **Do:** Fully kill the app (swipe out of app switcher), wait ~10s, reopen.
- **Expect:** Splash → app, no white flash, lands signed-in (if you were), correct theme. Interactive in ~≤4s.
- **Capture:** screen recording if possible, else note time-to-interactive + any flash.

### 2 — Reviewer login + premium unlock  ← THE at-risk item
- **Do:** Sign in as the Apple reviewer account → open **Learn** → look at the premium (locked 🔒) paths.
- **Expect:** Premium paths are **UNLOCKED** (no lock, openable). This proves the RevenueCat `premium` entitlement resolved live for the reviewer's Supabase UID.
- **FAIL sign:** premium paths still show 🔒 / "View Plans" while signed in as reviewer = reviewer would be blocked = **submission blocker**.
- **Capture:** screenshot of the Learn screen signed in as reviewer.

### 3 — Account deletion (prior rejection cause)
- **Do:** Create/sign in to a throwaway account → Settings → Delete Account → type DELETE → confirm.
- **Expect:** "Account Deleted" → signed out; logging back in fails (credentials gone).
- **Capture:** before + after screenshots.

### 4 — AI Assistant (prior rejection cause)
- **Do:** Open AI Assistant, ask a question.
- **Expect:** a real answer renders (markdown formatting), disclaimer visible below.
- **Capture:** screenshot of the answer.

### 5 — Paywall prices
- **Do:** Trigger the paywall (e.g. a locked premium path → View Plans, or Settings → Subscription).
- **Expect:** three products load with **$9.99 / $49.99 / $99.99**; screen does not crash.
- **Capture:** screenshot of the paywall.

### 6 — Restore Purchases
- **Do:** Settings → Subscription (and/or Profile) → tap Restore Purchases.
- **Expect:** runs without error; reflects current entitlement.
- **Capture:** screenshot of the result.

### 7 — Lessons / Learn + Next/Previous  ✅ DONE
- KP confirmed on device: lessons render, Next/Previous works (V1 static lock).

### 8 — App icon
- **Do:** Home screen / App Library → find Authentic Hadith.
- **Expect:** green/gold marble logo with Arabic calligraphy — NOT a blue Expo default.
- **Capture:** screenshot of the home-screen icon.

---

## Reviewer Premium Access — the remaining "not hardcoded" item

**Current state (verified earlier this session):** the reviewer's premium comes from a RevenueCat **promotional `premium` grant** on their UID. It works *if* RevenueCat initializes and resolves the entitlement live (Rule 039 probe B11 confirms the grant exists server-side). It is **not** guaranteed in code — if RC hiccups or the identity sync lags, the reviewer could momentarily see locked content.

**Two ways to make it bulletproof:**
- **A — Keep RC-only (current):** rely on the promotional grant + verify item #2 on device. Cleanest, no code change, but depends on live RC resolution.
- **B — Hardcoded reviewer bypass (the "hardcode" KP wants):** in the premium check, if the signed-in user is the reviewer account, force `isPremium = true` regardless of RevenueCat. Guarantees the reviewer is NEVER blocked even if RC fails. Touches SUBSCRIPTION PROTECTED logic → requires KP authorization. Tradeoff: a small, scoped, reviewer-only override shipped in production (a common, accepted App Review pattern).

**Decision needed from KP.** If B, the authorization sentence is in the chat reply.
