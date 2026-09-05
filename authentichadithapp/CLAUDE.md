# iOS App — Claude Code Instructions

## TruthSerum Protocol (NO CLAIM WITHOUT A RECEIPT) — GOVERNS EVERY RESPONSE

This is the first law of this repo. It outranks everything below it. Any operator
working here — Claude Code, Cowork, a swarm agent, a cloud/web session — inherits it.
Ported from KP's global engine (`packages/truthserum/` in the QBos repo).

### The Law
Never upgrade Unknown to Verified without receipts. Do not say a thing is done,
working, fixed, deployed, built, passing, or submittable unless you can point to the
proof in the same message. If you cannot prove it, say so plainly and mark it Unknown.
Confidence is earned by evidence, never asserted.

### Three-State Vocabulary (use these words explicitly)
- **Verified** — complete proof in hand, shown.
- **Unknown** — no proof yet, or indeterminate. The default. Name the exact missing receipt.
- **Blocked** — proof it cannot proceed (error, missing dependency, denied permission). Show the blocker.

### Forbidden Claim Words (banned unless a receipt sits next to them)
deployed, live, published, ready, working, completed, fixed, verified, built, passing,
connected, authenticated, submitted, done. No proof, no word — rewrite to
"status Unknown for X, missing receipt: Y."

### What Counts As A Receipt (in this repo specifically)
- Command output: `npx tsc --noEmit` exit code, `eslint` result, test summary, an `eas build` status line.
- A file path + line number actually read or written (`path:line`), or a diff.
- A live tool result: an HTTP status, an ASC/EAS API response, a Supabase row + id, a deploy URL returning non-404.
- A timestamp + source for any external/time-sensitive fact.
- Per the **Release Gating** section below + `SYSTEM_RULES.md` Rule 034: "ready to submit",
  "reviewer can log in", "premium is active" are CLAIMS until a live production probe proves them.
  A readiness/audit doc that says GO is a hypothesis, not a receipt.

### Proof-Gated Reporting (how every non-trivial task ends)
Close with a short receipt block: **State** (Verified | Unknown | Blocked, per claim if they
differ) · **Receipts** (evidence for each Verified claim) · **Missing** (for anything Unknown,
the exact proof still needed and how to get it). Never a naked "done."

### Anti-Fabrication
Do not invent file paths, command results, API responses, build numbers, or URLs. "Reach into X"
means actually open X and verify — never simulate a fetch and narrate a result. A guess is labeled
a guess with its confidence and what would confirm it. Silence about a failure is a violation:
if a step failed, was skipped, or could not be verified, say so in the same message.

---

## Web↔Mobile Parity Discipline (STANDING RULE — runs on every parity/restyle task)

Hardcoded 2026-06-24 via CTP. This is how visual/data parity between this iOS app and the
web app is ALWAYS done — no re-deciding the process each time, no improvising quality.

### CTP framing (the why, so it isn't cargo-culted)
- DRIVER: keep the app and the web app looking and syncing like one product, repeatably, at quality.
- MECHANISM: the web app is the design Source Of Truth; the mobile app is brought to it.
- REAL CONSTRAINT: not the styling — it's (a) not breaking the shared data layer, and (b) proving
  the cross-device sync actually works before anyone claims it does. Those are where it fails.

### The standing rule (always applies)
1. SSOT = the WEB app `v0-authentic-hadith` (repo `/Users/kp/Projects/v0-authentic-hadith`). Its
   `app/globals.css` tokens + `app/layout.tsx` fonts (Cinzel headings / Geist body) define the look.
   Parity work changes the MOBILE app to match the web, never the reverse, unless KP says otherwise.
2. RUN IT THROUGH THE asf PIPELINE WITH CTP GATES, each stage in its lane, upstream→downstream:
   asf-architect (lock the data/sync contract) → asf-designer (parity spec) → asf-builder
   (implement) → asf-qa-gate (tsc + expo-doctor + `expo export` boot proof + font-name match).
   No stage advances on the prior stage's word — the orchestrator ZERO-TRUST verifies every
   load-bearing claim against ground truth (re-run the command, read the diff, hit the API).
3. NEVER TOUCH THE DATA LAYER IN A RESTYLE. `lib/services/bookmark-service.ts`, `hooks/use-hadith.ts`,
   and anything under the forbidden-actions auth/db/purchase zones stay byte-identical. Prove it with
   `git status` showing those files unchanged. A restyle that edits data logic is a failed restyle.
4. THE SYNC TRUTH (verified 2026-06-24): both apps ship against Supabase project
   `nqklipakrfuwebkdnhwg` (NOT the `lwklog…` project in the MCP org). The cross-device bookmark
   sync table is `saved_hadiths` (both write `{user_id, hadith_id}` keyed on `hadiths.id`). The web
   "My Hadith" screen uses a SEPARATE `user_bookmarks` table the phone never writes — DEMO THE SYNC
   FROM THE HADITH DETAIL SCREEN, never from My Hadith.
5. READINESS IS A PROBE, NOT A DOC (ties to Rule 034/040 below). "Parity is done / sync works" is a
   CLAIM until: `expo export` exits 0 (compile proof) AND a live same-account round-trip (bookmark on
   web detail → appears on phone) is shown on a physical device. The device round-trip is KP's, and
   it is the last 10% no simulator can prove.

### Where it lives + how it fires + undo
LIVES HERE in this root `CLAUDE.md`, which the Mandatory Session Startup below forces every operator
to read before touching code — so it loads itself, it is not a passive doc. UNIVERSAL pieces (the asf
pipeline, CTP gates, the zero-trust return gate) already live in KP's global `~/.claude/CLAUDE.md`;
this section is the app-specific binding. UNDO: delete this section.

## Mandatory Session Startup

Before modifying code, Claude Code must read:

1. `PROJECT_CONTEXT.md`
2. `ERROR_REPORT.md`
3. `BUILD_FIX_LOG.md`
4. `SYSTEM_RULES.md`
5. `PROJECT_PLAYBOOK.md`
6. `APP_LAUNCH_PLAYBOOK.md`
7. `AI_OPERATOR_HANDOFF_PROTOCOL.md`
8. `CURRENT_MODEL_ASSIGNMENTS.md`
9. `WORKFLOW_ROUTER.md`
10. `../RELEASE_ENGINEERING_SOP.md` (Mandatory canonical release engineering lifecycle & state model)

Claude Code must not modify app code until the full mandatory startup review is complete.

If any required file is missing, Claude Code must notify KP before making major code changes and recommend creating or restoring the missing file.

`MODEL_AUDIT_LOG.md` is required only when reviewing, changing, or questioning model/tool assignments.

---

### Step 1: Read `PROJECT_CONTEXT.md`

- Defines project identity, ownership, KP's role, product goal, current strategic objective, launch context, business relationship to Penn Enterprises, technical priorities, sensitive areas, AI operator context, and success standard.
- Authentic Hadith is Rory's product unless KP explicitly states otherwise. Do not confuse ownership with Penn Enterprises LLC.
- All later steps must be interpreted through the priorities and ownership rules in this file.

---

### Step 2: Read `ERROR_REPORT.md`

- If status is 🔴 ACTIVE → this is the #1 priority. Fix it before anything else unless KP explicitly overrides.
- If status is 🟢 No active errors → proceed to the user's request only after completing the rest of the mandatory startup review.

---

### Step 3: Read `BUILD_FIX_LOG.md`

- Search for keywords related to the current task or error.
- If a matching fix exists → apply it, do not reinvent the solution.
- This file is the app's repair memory. Use it.

---

### Step 4: Read `SYSTEM_RULES.md`

- Contains the permanent engineering rules derived from recurring bug patterns.
- These rules are non-negotiable. Every code change must comply with them.
- If a new recurring pattern emerges, add it as the next numbered rule.
- Rule 009 is the escalation rule: any bug that appears twice becomes a permanent rule.

---

### Step 5: Read `PROJECT_PLAYBOOK.md`

- Universal operating playbook for this project: identity, tech stack summary, layer routing summary, safety/approval gates, debugging protocol, memory update rules, multi-LLM handoff summary, known risks.
- Defers to `APP_LAUNCH_PLAYBOOK.md` for full iOS build/launch detail.
- Defers to `WORKFLOW_ROUTER.md` for problem classification.

---

### Step 6: Read `APP_LAUNCH_PLAYBOOK.md`

- Contains the correct build process, config rules, and common fixes for the iOS app.
- Follow the dependency rules.
- Never install packages without checking Expo SDK compatibility.
- Follow the destructive command rules.
- Never run nuclear resets without KP approval.

---

### Step 7: Read `AI_OPERATOR_HANDOFF_PROTOCOL.md`

- Defines how Claude Code coordinates with KP's broader AI operator stack: ChatGPT, Gemini, v0, Make.com, Notion/Drive, By Red OS, and future approved tools.
- Tells Claude Code when to proceed directly versus when to generate a handoff prompt for another operator.
- Required before any task that may touch business strategy, current research, UI prototyping, automation design, model/tool routing, or external knowledge.

---

### Step 8: Read `CURRENT_MODEL_ASSIGNMENTS.md`

- Lists the current approved model/tool assigned to each operator role.
- Always check before recommending a model/tool handoff.
- Claude Code may recommend a model/tool assignment change, but must not update `CURRENT_MODEL_ASSIGNMENTS.md` unless KP explicitly approves the change in the current session.

---

### Step 9: Read `WORKFLOW_ROUTER.md`

- Tells Claude Code whether the issue lives in VS Code, Expo config, or Xcode.
- Classify every problem before touching files as:
  - `VS_CODE_APP_LAYER`
  - `EXPO_HYBRID_LAYER`
  - `XCODE_NATIVE_LAYER`
  - `UNKNOWN_NEEDS_TRIAGE`
- Default working tool is VS Code.
- Xcode is only for provably native iOS issues.
- Never run `npx expo prebuild --clean` or edit `ios/` files without KP approval.

---

## After Fixing Any Bug: Mandatory Documentation Protocol

After fixing any bug, Claude Code must:

1. Update `BUILD_FIX_LOG.md` with a full entry:
   - Fix ID
   - Date
   - Root cause
   - Files changed
   - Exact fix applied
   - Verification steps
   - Lesson learned
   - Pattern category

2. Reset `ERROR_REPORT.md` status back to 🟢 No active errors if the bug is fully resolved.

3. Check whether this issue matches an existing recurring pattern in the `BUILD_FIX_LOG.md` Pattern Tracker.

4. If the bug category has appeared 2 or more times, update `SYSTEM_RULES.md` with a new permanent rule or strengthen an existing one.

5. If deployment or architecture behavior changed, update `APP_LAUNCH_PLAYBOOK.md`.

6. If new operational guidance is discovered, update `CLAUDE.md` onboarding instructions only if necessary.

7. **Mirror the fix into the Notion Knowledge Hub with precision** (KP directive). Create or update a receipt page under **Authentic Hadith - Project Knowledge Hub** (page ID `66db3f5e-ef38-824c-8641-013bea219a7f`): one child page per build or fix batch, mirroring the exact FIX ID, root cause, files changed, row counts, and verification numbers from `BUILD_FIX_LOG.md` (mirror, do not paraphrase from memory). Server-side / data-only work that ships no new binary gets a dated non-build receipt. Then refresh the Hub's **Current State**, **Next KP Action**, and **Index** blocks so the top never goes stale. Hub operating rule: NO secrets — project refs and table names only, never service-role keys, JWTs, or full user UUIDs.

8. Never complete a debugging task without updating project memory.

The system must improve after every fix. No exceptions.

---

## Multi-LLM Operator Routing

Claude Code operates as the Coding Operator inside KP's broader AI operator stack.

Claude Code must follow:

1. `AI_OPERATOR_HANDOFF_PROTOCOL.md` for routing tasks to ChatGPT, Gemini, v0, Make.com, or other approved tools.
2. `CURRENT_MODEL_ASSIGNMENTS.md` for the latest approved model/tool assignments.
3. `MODEL_AUDIT_LOG.md` only when reviewing past model/tool assignment decisions.

Claude Code should proceed directly on repo-level coding, debugging, implementation, build repair, and engineering documentation.

Claude Code should generate a handoff prompt when the task is better suited for:

1. ChatGPT: strategy, synthesis, SOPs, business planning, prompts, audits.
2. Gemini: current external research, market scans, tool comparisons, documentation lookup.
3. v0: UI prototypes, frontend screens, dashboard concepts.
4. Make.com: workflow automation, integrations, trigger-action systems.
5. Notion / Google Drive / By Red OS: long-term memory, SOPs, source-of-truth records.

Claude Code must not assume any model/tool is permanently best.

Current assignments must be reviewed monthly or after major model/tool changes.

Claude Code may recommend assignment changes, but must not update `CURRENT_MODEL_ASSIGNMENTS.md` without explicit KP approval in the current session.

---

## App Stack: Do Not Upgrade Without Approval

- Expo SDK 54
- React Native 0.81.5
- React 19.1.0
- TypeScript 5.9.2
- Bundle ID: `com.byred.authentichadith`
- Use `npx expo install` for all packages.
- Never use raw `npm install` for Expo-managed dependencies.
- Supabase 2.48.1
- React Query 5.62.11
- Zustand 5.0.2
- RevenueCat 9.9.0
- i18next 23.16.8
- Vercel AI SDK 4.3.19
- `@ai-sdk/groq` 1.2.9

---

## File Priority Order

1. `PROJECT_CONTEXT.md` → project identity, ownership, priorities
2. `ERROR_REPORT.md` → current problem
3. `BUILD_FIX_LOG.md` → historical solutions
4. `SYSTEM_RULES.md` → permanent engineering rules
5. `PROJECT_PLAYBOOK.md` → universal operating playbook
6. `APP_LAUNCH_PLAYBOOK.md` → iOS build/launch process reference
7. `AI_OPERATOR_HANDOFF_PROTOCOL.md` → multi-LLM routing rules
8. `CURRENT_MODEL_ASSIGNMENTS.md` → current operator/tool mapping
9. `WORKFLOW_ROUTER.md` → tool routing: VS Code vs Expo vs Xcode
10. `../RELEASE_ENGINEERING_SOP.md` → canonical enterprise release engineering SOP & 8-state model
11. `MODEL_AUDIT_LOG.md` → historical model assignment decisions, only when model/tool assignment review is relevant
12. `package.json` → dependency truth
13. `app.json` → static config
14. `app.config.js` → dynamic config
15. `eas.json` → build profiles

---

## Expo Config Rules

- `app.json` = static metadata:
  - name
  - slug
  - scheme
  - icons
  - splash
  - bundle ID
  - build number
  - plugins

- `app.config.js` = dynamic config:
  - environment-based values
  - `EXPO_PUBLIC_` variables

- Never put secrets in `app.json`.

---

## Dependency Rules

1. Check `package.json` first.
2. Know what is installed before adding anything.
3. Check `package-lock.json`.
4. Know exact versions locked before changing dependencies.
5. Check Expo SDK 54 compatibility before adding any package.
6. Prefer Expo-compatible / managed packages.
7. Use `npx expo install package-name`, not `npm install`, for Expo-managed dependencies.
8. Do not randomly upgrade React, React Native, or Expo.
9. If a package conflict arises, check Expo SDK docs first.
10. Never upgrade app stack dependencies without KP approval.

---

## Destructive Commands: Never Without KP Approval

Never run these without KP approval:

- `rm -rf node_modules package-lock.json`
- `rm -rf ios android`
- `npx expo prebuild --clean`
- Any version upgrade of React, React Native, or Expo
- Any command that deletes generated native folders
- Any command that rewrites native project structure

---

## Release Gating: Verify Reviewer Readiness Against Production (NON-NEGOTIABLE)

### HARD GATE — No submission without full device QA (SYSTEM_RULES.md Rule 040)
"Submit for Review" is BLOCKED until KP confirms every release-critical flow on the **actual TestFlight build, on a physical iPhone, with screenshots/results.** No operator may claim a build "passes QA" / "ready to submit" / "production-ready" from a doc, audit, simulator, or code inspection — only from KP's device evidence. The 8-item device checklist (cold launch, reviewer login+premium, account deletion, AI assistant, paywall prices, restore purchases, lessons, app icon) must be GREEN with KP receipts, and must be re-confirmed on every NEW build number. Attaching a build to the version is permitted prep; it does NOT unlock submission. Full rule: `SYSTEM_RULES.md` **Rule 040**.

Before telling KP the app is submittable — or that the Apple reviewer can log in and see premium — you MUST prove it against PRODUCTION with live network calls. A readiness doc that says "GO" is a claim, not a receipt. See `SYSTEM_RULES.md` **Rule 034** for the full loop and the exact admin/grant commands.

The minimum live receipts before any "ready to submit" statement:

1. **Reviewer login** — `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` with the demo credentials returns an `access_token`. FAIL = account never created.
2. **Premium entitlement** — `GET https://api.revenuecat.com/v1/subscribers/{auth_uuid}` shows the `premium` entitlement active. FAIL = never granted in RevenueCat.
3. **Deployed backend** — `POST https://www.authentichadith.app/api/mobile-chat` is NOT 404 (the AI backend lives in the SEPARATE `v0-authentic-hadith` web repo, deploys from its `main`; a route file in THIS repo proves nothing — see `BUILD_FIX_LOG.md` FIX-062).

If a probe fails, fix the live state (GoTrue admin API / RevenueCat promotional grant), then re-run the same probe to prove green. Never trust the doc over the probe.
