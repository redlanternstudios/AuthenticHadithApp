<!-- CODEX:START -->
# Codex Agent Configuration & Operating Rules
# Project: Authentic Hadith (Penn Enterprises LLC)

## Release Engineering Standard Operating Protocol (MANDATORY)

Before implementing, building, packaging, or authorizing any release:
1. Read `RELEASE_ENGINEERING_SOP.md` (the canonical release operating system).
2. Adhere strictly to the 8-state release model: `STATE 0 (ISSUE CONFIRMED)` through `STATE 8 (SHIP APPROVED)`.
3. Never equate code completion, passing local tests, or successful builds with a release.
4. Run `npm run qa:release` in `authentichadithapp/` before pushing any release candidate branch.
5. All AI agents must format handoffs using the mandatory 10-point Agent Handoff Protocol.

## Cross-Agent Architectural Invariants (MANDATORY FOR ALL AGENTS)

All AI agents (@Money-Maker, @Jobo, @Bob-the-Builder, Claude, Codex, Gemini) operating on this codebase must adhere strictly to these hardcoded invariants:

1. **Root Layout vs. Feature Gating**: Never put `isPro` or paywall intercepts in root navigation. The root gate handles ONLY auth and onboarding. Freemium gating occurs strictly at feature boundaries.
2. **Synthetic User Journey Pre-Flight**: Never use TestFlight as a debugger. Always run and pass `__tests__/navigation/access-model.test.ts` and `npm run qa:release-guard` before build dispatch.
3. **Non-Fatal Auth Profile Writes**: Never allow `profiles.insert` during `signUp()` to throw modal alerts. Secondary profile creation is non-fatal; onboarding Step 3 handles persistent reconciliation.
4. **Resilient Multi-Tier AI Cascade**: Always implement multi-model fallbacks (Groq `llama-3.1-8b-instant` -> Vercel AI Gateway `openai/gpt-4o-mini`) and dual-endpoint client routing (`[primaryApexUrl, previewVercelUrl]`).
5. **Unabridged Sacred Text Display**: Never clamp hadith text with 3-line or 4-line ellipses (`numberOfLines`). All hadiths must render completely in Arabic and English.
6. **Enterprise Security Tripwires (SYS-SEC-001)**: Enforce zero client-side server secrets, cryptographically strict environment schema validation, and transport cleartext bans before every production build or deployment dispatch.
7. **Autonomous Enterprise Automation & Stack Upgrades (SYS-AUTO-001)**: All AI agents must prioritize continuous, hands-free automation over manual operational toil. Every recommendation and implementation must automatically bake in proactive telemetry, background self-healing hooks (e.g., git post-commit hooks, automated RAG updates), and concrete architectural stack upgrades rather than manual maintenance steps.
8. **Autonomous Context-Aware Telemetry Reflex (SYS-REFLEX-001)**: Keymon must never have to manually prompt an agent to log receipts, quantify deliverables, sync skills, or update telemetry. Upon completing any task, PR, bug fix, or milestone, all agents must autonomously infer the context (ENGINEERING, RELEASE_GUARD, CLIENT_DELIVERY, INFRASTRUCTURE, OPERATIONS) and reflexively invoke the correlating skill and receipt engine.

## Telemetry, Output Quantification & RAG
- Log completed work using: `python3 scripts/penn_rag.py receipt --agent "@Bob-the-Builder" --category "<CAT>" --summary "<SUMMARY>" --impact "<IMPACT>"`
- Query past architectural decisions: `python3 scripts/penn_rag.py query "<QUERY>"`
- Check velocity dashboard: `python3 scripts/penn_rag.py quantify`
<!-- CODEX:END -->
