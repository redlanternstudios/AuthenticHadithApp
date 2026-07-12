#!/usr/bin/env node
// Quick script to check actual hadiths table structure

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try a simple insert to see the full error with all columns
  const testRow = {
    test_col_that_wont_exist: "test"
  };
  
  const { data, error } = await supabase.from("hadiths").insert(testRow).select();
  
  if (error) {
    console.log("Expected error (looking for schema info):");
    console.log(error.message);
    console.log("\n---\n");
  }
  
  // Try to read one row to see the columns
  const { data: rows, error: readErr } = await supabase.from("hadiths").select("*").limit(1);
  
  if (readErr) {
    console.log("Read error:", readErr.message);
  } else if (rows && rows.length > 0) {
    console.log("Hadiths table columns:");
    console.log(Object.keys(rows[0]).join("\n"));
  } else {
    console.log("Table is empty, no rows to sample columns from.");
    
    // Another approach: use RPC to list columns
    const { data: rpcData, error: rpcError } = await supabase.rpc("query_table_columns");
    console.log("RPC result:", rpcData, rpcError);
  }
}

main();
