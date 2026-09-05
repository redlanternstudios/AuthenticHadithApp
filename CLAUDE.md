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

## Release Engineering Standard Operating Protocol (MANDATORY)

Before implementing, building, packaging, or authorizing any release:
1. Read `RELEASE_ENGINEERING_SOP.md` (the canonical release operating system).
2. Adhere strictly to the 8-state release model: `STATE 0 (ISSUE CONFIRMED)` through `STATE 8 (SHIP APPROVED)`.
3. Never equate code completion, passing local tests, or successful builds with a release.
4. Run `npm run qa:release` in `authentichadithapp/` before pushing any release candidate branch.
5. All AI agents must format handoffs using the mandatory 10-point Agent Handoff Protocol.
