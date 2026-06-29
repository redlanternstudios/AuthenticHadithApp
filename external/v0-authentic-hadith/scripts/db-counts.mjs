#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const { count: hadithCount } = await supabase
  .from("hadiths")
  .select("id", { count: "exact", head: true });

console.log("Total hadiths in hadiths table:", hadithCount);

const { data: collections } = await supabase
  .from("collections")
  .select("id, slug, name_en, total_hadiths");

console.log("\nCollections:");
for (const c of collections || []) {
  console.log(`  - ${c.name_en}: ${c.total_hadiths} hadiths (stored count)`);
}

// Check actual links per collection
console.log("\nActual link counts:");
for (const c of collections || []) {
  const { count } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", c.id);
  console.log(`  - ${c.name_en}: ${count} linked hadiths`);
}
