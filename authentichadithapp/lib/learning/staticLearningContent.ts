import { LearningPath, Lesson } from '@/types/hadith';

const CREATED_AT = '2026-05-30T00:00:00.000Z';

export const STATIC_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'foundations-of-faith',
    title: 'Foundations of Faith',
    description: 'Build a clear foundation in intention, belief, prayer, and daily remembrance.',
    level: 'beginner',
    estimated_hours: 2,
    is_premium: false,
    sort_order: 1,
    created_at: CREATED_AT,
  },
  {
    id: 'daily-practice',
    title: 'Daily Practice',
    description: 'Learn short, authentic habits that bring hadith guidance into everyday life.',
    level: 'beginner',
    estimated_hours: 2,
    is_premium: false,
    sort_order: 2,
    created_at: CREATED_AT,
  },
  {
    id: 'hadith-sciences',
    title: 'Hadith Sciences',
    description: 'Understand how hadith are preserved, graded, narrated, and applied.',
    level: 'intermediate',
    estimated_hours: 3,
    is_premium: false,
    sort_order: 3,
    created_at: CREATED_AT,
  },
  {
    id: 'character-and-ethics',
    title: 'Character and Ethics',
    description: 'Study prophetic guidance on mercy, honesty, patience, and service.',
    level: 'intermediate',
    estimated_hours: 3,
    is_premium: false,
    sort_order: 4,
    created_at: CREATED_AT,
  },
  {
    id: 'family-and-community',
    title: 'Family and Community',
    description: 'Explore hadith guidance for family bonds, neighbors, and community trust.',
    level: 'advanced',
    estimated_hours: 4,
    is_premium: true,
    sort_order: 5,
    created_at: CREATED_AT,
  },
  {
    id: 'scholar-deep-dive',
    title: 'Scholar Deep Dive',
    description: 'A deeper path for advanced readers studying narration, context, and practice.',
    level: 'scholar',
    estimated_hours: 5,
    is_premium: true,
    sort_order: 6,
    created_at: CREATED_AT,
  },
];

export const STATIC_PATH_LESSONS: Record<string, Lesson[]> = {
  'foundations-of-faith': [
    {
      id: 'foundations-intention',
      title: 'Begin With Intention',
      description: 'Why intention shapes every act of worship and daily effort.',
      content:
        'The Prophet taught that actions are judged by intentions. Begin each study session by asking Allah for sincerity, clarity, and action upon what you learn.',
      order_index: 1,
      estimated_minutes: 6,
      created_at: CREATED_AT,
    },
    {
      id: 'foundations-prayer',
      title: 'Prayer as a Daily Anchor',
      description: 'Use the five prayers as the structure of a faithful day.',
      content:
        'Prayer is the believer’s recurring return to Allah. Treat each prayer as a reset: pause, remember your purpose, and return to your responsibilities with cleaner intention.',
      order_index: 2,
      estimated_minutes: 7,
      created_at: CREATED_AT,
    },
  ],
  'daily-practice': [
    {
      id: 'daily-morning-evening',
      title: 'Morning and Evening Remembrance',
      description: 'A simple rhythm for remembrance at the edges of the day.',
      content:
        'The Sunnah teaches regular remembrance in the morning and evening. Start small, stay consistent, and let remembrance become part of the structure of your day.',
      order_index: 1,
      estimated_minutes: 5,
      created_at: CREATED_AT,
    },
    {
      id: 'daily-small-consistent',
      title: 'Small Consistent Deeds',
      description: 'Why steady practice matters more than bursts of intensity.',
      content:
        'The most beloved deeds are those done consistently, even when small. Choose one hadith-guided practice and protect it until it becomes natural.',
      order_index: 2,
      estimated_minutes: 6,
      created_at: CREATED_AT,
    },
  ],
  'hadith-sciences': [
    {
      id: 'hadith-chain-text',
      title: 'Chain and Text',
      description: 'Learn the basic difference between isnad and matn.',
      content:
        'A hadith is studied through its chain of narrators and its text. Both matter: the chain protects transmission, and the text carries the guidance to understand and practice.',
      order_index: 1,
      estimated_minutes: 8,
      created_at: CREATED_AT,
    },
    {
      id: 'hadith-gradings',
      title: 'Understanding Gradings',
      description: 'A beginner-friendly look at authentic, good, and weak reports.',
      content:
        'Hadith gradings help students know how strongly a report is established. For daily practice, prioritize authentic and well-known narrations from reliable collections.',
      order_index: 2,
      estimated_minutes: 9,
      created_at: CREATED_AT,
    },
  ],
  'character-and-ethics': [
    {
      id: 'character-mercy',
      title: 'Mercy in Conduct',
      description: 'Prophetic character begins with mercy toward people.',
      content:
        'Mercy is not weakness. It is disciplined care. Study hadith with the goal of becoming safer, gentler, and more trustworthy to the people around you.',
      order_index: 1,
      estimated_minutes: 7,
      created_at: CREATED_AT,
    },
    {
      id: 'character-truthfulness',
      title: 'Truthfulness and Trust',
      description: 'Why honesty is a foundation of Islamic character.',
      content:
        'Truthfulness protects worship, business, family, and community. Let each hadith you learn call you back to speech and action that can stand before Allah.',
      order_index: 2,
      estimated_minutes: 7,
      created_at: CREATED_AT,
    },
  ],
  'family-and-community': [
    {
      id: 'family-kinship',
      title: 'Honoring Family Ties',
      description: 'Hadith guidance for preserving kinship and family duty.',
      content:
        'Family ties require patience, service, and restraint. The Sunnah calls believers to uphold kinship even when relationships require wisdom and steady effort.',
      order_index: 1,
      estimated_minutes: 8,
      created_at: CREATED_AT,
    },
    {
      id: 'community-neighbor',
      title: 'The Right of the Neighbor',
      description: 'Build community trust through care for nearby people.',
      content:
        'Neighborly care is a visible sign of faith. Look for practical ways to remove harm, offer help, and make your presence a source of safety.',
      order_index: 2,
      estimated_minutes: 8,
      created_at: CREATED_AT,
    },
  ],
  'scholar-deep-dive': [
    {
      id: 'scholar-context',
      title: 'Context Before Application',
      description: 'Advanced study requires context, humility, and careful application.',
      content:
        'A mature student asks where a narration fits: its chapter, audience, wording, related reports, and scholarly explanation. Context protects practice from shallow reading.',
      order_index: 1,
      estimated_minutes: 10,
      created_at: CREATED_AT,
    },
    {
      id: 'scholar-action',
      title: 'Knowledge That Becomes Action',
      description: 'The purpose of study is worship, character, and obedience.',
      content:
        'Deep study should produce deeper humility. The best sign of beneficial knowledge is not argument, but worship, restraint, service, and a heart more awake to Allah.',
      order_index: 2,
      estimated_minutes: 10,
      created_at: CREATED_AT,
    },
  ],
};

export const STATIC_PATH_LESSON_MAP = Object.entries(STATIC_PATH_LESSONS).flatMap(
  ([learning_path_id, lessons]) =>
    lessons.map((lesson) => ({
      learning_path_id,
      lesson_id: lesson.id,
    }))
);

export function getStaticLessonsForPath(pathId?: string | null): Lesson[] {
  if (!pathId) return [];
  return STATIC_PATH_LESSONS[pathId] || [];
}

export function getStaticLesson(lessonId?: string | null): Lesson | null {
  if (!lessonId) return null;
  for (const lessons of Object.values(STATIC_PATH_LESSONS)) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}
