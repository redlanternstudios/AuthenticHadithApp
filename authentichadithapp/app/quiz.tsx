import React, { useState, useCallback, useRef, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { trackActivity } from '@/lib/gamification/track-activity'
import { Hadith } from '@/types/hadith'

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

type QuizState = 'start' | 'playing' | 'results'

const COLLECTION_DISPLAY: Record<string, string> = {
  'sahih-bukhari': 'Sahih al-Bukhari',
  'sahih-muslim': 'Sahih Muslim',
  'sunan-abu-dawud': 'Sunan Abu Dawud',
  'jami-tirmidhi': 'Jami at-Tirmidhi',
  'sunan-nasai': "Sunan an-Nasa'i",
  'sunan-ibn-majah': 'Sunan Ibn Majah',
  'muwatta-malik': 'Muwatta Malik',
  'musnad-ahmad': 'Musnad Ahmad',
}

function generateQuestions(hadiths: Hadith[]): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const collections = Object.keys(COLLECTION_DISPLAY)

  for (const hadith of hadiths.slice(0, 10)) {
    // FIX-038 defense-in-depth: even though the query already filters out empty
    // english_text / narrator, skip any row that still arrives blank rather than
    // emitting an unanswerable question.
    if (!hadith.english_text || !hadith.english_text.trim()) continue

    const type = Math.floor(Math.random() * 3)

    if (type === 0 && hadith.narrator && hadith.narrator.trim().length > 0) {
      // Narrator question
      const wrongNarrators = ['Abu Hurairah', 'Aisha', 'Ibn Umar', 'Anas bin Malik', 'Jabir', 'Ibn Abbas']
        .filter((n) => n !== hadith.narrator)
      const shuffled = wrongNarrators.sort(() => Math.random() - 0.5).slice(0, 3)
      const options = [...shuffled, hadith.narrator].sort(() => Math.random() - 0.5)
      questions.push({
        question: `Who narrated this hadith?\n\n"${(hadith.english_text || '').slice(0, 120)}..."`,
        options,
        correctIndex: options.indexOf(hadith.narrator),
        explanation: `This hadith was narrated by ${hadith.narrator}.`,
      })
    } else if (type === 1) {
      // Collection question
      const correct = COLLECTION_DISPLAY[hadith.collection_slug] || hadith.collection_slug
      const wrongCollections = Object.values(COLLECTION_DISPLAY)
        .filter((c) => c !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      const options = [...wrongCollections, correct].sort(() => Math.random() - 0.5)
      questions.push({
        question: `Which collection contains this hadith?\n\n"${(hadith.english_text || '').slice(0, 120)}..."`,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `This hadith is from ${correct}.`,
      })
    } else {
      // Grade question
      const gradeDisplay: Record<string, string> = { sahih: 'Sahih (Authentic)', hasan: 'Hasan (Good)', daif: "Da'if (Weak)" }
      const correct = gradeDisplay[hadith.grade] || 'Sahih (Authentic)'
      const options = Object.values(gradeDisplay).sort(() => Math.random() - 0.5)
      questions.push({
        question: `What is the grade of this hadith?\n\n"${(hadith.english_text || '').slice(0, 120)}..."`,
        options,
        correctIndex: options.indexOf(correct),
        explanation: `This hadith is graded as ${correct}.`,
      })
    }
  }

  return questions.slice(0, 10)
}

export default function QuizScreen() {
  const { user } = useAuth()
  const [quizState, setQuizState] = useState<QuizState>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: hadiths, isLoading } = useQuery({
    queryKey: ['quiz-hadiths'],
    queryFn: async () => {
      // UX hardening (FIX-038): quiz pulls random hadiths to build questions.
      // Skip rows with empty english_text or empty narrator — questions built
      // off them are nonsensical ("Who narrated this hadith? <blank>"). UI guard
      // only; content backfill is a separate ops task.
      const offsets = Array.from({ length: 10 }, () => Math.floor(Math.random() * 5000))
      const results: Hadith[] = []
      for (const offset of offsets) {
        const { data } = await supabase
          .from('hadiths')
          .select('*')
          .not('english_text', 'is', null)
          .neq('english_text', '')
          .not('narrator', 'is', null)
          .neq('narrator', '')
          .range(offset, offset)
          .single()
        if (data) results.push(data as Hadith)
      }
      return results
    },
    enabled: quizState === 'start',
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

  const startQuiz = useCallback(() => {
    if (!hadiths || hadiths.length === 0) return
    const q = generateQuestions(hadiths)
    setQuestions(q)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers([])
    setScore(0)
    setTimer(0)
    setQuizState('playing')
  }, [hadiths])

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)

    const isCorrect = index === questions[currentQuestion].correctIndex
    const newAnswers = [...answers, index]
    const newScore = isCorrect ? score + 1 : score
    setAnswers(newAnswers)
    setScore(newScore)

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion((c) => c + 1)
        setSelectedAnswer(null)
      } else {
        setQuizState('results')
        if (user) {
          trackActivity(user.id, 'complete_quiz')
          // Save attempt
          supabase.from('quiz_attempts').insert({
            user_id: user.id,
            score: newScore,
            total_questions: questions.length,
            time_seconds: timer,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Quiz', headerShown: true }} />

      {quizState === 'start' && (
        <View style={styles.startScreen}>
          <Text style={styles.startEmoji}>🧠</Text>
          <Text style={styles.startTitle}>Knowledge Quiz</Text>
          <Text style={styles.startSubtitle}>
            Test your knowledge of hadith narrators, collections, and grades
          </Text>
          <Card variant="elevated" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Questions</Text>
              <Text style={styles.infoValue}>10</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Types</Text>
              <Text style={styles.infoValue}>Narrator, Collection, Grade</Text>
            </View>
          </Card>
          <Button
            title="Start Quiz"
            variant="primary"
            size="large"
            onPress={startQuiz}
            disabled={!hadiths || hadiths.length === 0}
          />
        </View>
      )}

      {quizState === 'playing' && questions.length > 0 && (
        <View>
          {/* Progress Bar */}
          <View style={styles.quizHeader}>
            <Text style={styles.questionCount}>
              {currentQuestion + 1} / {questions.length}
            </Text>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>

          {/* Question */}
          <Card variant="elevated" style={styles.questionCard}>
            <Text style={styles.questionText}>
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
                  style={[styles.option, showResult && isCorrect && styles.optionCorrect, showResult && isSelected && !isCorrect && styles.optionWrong]}
                  onPress={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={styles.optionText}>{option}</Text>
                  {showResult && isCorrect && <Text style={styles.checkmark}>✓</Text>}
                  {showResult && isSelected && !isCorrect && <Text style={styles.crossmark}>✗</Text>}
                </Pressable>
              )
            })}
          </View>

          {selectedAnswer !== null && (
            <Text style={styles.explanationText}>
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
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <Text style={styles.scoreText}>
            {score} / {questions.length}
          </Text>
          <Text style={styles.scoreLabel}>
            {score >= 8 ? 'Excellent!' : score >= 5 ? 'Good job!' : 'Keep learning!'}
          </Text>
          <Text style={styles.timeText}>Time: {formatTime(timer)}</Text>

          <Card variant="elevated" style={styles.resultsSummary}>
            {questions.map((q, i) => (
              <View key={i} style={styles.resultRow}>
                <Text style={styles.resultIcon}>
                  {answers[i] === q.correctIndex ? '✅' : '❌'}
                </Text>
                <Text style={styles.resultQuestion} numberOfLines={1}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  // Start screen
  startScreen: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  startEmoji: { fontSize: 64 },
  startTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText },
  startSubtitle: { fontSize: FONT_SIZES.base, color: COLORS.mutedText, textAlign: 'center', paddingHorizontal: SPACING.lg },
  infoCard: { width: '100%', marginVertical: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  infoLabel: { fontSize: FONT_SIZES.base, color: COLORS.mutedText },
  infoValue: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.bronzeText },
  // Quiz
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  questionCount: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.bronzeText },
  timerText: { fontSize: FONT_SIZES.md, color: COLORS.mutedText, fontWeight: '500' },
  progressBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: SPACING.lg },
  progressBarFill: { height: '100%', backgroundColor: COLORS.emeraldMid, borderRadius: 2 },
  questionCard: { marginBottom: SPACING.lg },
  questionText: { fontSize: FONT_SIZES.md, color: COLORS.bronzeText, lineHeight: 24 },
  optionsContainer: { gap: SPACING.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md,
  },
  optionCorrect: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.emeraldMid + '15', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.emeraldMid, gap: SPACING.md,
  },
  optionWrong: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: COLORS.error + '15', borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.error, gap: SPACING.md,
  },
  optionLetter: { fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.goldMid, width: 24 },
  optionText: { fontSize: FONT_SIZES.base, color: COLORS.bronzeText, flex: 1 },
  checkmark: { fontSize: 18, color: COLORS.emeraldMid },
  crossmark: { fontSize: 18, color: COLORS.error },
  explanationText: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText, fontStyle: 'italic', marginTop: SPACING.md, padding: SPACING.md },
  // Results
  resultsScreen: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  resultsEmoji: { fontSize: 64 },
  resultsTitle: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText },
  scoreText: { fontSize: 48, fontWeight: '700', color: COLORS.emeraldMid },
  scoreLabel: { fontSize: FONT_SIZES.md, color: COLORS.mutedText },
  timeText: { fontSize: FONT_SIZES.base, color: COLORS.mutedText },
  resultsSummary: { width: '100%', marginVertical: SPACING.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  resultIcon: { fontSize: 16 },
  resultQuestion: { fontSize: FONT_SIZES.sm, color: COLORS.bronzeText, flex: 1 },
})
