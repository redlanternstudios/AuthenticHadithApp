// qa-audit-env.mjs
// Validates the Expo runtime env keys this project needs.
// Soft-warns on server-only keys when EAS_BUILD=true (EAS does not populate them).
// Reads .env.local directly so the chain works without a parent shell pre-loading.

import fs from 'node:fs';

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv('.env.local');
loadDotEnv('.env');

const CLIENT_REQUIRED = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS',
];

const SERVER_ONLY = [
  'SUPABASE_SERVICE_ROLE_KEY',
];

const isEasBuild = process.env.EAS_BUILD === 'true';

let hardFault = false;
let warnings = 0;

console.log('==> Validating Expo runtime environment variables...');
console.log(`    mode: ${isEasBuild ? 'EAS_BUILD (server keys soft-gated)' : 'local'}`);

for (const key of CLIENT_REQUIRED) {
  if (!process.env[key]) {
    console.error(`[CRITICAL] missing client-required key: ${key}`);
    hardFault = true;
  } else {
    console.log(`[OK]       ${key}`);
  }
}

if (process.env.EXPO_PUBLIC_APP_ENV !== 'production') {
  console.error(`[CRITICAL] EXPO_PUBLIC_APP_ENV must be production for release gates, got: ${process.env.EXPO_PUBLIC_APP_ENV || '(empty)'}`);
  hardFault = true;
}

for (const key of SERVER_ONLY) {
  if (!process.env[key]) {
    if (isEasBuild) {
      console.warn(`[WARN]     server-only key ${key} not present under EAS_BUILD (expected, soft-gated)`);
      warnings++;
    } else {
      console.error(`[CRITICAL] missing server-only key (local mode): ${key}`);
      hardFault = true;
    }
  } else {
    console.log(`[OK]       ${key}`);
  }
}

console.log(`==> env audit: ${hardFault ? 'FAIL' : 'PASS'} (${warnings} warnings)`);
if (hardFault) process.exit(1);
