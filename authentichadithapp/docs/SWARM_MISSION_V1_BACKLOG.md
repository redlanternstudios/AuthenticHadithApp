# SWARM MISSION BRIEF — Authentic Hadith, Post-Build-24 Backlog
**Issued:** 2026-06-10 PT · **Authority:** KP (By Red / Red Lantern Studios) · **Orchestrator:** Robbie (PA) or designated Cowork lead agent
**Read first:** `docs/HANDOFF_BUILD24.md` (release state + gates) · `BUILD_FIX_LOG.md` FIX-066→068 · `SYSTEM_RULES.md` Rules 032/034 · `CLAUDE.md` startup protocol

## Mission
The v1.0 release branch is code-complete and parked behind human gates (push, ASC, device QA — KP only). This swarm works the backlog BEHIND the release so v1.0 ships clean and v1.1 is loaded. No agent touches the release gates.

## Hard rules (every agent)
1. **Gates:** NO git push, NO eas build/submit, NO ASC actions, NO package installs, NO edits to locked zones (`.claude/rules/forbidden-actions.md`). Diff + receipt → KP approves.
2. **TruthSerum:** no claim without a receipt. Probe live state (Rule 032/034) before trusting any doc — including this one.
3. **No secrets** in any output, log, or Notion page.
4. **Log everything** to `BUILD_FIX_LOG.md` (next ID: FIX-069+) and mirror to the Notion Hub (`66db3f5e-ef38-824c-8641-013bea219a7f`).
5. Known traps (do not re-derive): entitlement is `premium`; Muslim #1527 is canonical text; home `count:'exact'` is the random-picker; quiz logic lives in `app/quiz.tsx` only.

## Workstreams (parallel, independent)

### W1 — Blank translation backfill (HIGH, integrity)
212 Bukhari+Muslim rows have empty `english_text` (the gap between the 14,444 headline and 14,232 viewable). 
- Enumerate the 212 rows (collection_slug + hadith_number) via anon REST.
- Source canonical English from sunnah.com (NOTE: DB hadith_number ≠ sunnah.com refs — build the mapping per collection first, verify 3 spot-checks per batch).
- Deliverable: a reviewed `UPDATE` SQL batch + per-row source URL receipts. **KP approves before any write** (service-role required, gated).

### W2 — v1.1 grading sourcing (MEDIUM, roadmap)
For the 6 hidden collections: research authoritative grading sources (sunnah.com API access recovery, Darussalam print gradings, alternative datasets). Deliverable: source comparison doc + per-collection feasibility verdict + cost. Research only, no code.

### W3 — Corpus punctuation audit (LOW, cosmetic)
Quantify terminal-punctuation stripping across `english_text` (sample-based). Deliverable: count + proposed normalization SQL, KP-gated.

### W4 — Docs truth pass (LOW)
`ERROR_REPORT.md` status line + stale references in repo docs vs live state (per HANDOFF_BUILD24 §4). Deliverable: doc-only PR-able diff.

## What stays with KP (no agent touches)
Push → Build 24 → pinned submit → ASC attach → device QA → Submit for Review. Runbook: `docs/HANDOFF_BUILD24.md` §2.

## Reporting
Each agent closes with: State (Verified/Unknown/Blocked) + receipts + exact next human action. Orchestrator rolls up to one daily summary in the Notion Hub.
