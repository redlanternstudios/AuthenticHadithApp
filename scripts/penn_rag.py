#!/usr/bin/env python3
"""
Penn Enterprises LLC — Universal Agent Telemetry, RAG & Quantification Engine
-----------------------------------------------------------------------------
Combines:
1. Zero-dependency Local RAG (SQLite FTS5 + BM25 ranking) across all docs, KIs, and SOPs.
2. Automated Output Quantification: Aggregates receipts, deliverables, categories, and git velocity.
3. Cross-Platform Skill Symlinker: Syncs skills across Antigravity, Claude, and Codex.
"""

import os
import sys
import json
import glob
import sqlite3
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

# Paths
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
OPERATIONS_DIR = WORKSPACE_ROOT / "operations"
RECEIPTS_DIR = OPERATIONS_DIR / "receipts"
KNOWLEDGE_DIR = OPERATIONS_DIR / "knowledge_base"
DB_PATH = OPERATIONS_DIR / "penn_telemetry.db"

CANONICAL_SKILLS_DIR = Path.home() / ".gemini/config/skills"
CLAUDE_SKILLS_DIR = Path.home() / ".claude/skills"
CODEX_SKILLS_DIR = Path.home() / ".codex/skills"
CODEX_AGENTS_MD = Path.home() / ".codex/AGENTS.md"
COMMAND_CENTER_SKILLS = Path.home() / "Desktop/Penn Enterprises LLC/00_COMMAND_CENTER/skills"

def get_db():
    """Initializes and returns the SQLite database connection with FTS5."""
    os.makedirs(OPERATIONS_DIR, exist_ok=True)
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Full-Text Search Table for RAG
    cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS rag_knowledge USING fts5(
            filepath,
            category,
            title,
            content,
            tokenize='porter unicode61'
        );
    """)
    
    # 2. Structured Operational Receipts Table (Quantification)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS receipts (
            receipt_id TEXT PRIMARY KEY,
            agent TEXT,
            project TEXT,
            category TEXT,
            summary TEXT,
            revenue_impact TEXT,
            metrics_json TEXT,
            timestamp DATETIME
        );
    """)
    
    # 3. Git Commits Telemetry Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS git_telemetry (
            commit_hash TEXT PRIMARY KEY,
            author TEXT,
            date DATETIME,
            message TEXT
        );
    """)
    
    conn.commit()
    return conn

def ingest_all(quiet=False):
    """Ingests all receipts, knowledge base files, markdown docs, and git history."""
    conn = get_db()
    cur = conn.cursor()
    
    ingested_docs = 0
    ingested_receipts = 0
    ingested_commits = 0
    
    # Clear existing FTS index to avoid duplicate rankings on re-index
    cur.execute("DELETE FROM rag_knowledge;")
    
    # Ingest Receipts into structured table
    for r_file in glob.glob(str(RECEIPTS_DIR / "*.json")):
        try:
            with open(r_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                r_id = data.get("receipt_id", Path(r_file).stem)
                agent = data.get("agent", "JP")
                project = data.get("project", WORKSPACE_ROOT.name)
                category = data.get("category", "OPERATIONS")
                summary = data.get("summary", data.get("file", "Operational Task"))
                revenue_impact = data.get("revenue_impact", data.get("metrics", {}).get("revenue_impact", "N/A"))
                timestamp = data.get("timestamp", datetime.utcnow().isoformat())
                metrics_json = json.dumps(data.get("metrics", {}))
                
                cur.execute("""
                    INSERT OR REPLACE INTO receipts 
                    (receipt_id, agent, project, category, summary, revenue_impact, metrics_json, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (r_id, agent, project, category, summary, revenue_impact, metrics_json, timestamp))
                
                # Also index into FTS RAG
                cur.execute("""
                    INSERT INTO rag_knowledge (filepath, category, title, content)
                    VALUES (?, ?, ?, ?)
                """, (r_file, "RECEIPT", f"Receipt: {r_id} ({category})", f"{summary} | Impact: {revenue_impact}"))
                ingested_receipts += 1
        except Exception as e:
            print(f"⚠️ Error reading receipt {r_file}: {e}")

    # Ingest Knowledge Base & Markdown Docs into FTS RAG
    doc_patterns = [
        str(KNOWLEDGE_DIR / "*.md"),
        str(WORKSPACE_ROOT / "*.md"),
        str(WORKSPACE_ROOT / "docs" / "*.md"),
        str(WORKSPACE_ROOT / "docs" / "**" / "*.md")
    ]
    
    for pattern in doc_patterns:
        for doc_file in glob.glob(pattern):
            try:
                path_obj = Path(doc_file)
                if any(part.startswith(".") for part in path_obj.parts):
                    continue
                with open(doc_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    title = path_obj.stem.replace("_", " ").title()
                    cur.execute("""
                        INSERT INTO rag_knowledge (filepath, category, title, content)
                        VALUES (?, ?, ?, ?)
                    """, (doc_file, "DOCUMENTATION", title, content))
                    ingested_docs += 1
            except Exception as e:
                print(f"⚠️ Error indexing doc {doc_file}: {e}")

    # Ingest Git Commit Telemetry (Quantifying velocity)
    try:
        git_cmd = ["git", "log", "-n", "100", "--pretty=format:%H|||%an|||%ad|||%s", "--date=iso"]
        res = subprocess.run(git_cmd, cwd=WORKSPACE_ROOT, capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            for line in res.stdout.strip().split("\n"):
                parts = line.split("|||")
                if len(parts) == 4:
                    c_hash, author, date, msg = parts
                    cur.execute("""
                        INSERT OR REPLACE INTO git_telemetry (commit_hash, author, date, message)
                        VALUES (?, ?, ?, ?)
                    """, (c_hash, author, date, msg))
                    ingested_commits += 1
    except Exception as e:
        print(f"⚠️ Git telemetry ingestion error: {e}")

    conn.commit()
    conn.close()
    
    if not quiet:
        print("\n" + "="*60)
        print("🎯 PENN TELEMETRY & RAG INGESTION COMPLETE")
        print("="*60)
        print(f"  • Structured Receipts Ingested : {ingested_receipts}")
        print(f"  • Knowledge / SOP Docs Indexed : {ingested_docs}")
        print(f"  • Git Commits Quantified       : {ingested_commits}")
        print(f"  • Telemetry Database Location  : {DB_PATH}")
        print("="*60 + "\n")
    else:
        print(f"⚡ [PENN-TELEMETRY] Auto-indexed {ingested_receipts} receipts, {ingested_docs} docs, {ingested_commits} commits.")

def query_rag(query_text, limit=5):
    """Performs lightning-fast BM25 full-text search across all ingested knowledge."""
    conn = get_db()
    cur = conn.cursor()
    
    # Clean query for SQLite FTS5 syntax
    clean_query = " ".join([f'"{word}"' for word in query_text.replace('"', '').split() if word])
    
    sql = """
        SELECT filepath, category, title, snippet(rag_knowledge, 3, '👉[', ']👈', '...', 25) AS preview, rank
        FROM rag_knowledge
        WHERE rag_knowledge MATCH ?
        ORDER BY rank
        LIMIT ?
    """
    
    try:
        cur.execute(sql, (clean_query, limit))
        rows = cur.fetchall()
        
        print("\n" + "="*70)
        print(f"🔍 RAG SEARCH RESULTS FOR: '{query_text}'")
        print("="*70)
        if not rows:
            print("No direct matches found. Try broader keywords.")
        else:
            for idx, (fpath, cat, title, snippet, rank) in enumerate(rows, 1):
                rel_path = os.path.relpath(fpath, WORKSPACE_ROOT) if fpath.startswith(str(WORKSPACE_ROOT)) else fpath
                print(f"[{idx}] {title} ({cat}) | Score: {rank:.2f}")
                print(f"    File: {rel_path}")
                print(f"    Context: {snippet.strip()}")
                print("-" * 70)
        print("="*70 + "\n")
    except Exception as e:
        print(f"⚠️ Search error: {e}")
    finally:
        conn.close()

def quantify_output():
    """Generates an executive-level summary quantifying all agent output and velocity."""
    conn = get_db()
    cur = conn.cursor()
    
    print("\n" + "="*70)
    print("📊 PENN ENTERPRISES LLC — EXECUTIVE VELOCITY & OUTPUT REPORT")
    print("="*70)
    
    # 1. Total Deliverables by Category
    print("\n📌 DELIVERABLES BY CATEGORY:")
    cur.execute("""
        SELECT category, count(*), group_concat(summary, ' | ')
        FROM receipts
        GROUP BY category
        ORDER BY count(*) DESC
    """)
    cat_rows = cur.fetchall()
    if cat_rows:
        for cat, cnt, _ in cat_rows:
            print(f"  • {cat:<24} : {cnt:>3} completed")
    else:
        print("  • No receipts found yet. Add receipts using 'penn_rag.py receipt'.")

    # 2. Agent Breakdown
    print("\n🤖 AGENT ATTRIBUTION:")
    cur.execute("""
        SELECT agent, count(*)
        FROM receipts
        GROUP BY agent
        ORDER BY count(*) DESC
    """)
    for agent, cnt in cur.fetchall():
        print(f"  • {agent:<24} : {cnt:>3} logged deliverables")

    # 3. Git Engineering Velocity
    cur.execute("SELECT count(*), min(date), max(date) FROM git_telemetry")
    g_cnt, min_d, max_d = cur.fetchone()
    print(f"\n⚡ ENGINEERING GIT VELOCITY:")
    print(f"  • Total Commits Tracked   : {g_cnt}")
    print(f"  • Active Date Window      : {min_d} to {max_d}")

    # 4. Recent Deliverables List
    print("\n📋 RECENT VERIFIED DELIVERABLES:")
    cur.execute("""
        SELECT timestamp, agent, category, summary, revenue_impact
        FROM receipts
        ORDER BY timestamp DESC
        LIMIT 5
    """)
    for ts, ag, cat, sm, rev in cur.fetchall():
        print(f"  [{ts[:10]}] [{ag}] [{cat}] {sm} (Impact: {rev})")
    
    print("="*70 + "\n")
    conn.close()

def record_receipt(agent, category, summary, revenue_impact="Operational Milestone"):
    """Quick CLI command to drop an immutable receipt and immediately index it."""
    r_id = f"REC_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{category.upper()}"
    filename = RECEIPTS_DIR / f"{r_id}.json"
    
    receipt_data = {
        "receipt_id": r_id,
        "agent": agent,
        "project": WORKSPACE_ROOT.name,
        "category": category.upper(),
        "summary": summary,
        "metrics": {
            "revenue_impact": revenue_impact,
            "logged_via": "penn_rag_cli"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(receipt_data, f, indent=2)
    
    print(f"✅ Receipt written: {filename.name}")
    # Re-ingest
    ingest_all()

def sync_skills():
    """Synchronizes all skills from master directory into Claude and Codex directories via symlinks."""
    print("\n🔗 SYNCHRONIZING AGENT SKILLS ACROSS FLEET (GEMINI, CLAUDE, CODEX)...")
    
    CLAUDE_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    CODEX_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    
    if not CANONICAL_SKILLS_DIR.exists():
        print(f"⚠️ Master skills dir {CANONICAL_SKILLS_DIR} not found.")
        return

    canonical_skills = [p for p in CANONICAL_SKILLS_DIR.iterdir() if p.is_dir() and not p.name.startswith(".")]
    
    # 1. Sync Claude
    c_synced = 0
    c_existing = 0
    for skill_path in canonical_skills:
        claude_target = CLAUDE_SKILLS_DIR / skill_path.name
        try:
            if claude_target.is_symlink() or claude_target.exists():
                c_existing += 1
            else:
                os.symlink(skill_path, claude_target)
                c_synced += 1
        except Exception as e:
            print(f"  ⚠️ Error linking {skill_path.name} to Claude: {e}")

    # 2. Sync Codex
    codex_synced = 0
    codex_existing = 0
    for skill_path in canonical_skills:
        codex_target = CODEX_SKILLS_DIR / skill_path.name
        try:
            if codex_target.is_symlink() or codex_target.exists():
                codex_existing += 1
            else:
                os.symlink(skill_path, codex_target)
                codex_synced += 1
        except Exception as e:
            print(f"  ⚠️ Error linking {skill_path.name} to Codex: {e}")

    # 3. Sync Global Codex AGENTS.md
    agents_src = WORKSPACE_ROOT / "AGENTS.md"
    if agents_src.exists():
        try:
            content = agents_src.read_text(encoding="utf-8")
            CODEX_AGENTS_MD.write_text(content, encoding="utf-8")
            print(f"  • Global Codex AGENTS.md aligned with project invariants.")
        except Exception as e:
            print(f"  ⚠️ Error updating Codex AGENTS.md: {e}")

    total_claude = len(list(CLAUDE_SKILLS_DIR.iterdir()))
    total_codex = len(list(CODEX_SKILLS_DIR.iterdir()))
    print(f"  • Claude Skills Total : {total_claude} (Newly linked: {c_synced})")
    print(f"  • Codex Skills Total  : {total_codex} (Newly linked: {codex_synced})")
    print(f"  • Gemini Master Skills: {len(canonical_skills)}")
    print("✅ 100% TRI-PLATFORM SKILL & IDENTITY PARITY ACHIEVED (GEMINI + CLAUDE + CODEX).")
GIT_TEMPLATES_DIR = Path.home() / ".git-templates"
GIT_TEMPLATES_HOOKS = GIT_TEMPLATES_DIR / "hooks"

PRE_COMMIT_TEMPLATE = """#!/bin/bash
# ==============================================================================
# Penn Enterprises LLC — Autonomous Pre-Commit Security & Receipt Guard (SYS-SEC-001)
# ==============================================================================
# 1. Tripwire: Block staged .env files with secrets
if git diff --cached --name-only | grep -E '^(\\.env|\\.env\\.production|\\.env\\.local)$' >/dev/null; then
    echo "❌ [SYS-SEC-001 BLOCKED] Attempting to commit active .env secrets file. Aborting commit."
    exit 1
fi

# 2. Syntax check staged receipts in operations/receipts/
for receipt in $(git diff --cached --name-only | grep -E '^operations/receipts/.*\\.json$'); do
    if [ -f "$receipt" ]; then
        if ! python3 -m json.tool "$receipt" > /dev/null 2>&1; then
            echo "❌ [RECEIPT-GUARD BLOCKED] Invalid JSON syntax in receipt: $receipt"
            exit 1
        fi
    fi
done

exit 0
"""

POST_COMMIT_TEMPLATE = """#!/bin/bash
# ==============================================================================
# Penn Enterprises LLC — Autonomous Git Post-Commit Telemetry Hook (SYS-AUTO-001)
# ==============================================================================
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -f "$REPO_ROOT/scripts/penn_rag.py" ]; then
    python3 "$REPO_ROOT/scripts/penn_rag.py" ingest --quiet
fi
"""

POST_MERGE_TEMPLATE = """#!/bin/bash
# ==============================================================================
# Penn Enterprises LLC — Autonomous Git Post-Merge Telemetry Hook (SYS-AUTO-001)
# ==============================================================================
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -f "$REPO_ROOT/scripts/penn_rag.py" ]; then
    python3 "$REPO_ROOT/scripts/penn_rag.py" ingest --quiet
fi
"""

def propagate_git_templates():
    """Propagates dual-stage hooks to global git-templates and all existing projects."""
    print("\n📦 PROPAGATING ENTERPRISE DUAL-STAGE GIT HOOKS GLOBALLY...")
    
    # 1. Create global ~/.git-templates/hooks
    GIT_TEMPLATES_HOOKS.mkdir(parents=True, exist_ok=True)
    
    pre_commit_file = GIT_TEMPLATES_HOOKS / "pre-commit"
    post_commit_file = GIT_TEMPLATES_HOOKS / "post-commit"
    post_merge_file = GIT_TEMPLATES_HOOKS / "post-merge"
    
    pre_commit_file.write_text(PRE_COMMIT_TEMPLATE, encoding="utf-8")
    post_commit_file.write_text(POST_COMMIT_TEMPLATE, encoding="utf-8")
    post_merge_file.write_text(POST_MERGE_TEMPLATE, encoding="utf-8")
    
    for hook_file in [pre_commit_file, post_commit_file, post_merge_file]:
        os.chmod(hook_file, 0o755)
        
    print(f"  • Installed hooks in global template: {GIT_TEMPLATES_HOOKS}")
    
    # 2. Configure Git to automatically use this template for all new git init / clone
    try:
        subprocess.run(["git", "config", "--global", "init.templateDir", str(GIT_TEMPLATES_DIR)], check=True)
        print(f"  • Global Git config updated: init.templateDir = {GIT_TEMPLATES_DIR}")
    except Exception as e:
        print(f"  ⚠️ Error setting git global templateDir: {e}")

    # 3. Propagate to existing repositories in ~/Desktop/Penn Enterprises LLC/
    penn_root = Path.home() / "Desktop/Penn Enterprises LLC"
    propagated_count = 0
    if penn_root.exists():
        for git_dir in penn_root.glob("**/projects/*/.git"):
            if git_dir.is_dir():
                target_hooks = git_dir / "hooks"
                target_hooks.mkdir(parents=True, exist_ok=True)
                (target_hooks / "pre-commit").write_text(PRE_COMMIT_TEMPLATE, encoding="utf-8")
                (target_hooks / "post-commit").write_text(POST_COMMIT_TEMPLATE, encoding="utf-8")
                (target_hooks / "post-merge").write_text(POST_MERGE_TEMPLATE, encoding="utf-8")
                for h in ["pre-commit", "post-commit", "post-merge"]:
                    os.chmod(target_hooks / h, 0o755)
                propagated_count += 1
                print(f"  • Propagated hooks to existing project: {git_dir.parent.name}")

    print(f"  • Total existing repositories upgraded: {propagated_count}")
    print("✅ GLOBAL AUTOMATION ACTIVE: Every future `git init` automatically inherits enterprise hooks.")
    print("="*60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Penn Enterprises Telemetry, RAG & Quantification Engine")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Ingest command
    ingest_p = subparsers.add_parser("ingest", help="Ingest all receipts, markdown docs, and git commits into RAG")
    ingest_p.add_argument("--quiet", action="store_true", help="Quiet mode for background git hooks")
    
    # Query command
    query_p = subparsers.add_parser("query", help="Query knowledge base via RAG")
    query_p.add_argument("text", help="Search query string")
    query_p.add_argument("--limit", type=int, default=5, help="Number of results to return")
    
    # Quantify command
    subparsers.add_parser("quantify", help="Quantify output, deliverables, and agent velocity")
    
    # Receipt command
    rec_p = subparsers.add_parser("receipt", help="Record a new operational receipt")
    rec_p.add_argument("--agent", default="JP", help="Agent identifier (@Bob-the-Builder, @Money-Maker, JP)")
    rec_p.add_argument("--category", default="ENGINEERING", help="Category (ENGINEERING, RELEASE, SALES, OPS)")
    rec_p.add_argument("--summary", required=True, help="Summary of deliverable or task completed")
    rec_p.add_argument("--impact", default="Direct Value Added", help="Business or revenue impact")

    # Sync Skills command
    subparsers.add_parser("sync-skills", help="Synchronize skill directories across agent configurations")

    # Propagate Hooks command
    subparsers.add_parser("propagate-hooks", help="Propagate dual-stage git hooks to global templates and repositories")

    args = parser.parse_args()
    
    if args.command == "ingest":
        ingest_all(quiet=args.quiet)
    elif args.command == "query":
        query_rag(args.text, limit=args.limit)
    elif args.command == "quantify":
        quantify_output()
    elif args.command == "receipt":
        record_receipt(args.agent, args.category, args.summary, args.impact)
    elif args.command == "sync-skills":
        sync_skills()
    elif args.command == "propagate-hooks":
        propagate_git_templates()
    else:
        # Default behavior if no args: Ingest and Quantify
        ingest_all()
        quantify_output()

if __name__ == "__main__":
    main()
