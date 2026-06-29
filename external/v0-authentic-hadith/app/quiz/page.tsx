"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Sparkles,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuota } from "@/hooks/use-quota"
import { UsageBanner } from "@/components/usage-banner"
import { UpgradeModal, type UpgradeReason } from "@/components/upgrade-modal"

interface QuizQuestion {
  id: string
  question: string
  type: "narrator" | "collection" | "grade" | "completion" | "ai"
  options: string[]
  correctIndex: number
  hadithRef: string
  arabicHint?: string
  explanation?: string
}

interface QuizAttempt {
  id: string
  total_questions: number
  correct_answers: number
  score_percent: number
  created_at: string
}

interface LearningPath {
  id: string
  title: string
  slug: string
  color: string
  level: string
}

type QuizMode = "general" | "ai_learning"
type Stage = "setup" | "quiz" | "results"

export default function QuizPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { quota, refresh: refreshQuota } = useQuota()
  const [stage, setStage] = useState<Stage>("setup")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [quizCount, setQuizCount] = useState(5)
  const [pastAttempts, setPastAttempts] = useState<QuizAttempt[]>([])
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [quizMode, setQuizMode] = useState<QuizMode>("general")
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const quizLimitReached = quota && !quota.isPremium && quota.usage.quizzesRemaining <= 0

  useEffect(() => {
    const fetchInit = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const [attemptsRes, pathsRes] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("learning_paths")
          .select("id, title, slug, color, level")
          .order("sort_order"),
      ])
      if (attemptsRes.data) setPastAttempts(attemptsRes.data)
      if (pathsRes.data) setLearningPaths(pathsRes.data)
    }
    fetchInit()
  }, [supabase])

  // Timer
  useEffect(() => {
    if (stage !== "quiz") return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [stage, startTime])

  const generateQuiz = useCallback(async () => {
    setLoading(true)
    // Fetch random hadiths for question generation
    const { data: hadiths } = await supabase
      .from("hadiths")
      .select("id, arabic_text, english_translation, collection, reference, grade, narrator")
              .in("collection", ["sahih-bukhari", "sahih-muslim"])
      .not("narrator", "is", null)
      .not("english_translation", "is", null)
      .limit(200)

    if (!hadiths || hadiths.length < 4) {
      setLoading(false)
      return
    }

    // Shuffle and pick
    const shuffled = hadiths.sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, Math.min(quizCount * 3, shuffled.length))
    const generated: QuizQuestion[] = []

    const questionTypes: Array<"narrator" | "collection" | "grade" | "completion"> = [
      "narrator",
      "collection",
      "grade",
      "completion",
    ]

    for (let i = 0; i < Math.min(quizCount, picked.length); i++) {
      const h = picked[i]
      const type = questionTypes[i % questionTypes.length]
      let question = ""
      let options: string[] = []
      let correctIndex = 0

      if (type === "narrator") {
        question = `Who narrated this hadith?\n"${h.english_translation?.substring(0, 120)}..."`
        const correct = h.narrator || "Unknown"
        const others = shuffled
          .filter((x) => x.narrator && x.narrator !== correct)
          .map((x) => x.narrator!)
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .slice(0, 3)
        while (others.length < 3) others.push("Unknown narrator")
        options = [correct, ...others].sort(() => Math.random() - 0.5)
        correctIndex = options.indexOf(correct)
      } else if (type === "collection") {
        question = `Which collection does this hadith belong to?\n"${h.english_translation?.substring(0, 120)}..."`
        const correct = h.collection || "Unknown"
        const others = shuffled
          .filter((x) => x.collection && x.collection !== correct)
          .map((x) => x.collection)
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .slice(0, 3)
        while (others.length < 3) others.push("Other Collection")
        options = [correct, ...others].sort(() => Math.random() - 0.5)
        correctIndex = options.indexOf(correct)
      } else if (type === "grade") {
        question = `What is the grade of this hadith?\n"${h.english_translation?.substring(0, 120)}..."`
        const correct = h.grade?.charAt(0).toUpperCase() + h.grade?.slice(1) || "Sahih"
        options = ["Sahih", "Hasan", "Da'if", "Mawdu'"]
        correctIndex = options.findIndex((o) => o.toLowerCase() === correct.toLowerCase())
        if (correctIndex === -1) correctIndex = 0
      } else {
        // completion - identify part of the hadith
        const words = h.english_translation?.split(" ") || []
        if (words.length > 10) {
          const cutOff = Math.floor(words.length * 0.6)
          const start = words.slice(0, cutOff).join(" ")
          const correctEnd = words.slice(cutOff, cutOff + 4).join(" ") + "..."
          question = `Complete the hadith:\n"${start} ___"`
          const otherEnds = shuffled
            .filter((x) => x.id !== h.id && x.english_translation)
            .slice(0, 3)
            .map((x) => {
              const w = x.english_translation!.split(" ")
              const c = Math.floor(w.length * 0.6)
              return w.slice(c, c + 4).join(" ") + "..."
            })
          while (otherEnds.length < 3) otherEnds.push("...other text...")
          options = [correctEnd, ...otherEnds].sort(() => Math.random() - 0.5)
          correctIndex = options.indexOf(correctEnd)
        } else {
          // Fallback to narrator
          question = `Who narrated: "${h.english_translation?.substring(0, 120)}..."`
          const correct = h.narrator || "Unknown"
          const others = shuffled.filter((x) => x.narrator && x.narrator !== correct).map((x) => x.narrator!).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 3)
          while (others.length < 3) others.push("Unknown")
          options = [correct, ...others].sort(() => Math.random() - 0.5)
          correctIndex = options.indexOf(correct)
        }
      }

      generated.push({
        id: h.id,
        question,
        type,
        options,
        correctIndex,
        hadithRef: h.reference || "",
        arabicHint: h.arabic_text?.substring(0, 60),
      })
    }

    setQuestions(generated)
    setCurrentIndex(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setStartTime(Date.now())
    setElapsed(0)
    setStage("quiz")
    setLoading(false)
  }, [supabase, quizCount])

  const generateAIQuiz = useCallback(async () => {
    if (!selectedPathId) return
    setLoading(true)
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathId: selectedPathId,
          count: quizCount,
          mode: "learning_path",
        }),
      })

      if (!res.ok) {
        console.error("AI quiz generation failed:", res.status)
        setLoading(false)
        return
      }

      const data = await res.json()
      if (!data.questions || data.questions.length === 0) {
        setLoading(false)
        return
      }

      const aiQuestions: QuizQuestion[] = data.questions.map(
        (q: { question: string; options: string[]; correctIndex: number; explanation?: string; relatedHadithRef?: string }, i: number) => ({
          id: `ai-${i}`,
          question: q.question,
          type: "ai" as const,
          options: q.options,
          correctIndex: q.correctIndex,
          hadithRef: q.relatedHadithRef || "",
          explanation: q.explanation,
        })
      )

      setQuestions(aiQuestions)
      setCurrentIndex(0)
      setSelected(null)
      setRevealed(false)
      setScore(0)
      setStartTime(Date.now())
      setElapsed(0)
      setStage("quiz")
    } catch (err) {
      console.error("AI quiz error:", err)
    }
    setLoading(false)
  }, [selectedPathId, quizCount])

  const handleSelect = (index: number) => {
    if (revealed) return
    setSelected(index)
  }

  const handleReveal = () => {
    if (selected === null) return
    setRevealed(true)
    if (selected === questions[currentIndex].correctIndex) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      // Quiz complete - save attempt
      // score state may not reflect the last answer yet (React batching), so compute it directly
      const lastWasCorrect = selected === questions[currentIndex].correctIndex
      const finalScore = lastWasCorrect ? score + 1 : score
      const scorePct = Math.round((finalScore / questions.length) * 100)
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_type: quizMode === "ai_learning" ? "ai_learning" : "general",
          total_questions: questions.length,
          correct_answers: finalScore,
          score_percent: scorePct,
          time_taken_seconds: timeTaken,
        })
      }

      setScore(finalScore)
      setStage("results")
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const currentQ = questions[currentIndex]
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (stage === "quiz" ? setStage("setup") : router.back())}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#C5A059]" />
              <h1 className="text-lg font-bold text-foreground">Knowledge Quiz</h1>
            </div>
          </div>
          {stage === "quiz" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(elapsed)}
              </span>
              <span className="font-medium text-foreground">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
          )}
        </div>
        {/* Progress bar during quiz */}
        {stage === "quiz" && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-[#C5A059] to-[#E8C77D] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* SETUP STAGE */}
        {stage === "setup" && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full gold-icon-bg flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-[#C5A059]" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Test Your Knowledge</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Answer questions about hadith narrators, collections, grades, and content to deepen your understanding.
              </p>
            </div>

            {/* Quiz Mode Selector */}
            <div className="premium-card gold-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Quiz Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuizMode("general")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    quizMode === "general"
                      ? "border-[#C5A059] bg-[#C5A059]/5"
                      : "border-border hover:border-[#C5A059]/50",
                  )}
                >
                  <BookOpen className="w-5 h-5 text-[#C5A059] mb-2" />
                  <p className="text-sm font-semibold text-foreground">General Quiz</p>
                  <p className="text-xs text-muted-foreground mt-1">Random hadith questions</p>
                </button>
                <button
                  onClick={() => setQuizMode("ai_learning")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    quizMode === "ai_learning"
                      ? "border-[#C5A059] bg-[#C5A059]/5"
                      : "border-border hover:border-[#C5A059]/50",
                  )}
                >
                  <Sparkles className="w-5 h-5 text-[#C5A059] mb-2" />
                  <p className="text-sm font-semibold text-foreground">AI-Powered</p>
                  <p className="text-xs text-muted-foreground mt-1">From your learning paths</p>
                </button>
              </div>
            </div>

            {/* Learning Path Selector (AI mode) */}
            {quizMode === "ai_learning" && learningPaths.length > 0 && (
              <div className="premium-card gold-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Select Learning Path</h3>
                <div className="space-y-2">
                  {learningPaths.map((path) => (
                    <button
                      key={path.id}
                      onClick={() => setSelectedPathId(path.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left",
                        selectedPathId === path.id
                          ? "border-[#C5A059] bg-[#C5A059]/5"
                          : "border-border hover:border-[#C5A059]/50",
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: path.color || "#1B5E43" }}
                      >
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{path.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{path.level}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Count Selector */}
            <div className="premium-card gold-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Number of Questions</h3>
              <div className="flex gap-3">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizCount(n)}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-sm font-medium border transition-all",
                      quizCount === n
                        ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416] border-transparent"
                        : "border-border text-muted-foreground hover:border-[#C5A059]",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz limit banner for free users */}
            {quota && !quota.isPremium && (
              <UsageBanner
                used={quota.usage.quizzesToday}
                limit={quota.usage.quizDailyLimit}
                label="Daily quizzes"
              />
            )}

            {/* Start Button */}
            <button
              onClick={() => {
                if (quizLimitReached) {
                  setShowUpgrade(true)
                  return
                }
                if (quizMode === "ai_learning") {
                  generateAIQuiz()
                } else {
                  generateQuiz()
                }
              }}
              disabled={loading || (quizMode === "ai_learning" && !selectedPathId)}
              className={cn(
                "w-full py-4 rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50",
                quizLimitReached
                  ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416]"
                  : "gold-button",
              )}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#2c2416] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{quizMode === "ai_learning" ? "AI is generating questions..." : "Loading..."}</span>
                </div>
              ) : quizLimitReached ? (
                <>
                  <Crown className="w-5 h-5" />
                  Upgrade for Unlimited Quizzes
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {quizMode === "ai_learning" ? "Generate AI Quiz" : "Start Quiz"}
                </>
              )}
            </button>

            <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="quiz_limit" />

            {/* Past Attempts */}
            {pastAttempts.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Recent Attempts</h3>
                <div className="space-y-2">
                  {pastAttempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-lg premium-card"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy
                          className={cn(
                            "w-5 h-5",
                            attempt.score_percent >= 80
                              ? "text-[#C5A059]"
                              : attempt.score_percent >= 50
                                ? "text-[#1B5E43]"
                                : "text-muted-foreground",
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {attempt.correct_answers}/{attempt.total_questions} correct
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          attempt.score_percent >= 80
                            ? "text-[#C5A059]"
                            : attempt.score_percent >= 50
                              ? "text-[#1B5E43]"
                              : "text-destructive",
                        )}
                      >
                        {Math.round(attempt.score_percent)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUIZ STAGE */}
        {stage === "quiz" && currentQ && (
          <div className="space-y-6">
            {/* Question Type Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#C5A059]/10 text-[#C5A059] capitalize">
                {currentQ.type === "completion" ? "Complete the Hadith" : currentQ.type === "ai" ? "AI Generated" : currentQ.type}
              </span>
              {currentQ.hadithRef && (
                <span className="text-xs text-muted-foreground">{currentQ.hadithRef}</span>
              )}
            </div>

            {/* Question */}
            <div className="premium-card gold-border rounded-xl p-6">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{currentQ.question}</p>
              {currentQ.arabicHint && (
                <p className="text-sm text-muted-foreground mt-3 text-right font-arabic" dir="rtl">
                  {currentQ.arabicHint}...
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isCorrect = idx === currentQ.correctIndex
                const isSelected = idx === selected
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={revealed}
                    className={cn(
                      "w-full p-4 rounded-xl text-left transition-all border-2",
                      revealed && isCorrect && "border-[#1B5E43] bg-[#1B5E43]/10",
                      revealed && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      !revealed && isSelected && "border-[#C5A059] bg-[#C5A059]/5",
                      !revealed && !isSelected && "border-border hover:border-[#C5A059]/50",
                      revealed && !isCorrect && !isSelected && "border-border opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          revealed && isCorrect && "bg-[#1B5E43] text-white",
                          revealed && isSelected && !isCorrect && "bg-destructive text-white",
                          !revealed && isSelected && "bg-[#C5A059] text-white",
                          !revealed && !isSelected && "bg-muted text-muted-foreground",
                          revealed && !isCorrect && !isSelected && "bg-muted text-muted-foreground",
                        )}
                      >
                        {revealed && isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : revealed && isSelected && !isCorrect ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </span>
                      <span className="text-sm font-medium text-foreground">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* AI Explanation */}
            {revealed && currentQ.explanation && (
              <div className="rounded-xl bg-[#1B5E43]/5 border border-[#1B5E43]/20 p-4">
                <p className="text-xs font-semibold text-[#1B5E43] uppercase mb-1">Explanation</p>
                <p className="text-sm text-foreground leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-3">
              {!revealed ? (
                <button
                  onClick={handleReveal}
                  disabled={selected === null}
                  className="flex-1 py-3 rounded-xl gold-button flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl emerald-button text-white flex items-center justify-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    "See Results"
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* RESULTS STAGE */}
        {stage === "results" && (
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center gold-success-icon">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Quiz Complete!</h2>
              <p className="text-muted-foreground">
                You scored {score} out of {questions.length}
              </p>
            </div>

            {/* Score Circle */}
            <div className="inline-flex items-center justify-center">
              <div
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center border-4",
                  pct >= 80
                    ? "border-[#C5A059] bg-[#C5A059]/10"
                    : pct >= 50
                      ? "border-[#1B5E43] bg-[#1B5E43]/10"
                      : "border-destructive bg-destructive/10",
                )}
              >
                <span
                  className={cn(
                    "text-4xl font-bold",
                    pct >= 80 ? "text-[#C5A059]" : pct >= 50 ? "text-[#1B5E43]" : "text-destructive",
                  )}
                >
                  {pct}%
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="premium-card p-4 rounded-xl">
                <p className="text-2xl font-bold text-[#1B5E43]">{score}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <p className="text-2xl font-bold text-destructive">{questions.length - score}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <p className="text-2xl font-bold text-foreground">{formatTime(elapsed)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>

            {/* Encouragement */}
            <div className="premium-card gold-border rounded-xl p-4">
              <p className="text-sm text-foreground">
                {pct >= 80
                  ? "Excellent! Your knowledge of hadith is outstanding. Keep studying to maintain this level."
                  : pct >= 50
                    ? "Good effort! Review the collections you found challenging and try again."
                    : "Keep learning! The more hadiths you read, the better you'll do. Try browsing the collections."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStage("setup")
                }}
                className="flex-1 py-3 rounded-xl border-2 border-[#C5A059] text-[#C5A059] font-medium flex items-center justify-center gap-2 hover:bg-[#C5A059]/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => router.push("/collections")}
                className="flex-1 py-3 rounded-xl emerald-button text-white flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Study More
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
