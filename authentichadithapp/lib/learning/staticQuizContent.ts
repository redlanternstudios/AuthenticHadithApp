import { QuizQuestion } from "@/lib/hadith/generateQuiz"

export interface StaticQuiz {
  id: string
  title: string
  description: string
  emoji: string
  lessonIds: string[]
  questions: QuizQuestion[]
}

export const STATIC_QUIZZES: StaticQuiz[] = [
  {
    id: "quiz-foundations-daily",
    title: "Foundations & Daily Practice",
    description: "Test your knowledge of intention, prayer, dhikr, consistency, and eating etiquette",
    emoji: "🌅",
    lessonIds: [
      "foundations-intention",
      "foundations-prayer",
      "daily-morning-evening",
      "daily-small-consistent",
      "daily-eating-etiquette",
    ],
    questions: [
      {
        question: "The hadith إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ was narrated by which Companion?",
        options: [
          "Abu Hurairah (ra)",
          "Umar ibn al-Khattab (ra)",
          "Abdullah ibn Masud (ra)",
          "Anas ibn Malik (ra)",
        ],
        correctIndex: 1,
        explanation:
          "Umar ibn al-Khattab (ra) narrated this foundational hadith recorded in Bukhari #1 and Muslim #1907. It opens Sahih al-Bukhari, signaling that all actions are judged by their intention.",
      },
      {
        question: "The Prophet (ﷺ) compared the five daily prayers to a river for bathing five times a day. What does this analogy teach?",
        options: [
          "That prayer is spiritually refreshing",
          "That prayer is obligatory every day",
          "That prayer erases sins like water removes dirt",
          "That prayer should be performed near water",
        ],
        correctIndex: 2,
        explanation:
          "Abu Hurairah (ra) narrated this analogy in Bukhari #528 and Muslim #667. Just as bathing five times a day leaves no dirt, the five prayers erase sins accumulated between them — a mercy built into the daily schedule.",
      },
      {
        question: "According to Muslim #2692, what is the spiritual reward for reciting سُبْحَانَ اللَّهِ وَبِحَمْدِهِ 100 times?",
        options: [
          "Guaranteed Jannah",
          "Sins erased even if as much as the foam of the sea",
          "Provision expanded for that day",
          "Protection from shaytan until Maghrib",
        ],
        correctIndex: 1,
        explanation:
          "Abu Hurairah (ra) narrated this in Muslim #2692. 100 repetitions in the morning can wipe sins even if they are as much as the foam of the sea. Weight in words, lightness in effort.",
      },
      {
        question: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ — what does this hadith prioritize?",
        options: [
          "The most difficult deeds",
          "The deeds done in congregation",
          "The most consistent deeds, even if small",
          "Deeds performed in Ramadan",
        ],
        correctIndex: 2,
        explanation:
          "Aisha (ra) narrated this in Bukhari #6464 and Muslim #783. Allah loves consistency over intensity. A small deed performed daily surpasses a large deed done once.",
      },
      {
        question: "If someone forgets to say Bismillah before eating and remembers mid-meal, what should they say?",
        options: [
          "Start the meal over from the beginning",
          "Nothing — the moment has passed",
          "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ (Bismillah fi awwalihi wa akhirihi)",
          "Alhamdulillah and continue",
        ],
        correctIndex: 2,
        explanation:
          "Aisha (ra) narrated this ruling in Abu Dawud #3767 and Tirmidhi #1858. The phrase acknowledges the late start and maintains the Sunnah of eating with the name of Allah throughout.",
      },
      {
        question: "Two people perform the same outward action. According to Bukhari #1, what determines whether their deeds are equal?",
        options: [
          "The time they spent performing the deed",
          "Whether they performed it in congregation",
          "Their inner intention (niyyah)",
          "The number of times they repeated it",
        ],
        correctIndex: 2,
        explanation:
          "The opening hadith of Bukhari establishes that niyyah is the dividing line. One person migrating for Allah earns full reward; another migrating for worldly gain earns only that worldly gain.",
      },
      {
        question: "Who narrated the river-and-five-prayers analogy recorded in Bukhari #528?",
        options: [
          "Abu Hurairah (ra)",
          "Anas ibn Malik (ra)",
          "Jabir ibn Abdullah (ra)",
          "Abdullah ibn Umar (ra)",
        ],
        correctIndex: 0,
        explanation:
          "Abu Hurairah (ra) narrated this in Bukhari #528 and Muslim #667. Abu Hurairah is among the most prolific narrators of hadith, transmitting many of the Prophet's (ﷺ) vivid analogies about daily worship.",
      },
      {
        question: "The evening dua أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ is recorded in which collection?",
        options: [
          "Bukhari #6217",
          "Muslim #2709",
          "Abu Dawud #5088",
          "Tirmidhi #3604",
        ],
        correctIndex: 1,
        explanation:
          "This evening protection formula is recorded in Muslim #2709. Recited three times at the onset of evening, it provides comprehensive protection from the evil of Allah's creation.",
      },
      {
        question: "Aisha (ra) narrated: 'Take on deeds you are capable of.' Why is this critical for spiritual consistency?",
        options: [
          "Because effort without capacity leads to bid'ah",
          "Because Allah provides more reward for easier deeds",
          "Because overburdening oneself leads to abandonment — and Allah loves a deed that is maintained",
          "Because it applies only to nafl prayers",
        ],
        correctIndex: 2,
        explanation:
          "Recorded in Bukhari #6464 and Muslim #783, this guards against burnout. Overloading a practice causes total abandonment. A small, consistent deed loved by Allah outweighs a large deed dropped after a week.",
      },
      {
        question: "The instruction to eat with the right hand in Muslim #2020 was narrated by which Companion?",
        options: [
          "Abu Hurairah (ra)",
          "Umar ibn Abi Salamah (ra)",
          "Anas ibn Malik (ra)",
          "Abdullah ibn Umar (ra)",
        ],
        correctIndex: 3,
        explanation:
          "Abdullah ibn Umar (ra) narrated the right-hand eating instruction in Muslim #2020. Eating with the right hand transforms a mundane act into worship — intentional alignment with the Prophet's (ﷺ) way in every meal.",
      },
    ],
  },
  {
    id: "quiz-hadith-character",
    title: "Hadith Sciences & Character",
    description: "Test your knowledge of hadith grading, chain authentication, mercy, and truthfulness",
    emoji: "📚",
    lessonIds: [
      "hadith-chain-text",
      "hadith-gradings",
      "character-mercy",
      "character-truthfulness",
    ],
    questions: [
      {
        question: "What warning did the Prophet (ﷺ) issue about fabricating hadith, recorded in Bukhari #110?",
        options: [
          "His deeds will be nullified",
          "He will be questioned on Yawm al-Qiyamah",
          "Let him prepare his seat in the Fire",
          "He will be expelled from the Ummah",
        ],
        correctIndex: 2,
        explanation:
          "مَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ — 'Whoever lies about me intentionally, let him prepare his seat in the Fire.' This Mutawatir hadith narrated by over 70 Companions is the strongest warning against fabrication.",
      },
      {
        question: "What does Sahih (صحيح) mean in hadith grading?",
        options: [
          "Narrated by at least three Companions",
          "Recorded in both Bukhari and Muslim",
          "Authentic — continuous chain of upright narrators, free of anomalies and defects",
          "Memorized by at least one hafidh in each generation",
        ],
        correctIndex: 2,
        explanation:
          "Sahih requires: (1) continuous isnad, (2) all narrators are upright (adl) and precise (dabt), (3) no shudhudh (anomaly), (4) no illah (hidden defect). Meeting all four conditions yields the highest grade.",
      },
      {
        question: "What does الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَٰنُ teach about mercy?",
        options: [
          "Mercy is only for those who ask for it",
          "Those who show mercy to others will receive Allah's mercy",
          "Mercy is earned through extra acts of worship",
          "Mercy flows only within family bonds",
        ],
        correctIndex: 1,
        explanation:
          "Abdullah ibn Amr (ra) narrated this in Abu Dawud #4941 and Tirmidhi #1924. 'The merciful are shown mercy by the Most Merciful.' Mercy to creation is the gateway to Allah's mercy — no mercy given means no mercy received.",
      },
      {
        question: "According to Bukhari #6094, where does a chain of truthfulness ultimately lead?",
        options: [
          "To acceptance among people",
          "To long life and expanded provision",
          "To righteousness (birr) and then to Jannah",
          "To becoming a scholar of hadith",
        ],
        correctIndex: 2,
        explanation:
          "Abdullah ibn Masud (ra) narrated: truthfulness leads to birr (righteousness), and birr leads to Jannah. The man continues in truthfulness until he is written with Allah as a Siddiq. The chain is: truth → birr → Jannah.",
      },
      {
        question: "What does Da'if (ضعيف) mean in hadith sciences?",
        options: [
          "Rejected — attributed to the Prophet with no basis",
          "Disputed — scholars disagree on its grading",
          "Weak — one or more of the Sahih conditions are unmet",
          "Rare — narrated by only one Companion",
        ],
        correctIndex: 2,
        explanation:
          "Da'if (Weak) means the hadith falls short of Hasan or Sahih standards — a narrator may have weak memory, be unknown, or there is a break in the chain. Da'if hadiths are not used as evidence for rulings.",
      },
      {
        question: "In hadith sciences, what is the difference between the isnad and the matn?",
        options: [
          "Isnad is the text of the hadith; matn is the chain of narrators",
          "Isnad is the chain of narrators; matn is the actual text of the hadith",
          "Isnad is the grade; matn is the ruling derived from it",
          "Isnad is the written form; matn is the oral transmission",
        ],
        correctIndex: 1,
        explanation:
          "Ibn al-Mubarak noted that the isnad (chain of narrators) is part of the religion itself. The matn is the content — what the Prophet (ﷺ) actually said or did. Hadith scholars scrutinized both: fabricators could forge a matn, but a false chain exposed them.",
      },
      {
        question: "What grade is Hasan (حسن) in hadith sciences?",
        options: [
          "Rejected — narrated by unreliable chains only",
          "Acceptable — meets all Sahih conditions perfectly",
          "Good — meets most Sahih conditions but a narrator has slightly weaker memory",
          "Fabricated — invented after the Prophetic era",
        ],
        correctIndex: 2,
        explanation:
          "Hasan is the grade between Sahih and Da'if. All conditions of Sahih are met except one narrator shows slight weakness in precision (dabt) — not in integrity (adl). Hasan hadiths are valid evidence for rulings.",
      },
      {
        question: "What is the Mawdu (موضوع) grade in hadith sciences?",
        options: [
          "Fabricated — deliberately invented and attributed to the Prophet (ﷺ) without basis",
          "Interrupted — a narrator in the middle of the chain is missing",
          "Weak — fails one of the five Sahih conditions",
          "Suspended — the first narrator after the Companion is missing",
        ],
        correctIndex: 0,
        explanation:
          "Mawdu is outright fabrication. A liar in the chain invented it and ascribed it to the Prophet (ﷺ). The Bukhari #110 fabrication warning applies directly here. Scholars spent lifetimes identifying Mawdu narrations to protect the Sunnah.",
      },
      {
        question: "'He who shows no mercy will be shown no mercy' — which Companion narrated this and where is it recorded?",
        options: [
          "Abu Hurairah (ra) — Muslim #2319",
          "Anas ibn Malik (ra) — Bukhari #7376",
          "Abdullah ibn Amr (ra) — Abu Dawud #4941",
          "Jarir ibn Abdullah (ra) — Bukhari #6013 / Muslim #2318",
        ],
        correctIndex: 3,
        explanation:
          "Jarir ibn Abdullah (ra) narrated this in Bukhari #6013 and Muslim #2318. It complements الرَّاحِمُونَ — both hadiths establish that mercy is not just spiritually rewarded but its absence is spiritually costly.",
      },
      {
        question: "According to Bukhari #6094, what happens to a person who persists in lying?",
        options: [
          "Their prayers are not accepted for 40 days",
          "They are recorded by Allah as a liar (kadhdhab), and lying leads to fujur then to the Fire",
          "They lose their ability to memorize Quran",
          "Their provision is reduced in this world",
        ],
        correctIndex: 1,
        explanation:
          "Abdullah ibn Masud (ra) narrated the complete chain: lying → fujur (wickedness) → Fire. Just as the truthful man is recorded as a Siddiq, the persistent liar is recorded by Allah as a kadhdhab. Character is built or destroyed by what we repeat.",
      },
    ],
  },
  {
    id: "quiz-family-scholarship",
    title: "Family, Community & Scholarship",
    description: "Test your knowledge of kinship ties, neighbor rights, obligation of knowledge, and scholarly wisdom",
    emoji: "🕌",
    lessonIds: [
      "family-kinship",
      "community-neighbor",
      "scholar-context",
      "scholar-action",
    ],
    questions: [
      {
        question: "Anas ibn Malik (ra) narrated in Bukhari #5986 that maintaining silat al-rahim results in what two blessings?",
        options: [
          "Protection from the Fire and entry into Jannah",
          "Expanded provision and longer life",
          "Increased knowledge and righteous offspring",
          "A light on Yawm al-Qiyamah and entry into Jannah without account",
        ],
        correctIndex: 1,
        explanation:
          "مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ — 'Whoever wishes to have his provision expanded and his lifespan extended, let him maintain kinship ties.' The Prophet (ﷺ) connects unseen barakah to how we treat family.",
      },
      {
        question: "The Prophet (ﷺ) repeated 'By Allah, he does not believe' three times. What sin was he describing?",
        options: [
          "A Muslim who does not pray Fajr in congregation",
          "A Muslim who does not pay zakat",
          "A Muslim whose neighbor is not safe from his harm",
          "A Muslim who misses Jumu'ah without excuse",
        ],
        correctIndex: 2,
        explanation:
          "Abu Hurairah (ra) narrated this in Bukhari #6016 and Muslim #46. The triple oath — وَاللَّهِ لَا يُؤْمِنُ — is one of the strongest expressions of severity in the Sunnah. Harming your neighbor is an iman-level issue, not merely an ethics issue.",
      },
      {
        question: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ — who narrated this and in which collection?",
        options: [
          "Abu Hurairah (ra) — Bukhari #60",
          "Abdullah ibn Masud (ra) — Muslim #2699",
          "Anas ibn Malik (ra) — Ibn Majah #224",
          "Umar ibn al-Khattab (ra) — Tirmidhi #2682",
        ],
        correctIndex: 2,
        explanation:
          "Anas ibn Malik (ra) narrated this in Ibn Majah #224, graded Sahih. 'Seeking knowledge is an obligation upon every Muslim' — not a recommendation. The scholar-context lesson adds: apply three questions before using any hadith.",
      },
      {
        question: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا — who narrated this dua and where is it recorded?",
        options: [
          "Aisha (ra) — Muslim #2722",
          "Anas ibn Malik (ra) — Bukhari #6368",
          "Abdullah ibn Masud (ra) — Abu Dawud #5090",
          "Umm Salamah (ra) — Ibn Majah #925",
        ],
        correctIndex: 3,
        explanation:
          "Umm Salamah (ra) narrated this morning dua in Ibn Majah #925. It binds three inseparable elements: beneficial knowledge, pure provision, and accepted deeds. Knowledge without action breaks the chain.",
      },
      {
        question: "Ibn al-Mubarak said: 'The isnad is part of the religion.' What did he warn would happen without it?",
        options: [
          "Scholars would lose the ability to derive rulings",
          "Anyone could say whatever they wished about the Prophet (ﷺ)",
          "The Quran would be misinterpreted",
          "Hadith collections would be corrupted over time",
        ],
        correctIndex: 1,
        explanation:
          "Ibn al-Mubarak's statement is a cornerstone of hadith sciences. Without the chain, anyone could say whatever they wished. The isnad prevents fabrication from being accepted as Sunnah — it is why Muslims can trace every hadith back to its source.",
      },
      {
        question: "What is the higher standard of kinship maintenance described in Bukhari #5991?",
        options: [
          "Visiting relatives every week without fail",
          "Giving sadaqah exclusively to relatives in need",
          "Maintaining ties even when the relative cuts them off",
          "Making dua for relatives in every prayer",
        ],
        correctIndex: 2,
        explanation:
          "Abdullah ibn Amr (ra) narrated in Bukhari #5991 that the true wasil is not the one who reciprocates — that is merely equal exchange. The wasil maintains ties even when the other side cuts them. This is the prophetic standard: unconditional silat al-rahim.",
      },
      {
        question: "Jibril (as) kept urging the Prophet (ﷺ) about kindness to the neighbor until what point?",
        options: [
          "Until the Prophet (ﷺ) included neighbor rights in the khutbah",
          "Until the Prophet (ﷺ) thought the neighbor would inherit from him",
          "Until a specific verse about neighbors was revealed",
          "Until the neighbor accepted Islam",
        ],
        correctIndex: 1,
        explanation:
          "Aisha and Ibn Umar narrated in Bukhari #6015 and Muslim #2625 that Jibril's repeated urging was so persistent that the Prophet (ﷺ) began to think the neighbor would be given a share of inheritance. This is how seriously Islam treats the neighbor's right.",
      },
      {
        question: "The scholar-context lesson teaches asking three questions before applying a hadith. Which option correctly names all three?",
        options: [
          "Who narrated it, when was it recorded, and which collection it appears in",
          "Is it Sahih, is it abrogated, and does the madhab accept it",
          "To whom was it addressed, in what context, and for what purpose",
          "Who is the primary narrator, who is secondary, and is the chain Mutawatir",
        ],
        correctIndex: 2,
        explanation:
          "Before applying any hadith: (1) To whom was it addressed — general or specific? (2) In what context — what situation prompted this? (3) For what purpose — what was being corrected or encouraged? Missing these leads to misapplication.",
      },
      {
        question: "'The best among you are those who learn the Quran and teach it.' Which Companion narrated this and in which collection?",
        options: [
          "Ali ibn Abi Talib (ra) — Muslim #2578",
          "Abu Hurairah (ra) — Tirmidhi #2908",
          "Uthman ibn Affan (ra) — Bukhari #5027",
          "Abdullah ibn Masud (ra) — Ibn Majah #211",
        ],
        correctIndex: 2,
        explanation:
          "Uthman ibn Affan (ra) narrated this in Bukhari #5027. The cycle is complete: learn → internalize → teach → the Ummah benefits. The scholar-action lesson links this directly to Umm Salamah's dua — useful knowledge circulates through learning and teaching.",
      },
      {
        question: "In the dua اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا, what does the word نَافِعًا (nafi'an) signal about the Islamic view of knowledge?",
        options: [
          "Knowledge must produce benefit — it is not complete without action and impact",
          "Knowledge should be memorized before being shared",
          "Knowledge is only valid if it comes from a recognized school",
          "Knowledge must be sought from a certified scholar",
        ],
        correctIndex: 0,
        explanation:
          "نَافِعًا means 'beneficial.' The Prophet (ﷺ) sought refuge from knowledge that does not benefit. In Islam, knowledge is not an intellectual exercise — it must lead to action (amal), which must be accepted (mutaqabbal). The dua encodes: knowledge → deed → divine acceptance.",
      },
    ],
  },
]

export function getStaticQuiz(id: string): StaticQuiz | null {
  return STATIC_QUIZZES.find((q) => q.id === id) ?? null
}
