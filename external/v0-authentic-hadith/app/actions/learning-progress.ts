"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { trackActivity } from "./track-activity"

export async function markLessonStarted(lessonId: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  // Upsert - only set started_at if not already started
  const { error } = await supabase.from("learning_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  )

  if (error) {
    console.error("Mark lesson started error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markLessonCompleted(lessonId: string) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase.from("learning_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  )

  if (error) {
    console.error("Mark lesson completed error:", error)
    return { success: false, error: error.message }
  }

  // Track activity for XP
  await trackActivity("hadith_read", lessonId)

  return { success: true }
}

export async function saveLessonQuizScore(
  lessonId: string,
  score: number,
  passed: boolean,
  pathId?: string,
  totalQuestions?: number,
  correctAnswers?: number,
  timeTaken?: number,
  questions?: unknown
) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  // Update learning_progress with quiz results
  const { error: progressError } = await supabase.from("learning_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      completed_at: new Date().toISOString(),
      quiz_score: score,
      quiz_passed: passed,
    },
    { onConflict: "user_id,lesson_id" }
  )

  if (progressError) {
    console.error("Save quiz score error:", progressError)
    return { success: false, error: progressError.message }
  }

  // Also log to quiz_attempts table
  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    lesson_id: lessonId,
    learning_path_id: pathId || null,
    quiz_type: "lesson",
    score_percent: score,
    passed,
    total_questions: totalQuestions || 0,
    correct_answers: correctAnswers || 0,
    time_taken_seconds: timeTaken || 0,
    questions: questions || null,
  })

  if (passed) {
    await trackActivity("quiz_completed", lessonId)
  }

  return { success: true }
}

export async function getUserLearningProgress() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { progress: [], userId: null }

  const { data } = await supabase
    .from("learning_progress")
    .select("lesson_id, status, completed_at, quiz_passed, quiz_score")
    .eq("user_id", user.id)

  return { progress: data || [], userId: user.id }
}
