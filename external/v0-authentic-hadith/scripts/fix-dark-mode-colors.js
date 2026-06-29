const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join, extname } = require('path');

// Color replacements: hardcoded light-only colors -> semantic tokens
const replacements = [
  // Background colors
  ['bg-[#F8F6F2]', 'bg-background'],
  ['bg-[#f8f6f2]', 'bg-background'],
  ['bg-[#FFFEFB]', 'bg-background'],
  ['bg-[#fffefb]', 'bg-background'],
  ['bg-[#EBE7E0]', 'bg-muted'],
  ['bg-[#ebe7e0]', 'bg-muted'],
  ['bg-[#f3f4f6]', 'bg-muted'],
  ['bg-[#f9fafb]', 'bg-muted/50'],
  ['bg-white', 'bg-card'],
  
  // Text colors (dark text on light bg -> semantic)
  ['text-[#2C2416]', 'text-foreground'],
  ['text-[#2c2416]', 'text-foreground'],
  ['text-[#1a1f36]', 'text-foreground'],
  ['text-[#374151]', 'text-foreground/80'],
  ['text-[#4b5563]', 'text-muted-foreground'],
  ['text-[#6b7280]', 'text-muted-foreground'],
  ['text-[#9ca3af]', 'text-muted-foreground/60'],
  ['text-[#6b5d4d]', 'text-muted-foreground'],
  ['text-[#4a5568]', 'text-foreground/80'],
  
  // Border colors
  ['border-[#e5e7eb]', 'border-border'],
  ['border-[#d4cfc7]', 'border-border'],
  ['border-[#f3f4f6]', 'border-border/50'],
  ['divide-[#f3f4f6]', 'divide-border/50'],
  ['divide-[#e5e7eb]', 'divide-border'],
  
  // Hover states
  ['hover:bg-[#e5e7eb]', 'hover:bg-muted'],
  ['hover:bg-[#f3f4f6]', 'hover:bg-muted'],
  ['hover:bg-[#f9fafb]', 'hover:bg-muted/50'],
  ['hover:border-[#d4cfc7]', 'hover:border-border'],
  ['hover:text-[#2C2416]', 'hover:text-foreground'],
  ['hover:text-[#2c2416]', 'hover:text-foreground'],
  ['hover:text-[#6b7280]', 'hover:text-muted-foreground'],
  ['hover:text-[#C5A059]', 'hover:text-secondary'],
  ['hover:border-[#C5A059]', 'hover:border-secondary'],

  // Gray bg classes
  ['bg-gray-100', 'bg-muted'],
  ['bg-gray-200', 'bg-muted'],
  ['bg-gray-300', 'bg-muted-foreground/20'],
  ['bg-gray-50', 'bg-muted/50'],
  
  // Focus states
  ['focus:border-[#C5A059]', 'focus:border-secondary'],
  
  // Placeholder text
  ['placeholder-[#9ca3af]', 'placeholder-muted-foreground'],
];

// SKIP these patterns - gold/emerald gradients and intentional branded colors should stay
const skipPatterns = [
  'from-[#C5A059]', 'to-[#E8C77D]', 'from-[#1B5E43]', 'to-[#2D7A5B]',
  'to-[#4a9973]', 'from-[#8a6e3a]',
  'text-[#C5A059]', 'text-[#1B5E43]', 'text-[#2D7A5B]',
  'border-[#C5A059]', 'ring-[#C5A059]',
  'bg-[#C5A059]', 'bg-[#1B5E43]', 'bg-[#2D7A5B]',
];

function walkDir(dir, ext, files = []) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      // Skip node_modules, .next, etc.
      if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'expo-wrapper') continue;
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath, ext, files);
        } else if (extname(fullPath) === ext) {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip inaccessible files
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }
  return files;
}

let totalReplacements = 0;
let filesChanged = 0;

// Find the project root by looking for common project files
const { execSync } = require('child_process');
let basePath;
try {
  const findResult = execSync('find / -name "page.tsx" -path "*/app/page.tsx" 2>/dev/null | head -1').toString().trim();
  console.log('Found page.tsx at:', findResult);
  if (findResult) {
    basePath = findResult.replace('/app/page.tsx', '');
  }
} catch(e) {
  console.log('find failed, trying locate...');
}

if (!basePath) {
  // Try common paths
  const candidates = ['/home/user', '/workspace', '/project', process.cwd()];
  for (const c of candidates) {
    try {
      readdirSync(join(c, 'app'));
      basePath = c;
      break;
    } catch(e) {}
  }
}

if (!basePath) {
  console.log('Could not find project directory');
  process.exit(1);
}

console.log('Using basePath:', basePath);

const tsxFiles = [
  ...walkDir(join(basePath, 'app'), '.tsx'),
  ...walkDir(join(basePath, 'components'), '.tsx'),
];

console.log(`Found ${tsxFiles.length} .tsx files to process`);

for (const filePath of tsxFiles) {
  let content = readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;
  
  for (const [oldStr, newStr] of replacements) {
    if (content.includes(oldStr)) {
      const count = content.split(oldStr).length - 1;
      content = content.split(oldStr).join(newStr);
      fileReplacements += count;
    }
  }
  
  if (fileReplacements > 0) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  ${filePath}: ${fileReplacements} replacement(s)`);
    totalReplacements += fileReplacements;
    filesChanged++;
  }
}

console.log(`\nDone! ${totalReplacements} total replacements across ${filesChanged} files.`);
