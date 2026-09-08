/**
 * Splash & Branding Integrity Invariant Test Suite
 * 
 * Hardcodes the complete ban of the Expo placeholder "black square"
 * and ensures the authentic Hadith golden emblem is strictly enforced
 * across iOS storyboard, Android adaptive icons, and runtime layout.
 */
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../../");
const ASSETS_DIR = path.join(APP_DIR, "assets/images");

describe("Splash & Brand Integrity Invariants (Anti-Black-Square Hardcode)", () => {
  // 1. splash-icon.png must be the authentic hadith emblem (>100KB, 1024x1024 RGBA)
  it("splash-icon.png exists, is > 200KB (not the 41KB Expo placeholder grid), and is 32-bit RGBA", () => {
    const splashPath = path.join(ASSETS_DIR, "splash-icon.png");
    expect(fs.existsSync(splashPath)).toBe(true);
    
    const stats = fs.statSync(splashPath);
    expect(stats.size).toBeGreaterThan(200 * 1024); // Brand emblem is ~503KB; Expo grid was ~41KB

    const buf = fs.readFileSync(splashPath);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const bitDepth = buf.readUInt8(24);
    const colorType = buf.readUInt8(25);

    expect(width).toBe(1024);
    expect(height).toBe(1024);
    expect(bitDepth).toBe(8);
    expect(colorType).toBe(6); // 6 = RGBA (Truecolor with alpha)
  });

  // 2. icon.png must exist and be 1024x1024
  it("icon.png exists and is 1024x1024", () => {
    const iconPath = path.join(ASSETS_DIR, "icon.png");
    expect(fs.existsSync(iconPath)).toBe(true);
    const buf = fs.readFileSync(iconPath);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1024);
    expect(height).toBe(1024);
  });

  // 3. app.json must lock splash background to emerald (#1b5e43) and never black (#000000)
  it("app.json splash configuration is hardcoded to emerald (#1b5e43) for both light and dark mode", () => {
    const appJsonPath = path.join(APP_DIR, "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

    // Top-level splash
    expect(appJson.expo.splash.image).toBe("./assets/images/splash-icon.png");
    expect(appJson.expo.splash.backgroundColor).toBe("#1b5e43");

    // expo-splash-screen plugin
    const plugins = appJson.expo.plugins || [];
    const splashPlugin = plugins.find((p: any) => Array.isArray(p) && p[0] === "expo-splash-screen");
    expect(splashPlugin).toBeDefined();

    const config = splashPlugin[1];
    expect(config.image).toBe("./assets/images/splash-icon.png");
    expect(config.backgroundColor).toBe("#1b5e43");
    expect(config.imageWidth).toBe(200);

    // Dark mode MUST NOT use #000000 (which produces black screen on dark-mode devices)
    expect(config.dark).toBeDefined();
    expect(config.dark.backgroundColor).toBe("#1b5e43");
    expect(config.dark.imageWidth).toBe(200);
  });

  // 4. app/_layout.tsx must render emerald (#1b5e43) during font loading
  it("app/_layout.tsx font loading fallback matches emerald (#1b5e43) with zero black flash", () => {
    const layoutPath = path.join(APP_DIR, "app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf8");
    expect(content).toContain("backgroundColor: '#1b5e43'");
    expect(content).not.toContain("colorScheme === 'dark' ? '#000000' : '#1b5e43'");
  });
});
