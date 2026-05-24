// qa-audit-routes.mjs
// Walks ./app (Expo Router screen tree) and reports screens, layouts, dynamic routes, and groups.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = './app';
const SKIP = new Set(['node_modules', '.expo', 'dist', 'build', 'ios', 'android']);

let screens = 0;
let layouts = 0;
let dynamicRoutes = 0;
let groups = 0;

function classify(file) {
  if (file.startsWith('_layout.')) return 'layout';
  if (/^\[.+\]\.(tsx|ts|jsx|js)$/.test(file)) return 'dynamic';
  if (/\.(tsx|ts|jsx|js)$/.test(file) && !file.startsWith('+not-found.')) return 'screen';
  if (/^\+not-found\.(tsx|ts|jsx|js)$/.test(file)) return 'screen';
  return null;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        console.log(`[GROUP]    ${full}`);
        groups++;
      }
      walk(full);
    } else {
      const kind = classify(entry.name);
      if (kind === 'layout') {
        console.log(`[LAYOUT]   ${full}`);
        layouts++;
      } else if (kind === 'dynamic') {
        console.log(`[DYNAMIC]  ${full}`);
        dynamicRoutes++;
      } else if (kind === 'screen') {
        console.log(`[SCREEN]   ${full}`);
        screens++;
      }
    }
  }
}

console.log('==> Scanning Expo Router screen tree at ./app ...');
if (!fs.existsSync(ROOT)) {
  console.error(`[CRITICAL] route root ${ROOT} does not exist`);
  process.exit(1);
}
walk(ROOT);

console.log('==> route audit summary:');
console.log(`    screens:        ${screens}`);
console.log(`    layouts:        ${layouts}`);
console.log(`    dynamic routes: ${dynamicRoutes}`);
console.log(`    route groups:   ${groups}`);
console.log(`==> routes audit: ${screens > 0 ? 'PASS' : 'FAIL (zero screens detected)'}`);
if (screens === 0) process.exit(1);
