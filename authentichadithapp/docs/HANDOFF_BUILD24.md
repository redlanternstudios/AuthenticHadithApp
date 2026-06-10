# HANDOFF — Build 24 Resume Package
**Written:** 2026-06-10 PT · **Author:** Claude Code session (FIX-066 → FIX-068)
**Purpose:** Resume the App Store release cold — KP, Cowork, swarm, or any agent — with zero context loss.
**Operating rule:** No secrets in this doc. Project refs and IDs only.

---

## 1. Current State (all receipts from live probes, 2026-06-10)

| Thing | State | Receipt |
|---|---|---|
| Branch `release/appstore-ready-v1.0` | **2 commits ahead of origin, NOT pushed** | `git log`: `b5aebb7`, `d3dc352` local; `761aad0` = pushed base |
| `b5aebb7` | FIX-068 — PremiumGate spinner instead of blank while RC entitlement resolves | `BUILD_FIX_LOG.md` FIX-068 |
| `d3dc352` | FIX-067 — quiz word-boundary hadith excerpt (kills mid-word "...") | `BUILD_FIX_LOG.md` FIX-067 |
| `761aad0` (pushed) | FIX-066 batch — learn route titles, 14,444 count, AI markdown, sunnah icon map, quiz narrator dedupe | `BUILD_FIX_LOG.md` FIX-066 |
| TestFlight Build 23 | Uploaded to ASC (submission `605cea61-ab75-4065-88df-35bb5ca471f2`), contains FIX-066 only — **does NOT contain FIX-067/068** | EAS build `a7786cdd-c661-49ab-b587-57938898e871`, commit `761aad0` |
| ASC version 1.0 | `PREPARE_FOR_SUBMISSION`, attached build = **22** (stale) | ASC API probe 2026-06-10 |
| Apple Review | **Nothing submitted, nothing in review** | Same probe |
| tsc / eslint on branch tip | exit 0 / exit 0 | FIX-068 verification run |

### Corrections to stale planning docs (trust these, not the playbooks)
- RevenueCat entitlement ID is **`premium`** (`lib/revenuecat/config.ts:20`). The key `rc_promo_premium_lifetime` named in planning prompts does not exist in code.
- Sahih Muslim #1527 is **not truncated** — DB matches canonical Siddiqui translation (sunnah.com/muslim:670c; DB numbering ≠ sunnah.com refs).
- The `count:'exact'` query in `app/(tabs)/index.tsx` is the random-hadith offset picker, NOT the displayed total. Do not remove it.
- No `components/quiz/QuizCard.tsx` or `lib/quiz/generateQuiz.ts` exists — all quiz logic is in `app/quiz.tsx`.

---

## 2. Resume Runbook (dependency order, exact commands)

> Gates: steps 1–3 fire only on KP's word. Steps 4–6 are human-only in ASC.

1. **Push** (KP gate):
   `git push origin release/appstore-ready-v1.0`
2. **Build 24** (KP gate):
   `npx eas-cli build --platform ios --profile production --non-interactive --no-wait`
   Expect: version 1.0.0, **build number 24**, commit `b5aebb7`. Capture the build ID from the output URL.
3. **Submit to TestFlight** (KP gate) — **pin by `--id`, NEVER `--latest`** (stale-binary trap: Build 20 incident + Build 22 near-miss):
   `npx eas-cli submit --platform ios --profile production --id <BUILD24_ID> --non-interactive`
   This only uploads to TestFlight. It does NOT submit to Apple Review.
4. **ASC: attach Build 24 to version 1.0** (swap off Build 22) — App Store Connect → app 6764673665 → version 1.0 → Build.
5. **Device QA on Build 24** — checklist in §3. Human-only.
6. **Submit for Review** — KP's finger only, after §3 is green and `docs/SUBMISSION_BLOCKER_LEDGER.md` probes pass (Rule 034).

---

## 3. Device QA Checklist (Build 24)

**Regression on this batch's fixes:**
- [ ] Learning Paths: tap a path → header shows the real path title (never `[pathId]`), lesson list populates
- [ ] Lesson detail: header shows lesson title (never `[lessonId]`), body content renders, Mark as Complete appears after load
- [ ] Quiz: question cards show word-boundary excerpts ending `…` only when long — never mid-word cuts like "(he meant garl..."
- [ ] Quiz: no duplicate narrator options (e.g. "Ibn Umar" twice); results rows wrap, no single-line ellipsis
- [ ] Sunnah: category rows show emoji icons — never clipped words ("Moor", "Hanc")
- [ ] AI Assistant: responses render bold/headers/lists (no raw `**` or `###`); both disclaimers still visible
- [ ] Home: reads exactly "14,444 hadiths from 2 major collections"
- [ ] Premium sections show a spinner (not blank space) while entitlement resolves — test on throttled network

**Still pending from Build 22 QA:**
- [ ] A4: Paywall loads with $9.99 / $49.99 / $99.99
- [ ] A5: Restore Purchases works
- [ ] B smoke tests: cold launch, all 5 tabs, hadith detail, Today/Quiz/Sunnah/Badges, save/unsave, sign-out/sign-in

---

## 4. Open Items / Watch-outs

- **14,444 vs viewable 14,232:** 212 Bukhari+Muslim rows have blank `english_text` (filtered from browse surfaces). Headline matches App Store listing per KP directive; the honest long-term fix is backfilling the 212 translations. See comment in `lib/hadith/visibleCollections.ts`.
- **Terminal punctuation stripped** from `english_text` tails across the corpus (cosmetic, systemic, low priority).
- **ERROR_REPORT.md** content-integrity section: resolved-by-decision (Sahihayn-only V1, AUDIT-061) but the file status line may need refresh on next docs pass.
- **ASC API access:** ES256 JWT, key ID `L65WW2C698`, issuer in Notion punch list, `.p8` at `~/private_keys/` — method documented in memory/Notion; never copy key contents anywhere.
- Pre-submit: run every probe in `docs/SUBMISSION_BLOCKER_LEDGER.md` to green in one pass (SYSTEM_RULES Rule 034). A doc saying GO is a claim, not a receipt.
