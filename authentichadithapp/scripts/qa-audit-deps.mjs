// qa-audit-deps.mjs
// Validates the Expo dependency surface for known-bad packages and version drift.

import fs from 'node:fs';

const EXPECTED_EXPO_MAJOR = 54;
const EXPECTED_REACT = '19.1.0';
const EXPECTED_RN_MINOR = '0.81';

const BANNED = [
  'react-native-cli',          // legacy CLI, conflicts with Expo
  'vague-agent-framework',     // sentinel: placeholder ban list
  'bloated-copied-boilerplate-dep',
];

const WARN_ON_PRESENT = [
  // Add packages that work but are discouraged here.
];

let hardFault = false;
let warnings = 0;

console.log('==> Scanning dependency topology...');
if (!fs.existsSync('package.json')) {
  console.error('[CRITICAL] package.json not found');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
const devDeps = Object.keys(pkg.devDependencies || {});
const all = new Set([...deps, ...devDeps]);

for (const banned of BANNED) {
  if (all.has(banned)) {
    console.error(`[BANNED]   ${banned} present in dependencies`);
    hardFault = true;
  }
}

for (const warn of WARN_ON_PRESENT) {
  if (all.has(warn)) {
    console.warn(`[WARN]     ${warn} present but discouraged`);
    warnings++;
  }
}

const expoVer = (pkg.dependencies?.expo || '').replace(/^[\^~]/, '');
if (!expoVer.startsWith(`${EXPECTED_EXPO_MAJOR}.`)) {
  console.warn(`[WARN]     expo version is ${expoVer}, expected major ${EXPECTED_EXPO_MAJOR}`);
  warnings++;
} else {
  console.log(`[OK]       expo@${expoVer}`);
}

const reactVer = pkg.dependencies?.react || '';
if (reactVer !== EXPECTED_REACT) {
  console.warn(`[WARN]     react version is ${reactVer}, expected exact ${EXPECTED_REACT}`);
  warnings++;
} else {
  console.log(`[OK]       react@${reactVer}`);
}

const rnVer = pkg.dependencies?.['react-native'] || '';
if (!rnVer.startsWith(EXPECTED_RN_MINOR)) {
  console.warn(`[WARN]     react-native is ${rnVer}, expected ${EXPECTED_RN_MINOR}.x`);
  warnings++;
} else {
  console.log(`[OK]       react-native@${rnVer}`);
}

// Known peer-conflict acknowledgement (FIX-025 shipped .npmrc legacy-peer-deps for this).
const hasGroq = all.has('@ai-sdk/groq');
const zod = pkg.dependencies?.zod || '';
if (hasGroq && zod.startsWith('^4')) {
  console.warn('[WARN]     @ai-sdk/groq peer zod^3 vs project zod^4 — handled by .npmrc legacy-peer-deps (FIX-025)');
  warnings++;
}

console.log(`==> deps audit: ${hardFault ? 'FAIL' : 'PASS'} (${warnings} warnings)`);
if (hardFault) process.exit(1);
