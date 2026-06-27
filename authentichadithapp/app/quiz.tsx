import React, { useState, useCallback, useRef, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { trackActivity } from '@/lib/gamification/track-activity'
import { Hadith } from '@/types/hadith'
import { HIDDEN_COLLECTION_FILTER } from '@/lib/hadith/visibleCollections'
import { QuizQuestion, generateQuestions } from '@/lib/hadith/generateQuiz'
import { STATIC_QUIZZES, getStaticQuiz } from '@/lib/learning/staticQuizContent'
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner'
import { useRevenueCat } from '@/lib/revenuecat/RevenueCatProvider'
import { FONT_FAMILY } from '@/constants/theme'

type QuizState = 'start' | 'playing' | 'results'

export default function QuizScreen() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()
  const { isPro } = useRevenueCat()
  const [quizState, setQuizState] = useState<QuizState>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [quizMode, setQuizMode] = useState<string>('general')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Daily quiz limit enforcement for free users
  const todayISO = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const { data: todayQuizCount = 0 } = useQuery({
    queryKey: ['quiz-attempts-today', user?.id, todayISO],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${todayISO}T00:00:00.000Z`)
      if (error) return 0
      return count ?? 0
    },
    enabled: !!user && !isPro,
  })
  const dailyLimitReached = !isPro && todayQuizCount >= 1

  const { data: hadiths, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz-hadiths'],
    queryFn: async () => {
      // UX hardening (FIX-038): quiz pulls random hadiths to build questions.
      // Skip rows with empty english_text or empty narrator — questions built
      // off them are nonsensical ("Who narrated this hadith? <blank>"). UI guard
      // only; content backfill is a separate ops task.
      const offsets = Array.from({ length: 10 }, () => Math.floor(Math.random() * 5000))
      const results: Hadith[] = []
      for (const offset of offsets) {
        let q = supabase
          .from('hadiths')
          .select('*')
          .not('english_text', 'is', null)
          .neq('english_text', '')
          .not('narrator', 'is', null)
          .neq('narrator', '')
        // Never build quiz questions from release-hidden collections.
        if (HIDDEN_COLLECTION_FILTER) {
          q = q.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER)
        }
        const { data } = await q.range(offset, offset).single()
        if (data) results.push(data as Hadith)
      }
      return results
    },
    enabled: quizState === 'start' && quizMode === 'general',
  })

  useEffect(() => {
    if (quizState === 'playing') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quizState])

  // Cleanup: cancel any pending answer-advance timer on unmount to prevent
  // setState calls on an unmounted component.
  useEffect(() => {
    return () => {
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current)
    }
  }, [])

  const startQuiz = useCallback(() => {
    let q: QuizQuestion[]
    if (quizMode === 'general') {
      if (!hadiths || hadiths.length === 0) return
      q = generateQuestions(hadiths)
    } else {
      const staticQuiz = getStaticQuiz(quizMode)
      if (!staticQuiz || staticQuiz.questions.length === 0) return
      q = [...staticQuiz.questions]
    }
    // FIX-CRASH-003: generateQuestions() can return [] when all fetched hadiths
    // fail the content filter (empty english_text / narrator). Without this guard
    // the screen enters 'playing' state with no questions, the render gate
    // (questions.length > 0) shows nothing, and the user is stuck with no way
    // back except the nav header. Guard here so we never enter 'playing' on an
    // empty deck.
    if (q.length === 0) {
      __DEV__ && console.warn('[Quiz] generateQuestions returned 0 questions — aborting start')
      return
    }
    setQuestions(q)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers([])
    setScore(0)
    setTimer(0)
    setQuizState('playing')
  }, [hadiths, quizMode])

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)

    const isCorrect = index === questions[currentQuestion].correctIndex
    const newAnswers = [...answers, index]
    const newScore = isCorrect ? score + 1 : score
    setAnswers(newAnswers)
    setScore(newScore)

    answerTimerRef.current = setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion((c) => c + 1)
        setSelectedAnswer(null)
      } else {
        setQuizState('results')
        if (user) {
          // FIX-CRASH-004: trackActivity and quiz_attempts.insert are fire-and-forget
          // analytics calls inside a setTimeout — any unhandled rejection here would
          // propagate silently. Wrap in void + .catch() so errors are logged in DEV
          // and never surface as an unhandled rejection warning in Sentry/Crashlytics.
          void trackActivity(user.id, 'complete_quiz').catch((err) => {
            __DEV__ && console.warn('[Quiz] trackActivity failed (non-fatal):', err)
          })
          // Save attempt
          void supabase.from('quiz_attempts').insert({
            user_id: user.id,
            score: newScore,
            total_questions: questions.length,
            time_seconds: timer,
          }).then(({ error }) => {
            if (error) __DEV__ && console.warn('[Quiz] quiz_attempts insert failed (non-fatal):', error)
          })
        }
      }
    }, 1500)
  }, [selectedAnswer, currentQuestion, questions, answers, score, user, timer])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  if (isLoading && quizState === 'start') {
    return <LoadingSpinner />
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Quiz', headerShown: true }} />
      {isError && <QueryErrorBanner onRetry={refetch} />}

      {quizState === 'start' && (
        <View style={styles.startScreen}>
          <Text style={styles.startEmoji}>🧠</Text>
          <Text style={[styles.startTitle, { color: colors.bronzeText }]}>Knowledge Quiz</Text>
          <Text style={[styles.startSubtitle, { color: colors.mutedText }]}>
            Choose a quiz to test what you&apos;ve learned
          </Text>

          {/* Quiz Mode Selector */}
          <View style={styles.quizModeList}>
            {/* General Knowledge — dynamic (Supabase) */}
            <Pressable
              style={[
                styles.quizModeCard,
                { backgroundColor: colors.card, borderColor: quizMode === 'general' ? colors.emeraldMid : colors.border },
                quizMode === 'general' && styles.quizModeSelected,
              ]}
              onPress={() => setQuizMode('general')}
            >
              <Text style={styles.quizModeEmoji}>🎲</Text>
              <View style={styles.quizModeTextBlock}>
                <Text style={[styles.quizModeTitle, { color: colors.bronzeText }]}>General Knowledge</Text>
                <Text style={[styles.quizModeDesc, { color: colors.mutedText }]}>
                  Random hadith — narrators, collections, grades
                </Text>
              </View>
              <Text style={[styles.quizModeBadge, { color: colors.mutedText }]}>10 Qs</Text>
            </Pressable>

            {/* Lesson-correlated static quizzes */}
            {STATIC_QUIZZES.map((sq) => (
              <Pressable
                key={sq.id}
                style={[
                  styles.quizModeCard,
                  { backgroundColor: colors.card, borderColor: quizMode === sq.id ? colors.emeraldMid : colors.border },
                  quizMode === sq.id && styles.quizModeSelected,
                ]}
                onPress={() => setQuizMode(sq.id)}
              >
                <Text style={styles.quizModeEmoji}>{sq.emoji}</Text>
                <View style={styles.quizModeTextBlock}>
                  <Text style={[styles.quizModeTitle, { color: colors.bronzeText }]}>{sq.title}</Text>
                  <Text style={[styles.quizModeDesc, { color: colors.mutedText }]}>{sq.description}</Text>
                </View>
                <Text style={[styles.quizModeBadge, { color: colors.mutedText }]}>{sq.questions.length} Qs</Text>
              </Pressable>
            ))}
          </View>

          <Button
            title="Start Quiz"
            variant="primary"
            size="large"
            onPress={startQuiz}
            disabled={(quizMode === 'general' && (!hadiths || hadiths.length === 0)) || dailyLimitReached}
          />
          {!isPro && (
            <Text style={[styles.limitNote, { color: colors.mutedText }]}>
              {dailyLimitReached
                ? 'Daily quiz used — come back tomorrow or '
                : 'Free: 1 quiz per day · '}
              <Text style={[styles.limitUpgrade, { color: colors.goldMid }]} onPress={() => router.push('/paywall')}>
                Upgrade for unlimited
              </Text>
            </Text>
          )}
        </View>
      )}

      {quizState === 'playing' && questions.length > 0 && (
        <View>
          {/* Progress Bar */}
          <View style={styles.quizHeader}>
            <Text style={[styles.questionCount, { color: colors.bronzeText }]}>
              {currentQuestion + 1} / {questions.length}
            </Text>
            <Text style={[styles.timerText, { color: colors.mutedText }]}>{formatTime(timer)}</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentQuestion + 1) / questions.length) * 100}%`, backgroundColor: colors.emeraldMid },
              ]}
            />
          </View>

          {/* Question */}
          <Card variant="elevated" style={styles.questionCard}>
            <Text style={[styles.questionText, { color: colors.bronzeText }]}>
              {questions[currentQuestion].question}
            </Text>
          </Card>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {questions[currentQuestion].options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === questions[currentQuestion].correctIndex
              const showResult = selectedAnswer !== null

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.option,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    showResult && isCorrect && { backgroundColor: colors.emeraldMid + '15', borderColor: colors.emeraldMid, borderWidth: 2 },
                    showResult && isSelected && !isCorrect && { backgroundColor: colors.error + '15', borderColor: colors.error, borderWidth: 2 },
                  ]}
                  onPress={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[styles.optionLetter, { color: colors.goldMid }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={[styles.optionText, { color: colors.bronzeText }]}>{option}</Text>
                  {showResult && isCorrect && <Text style={[styles.checkmark, { color: colors.emeraldMid }]}>✓</Text>}
                  {showResult && isSelected && !isCorrect && <Text style={[styles.crossmark, { color: colors.error }]}>✗</Text>}
                </Pressable>
              )
            })}
          </View>

          {selectedAnswer !== null && (
            <Text style={[styles.explanationText, { color: colors.mutedText }]}>
              {questions[currentQuestion].explanation}
            </Text>
          )}
        </View>
      )}

      {quizState === 'results' && (
        <View style={styles.resultsScreen}>
          <Text style={styles.resultsEmoji}>
            {score >= 8 ? '🏆' : score >= 5 ? '👏' : '📚'}
          </Text>
          <Text style={[styles.resultsTitle, { color: colors.bronzeText }]}>Quiz Complete!</Text>
          <Text style={[styles.scoreText, { color: colors.emeraldMid }]}>
            {score} / {questions.length}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>
            {score >= 8 ? 'Excellent!' : score >= 5 ? 'Good job!' : 'Keep learning!'}
          </Text>
          <Text style={[styles.timeText, { color: colors.mutedText }]}>Time: {formatTime(timer)}</Text>

          <Card variant="elevated" style={styles.resultsSummary}>
            {questions.map((q, i) => (
              <View key={i} style={styles.resultRow}>
                <Text style={styles.resultIcon}>
                  {answers[i] === q.correctIndex ? '✅' : '❌'}
                </Text>
                <Text style={[styles.resultQuestion, { color: colors.bronzeText }]}>
                  Q{i + 1}: {q.question.split('\n')[0]}
                </Text>
              </View>
            ))}
          </Card>

          <Button
            title="Try Again"
            variant="primary"
            size="large"
            onPress={() => setQuizState('start')}
          />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  // Start screen
  startScreen: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  startEmoji: { fontSize: 64 },
  startTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  startSubtitle: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body, textAlign: 'center', paddingHorizontal: SPACING.lg },
  infoCard: { width: '100%', marginVertical: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  infoLabel: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body },
  infoValue: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.bodySemiBold, fontWeight: '600' },
  // Quiz
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  questionCount: { fontSize: FONT_SIZES.md, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold },
  timerText: { fontSize: FONT_SIZES.md, fontWeight: '500', fontFamily: FONT_FAMILY.bodyMedium },
  progressBarBg: { height: 4, borderRadius: 2, marginBottom: SPACING.lg },
  progressBarFill: { height: '100%', borderRadius: 2 },
  questionCard: { marginBottom: SPACING.lg },
  questionText: { fontSize: FONT_SIZES.md, fontFamily: FONT_FAMILY.body, lineHeight: 24 },
  optionsContainer: { gap: SPACING.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, gap: SPACING.md,
  },
  optionLetter: { fontSize: FONT_SIZES.base, fontWeight: '700', fontFamily: FONT_FAMILY.heading, width: 24 },
  optionText: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body, flex: 1 },
  checkmark: { fontSize: 18 },
  crossmark: { fontSize: 18 },
  explanationText: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, fontStyle: 'italic', marginTop: SPACING.md, padding: SPACING.md },
  // Results
  resultsScreen: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  resultsEmoji: { fontSize: 64 },
  resultsTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  scoreText: { fontSize: 48, fontWeight: '700', fontFamily: FONT_FAMILY.heading },
  scoreLabel: { fontSize: FONT_SIZES.md, fontFamily: FONT_FAMILY.body },
  timeText: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.body },
  resultsSummary: { width: '100%', marginVertical: SPACING.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  resultIcon: { fontSize: 16 },
  resultQuestion: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, flex: 1 },
  // Quiz mode selector
  quizModeList: { width: '100%', gap: SPACING.sm, marginVertical: SPACING.md },
  quizModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  quizModeSelected: { borderWidth: 2 },
  quizModeEmoji: { fontSize: 28 },
  quizModeTextBlock: { flex: 1 },
  quizModeTitle: { fontSize: FONT_SIZES.base, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold, marginBottom: 2 },
  quizModeDesc: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.body, lineHeight: 18 },
  quizModeBadge: { fontSize: FONT_SIZES.sm, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold },
  limitNote: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.body,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  limitUpgrade: {
    fontFamily: FONT_FAMILY.bodySemiBold,
  },
})
