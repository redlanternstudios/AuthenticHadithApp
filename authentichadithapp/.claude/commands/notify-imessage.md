# /notify-imessage — Outbound iMessage Alert Routing

> Slash command. When invoked, parses the latest QA verification report and routes a summary payload to KP via iMessage (or a configured fallback channel).

## Strategy

Pull the most recent `docs/reports/latest-verification.md` summary, extract the structural status fields, format a concise payload, and dispatch through the registered outbound notify channel.

## Payload Schema

The summary payload sent over the wire follows this shape:

```
Project:        AuthenticHadith
Bundle:         com.byred.authentichadith
Timestamp:      <ISO-8601 UTC>
Compilation:    <PASS | FAIL>
Env Check:      <PASS | WARN | FAIL>
Routes Check:   <count> screens, <count> layouts
Deps Check:     <PASS | FAIL>
Anomalies:      <count> flagged
Runtime Tag:    <commit-sha-short> | <branch>
```

Hard ceiling: **300 characters** for the formatted iMessage body. Longer reports get truncated with a `…` and a link to the full local report path.

## Execution Steps

1. **Locate the latest report.**
   - Read `docs/reports/latest-verification.md` from the project root.
   - If the file does not exist, run `npm run qa:truthserum` first to generate it, then re-read.

2. **Parse the structural fields.**
   - Extract: timestamp, compilation status, env perimeter status, anomaly count.
   - If any field is missing, surface a clear error and abort the send — do not send a partial payload.

3. **Compose the payload.**
   - Use the schema above.
   - Append the short git SHA: `git rev-parse --short HEAD`.
   - Truncate to 300 chars if needed.

4. **Dispatch to the notify channel.**
   - Target integration: **Make.com scenario `s4933390_notify_kp`** (Penn Enterprises notify rail).
   - Endpoint resolution:
     - Read `NOTIFY_KP_WEBHOOK_URL` from `.env.local` (gitignored). If missing, abort and surface a clear setup error pointing the operator to provision the webhook URL from the scenario's Webhook trigger module.
     - Optional override: env var `NOTIFY_KP_WEBHOOK_URL_OVERRIDE` for ad-hoc testing.
   - Dispatch contract:
     ```
     POST $NOTIFY_KP_WEBHOOK_URL
     Content-Type: application/json

     {
       "source": "authentichadith.qa-truthserum",
       "text":   "<payload formatted to schema above, <= 300 chars>",
       "report_path": "docs/reports/latest-verification.md",
       "git_sha": "<short SHA>",
       "timestamp": "<ISO-8601 UTC>"
     }
     ```
   - On success (HTTP 2xx): print the dispatched payload + Make.com execution ID (if returned) to stdout.
   - On failure (non-2xx, timeout, DNS error): log the full payload + error to `docs/reports/notify-failures.log` with timestamp; do not retry in-process (avoid amplification); surface the failure to KP in the session.

5. **Confirm delivery.**
   - If the integration returns a delivery receipt or message ID, log it.
   - If not, log the send timestamp and treat as best-effort.

## Integration Wiring (Locked: PE `s4933390_notify_kp`)

The dispatch is wired to the Penn Enterprises Make.com scenario **`s4933390_notify_kp`**. This is the canonical alert rail for KP across all PE automations.

### One-time operator setup (required before first send)

1. Open Make.com → scenario `s4933390_notify_kp` → first module (Webhook trigger).
2. Copy the unique webhook URL.
3. Append to `authentichadithapp/.env.local`:
   ```
   NOTIFY_KP_WEBHOOK_URL=https://hook.make.com/<unique-token>
   ```
4. Verify the scenario's downstream modules accept the JSON contract documented in step 4 above (`text`, `source`, `report_path`, `git_sha`, `timestamp`). Adjust the Make.com data mapping if any field name differs.
5. Run a single dispatch as a smoke test; confirm KP receives the alert and the Make.com execution log shows a clean run.

### Fallback paths (not preferred; only if PE rail is down)

- Local AppleScript via `osascript` — only when running on KP's Mac, not on EAS/VPS.
- Direct webhook to `s3726041_tool_send_an_email` — email rail, useful if iMessage path is degraded.

### Pre-flight gate

Before dispatch:
- If `NOTIFY_KP_WEBHOOK_URL` is unset, abort with `[NOT DISPATCHED — NOTIFY_KP_WEBHOOK_URL not configured in .env.local]` and print the formatted payload so the operator can route it manually.
- If `docs/reports/latest-verification.md` is missing, run `npm run qa:truthserum` first; never send empty/partial payloads.

## Failure Modes to Watch

- Missing report file → run `qa:truthserum` first, do not send empty payload.
- Network/webhook timeout → log to `notify-failures.log`, do not retry in the same invocation (avoid amplification).
- Secret exposure → never include `.env` values, API keys, or session tokens in the payload.

## Related

- `.claude/rules/forbidden-actions.md` — defines what content can never leave this workspace.
- `scripts/qa-audit-report.mjs` — generates the report this command consumes.
- Root `CLAUDE.md` — startup protocol and project identity.
