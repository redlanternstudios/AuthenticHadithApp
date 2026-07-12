"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Loader2,
  Circle,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { markLessonStarted, markLessonCompleted } from "@/app/actions/learning-progress"
import { LessonContent } from "@/components/learn/lesson-content"
import { LessonQuiz } from "@/components/learn/lesson-quiz"
import { cn } from "@/lib/utils"

interface Lesson {
  id: string
  module_id: string
  slug: string
  title: string
  description: string | null
  content_markdown: string | null
  content_type: string
  hadith_ids: string[]
  collection_slug: string | null
  book_number: number | null
  sort_order: number
  has_quiz: boolean
  estimated_minutes: number
}

interface Module {
  id: string
  path_id: string
  slug: string
  title: string
  description: string
  sort_order: number
}

interface LearningPath {
  id: string
  title: string
  slug: string
  color: string
}

interface SiblingLesson {
  id: string
  title: string
  sort_order: number
}

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_index: number
  hint_text: string | null
  sort_order: number
}

interface Progress {
  status: string
  completed_at: string | null
  quiz_score: number | null
  quiz_passed: boolean
}

export default function LessonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [path, setPath] = useState<LearningPath | null>(null)
  const [siblings, setSiblings] = useState<SiblingLesson[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [hadiths, setHadiths] = useState<Array<{
    id: string
    arabic_text: string
    english_translation: string
    collection: string
    reference: string
    grade: string
  }>>([])

  const fetchData = useCallback(async () => {
    // Fetch lesson
    const { data: lessonData } = await supabase
      .from("learning_lessons")
      .select("*")
      .eq("id", lessonId)
      .single()

    if (!lessonData) {
      setLoading(false)
      return
    }
    setLesson(lessonData)

    // Mark as started
    markLessonStarted(lessonId).catch(() => {})

    // Fetch module and path in parallel
    const [moduleRes, progressRes, quizRes] = await Promise.all([
      supabase.from("learning_modules").select("*").eq("id", lessonData.module_id).single(),
      supabase
        .from("learning_progress")
        .select("status, completed_at, quiz_score, quiz_passed")
        .eq("lesson_id", lessonId)
        .maybeSingle(),
      lessonData.has_quiz
        ? supabase
            .from("learning_quiz_questions")
            .select("*")
            .eq("lesson_id", lessonId)
            .order("sort_order")
        : Promise.resolve({ data: [] }),
    ])

    if (moduleRes.data) {
      setModule(moduleRes.data)

      // Fetch path
      const { data: pathData } = await supabase
        .from("learning_paths")
        .select("id, title, slug, color")
        .eq("id", moduleRes.data.path_id)
        .single()
      if (pathData) setPath(pathData)

      // Fetch siblings (all lessons in same module)
      const { data: siblingData } = await supabase
        .from("learning_lessons")
        .select("id, title, sort_order")
        .eq("module_id", lessonData.module_id)
        .order("sort_order")
      if (siblingData) setSiblings(siblingData)
    }

    if (progressRes.data) {
      setProgress(progressRes.data)
    }

    if (quizRes.data && quizRes.data.length > 0) {
      setQuizQuestions(quizRes.data)
    }

    // Fetch referenced hadiths if any
    if (lessonData.hadith_ids && lessonData.hadith_ids.length > 0) {
      const { data: hadithData } = await supabase
        .from("hadiths")
        .select("id, arabic_text, english_translation, collection, reference, grade")
        .in("id", lessonData.hadith_ids)
      if (hadithData) setHadiths(hadithData)
    }

    setLoading(false)
  }, [supabase, lessonId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkComplete = async () => {
    if (!lesson) return
    setCompleting(true)
    const result = await markLessonCompleted(lesson.id)
    if (result.success) {
      setProgress({ status: "completed", completed_at: new Date().toISOString(), quiz_score: null, quiz_passed: false })
    }
    setCompleting(false)
  }

  const handleQuizComplete = async (score: number, passed: boolean) => {
    setProgress({
      status: "completed",
      completed_at: new Date().toISOString(),
      quiz_score: score,
      quiz_passed: passed,
    })
    setShowQuiz(false)
  }

  const currentIndex = siblings.findIndex((s) => s.id === lessonId)
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextLesson = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null
  const isCompleted = progress?.status === "completed"

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Lesson not found</p>
          <button onClick={() => router.push("/learn")} className="mt-4 px-4 py-2 rounded-lg gold-button">
            Back to Learn
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/learn")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                {path?.title} {module ? `/ ${module.title}` : ""}
              </p>
              <h1 className="text-sm font-semibold text-foreground truncate">{lesson.title}</h1>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B5E43]/10">
                <CheckCircle2 className="w-4 h-4 text-[#1B5E43]" />
                <span className="text-xs font-medium text-[#1B5E43]">Done</span>
              </div>
            )}
          </div>

          {/* Lesson nav dots */}
          {siblings.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {siblings.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/learn/lesson/${s.id}`)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    s.id === lessonId
                      ? "w-6 bg-[#C5A059]"
                      : "bg-border hover:bg-muted-foreground/40",
                  )}
                  aria-label={`Go to lesson: ${s.title}`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Lesson Meta */}
        <div className="flex items-center gap-3 mb-6">
          {lesson.estimated_minutes > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {lesson.estimated_minutes} min
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground capitalize">
            {lesson.content_type}
          </span>
          {lesson.has_quiz && (
            <span className="px-2.5 py-1 rounded-full bg-[#C5A059]/10 text-xs text-[#C5A059] font-medium">
              Has Quiz
            </span>
          )}
        </div>

        {/* Markdown Content */}
        {lesson.content_markdown && !showQuiz && (
          <LessonContent markdown={lesson.content_markdown} hadiths={hadiths} />
        )}

        {/* Quiz Section */}
        {showQuiz && quizQuestions.length > 0 && (
          <LessonQuiz
            questions={quizQuestions}
            lessonId={lesson.id}
            pathId={path?.id}
            onComplete={handleQuizComplete}
          />
        )}

        {/* Actions */}
        {!showQuiz && (
          <div className="mt-8 flex flex-col gap-3">
            {/* Mark complete / take quiz */}
            {!isCompleted && (
              <>
                {lesson.has_quiz && quizQuestions.length > 0 ? (
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium gold-button text-white"
                  >
                    Take Quiz to Complete
                  </button>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    disabled={completing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium emerald-button text-white disabled:opacity-50"
                  >
                    {completing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {completing ? "Saving..." : "Mark as Complete"}
                  </button>
                )}
              </>
            )}

            {isCompleted && lesson.has_quiz && quizQuestions.length > 0 && (
              <div className="rounded-xl border border-[#1B5E43]/20 bg-[#1B5E43]/5 p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#1B5E43] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1B5E43]">Lesson Completed</p>
                {progress?.quiz_score != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Quiz Score: {Math.round(progress.quiz_score)}%
                  </p>
                )}
                <button
                  onClick={() => setShowQuiz(true)}
                  className="mt-3 px-4 py-2 rounded-lg border border-[#1B5E43]/30 text-xs font-medium text-[#1B5E43] hover:bg-[#1B5E43]/10 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            )}

            {isCompleted && !lesson.has_quiz && (
              <div className="rounded-xl border border-[#1B5E43]/20 bg-[#1B5E43]/5 p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#1B5E43] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1B5E43]">Lesson Completed</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-2">
              {prevLesson ? (
                <button
                  onClick={() => router.push(`/learn/lesson/${prevLesson.id}`)}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border hover:border-[#C5A059] transition-colors text-left"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">Previous</p>
                    <p className="text-xs font-medium text-foreground truncate">{prevLesson.title}</p>
                  </div>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {nextLesson ? (
                <button
                  onClick={() => router.push(`/learn/lesson/${nextLesson.id}`)}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border hover:border-[#C5A059] transition-colors text-right"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">Next</p>
                    <p className="text-xs font-medium text-foreground truncate">{nextLesson.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/learn")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#C5A059]/30 hover:bg-[#C5A059]/5 transition-colors"
                >
                  <span className="text-xs font-medium text-[#C5A059]">Back to Paths</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
