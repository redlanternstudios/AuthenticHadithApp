import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'user-theme-preference';

export type ThemeMode = 'light' | 'dark';

/**
 * Save user's theme preference to secure storage
 */
export async function saveThemePreference(theme: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
}

/**
 * Load user's theme preference from secure storage
 * Returns 'light' as default if no preference is saved
 */
export async function loadThemePreference(): Promise<ThemeMode> {
  try {
    const theme = await SecureStore.getItemAsync(THEME_KEY);
    return (theme === 'dark' ? 'dark' : 'light') as ThemeMode;
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return 'light';
  }
}

/**
 * Clear saved theme preference
 */
export async function clearThemePreference(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(THEME_KEY);
  } catch (error) {
    console.error('Failed to clear theme preference:', error);
  }
}
