// lib/learning/staticQuizContent.ts
// FIX-075 — Hardcoded lesson-correlated quizzes
// 3 quizzes, each tied to specific content from staticLearningContent.ts.
// Questions reference exact Arabic phrases, hadith numbers, narrators, and
// teachings from the 13 lessons — NOT generic DB-backed questions.

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
  // ─── QUIZ 1 — Foundations & Daily Practice ──────────────────────────────
  // Covers: foundations-intention, foundations-prayer, daily-morning-evening,
  //         daily-small-consistent, daily-eating-etiquette
  {
    id: "quiz-foundations-daily",
    title: "Foundations & Daily Practice",
    description: "Intention, prayer, dhikr, consistency, and eating etiquette",
    emoji: "\u{1F305}",
    lessonIds: [
      "foundations-intention",
      "foundations-prayer",
      "daily-morning-evening",
      "daily-small-consistent",
      "daily-eating-etiquette",
    ],
    questions: [
      {
        question:
          "The hadith \u{0625}\u{0646}\u{0651}\u{0645}\u{064E}\u{0627} \u{0627}\u{0644}\u{0623}\u{0639}\u{0645}\u{064E}\u{0627}\u{0644}\u{064F} \u{0628}\u{0650}\u{0627}\u{0644}\u{0646}\u{0651}\u{064A}\u{0651}\u{064E}\u{0627}\u{062A}\u{0650}\n(\"Actions are judged by intentions\") was narrated by which companion?",
        options: [
          "Abu Hurairah (ra)",
          "Umar ibn al-Khattab (ra)",
          "Aisha (ra)",
          "Abdullah ibn Masud (ra)",
        ],
        correctIndex: 1,
        explanation:
          "Umar ibn al-Khattab (ra) narrated this hadith — recorded as Bukhari #1 and Muslim #1907. It opens most hadith collections because intention is the foundation of every act of worship.",
      },
      {
        question:
          "In the prayer hadith (Bukhari #528), the Prophet \u{FDFA} compared 5 daily prayers to bathing in a river 5 times daily. What is the lesson?",
        options: [
          "Prayer should be performed near water",
          "Prayer physically purifies the body",
          "Prayer erases sins just as water removes filth",
          "Prayer counts as physical cleanliness",
        ],
        correctIndex: 2,
        explanation:
          "\u{0623}\u{0631}\u{064E}\u{0623}\u{064E}\u{064A}\u{062A}\u{064F}\u{0645}\u{0652} \u{0644}\u{064E}\u{0648}\u{0652} \u{0623}\u{064E}\u{0646}\u{0651}\u{064E} \u{0646}\u{064E}\u{0647}\u{064E}\u{0631}\u{064B}\u{0627} \u2014 \"Would any filth remain?\" The five daily prayers erase minor sins between them, spiritually purifying the believer each day.",
      },
      {
        question:
          "Saying \u{0633}\u{064F}\u{0628}\u{0652}\u{062D}\u{064E}\u{0627}\u{0646}\u{064E} \u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0648}\u{064E}\u{0628}\u{0650}\u{062D}\u{064E}\u{0645}\u{0652}\u{062F}\u{0650}\u{0647}\u{0650} (SubhanAllah wa bihamdihi) 100 times results in what? (Muslim #2692)",
        options: [
          "A supplication guaranteed to be answered",
          "Sins erased even if like the foam of the sea",
          "100 good deeds written in the ledger",
          "Protection from evil all day",
        ],
        correctIndex: 1,
        explanation:
          "Muslim #2692: Whoever says SubhanAllah wa bihamdihi 100 times, his sins are wiped away even if they were like the foam of the sea. A small consistent act with enormous spiritual weight.",
      },
      {
        question:
          "Aisha (ra) narrated (Bukhari #6464): \u{0623}\u{062D}\u{064E}\u{0628}\u{0651}\u{064F} \u{0627}\u{0644}\u{0623}\u{0639}\u{0645}\u{064E}\u{0627}\u{0644}\u{0650} \u{0625}\u{0644}\u{064E}\u{0649} \u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0623}\u{062F}\u{064E}\u{0648}\u{0645}\u{064F}\u{0647}\u{064E}\u{0627} \u{0648}\u{064E}\u{0625}\u{0646}\u{0652} \u{0642}\u{064E}\u{0644}\u{0651}\u{064E} \u2014 What does this mean?",
        options: [
          "The most difficult deeds are most beloved to Allah",
          "The most plentiful deeds are most beloved to Allah",
          "The most consistent deeds are most beloved, even if small",
          "Deeds in congregation are most beloved to Allah",
        ],
        correctIndex: 2,
        explanation:
          "\"The most beloved deeds to Allah are the most consistent, even if small.\" \u2014 Bukhari #6464. Consistency beats intensity. A small daily act maintained is worth more than a large act done once.",
      },
      {
        question:
          "If a Muslim forgets Bismillah before eating and remembers mid-meal, what should they say according to the eating etiquette hadith?",
        options: [
          "Alhamdulillah",
          "Astaghfirullah three times",
          "Bismillah fi awwalihi wa akhirihi",
          "SubhanAllah wa bihamdihi",
        ],
        correctIndex: 2,
        explanation:
          "\u{0628}\u{0650}\u{0633}\u{0652}\u{0645}\u{0650} \u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0641}\u{0650}\u{064A}\u{0020}\u{0623}\u{064E}\u{0648}\u{0651}\u{064E}\u{0644}\u{0650}\u{0647}\u{0650} \u{0648}\u{064E}\u{0622}\u{062E}\u{0650}\u{0631}\u{0650}\u{0647}\u{0650} \u2014 \"In the name of Allah at its beginning and end.\" The Prophet \u{FDFA} prescribed this as the correction when Bismillah is forgotten at the start.",
      },
    ],
  },

  // ─── QUIZ 2 — Hadith Sciences & Character ────────────────────────────────
  // Covers: hadith-chain-text, hadith-gradings, character-mercy, character-truthfulness
  {
    id: "quiz-hadith-character",
    title: "Hadith Sciences & Character",
    description: "Isnad, hadith grades, the ethics of mercy and truthfulness",
    emoji: "\u{1F4DC}",
    lessonIds: [
      "hadith-chain-text",
      "hadith-gradings",
      "character-mercy",
      "character-truthfulness",
    ],
    questions: [
      {
        question:
          "What warning did the Prophet \u{FDFA} give about intentionally fabricating hadith? (Bukhari #110, Muslim #4)",
        options: [
          "The fabricator loses all their good deeds",
          "The fabricator will not enter Paradise for 40 years",
          "Let them prepare their seat in the Hellfire",
          "The fabricator\u2019s testimony is rejected for life",
        ],
        correctIndex: 2,
        explanation:
          "\u{0645}\u{064E}\u{0646}\u{0652} \u{0643}\u{064E}\u{0630}\u{064E}\u{0628}\u{064E} \u{0639}\u{064E}\u{0644}\u{064E}\u{064A}\u{0651}\u{064E} \u{0645}\u{064F}\u{062A}\u{064E}\u{0639}\u{064E}\u{0645}\u{0651}\u{064F}\u{062F}\u{064B}\u{0627} \u{0641}\u{064E}\u{0644}\u{0652}\u{064A}\u{064E}\u{062A}\u{064E}\u{0628}\u{064E}\u{0648}\u{0651}\u{064E}\u{0623}\u{0652} \u{0645}\u{064E}\u{0642}\u{0652}\u{0639}\u{064E}\u{062F}\u{064E}\u{0647}\u{064F} \u{0645}\u{0650}\u{0646}\u{064E} \u{0627}\u{0644}\u{0646}\u{0651}\u{064E}\u{0627}\u{0631}\u{0650} \u2014 \"Whoever intentionally lies about me, let him prepare his seat in the Fire.\" Among the most transmitted warnings in all of hadith literature.",
      },
      {
        question:
          "In hadith classification, what does the grade Sahih (\u{0635}\u{062D}\u{064A}\u{062D}) indicate?",
        options: [
          "Weak \u2014 a narrator has poor memory",
          "Good \u2014 slightly below the highest grade",
          "Authentic \u2014 unbroken trustworthy chain, free of defects",
          "Fabricated \u2014 invented after the Prophet \u{FDFA}",
        ],
        correctIndex: 2,
        explanation:
          "Sahih = Authentic: (1) unbroken chain back to the Prophet \u{FDFA}, (2) all narrators are upright (adl) and have precise memory (dabt), (3) no hidden defect (\u2019illah), (4) not contradicted by a stronger narration (shudhudh).",
      },
      {
        question:
          "Abdullah ibn Amr (ra) narrated: \u{0627}\u{0644}\u{0631}\u{0651}\u{064E}\u{0627}\u{062D}\u{0650}\u{0645}\u{064F}\u{0648}\u{0646}\u{064E} \u{064A}\u{064E}\u{0631}\u{062D}\u{064E}\u{0645}\u{064F}\u{0647}\u{064F}\u{0645}\u{064F} \u{0627}\u{0644}\u{0631}\u{0651}\u{064E}\u{062D}\u{0652}\u{0645}\u{064E}\u{0670}\u{0646}\u{064F}\n(Abu Dawud #4941). What does this mean?",
        options: [
          "Those who pray will be blessed by the Most Merciful",
          "The merciful will be shown mercy by the Most Merciful",
          "Those who give charity receive divine mercy",
          "The Most Merciful forgives all who repent",
        ],
        correctIndex: 1,
        explanation:
          "\"The merciful will be shown mercy by the Most Merciful. Have mercy on those on earth, and He who is in heaven will have mercy on you.\" \u2014 Abu Dawud #4941, Tirmidhi #1924. Mercy to creation is the path to Allah\u2019s mercy.",
      },
      {
        question:
          "Abdullah ibn Masud (ra) narrated (Bukhari #6094): truthfulness (\u{0627}\u{0644}\u{0635}\u{0651}\u{062F}\u{0642}\u{064F}) leads through what chain to Paradise?",
        options: [
          "Truthfulness \u2192 wealth \u2192 Jannah",
          "Truthfulness \u2192 patience \u2192 Jannah",
          "Truthfulness \u2192 righteousness (birr) \u2192 Jannah",
          "Truthfulness \u2192 forgiveness \u2192 Jannah",
        ],
        correctIndex: 2,
        explanation:
          "\u{0639}\u{064E}\u{0644}\u{064E}\u{064A}\u{0652}\u{0643}\u{064F}\u{0645}\u{0652} \u{0628}\u{0650}\u{0627}\u{0644}\u{0635}\u{0651}\u{062F}\u{0642}\u{0650} \u{0641}\u{064E}\u{0625}\u{0646}\u{0651}\u{064E} \u{0627}\u{0644}\u{0635}\u{0651}\u{062F}\u{0642}\u{064E} \u{064A}\u{064E}\u{0647}\u{062F}\u{0650}\u{064A} \u{0625}\u{0644}\u{064E}\u{0649} \u{0627}\u{0644}\u{0628}\u{0650}\u{0631}\u{0651}\u{0650} \u2014 Truthfulness \u2192 birr (righteousness) \u2192 Jannah. The inverse: lying \u2192 transgression (fujur) \u2192 Fire.",
      },
      {
        question:
          "What does Da\u2019if (\u{0636}\u{0639}\u{064A}\u{0641}) mean in hadith grading?",
        options: [
          "The highest authenticity grade",
          "Certainly fabricated \u2014 rejected outright",
          "Weak \u2014 one or more conditions for Sahih/Hasan are unmet",
          "Narrated by only one companion",
        ],
        correctIndex: 2,
        explanation:
          "Da\u2019if (Weak): a condition for Sahih or Hasan is missing \u2014 e.g., a narrator with poor memory, a broken chain, or a hidden defect. Da\u2019if hadith cannot establish rulings, though some scholars permit them for virtuous deeds (fada\u2019il al-a\u2019mal) under strict conditions.",
      },
    ],
  },

  // ─── QUIZ 3 — Family, Community & Scholarship ────────────────────────────
  // Covers: family-kinship, community-neighbor, scholar-context, scholar-action
  {
    id: "quiz-family-scholarship",
    title: "Family, Community & Scholarship",
    description: "Kinship, neighbor rights, seeking knowledge, and beneficial learning",
    emoji: "\u{1F3E1}",
    lessonIds: [
      "family-kinship",
      "community-neighbor",
      "scholar-context",
      "scholar-action",
    ],
    questions: [
      {
        question:
          "Anas ibn Malik (ra) narrated (Bukhari #5986): maintaining ties of kinship (silat al-rahim) results in what?",
        options: [
          "More children and a larger household",
          "Expanded provision (rizq) and a lengthened lifespan",
          "Protection from envy and the evil eye",
          "A respected reputation in the community",
        ],
        correctIndex: 1,
        explanation:
          "\u{0645}\u{064E}\u{0646}\u{0652} \u{0623}\u{064E}\u{062D}\u{064E}\u{0628}\u{064E}\u{0651} \u{0623}\u{064E}\u{0646}\u{0652} \u{064A}\u{064F}\u{0628}\u{0652}\u{0633}\u{064E}\u{0637}\u{064E} \u{0644}\u{064E}\u{0647}\u{064F} \u{0641}\u{0650}\u{064A} \u{0631}\u{0650}\u{0632}\u{0652}\u{0642}\u{0650}\u{0647}\u{0650} \u2014 \"Whoever loves to have their provision expanded and lifespan extended, let them maintain ties of kinship.\" \u2014 Bukhari #5986, Muslim #2557.",
      },
      {
        question:
          "The neighbor hadith (Bukhari #6016) opens with the Prophet \u{FDFA} swearing \"By Allah, he does not truly believe\" \u2014 three times. He is speaking about someone whose:",
        options: [
          "Prayer is not performed on time",
          "Family ties are cut off",
          "Neighbor is not safe from their harm",
          "Zakah has not been paid",
        ],
        correctIndex: 2,
        explanation:
          "\u{0648}\u{064E}\u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0644}\u{064E}\u{0627} \u{064A}\u{064F}\u{0624}\u{0652}\u{0645}\u{0650}\u{0646}\u{064F} \u{0648}\u{064E}\u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0644}\u{064E}\u{0627} \u{064A}\u{064F}\u{0624}\u{0652}\u{0645}\u{0650}\u{0646}\u{064F} \u{0648}\u{064E}\u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{0650} \u{0644}\u{064E}\u{0627} \u{064A}\u{064F}\u{0624}\u{0652}\u{0645}\u{0650}\u{0646}\u{064F} \u2014 Narrated by Abu Hurairah (ra). The threefold oath signals severity: harming neighbors is a matter of iman, not just manners.",
      },
      {
        question:
          "\u{0637}\u{064E}\u{0644}\u{064E}\u{0628}\u{064F} \u{0627}\u{0644}\u{0652}\u{0639}\u{0650}\u{0644}\u{0652}\u{0645}\u{0650} \u{0641}\u{064E}\u{0631}\u{0650}\u{064A}\u{0636}\u{064E}\u{0629}\u{064C} \u{0639}\u{064E}\u{0644}\u{064E}\u{0649} \u{0643}\u{064F}\u{0644}\u{0651}\u{0650} \u{0645}\u{064F}\u{0633}\u{0652}\u{0644}\u{0650}\u{0645}\u{0640}\n\"Seeking knowledge is obligatory upon every Muslim\" \u2014 who narrated this?",
        options: [
          "Abu Hurairah (ra) \u2014 Sahih Bukhari",
          "Aisha (ra) \u2014 Sahih Muslim",
          "Anas ibn Malik (ra) \u2014 Sunan Ibn Majah #224",
          "Umar ibn al-Khattab (ra) \u2014 Sunan Abu Dawud",
        ],
        correctIndex: 2,
        explanation:
          "Narrated by Anas ibn Malik (ra), recorded in Sunan Ibn Majah #224. The obligation covers \u2018aqeedah, core worship (\u2018ibadah), and the Islamic rulings governing daily life that every Muslim must know.",
      },
      {
        question:
          "The morning du\u2019a \u{0627}\u{0644}\u{0644}\u{0651}\u{064E}\u{0647}\u{064F}\u{0645}\u{064E}\u{0651} \u{0625}\u{0646}\u{0651}\u{0650}\u{064A} \u{0623}\u{064E}\u{0633}\u{0652}\u{0623}\u{064E}\u{0644}\u{064F}\u{0643}\u{064E} \u{0639}\u{0650}\u{0644}\u{0652}\u{0645}\u{064B}\u{0627} \u{0646}\u{064E}\u{0627}\u{0641}\u{0650}\u{0639}\u{064B}\u{0627}\nwas narrated by which female companion? (Ibn Majah #925)",
        options: [
          "Aisha (ra)",
          "Fatimah al-Zahra (ra)",
          "Khadijah bint Khuwaylid (ra)",
          "Umm Salamah (ra)",
        ],
        correctIndex: 3,
        explanation:
          "\"O Allah, I ask You for beneficial knowledge, accepted deeds, and pure provision\" \u2014 narrated by Umm Salamah (ra), Ibn Majah #925. The key word \u{0646}\u{064E}\u{0627}\u{0641}\u{0650}\u{0639}\u{064B}\u{0627} (beneficial) teaches that knowledge must produce action, not just information.",
      },
      {
        question:
          "In the hadith sciences lesson, why did Ibn al-Mubarak say \"The isnad is part of the religion\"?",
        options: [
          "Hadith without isnad are more poetic and memorable",
          "Without the chain, anyone could claim anything about the Prophet \u{FDFA}",
          "Scholars memorized chains instead of texts",
          "The isnad makes hadith easier to categorize",
        ],
        correctIndex: 1,
        explanation:
          "Ibn al-Mubarak: \"Were it not for the isnad, anyone could say whatever they wished.\" The chain of narrators is the authentication mechanism protecting the Sunnah \u2014 verifiable, traceable back to eyewitnesses of the Prophet \u{FDFA}.",
      },
    ],
  },
]

export function getStaticQuiz(id: string): StaticQuiz | null {
  return STATIC_QUIZZES.find((q) => q.id === id) ?? null
}
