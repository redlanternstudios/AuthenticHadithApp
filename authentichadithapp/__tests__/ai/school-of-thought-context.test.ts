const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', '..');

describe('school of thought preference context', () => {
  it('sends the selected school of thought to the mobile chat route', () => {
    const groqSource = fs.readFileSync(path.join(appRoot, 'lib/api/groq.ts'), 'utf8');
    const assistantSource = fs.readFileSync(path.join(appRoot, 'app/(tabs)/assistant.tsx'), 'utf8');

    expect(groqSource).toContain('ChatUserContext');
    expect(groqSource).toContain('userContext');
    expect(assistantSource).toContain('useSchoolOfThought');
    expect(assistantSource).toContain('sendChatMessage([...messages, userMessage], { schoolOfThought })');
  });

  it('uses madhab only as an assistant context lens', () => {
    const routeSource = fs.readFileSync(path.join(appRoot, 'app/api/mobile-chat/route.ts'), 'utf8');

    expect(routeSource).toContain('school of thought during onboarding');
    expect(routeSource).toContain('juristic context lens');
    expect(routeSource).toContain('Do not alter hadith text, authenticity, grades, citations, or translations');
    expect(routeSource).toContain('Do not invent');
  });

  it('shows the saved school of thought in profile', () => {
    const profileSource = fs.readFileSync(path.join(appRoot, 'app/(tabs)/profile.tsx'), 'utf8');

    expect(profileSource).toContain('School of Thought');
    expect(profileSource).toContain('schoolOfThought ||');
  });
});
