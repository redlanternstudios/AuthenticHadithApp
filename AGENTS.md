<!-- CLAUDEX:START -->
# Claudex Bridge Boot

Before product instructions:

1. Read `.claudex.json`.
2. Resolve `local_bridge_path`. If unavailable, use `bridge_repo`, `bridge_ref`, and `bridge_file`.
3. Read the canonical bridge, protocol, alignment policy, current intent, and latest receipt.
4. Select product key `authentic_hadith`.
5. Use the worse of global and product sync colors.
6. RED means stop. YELLOW means continue with the warning. GREEN means continue.
7. Never create a product local bridge or copy secret values.

<!-- CLAUDEX:END -->

## Penn Enterprises infrastructure policy
Read `../../AGENTS.md` and `../../.agents/skills/infrastructure-invariants/SKILL.md`.
Enforce `../../knowledge/graph/guards/guard-six-pillar-invariants.md`; retain every stricter product gate below.


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

## Local Testing Authority (SYS-MOD-022 / Level A2 Bounded Delegation)

@Bob-the-Builder, Codex, and Antigravity may resolve local testing friction within the authorized task without asking Keymon to operate the tools. This authority covers:

1. `NODE_ENV === 'development'` overrides for routes under test.
2. Development-only middleware bypasses for `/test-*` and fixture routes.
3. Synthetic sessions, mocked client tokens and cookies, and local database fixtures.
4. Native `.mjs` runners when a package manager prevents local test execution.

Keep these mechanisms restricted to development or local fixtures. Do not place secrets in mocks, weaken production authentication or authorization, or use synthetic results as evidence of production behavior. Run the real route and applicable release guards before any build dispatch. The release state model and all existing security and approval gates remain in force.

**GUARD-TEST-IMMUTABILITY-001:** Do not modify test files, assertions, snapshots, or test configuration to force a pass. During feature implementation or bug repair, fix the implementation when a test fails; preserve the existing test harness.

**Level A1 escalation for this local testing delegation:** Stop and ask Keymon before applying production database DDL, allocating paid external API credits, or deploying binaries directly to production. These are the only Keymon prompts introduced by local testing friction; other actions still follow their existing release and external-action gates.

