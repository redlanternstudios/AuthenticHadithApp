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
