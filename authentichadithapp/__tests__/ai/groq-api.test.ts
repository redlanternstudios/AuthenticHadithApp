/**
 * AI/Groq API Tests
 * Verifies the API module exports, safety filter, and error handling.
 */

describe('Groq API Module', () => {
  it('exports sendChatMessage function', () => {
    const { sendChatMessage } = require('@/lib/api/groq');
    expect(typeof sendChatMessage).toBe('function');
  });

  it('exports AI_REQUEST_FAILED error constant', () => {
    const { AI_REQUEST_FAILED } = require('@/lib/api/groq');
    expect(typeof AI_REQUEST_FAILED).toBe('string');
    expect(AI_REQUEST_FAILED.length).toBeGreaterThan(0);
  });

  it('exports ChatMessage interface (module loads without crash)', () => {
    const mod = require('@/lib/api/groq');
    expect(mod).toBeDefined();
  });
});

describe('Groq API URL hardening', () => {
  it('rewrites the redirecting apex host to www', () => {
    const { normalizeApiBaseUrl } = require('@/lib/config/constants');
    expect(normalizeApiBaseUrl('https://authentichadith.app')).toBe(
      'https://www.authentichadith.app'
    );
  });

  it('removes trailing slashes before mobile-chat is appended', () => {
    const { normalizeApiBaseUrl } = require('@/lib/config/constants');
    expect(normalizeApiBaseUrl('https://www.authentichadith.app///')).toBe(
      'https://www.authentichadith.app'
    );
  });

  it('uses the production www host when config is missing', () => {
    const { normalizeApiBaseUrl } = require('@/lib/config/constants');
    expect(normalizeApiBaseUrl()).toBe('https://www.authentichadith.app');
  });
});

describe('Islamic Safety Filter', () => {
  it('exports checkInputSafety function', () => {
    const { checkInputSafety } = require('@/lib/islamic-safety-filter');
    expect(typeof checkInputSafety).toBe('function');
  });

  it('allows normal hadith questions', () => {
    const { checkInputSafety } = require('@/lib/islamic-safety-filter');
    const result = checkInputSafety([
      { role: 'user', content: 'Explain the hadith about intentions' },
    ]);
    expect(result.allowed).toBe(true);
  });
});

describe('sendChatMessage dual-endpoint resilience', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('falls back to secondary endpoint if primary endpoint returns non-OK', async () => {
    const { sendChatMessage } = require('@/lib/api/groq');
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        clone: () => ({ json: async () => ({ error: 'model not found' }) }),
        json: async () => ({ error: 'model not found' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ response: 'Alhamdulillah, here is your hadith answer.' }),
      });

    const answer = await sendChatMessage([
      { id: '1', role: 'user', content: 'What is ihsan?', timestamp: '2026-09-06T00:00:00Z' },
    ]);

    expect(answer).toBe('Alhamdulillah, here is your hadith answer.');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
