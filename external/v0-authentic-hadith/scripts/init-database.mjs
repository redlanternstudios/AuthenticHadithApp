#!/usr/bin/env node

/**
 * Initialize Database Tables
 * Runs SQL migrations directly via Supabase REST API
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

async function runSQL(sql, name) {
  console.log(`\n📦 Running: ${name}...`);
  
  // Use Supabase's SQL endpoint (requires service role)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Try alternative: use pg_query if exec_sql doesn't exist
    const text = await response.text();
    if (text.includes("function") && text.includes("does not exist")) {
      console.log("   ⚠️  exec_sql RPC not available, tables may already exist");
      return true;
    }
    console.log(`   ⚠️  ${text.slice(0, 200)}`);
    return false;
  }
  
  console.log(`   ✅ Success`);
  return true;
}

async function checkTable(tableName) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=0`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  return response.ok;
}

async function main() {
  console.log("🔧 Database Initialization Check\n");
  console.log("=".repeat(50));

  // Check which tables exist
  const tables = ["collections", "books", "chapters", "hadiths", "collection_hadiths", "topics"];
  const existing = [];
  const missing = [];

  for (const table of tables) {
    const exists = await checkTable(table);
    if (exists) {
      existing.push(table);
    } else {
      missing.push(table);
    }
  }

  console.log("\n📊 Table Status:");
  console.log(`   ✅ Existing: ${existing.join(", ") || "none"}`);
  console.log(`   ❌ Missing: ${missing.join(", ") || "none"}`);

  if (missing.length === 0) {
    console.log("\n✅ All required tables exist!");
    console.log("   You can now run: node scripts/seed-all-collections.mjs");
    return;
  }

  console.log("\n" + "=".repeat(50));
  console.log("⚠️  Some tables are missing!");
  console.log("\nPlease run these SQL files in Supabase Dashboard → SQL Editor:");
  console.log("   1. scripts/003-create-hadiths-tables.sql");
  console.log("   2. scripts/005-create-collections-tables.sql");
  console.log("   3. scripts/012-fix-rls-and-streaks.sql");
  console.log("\nOr copy the combined SQL below:");
  console.log("=".repeat(50));

  // Output combined SQL for manual execution
  const sqlFiles = [
    "003-create-hadiths-tables.sql",
    "005-create-collections-tables.sql",
    "012-fix-rls-and-streaks.sql"
  ];

  let combinedSQL = "-- Combined SQL Initialization\n-- Run this in Supabase SQL Editor\n\n";

  for (const file of sqlFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      combinedSQL += `\n-- ========== ${file} ==========\n\n${content}\n`;
    }
  }

  // Write combined SQL to file
  const outputPath = path.join(__dirname, "INIT-ALL-TABLES.sql");
  fs.writeFileSync(outputPath, combinedSQL);
  console.log(`\n📄 Combined SQL written to: scripts/INIT-ALL-TABLES.sql`);
  console.log("   Copy the contents and paste into Supabase SQL Editor\n");
}

main().catch(console.error);
