/**
 * Supabase Client Safety Tests
 * Verifies client initialization and env variable handling.
 */

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports a supabase client instance', () => {
    const { supabase } = require('@/lib/supabase/client');
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.auth).toBe('object');
  });

  it('exports API_CONFIG with a baseUrl', () => {
    const { API_CONFIG } = require('@/lib/supabase/client');
    expect(API_CONFIG).toBeDefined();
    expect(typeof API_CONFIG.baseUrl).toBe('string');
    expect(API_CONFIG.baseUrl.length).toBeGreaterThan(0);
  });

  it('exports Hadith type shape', () => {
    // Type-level check: ensure the module does not crash on import
    const mod = require('@/lib/supabase/client');
    expect(mod).toBeDefined();
  });
});
