"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Lightbulb,
  Trophy,
  RotateCcw,
} from "lucide-react"
import { saveLessonQuizScore } from "@/app/actions/learning-progress"
import { cn } from "@/lib/utils"

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_index: number
  hint_text: string | null
  sort_order: number
}

interface LessonQuizProps {
  questions: QuizQuestion[]
  lessonId: string
  pathId?: string
  onComplete: (score: number, passed: boolean) => void
}

export function LessonQuiz({ questions, lessonId, pathId, onComplete }: LessonQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [answers, setAnswers] = useState<Array<{ questionId: string; selected: number; correct: boolean }>>([])
  const [quizDone, setQuizDone] = useState(false)
  const [startTime] = useState(Date.now())

  const question = questions[currentIdx]
  const isCorrect = selectedAnswer === question?.correct_index
  const score = answers.length > 0 ? Math.round((answers.filter((a) => a.correct).length / questions.length) * 100) : 0
  const passed = score >= 70

  const handleSelectAnswer = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    setShowResult(true)
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, selected: selectedAnswer, correct: selectedAnswer === question.correct_index },
    ])
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setShowHint(false)
    } else {
      setQuizDone(true)
    }
  }

  useEffect(() => {
    if (quizDone) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000)
      saveLessonQuizScore(
        lessonId,
        score,
        passed,
        pathId,
        questions.length,
        answers.filter((a) => a.correct).length,
        timeTaken,
        answers
      ).catch(() => {})
    }
  }, [quizDone, lessonId, pathId, score, passed, answers, questions.length, startTime])

  const handleRetry = () => {
    setCurrentIdx(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setShowHint(false)
    setAnswers([])
    setQuizDone(false)
  }

  if (quizDone) {
    return (
      <div className="premium-card rounded-xl p-6 text-center">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            passed ? "bg-[#1B5E43]/10" : "bg-red-50"
          )}
        >
          {passed ? (
            <Trophy className="w-8 h-8 text-[#1B5E43]" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          {passed ? "Quiz Passed" : "Not Quite"}
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          You scored {score}% ({answers.filter((a) => a.correct).length}/{questions.length} correct)
        </p>

        <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              passed ? "bg-[#1B5E43]" : "bg-red-400"
            )}
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="flex flex-col gap-3">
          {passed ? (
            <button
              onClick={() => onComplete(score, true)}
              className="w-full py-3 rounded-xl text-sm font-medium emerald-button text-white"
            >
              Continue
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium emerald-button text-white"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => onComplete(score, false)}
                className="w-full py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Skip for Now
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card rounded-xl p-5 sm:p-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full",
                idx < answers.length
                  ? answers[idx]?.correct
                    ? "bg-[#1B5E43]"
                    : "bg-red-400"
                  : idx === currentIdx
                    ? "bg-[#C5A059]"
                    : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C5A059] transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="text-base font-semibold text-foreground mb-5 leading-relaxed">
        {question.question_text}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx
          const isAnswerCorrect = showResult && idx === question.correct_index
          const isAnswerWrong = showResult && isSelected && !isCorrect

          return (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              disabled={showResult}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm",
                showResult
                  ? isAnswerCorrect
                    ? "border-[#1B5E43] bg-[#1B5E43]/10 text-[#1B5E43] font-medium"
                    : isAnswerWrong
                      ? "border-red-400 bg-red-50 text-red-600"
                      : "border-border text-muted-foreground"
                  : isSelected
                    ? "border-[#C5A059] bg-[#C5A059]/5 text-foreground"
                    : "border-border text-foreground hover:border-[#C5A059]/50"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    showResult
                      ? isAnswerCorrect
                        ? "bg-[#1B5E43] text-white"
                        : isAnswerWrong
                          ? "bg-red-400 text-white"
                          : "bg-muted text-muted-foreground"
                      : isSelected
                        ? "bg-[#C5A059] text-white"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {showResult && isAnswerCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : showResult && isAnswerWrong ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span>{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Hint */}
      {!showResult && question.hint_text && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1.5 mt-4 text-xs text-[#C5A059] hover:text-[#C5A059]/80 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {showHint ? "Hide hint" : "Need a hint?"}
        </button>
      )}
      {showHint && question.hint_text && (
        <div className="mt-2 p-3 rounded-lg bg-[#C5A059]/5 border border-[#C5A059]/20">
          <p className="text-xs text-[#C5A059] leading-relaxed">{question.hint_text}</p>
        </div>
      )}

      {/* Submit / Next */}
      <div className="mt-6">
        {!showResult ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-3.5 rounded-xl text-sm font-medium gold-button text-white disabled:opacity-50"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium emerald-button text-white"
          >
            {currentIdx < questions.length - 1 ? "Next Question" : "See Results"}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
