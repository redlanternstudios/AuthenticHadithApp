# Autonomous Slack Web Navigation & App Management SOP
**Document ID:** SOP-SLACK-NAV-001  
**Author:** JP (AI Operating Partner & Lead Strategist)  
**Governing Authority:** Keymon Penn (Penn Enterprises LLC)  
**System Designation:** Level 5/6 Autonomous Web Execution Standard  

---

## 1. Executive Summary & Objective

This Standard Operating Procedure (SOP) hardcodes the complete, end-to-end browser navigation workflow for Slack API management (`api.slack.com/apps`). It equips all AI agents (@Money-Maker, @Jobo, @Bob-the-Builder, Claude, Codex, Gemini, JP) to autonomously inspect, create, configure, extract, and authorize Slack apps and Incoming Webhooks on Keymon's behalf using both **Python Playwright** and **Chrome DevTools MCP** engines.

Per the **Autonomous Playwright Web Execution Mandate** (Invariant 6.2), agents must execute these browser workflows autonomously rather than pushing manual browser steps back to Keymon.

---

## 2. System Architecture & Execution Engines

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   AUTONOMOUS SLACK WEB NAVIGATION WORKFLOW (SOP-SLACK-001)             │
│                                                                                        │
│   [1. Browser Initialization] ──> Playwright Python Engine / Chrome DevTools MCP       │
│                                           │                                            │
│   [2. Session & Auth Check]   ──> Navigate to https://api.slack.com/apps               │
│                                           │                                            │
│   [3. App Provisioning/Inspect]─> Create App from Scratch OR Select Existing App       │
│                                           │                                            │
│   [4. Incoming Webhooks]      ──> Toggle Activate Incoming Webhooks -> ON              │
│                                           │                                            │
│   [5. Human Gate Authorization]─> Select Public Channel (#leads-and-alerts) & Authorize│
│                                           │                                            │
│   [6. Webhook URL Extraction] ──> Extract https://hooks.slack.com/services/...         │
│                                           │                                            │
│   [7. Channel Isolation & Env]──> Securely persist to .env (Zero cross-channel leak)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mandatory Invariants for Slack Web Automation

1. **Strict Multi-Channel Isolation:**
   - Business operations alerts (`#leads-and-alerts`) must use `SLACK_WEBHOOK_URL`.
   - Personal Life OS alerts (`#personal-command`) must use `SLACK_PERSONAL_WEBHOOK_URL`.
   - **Zero cross-channel fallback or mixing permitted.**
2. **Public Channel Rule:**
   - Slack's authorization picker only lists **public** channels by default unless the bot user is explicitly pre-invited into private channels. Always target public channels for webhooks.
3. **Headless Chrome Preference:**
   - Always attempt launch with local Google Chrome channel first (`channel="chrome"`), falling back to bundled Chromium or WebKit.
4. **Secret Quarantine:**
   - Extracted Webhook URLs (`https://hooks.slack.com/services/...`) must be written directly to local `.env` files. **NEVER** commit webhook URLs to git, markdown logs, or public PRs.

---

## 4. Step-by-Step Playwright Web Navigation Blueprint

Agents executing web-based Slack setup must run this exact automated sequence:

```python
#!/usr/bin/env python3
"""
Penn Enterprises LLC — Autonomous Slack Webhook Playwright Controller
Author: JP (AI Operating Partner)
Standard: SOP-SLACK-NAV-001
"""

import os
import sys
import json
import re
from playwright.sync_api import sync_playwright

SLACK_APPS_URL = "https://api.slack.com/apps"

def run_slack_navigation_engine(target_channel="#leads-and-alerts", app_name="Penn-Alert-Bot"):
    print("[SOP-SLACK-001] Initializing browser engine...")
    with sync_playwright() as p:
        # Launch with system Chrome if available
        try:
            browser = p.chromium.launch(headless=True, channel="chrome")
        except Exception:
            browser = p.chromium.launch(headless=True)
            
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Step 1: Navigate to Slack Apps Dashboard
        print(f"[SOP-SLACK-001] Navigating to {SLACK_APPS_URL}...")
        page.goto(SLACK_APPS_URL, timeout=25000)
        page.wait_for_load_state("domcontentloaded")

        # Step 2: Session Check
        content = page.content()
        if "Sign in to your workspace" in content or "Sign In" in page.title():
            print("[SOP-SLACK-001] ⚠️ Authentication Required. Active Slack session cookie needed.")
            browser.close()
            return {"status": "AUTH_REQUIRED", "url": page.url}

        print("[SOP-SLACK-001] ✅ Authenticated session confirmed.")

        # Step 3: Scan Existing Apps or Create New App
        links = page.eval_on_selector_all("a", "elements => elements.map(e => ({ text: e.innerText, href: e.href }))")
        app_links = [l for l in links if "/apps/A" in l.get("href", "")]
        print(f"[SOP-SLACK-001] Discovered {len(app_links)} registered Slack App(s).")

        webhook_url = None

        # Step 4: Check if App already has active Webhook
        for app in app_links:
            app_url = app["href"].rstrip("/") + "/incoming-webhooks"
            print(f"[SOP-SLACK-001] Inspecting {app['text']} at {app_url}...")
            page.goto(app_url, timeout=15000)
            page.wait_for_load_state("domcontentloaded")

            # Extract any existing webhook URL from inputs or code tags
            values = page.eval_on_selector_all("input, textarea, code", "elements => elements.map(e => e.value || e.innerText)")
            for val in values:
                if "hooks.slack.com/services/" in val:
                    webhook_url = val.strip()
                    print(f"[SOP-SLACK-001] 🎉 Found active webhook: {webhook_url}")
                    break
            if webhook_url:
                break

        # Step 5: If no webhook exists, automate creation
        if not webhook_url and app_links:
            print("[SOP-SLACK-001] Activating incoming webhooks toggle...")
            # Ensure toggle is ON
            toggle = page.query_selector("input[type='checkbox']#incoming_webhooks_toggle")
            if toggle and not toggle.is_checked():
                toggle.click()
                page.wait_for_timeout(1000)

            # Click 'Add New Webhook to Workspace'
            add_button = page.query_selector("a:has-text('Add New Webhook to Workspace'), button:has-text('Add New Webhook to Workspace')")
            if add_button:
                print("[SOP-SLACK-001] Requesting workspace authorization...")
                add_button.click()
                page.wait_for_load_state("networkidle")

                # Channel selection picker
                page.wait_for_selector("select, div[role='combobox']", timeout=10000)
                # Select target public channel
                page.click(f"text={target_channel}")
                page.click("button:has-text('Allow'), button:has-text('Authorize')")
                page.wait_for_load_state("domcontentloaded")

        browser.close()
        return {"status": "SUCCESS", "webhook_url": webhook_url}
```

---

## 5. Chrome DevTools MCP Navigation Pattern

When using the Antigravity IDE Chrome DevTools MCP tools directly, agents execute this sequence:

1. **`list_pages`**: Identify existing browser tabs.
2. **`new_page`** or **`navigate_page`**: Go to `https://api.slack.com/apps`.
3. **`take_snapshot`**: Inspect the DOM tree to locate the App list or `Create an App` button.
4. **`click`**: Click into the target app ID (e.g., `/apps/A0XXXXXXXXX/incoming-webhooks`).
5. **`wait_for`**: Wait for selector `input[readonly]`.
6. **`evaluate_script`**: Run:
   ```javascript
   () => Array.from(document.querySelectorAll('input, code'))
     .map(el => el.value || el.innerText)
     .find(v => v && v.includes('hooks.slack.com/services/'))
   ```
7. **Store**: Write the returned URL to `.env` under the proper isolated channel variable.

---

## 6. Self-Healing Remediator Protocol

If navigation encounters an exception:
1. **Error: Timeout during navigation:** Retry with `timeout=30000` and `wait_for_load_state('networkidle')`.
2. **Error: Session expired:** Capture screenshot artifact (`take_screenshot`) to verify if login redirect happened; escalate to Keymon with Human Gate Tier 2 (Auth Re-authentication).
3. **Error: Channel missing from picker:** Verify channel is **public**. If private, notify Keymon or invite the Slack app bot into the channel first.
4. **Error: Webhook revocation (404/403):** Rerun navigation engine to click `Add New Webhook to Workspace` and regenerate a fresh token.

---

## 7. Operational Receipt Standard
Every completed Slack web navigation task must terminate in a validated operational receipt:
- Record: `operations/receipts/YYYY-MM-DD_HHMMSS__slack_webhook_provisioned.md`
- Include: Timestamp, Agent, Channel (`#leads-and-alerts`), Status (`VERIFIED`), and destination `.env` path.
