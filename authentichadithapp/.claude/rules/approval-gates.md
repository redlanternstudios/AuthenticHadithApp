# Human Approval Gates & Self-Healing Scopes

> Stack: Expo SDK 54 + React Native 0.81.5 + Supabase + RevenueCat.
> This file defines what you can do autonomously vs. what requires a human gate.
> It supplements `.claude/rules/forbidden-actions.md` and the root `CLAUDE.md` 10-step startup protocol.

## 1. Low-Risk Autonomous Self-Healing Scope

You may initiate code generation, run test cycles, and self-heal from errors WITHOUT explicit approval for:

### Import & Module Resolution
- Fix broken, missing, or circular import paths in `app/`, `components/`, `lib/`, `hooks/`, `types/`
- Resolve TypeScript module resolution errors that don't require new dependencies
- Add missing barrel `index.ts` re-exports inside existing module directories

### Formatting & Lint
- Prettier auto-fixes
- ESLint auto-fixes via `expo lint --fix`
- Sorting imports, removing unused imports
- Whitespace, trailing commas, single vs. double quotes (follow project style already in tree)

### TypeScript Hardening
- Add missing return type annotations on functions
- Add interface declarations for prop types where missing
- Add null guards (`?.`, `??`, type narrowing) for the recurring `BUILD_FIX_LOG.md` Golden Rule #2 patterns
- Strengthen `unknown` over `any` where the type is inferrable

### UI Resilience
- Add loading skeletons, spinners, Suspense fallbacks for missing async states
- Add error boundaries for screens that lack them
- Add empty-state UI for lists that can return zero results

### Local Validation & Reporting
- Run and re-run `qa:audit:env`, `qa:audit:routes`, `qa:audit:deps`, `qa:audit:report`
- Run `qa:truthserum` chain
- Update `docs/reports/latest-verification.md`
- Update test coverage tables

### Documentation
- Update `BUILD_FIX_LOG.md` per the mandatory post-fix protocol in root CLAUDE.md
- Update `docs/` files that aren't part of the locked-down list

## 2. Programmatic Human Verification Protocol

For any change EXCEEDING the low-risk threshold (including but not limited to anything in `.claude/rules/forbidden-actions.md`):

1. **Isolate**: Create a dedicated branch.
   ```
   git checkout -b fix/<short-slug>-<YYYYMMDD>
   ```
   Never commit straight to `main` for non-trivial changes.

2. **Diff Preview**: Stage the changes and present a line-by-line patch.
   ```
   git diff --staged
   ```
   Output the diff in the chat. Do not assume KP saw it from the file system.

3. **State the Why**: One paragraph explaining:
   - What problem this solves
   - What alternatives were considered
   - What it touches in the locked zones (if anything)
   - Revenue or shipping impact

4. **Wait for Approval**: Do not commit. Do not push. Wait for explicit "ship it" or equivalent.

5. **Post-Action Logging**: After approval and merge, append a `BUILD_FIX_LOG.md` entry per the root CLAUDE.md mandatory documentation protocol.

## 3. Hard Gates (Always Require Approval)

Even if a task seems trivial, these always gate to human:

- Any commit to `main`
- Any `git push`
- Any package install/upgrade/uninstall via `npm install`, `npm uninstall`, `npx expo install`
- Any `eas build` or `eas submit`
- Any change to files listed in `.claude/rules/forbidden-actions.md`
- Any external network call that costs money (EAS builds, OpenAI/Groq inference at scale, Stripe API mutations)
- Any operation that creates artifacts visible to third parties (App Store Connect submissions, GitHub PRs, Slack/email sends)

## 4. OPEN-BUGS GATE — No TestFlight submit until spotted bugs are closed end to end (HARDCODED)

`eas submit` (TestFlight / App Store upload) is BLOCKED automatically while
`OPEN_BUGS.md` (repo root) has any bug marked `| OPEN`. This is enforced by a
self-firing PreToolUse hook — `~/.claude/hooks/testflight-submit-gate.mjs`,
wired in `~/.claude/settings.json` (matcher: `Bash`) — that exits non-zero on
any `eas submit` while open bugs exist. It is NOT a doc you have to remember.

The discipline:
1. The MOMENT a bug is spotted (review, QA grep, crash, audit), add it to
   `OPEN_BUGS.md` as `## BUG-<id> | OPEN` with what/where/why.
2. Fix it. Verify with a real receipt (tsc/lint/test exit code, grep gate,
   logic proof). Flip status to `CLOSED` and paste the receipt.
3. Only when zero bugs are `OPEN` does the gate let a TestFlight submit through.

Two-gate model — do not conflate: this gate = pre-TestFlight (no open code/logic
bug ships to testers). `SYSTEM_RULES.md` Rule 040 = pre-App-Store-Review device
QA on the actual TestFlight build. Building (`eas build`) is NOT gated by this —
only `eas submit`. Origin: Build 82 crash (FIX-124) reached TestFlight because a
spotted-class bug was not closed before submit. Undo: remove the `Bash` matcher
from `settings.json` PreToolUse and delete the hook script.
