/**
 * Header Integrity & Anti-Leak Invariant Test Suite
 * 
 * Enforces Rule 045: Navigation Chrome & Route Leak Invariant
 * Prevents:
 * 1. Double-headers (rendering both native iOS header and custom in-app ScreenHeader)
 * 2. Raw route leaks (displaying technical paths like 'prophet/[slug]' or 'my-hadith/create-folder' in the top nav bar)
 * 3. Substack directories without explicit _layout.tsx header controls
 */
import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.resolve(__dirname, '../../app');

describe('Header Integrity & Anti-Leak Invariants', () => {
  // Invariant 1: All subdirectories in app/ that contain multi-screen flows must have an explicit _layout.tsx
  const subdirsWithScreens = ['stories', 'my-hadith', 'auth', '(tabs)', 'topics'];

  subdirsWithScreens.forEach((subdir) => {
    it(`subdirectory "app/${subdir}" must have an explicit _layout.tsx`, () => {
      const layoutPath = path.join(APP_DIR, subdir, '_layout.tsx');
      expect(fs.existsSync(layoutPath)).toBe(true);
    });
  });

  // Invariant 2: app/my-hadith/_layout.tsx and app/topics/_layout.tsx must suppress native headers
  it('app/my-hadith/_layout.tsx suppresses native headers for custom ScreenHeader components', () => {
    const layoutPath = path.join(APP_DIR, 'my-hadith', '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('headerShown: false');
  });

  it('app/topics/_layout.tsx suppresses native headers for custom ScreenHeader components', () => {
    const layoutPath = path.join(APP_DIR, 'topics', '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('headerShown: false');
  });

  // Invariant 3: app/stories/_layout.tsx must specify human-readable titles and back button labels
  it('app/stories/_layout.tsx specifies explicit human-readable titles and back button labels', () => {
    const layoutPath = path.join(APP_DIR, 'stories', '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain("headerBackTitle: 'Home'");
    expect(content).toContain("headerBackTitle: 'Stories'");
    expect(content).toContain("title: 'Prophet Story'");
    expect(content).toContain("title: 'Companion Story'");
  });

  // Invariant 4: No screen using ScreenHeader may permit an active native header
  const screensUsingScreenHeader = [
    'my-hadith/create-folder.tsx',
    'my-hadith/folder/[id].tsx',
    'my-hadith/shared/[token].tsx',
    'topics/index.tsx',
    'topics/[slug].tsx',
  ];

  screensUsingScreenHeader.forEach((relPath) => {
    it(`screen "app/${relPath}" explicitly sets Stack.Screen options={{ headerShown: false }}`, () => {
      const filePath = path.join(APP_DIR, relPath);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('headerShown: false');
    });
  });
});
