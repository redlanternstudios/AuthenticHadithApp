#!/usr/bin/env node
/**
 * QA Route Scanner
 * Scans app/ directory for all Expo Router routes and outputs an inventory.
 * Usage: node scripts/qa-route-scanner.js
 */
const fs = require('fs');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '../app');

function scanDir(dir, prefix = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check for _layout.tsx (navigation group)
      const layoutPath = path.join(fullPath, '_layout.tsx');
      const hasLayout = fs.existsSync(layoutPath);

      routes.push(...scanDir(fullPath, `${prefix}/${entry.name}`));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      if (entry.name === '_layout.tsx') continue; // layouts are not routes
      const routeName = entry.name.replace(/\.(tsx|ts)$/, '');
      const routePath = routeName === 'index' ? prefix || '/' : `${prefix}/${routeName}`;

      // Read file to detect dependencies
      const content = fs.readFileSync(fullPath, 'utf8');
      const deps = [];
      if (content.includes('supabase')) deps.push('Supabase');
      if (content.includes('useAuth')) deps.push('Auth');
      if (content.includes('groq') || content.includes('sendChatMessage') || content.includes('AI')) deps.push('AI');
      if (content.includes('RevenueCat') || content.includes('usePremiumStatus') || content.includes('isPremium')) deps.push('Premium');
      if (content.includes('AsyncStorage')) deps.push('AsyncStorage');

      const hasLoading = content.includes('ActivityIndicator') || content.includes('LoadingSpinner') || content.includes('isLoading');
      const hasError = content.includes('error') && (content.includes('catch') || content.includes('Error'));
      const hasEmpty = content.includes('length === 0') || content.includes('!data') || content.includes('empty');

      routes.push({
        route: routePath,
        file: path.relative(path.resolve(__dirname, '..'), fullPath),
        deps: deps.join(', ') || 'None',
        loading: hasLoading ? 'Yes' : 'NO',
        error: hasError ? 'Yes' : 'NO',
        empty: hasEmpty ? 'Yes' : 'NO',
      });
    }
  }
  return routes;
}

const routes = scanDir(APP_DIR);

console.log('\n=== AUTHENTIC HADITH APP: ROUTE INVENTORY ===\n');
console.log(`Total routes found: ${routes.length}\n`);
console.log('Route'.padEnd(40) + 'File'.padEnd(50) + 'Deps'.padEnd(30) + 'Load'.padEnd(6) + 'Err'.padEnd(6) + 'Empty');
console.log('-'.repeat(138));

for (const r of routes) {
  console.log(
    r.route.padEnd(40) +
    r.file.padEnd(50) +
    r.deps.padEnd(30) +
    r.loading.padEnd(6) +
    r.error.padEnd(6) +
    r.empty
  );
}

// Flag risks
const risks = routes.filter(r => r.loading === 'NO' || r.error === 'NO');
if (risks.length > 0) {
  console.log('\n=== RISK FLAGS ===\n');
  for (const r of risks) {
    const issues = [];
    if (r.loading === 'NO') issues.push('Missing loading state');
    if (r.error === 'NO') issues.push('Missing error handling');
    console.log(`  ${r.route}: ${issues.join(', ')}`);
  }
}

console.log('\n=== SCAN COMPLETE ===\n');
