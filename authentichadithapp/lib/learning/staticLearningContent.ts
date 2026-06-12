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
      content: `Every act in Islam begins in the heart long before it appears on the limbs. Intention (niyyah) is the hidden engine that gives an action its weight, its direction, and its reward. Two people can perform the exact same deed, yet one is rewarded fully and the other gains nothing, and the only difference between them is what their heart intended.

The Prophet (peace be upon him) said: "Innamal a'malu bin-niyyat" — "Actions are judged only by intentions, and every person will have only what they intended." (Arabic: إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ) Narrated by Umar ibn al-Khattab (ra). Collection: Sahih al-Bukhari #1 and Sahih Muslim #1907. Grade: Sahih.

The scholars placed this hadith at the very beginning of their books for a reason: it is the gate to every other deed. A habit becomes worship when the heart turns it toward Allah, and worship becomes empty when the heart turns toward people. Renewing intention is how an ordinary day becomes a day of reward.

Daily Application: Before your next prayer, study session, or act of charity, pause for three seconds and silently say, "O Allah, this is for You." Repeat that reset at the start of each new task today.

Umma Connection: The collective acts of the ummah — congregational prayer, zakat that feeds the poor, community service — draw their power from collective sincerity. When millions intend their deeds purely for Allah, private intention becomes a shared current that lifts the whole community.`,
      order_index: 1,
      estimated_minutes: 6,
      created_at: CREATED_AT,
    },
    {
      id: 'foundations-prayer',
      title: 'Prayer as a Daily Anchor',
      description: 'Use the five prayers as the structure of a faithful day.',
      content: `Prayer is not an interruption to the day; it is the frame the rest of the day hangs on. The five daily prayers divide the hours into manageable spans and return the believer to Allah again and again, so that no stretch of life passes without remembrance and renewal.

The Prophet (peace be upon him) asked: (أَرَأَيْتُمْ لَوْ أَنَّ نَهَرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ مِنْهُ كُلَّ يَوْمّ خَمْسًا مَاذَا يَبْقَى مِنْ دَرَنِهِ) "Tell me, if one of you had a river at his door and bathed in it five times a day, would any dirt remain on him?" They said, "No dirt would remain." He said, "That is the example of the five prayers; through them Allah erases sins." Narrated by Abu Hurairah (ra). Collection: Sahih al-Bukhari #528 and Sahih Muslim #667. Grade: Sahih.

The image is precise: just as flowing water carries away dirt, each prayer washes away the small slips that gather between one prayer and the next. Prayer is therefore both a cleansing and a reset — a moment to pause, remember your purpose, and return to your responsibilities with a cleaner heart.

Daily Application: Pray at least one of today's five prayers at its earliest time instead of delaying it. Notice how anchoring that one prayer steadies the hours around it.

Umma Connection: The five prayers unite roughly 1.8 billion Muslims worldwide in the same bowing and prostration, facing the same qiblah, moving through the same hours as the sun crosses the earth. When you stand to pray, you join a continuous, unbroken wave of worship that never stops circling the globe.`,
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
      content: `The beginning and end of each day are spiritual thresholds. The Sunnah fills these moments with remembrance (adhkar) so that the believer opens and closes the day anchored to Allah, protected and grateful, rather than swept straight into distraction.

The Prophet (peace be upon him) said: "Whoever says in the morning and in the evening, 'Subhanallahi wa bihamdihi' (Arabic: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ) — Glory and praise be to Allah — one hundred times, no one will come on the Day of Resurrection with anything better than what he brought, except one who said the same or more." Narrated by Abu Hurairah (ra). Collection: Sahih Muslim #2692. Grade: Sahih.

For protection at the close of the day, the Sunnah adds: "A'udhu bikalimatillahit-tammati min sharri ma khalaq" (Arabic: أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ) — "I seek refuge in the perfect words of Allah from the evil of what He created," recited three times in the evening. Collection: Sahih Muslim #2709.

These adhkar are light on the tongue but heavy on the scale. They require no special place and only a few minutes, yet they wrap the day in remembrance and seeking of refuge.

Daily Application: Tonight, recite "Subhanallahi wa bihamdihi" one hundred times and the refuge dua three times. Tomorrow, repeat the praise in the morning. Tie each to a fixed cue — after Fajr and after Maghrib.

Umma Connection: Morning and evening adhkar are practiced by Muslims on every continent, in every language. When you remember Allah at dawn and dusk, you join millions performing the same remembrance at the same edges of their own day.`,
      order_index: 1,
      estimated_minutes: 15,
      created_at: CREATED_AT,
    },
    {
      id: 'daily-small-consistent',
      title: 'Small Consistent Deeds',
      description: 'Why steady practice matters more than bursts of intensity.',
      content: `Many people begin worship with a burst of energy, take on far too much, and burn out within a week. The prophetic model is the opposite: choose something small, and never let it go. Consistency, not intensity, is what builds a lasting relationship with Allah.

The Prophet (peace be upon him) said: (أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ) "The most beloved deeds to Allah are the most consistent ones, even if they are small." Narrated by Aisha (ra). Collection: Sahih al-Bukhari #6464 and Sahih Muslim #783. Grade: Sahih. From the same source he also taught: "Take on only what you can bear of good deeds, for Allah does not tire until you tire."

These two narrations work together. The first tells us what Allah loves most — steadiness. The second protects us from the trap of overreaching, reminding us that the goal is a deed we can keep, not a deed that exhausts us and disappears.

Daily Application: Pick one small act you can sustain every single day — two pages of Quran, ten minutes of dhikr, or one extra sunnah prayer — and commit to it for the next thirty days without raising the amount. Guard the floor before you reach for the ceiling.

Umma Connection: The strength of the ummah is not built from rare heroic feats but from millions of small, private, consistent acts. Each believer anchored in a steady daily practice becomes a stable thread, and together those threads weave a resilient community that does not collapse when enthusiasm fades.`,
      order_index: 2,
      estimated_minutes: 6,
      created_at: CREATED_AT,
    },
    {
      id: 'daily-eating-etiquette',
      title: 'Islamic Etiquette of Eating',
      description:
        'Prophetic guidance on eating: beginning with Bismillah, eating with the right hand, and eating from what is nearest.',
      content: `Islam transforms even the most ordinary daily act — eating — into an act of worship and mindfulness. The Prophet (peace be upon him) gave clear, gentle etiquette (adab) for the table, so that a believer remembers Allah at every meal and distinguishes their habits from heedlessness.

He (peace be upon him) said: "When one of you eats, let him eat with his right hand, and when he drinks, let him drink with his right hand, for Shaytan eats with his left hand and drinks with his left hand." Narrated by Abdullah ibn Umar (ra). Collection: Sahih Muslim #2020. Grade: Sahih.

On beginning with Allah's name he taught: "When one of you begins eating, he should say Bismillah. If he forgets at the beginning, he should say, 'Bismillahi fi awwalihi wa akhirihi' (Arabic: بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ) — In the name of Allah at its beginning and its end." Narrated by Aisha (ra). Collection: Abu Dawud #3767 and Tirmidhi #1858. Grade: Sahih.

And to a young boy at his table he said: "O young boy, say Bismillah, eat with your right hand, and eat from what is nearest to you." Narrated by Umar ibn Abi Salamah (ra). Collection: Sahih al-Bukhari #5376 and Sahih Muslim #2022. Grade: Sahih.

Daily Application: At your very next meal, say Bismillah before the first bite, eat with your right hand, and take from the food closest to you. If you forget the Bismillah, recover it with the longer phrase.

Umma Connection: These simple practices unite Muslim families around the world at every meal — a shared prophetic habit that turns every table, from one home to the next, into an act of worship.`,
      order_index: 3,
      estimated_minutes: 15,
      created_at: CREATED_AT,
    },
  ],
  'hadith-sciences': [
    {
      id: 'hadith-chain-text',
      title: 'Chain and Text',
      description: 'Learn the basic difference between isnad and matn.',
      content: `One of the great gifts of this ummah is that it did not just preserve what the Prophet (peace be upon him) said — it preserved exactly how that saying reached us. Every authentic hadith carries two parts: the chain of people who passed it down, and the words themselves.

The scholar Abdullah ibn al-Mubarak said: "The isnad is part of the religion. Were it not for the isnad, anyone could say whatever they wished." (Recorded in the Muqaddimah of Sahih Muslim.) The prophetic foundation underlying that science: "Whoever deliberately lies about me, let him take his seat in the Fire." (مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ) Narrated by numerous Companions. Collection: Sahih al-Bukhari #110 and Sahih Muslim #4. Grade: Mutawatir. This warning made exact chain preservation a religious obligation.

The two key terms are simple. The isnad is the chain of narrators — the line of trustworthy people who transmitted the report from the Prophet (peace be upon him) down to us, each one named and examined. The matn is the actual text — the wording of the hadith itself, the guidance you read and act upon. Both are studied: the chain is checked for the reliability and connection of its narrators, and the text is checked for soundness and consistency.

Daily Application: When you read a hadith this week, slow down and separate the two parts. The phrase "narrated by..." or "reported by..." marks the isnad — the people. The quoted statement of the Prophet (peace be upon him) is the matn — the message. Practice naming each part out loud in any hadith you encounter.

Umma Connection: This careful chain of transmission is what kept the Prophet's words intact across fourteen centuries and countless lands. When you read an authentic hadith today, you are receiving it through an unbroken human chain that links you directly back to the Messenger of Allah.`,
      order_index: 1,
      estimated_minutes: 8,
      created_at: CREATED_AT,
    },
    {
      id: 'hadith-gradings',
      title: 'Understanding Gradings',
      description: 'A beginner-friendly look at authentic, good, and weak reports.',
      content: `Not every statement attributed to the Prophet (peace be upon him) is established to the same degree. The scholars of hadith — among them Imam al-Nawawi and Imam al-Tirmidhi — developed a precise grading system so that believers know exactly how strongly a report rests on its evidence before they act on it.

The four core categories are: Sahih (Authentic) — a report that meets every condition of reliability in both its chain and its text; Hasan (Good) — a report with a slightly weaker chain that is still acceptable as evidence and for practice; Da'if (Weak) — a report with a deficiency in its chain or text, over which scholars differ regarding its use; and Mawdu (Fabricated) — an invented statement falsely attributed to the Prophet, which is rejected outright and never from him.

The stakes are severe. The Prophet (peace be upon him) said: (مَنْ حَدَّثَ عَنِّي بِحَدِيثّ يَرَى أَنَّهُ كَذِبٌ فَهُوَ أَحَدُ الْكَاذِبَيْنِ) "Whoever narrates from me a hadith thinking it is false is one of the two liars." Narrated by Samura ibn Jundub (ra). Collection: Sahih Muslim (Introduction). Grade: Sahih. This is why scholars guarded the gradings so carefully — attributing a lie to the Messenger is among the gravest sins.

Daily Application: When you encounter a hadith — in a book, a post, or a lecture — look for its grading and its source. For matters of ibadah (worship), rely only on what is graded sahih or hasan, and verify before you spread it.

Umma Connection: This grading system protects the entire ummah from building its worship on false foundations. Every time a believer checks a grading before sharing, they help keep the community's understanding of the religion clean and trustworthy.`,
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
      content: `Mercy (rahmah) is not a soft extra in Islam; it is the heart of prophetic character and a direct path to Allah's own mercy. The Prophet (peace be upon him) tied the mercy we receive from Allah to the mercy we extend to His creation, making compassion a daily transaction with our Lord.

He (peace be upon him) said: (الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَٰنُ ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ) "Those who show mercy will be shown mercy by the Most Merciful. Show mercy to those on earth, and the One above the heavens will show mercy to you." Narrated by Abdullah ibn Amr (ra). Collection: Abu Dawud #4941 and Tirmidhi #1924. Grade: Sahih. He also warned plainly: "He who does not show mercy to others will not be shown mercy." Narrated by Jarir ibn Abdullah (ra). Collection: Sahih al-Bukhari #6013 and Sahih Muslim #2318. Grade: Sahih.

These narrations frame mercy as both a command and a measure. The mercy you give is the mercy you are positioning yourself to receive. Far from weakness, true mercy is disciplined care — gentleness with people, patience with their faults, and active effort to ease their burdens.

Daily Application: Choose one person today who tests your patience — a relative, a coworker, a stranger — and deliberately respond to them with gentleness instead of harshness. Let your mercy toward them be your appeal for Allah's mercy toward you.

Umma Connection: Mercy is the very quality Allah names in the Bismillah — Ar-Rahman, Ar-Rahim — which a Muslim recites before every meaningful act. The ummah is called to make that name visible: a community known not for harshness but for being a source of relief and compassion to everyone it touches.`,
      order_index: 1,
      estimated_minutes: 7,
      created_at: CREATED_AT,
    },
    {
      id: 'character-truthfulness',
      title: 'Truthfulness and Trust',
      description: 'Why honesty is a foundation of Islamic character.',
      content: `Truthfulness (sidq) is not a single act but a direction the whole self travels in. The Prophet (peace be upon him) described honesty and lying as two roads, each one shaping the traveler until it becomes their permanent identity before Allah.

He (peace be upon him) said: (عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ) "Truthfulness leads to righteousness (birr), and righteousness leads to Paradise. A man keeps telling the truth until he is recorded with Allah as a truthful one (siddiq). Lying leads to wickedness, and wickedness leads to the Fire. A man keeps lying until he is recorded with Allah as a liar." Narrated by Abdullah ibn Masud (ra). Collection: Sahih al-Bukhari #6094 and Sahih Muslim #2607. Grade: Sahih.

The lesson is that character is cumulative. No one is branded truthful or liar by a single word; it is the repeated choice that fixes the label. Every honest statement, even when it is costly, nudges a person toward the rank of siddiq — the highest station of truthfulness short of prophethood.

Daily Application: Today, catch yourself in one moment where a small lie would be easier — an excuse, an exaggeration, a convenient half-truth — and choose the honest words instead, even at a cost. Build the habit one statement at a time.

Umma Connection: Trust (amanah) is the social fabric that holds the ummah together. Communities where people speak truthfully and keep their word become places of safety, where business, marriage, and neighborly life can rest on something solid. Truthfulness is how a Muslim contributes to that shared security.`,
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
      content: `Maintaining family ties (silat al-rahim) is among the most emphasized social duties in Islam, and the Prophet (peace be upon him) attached remarkable worldly and spiritual rewards to it. Caring for relatives is not merely good manners; it is an act of worship with direct consequences for one's life and provision.

He (peace be upon him) said: (مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ) "Whoever wishes to have his provision expanded and his lifespan extended, let him maintain the ties of kinship." Narrated by Anas ibn Malik (ra). Collection: Sahih al-Bukhari #5986 and Sahih Muslim #2557. Grade: Sahih. He also raised the standard higher: "The one who maintains ties of kinship is not the one who reciprocates; rather it is the one who, when his ties of kinship are cut, still maintains them." Narrated by Abdullah ibn Amr (ra). Collection: Sahih al-Bukhari #5991. Grade: Sahih.

Together these narrations teach that real kinship is not transactional. Anyone can return a call or a visit; the believer is asked to keep reaching out even toward relatives who have pulled away, turning patience and initiative into a means of blessing.

Daily Application: Reach out today to one relative you have drifted from — a call, a visit, or a sincere message — without waiting for them to reach out first. Let your effort be the one that mends the gap.

Umma Connection: The ummah is built outward from its smallest unit, the family. When believers strengthen their kinship bonds, they reinforce the foundation that the larger community rests on — a society of connected, supported households rather than isolated individuals.`,
      order_index: 1,
      estimated_minutes: 8,
      created_at: CREATED_AT,
    },
    {
      id: 'community-neighbor',
      title: 'The Right of the Neighbor',
      description: 'Build community trust through care for nearby people.',
      content: `In Islam, faith is measured partly by how you treat the people who live closest to you. The Prophet (peace be upon him) raised the right of the neighbor to such a height that he linked it directly to the soundness of a believer's faith.

He (peace be upon him) said, swearing three times for emphasis: (وَاللَّهِ لَا يُؤْمِنُ وَاللَّهِ لَا يُؤْمِنُ وَاللَّهِ لَا يُؤْمِنُ) "By Allah, he does not believe. By Allah, he does not believe. By Allah, he does not believe." It was asked, "Who, O Messenger of Allah?" He said, "The one whose neighbor is not safe from his harm." Narrated by Abu Hurairah (ra). Collection: Sahih al-Bukhari #6016 and Sahih Muslim #46. Grade: Sahih. He also said: "Jibril kept urging me to be good to my neighbor until I thought he would make him an heir." Narrated by Aisha and Ibn Umar (ra). Collection: Sahih al-Bukhari #6015 and Sahih Muslim #2625. Grade: Sahih.

The first hadith sets the floor — at minimum, your neighbor must be safe from your harm. The second sets the ceiling — the angel Jibril stressed kindness to neighbors so insistently that the Prophet expected them to inherit. Between those two lies the believer's daily duty: remove harm, and actively do good.

Daily Application: Do one concrete good for a neighbor today — a greeting, a small gift, help with a task, or simply ensuring your noise and conduct cause them no trouble.

Umma Connection: Safe, supportive neighborhoods are the ummah made visible on every street. When Muslims meet the prophetic standard toward those next door, the community becomes a felt reality rather than an abstract idea.`,
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
      content: `Mature study of the religion begins with a duty and a discipline: the duty to seek knowledge, and the discipline to understand a text before applying it. Rushing a hadith from the page to a verdict, without weighing its context, is one of the most common errors of the sincere but hasty student.

The Prophet (peace be upon him) said: (طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمّ) "Seeking knowledge is an obligation upon every Muslim." Narrated by Anas ibn Malik (ra). Collection: Sunan Ibn Majah #224. Grade: Sahih (authenticated by al-Albani and others). This obligation is not satisfied by collecting quotations; it is fulfilled by understanding them rightly.

The Sahaba modeled this. They would ask about the occasion of revelation (asbab al-nuzul) for verses and the circumstances surrounding a hadith — to whom it was said, when, and why — before drawing conclusions. They understood that the same words can carry different applications depending on their setting, and that scholars across generations refined how a report is applied in changing conditions.

Daily Application: Before applying any hadith to a specific situation this week, run it through three questions: (1) Who was this addressed to? (2) What was the occasion or circumstance behind it? (3) What do qualified scholars say about how it applies today? If you cannot answer these, pause and ask someone who can.

Umma Connection: Context-based reading protects the ummah from extremism and shallow rulings alike. A community that learns to ask before it acts preserves both the integrity of the texts and the unity of its people, leaving the heavy lifting of derivation to those qualified for it.`,
      order_index: 1,
      estimated_minutes: 10,
      created_at: CREATED_AT,
    },
    {
      id: 'scholar-action',
      title: 'Knowledge That Becomes Action',
      description: 'The purpose of study is worship, character, and obedience.',
      content: `The aim of sacred knowledge is not to win arguments or accumulate information; it is to produce worship, character, and benefit. Knowledge that does not move from the head to the hands and heart has missed its purpose. The believer therefore asks Allah for knowledge that is beneficial and for the ability to act on it.

The Prophet (peace be upon him) taught this supplication: "O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds." (Arabic: اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا) Narrated by Umm Salamah (ra). Collection: Sunan Ibn Majah #925 and Musnad Ahmad. Grade: Sahih (authenticated). He also pointed to the highest expression of knowledge-into-action: "The best of you are those who learn the Quran and teach it." Narrated by Uthman ibn Affan (ra). Collection: Sahih al-Bukhari #5027. Grade: Sahih.

Notice the progression in the dua: beneficial knowledge first, then sustenance to live on, then deeds that Allah accepts. Knowledge is meant to flower into practice, and practice into teaching, so that what you learn does not end with you.

Daily Application: Take one thing you have learned this week and act on it today, then pass it to one other person — a family member, a friend, a child. Let the knowledge complete its cycle from learning to action to transmission.

Umma Connection: Every scholar of the ummah stands on a chain of teachers and students reaching back to the Prophet (peace be upon him). When you learn, apply, and teach, you step into that living chain of transmission and help carry the religion forward to the next link.`,
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
