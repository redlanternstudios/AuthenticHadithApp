import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { LearningQuizQuestion } from '@/types/hadith';
import { supabase } from '@/lib/supabase/client';

/**
 * In-lesson quiz (v2). Renders relevant `learning_quiz_questions` for a lesson:
 * tap an option to lock it in, see correct/incorrect + the hint, and a running
 * score. Self-contained — no completion gating, no new dependencies.
 */
type LessonQuizProps = {
  lessonId: string;
  lessonTitle?: string;
  lessonContent?: string;
};

export function LessonQuiz({ lessonId, lessonTitle = '', lessonContent = '' }: LessonQuizProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const { data: questions } = useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: async (): Promise<LearningQuizQuestion[]> => {
      const { data, error } = await supabase
        .from('learning_quiz_questions')
        .select('id, lesson_id, question_text, question_type, options, correct_index, hint_text, sort_order')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true });
      if (error) {
        __DEV__ && console.error('[LessonQuiz] query failed:', error);
        throw error;
      }
      // `options` is jsonb; normalize to string[] defensively.
      return (data ?? []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
      }));
    },
    enabled: !!lessonId,
  });

  const relevantQuestions = useMemo(() => {
    if (!questions?.length) return [];
    return questions.filter((q) => isQuizQuestionRelevant(q, `${lessonTitle}\n${lessonContent}`));
  }, [questions, lessonTitle, lessonContent]);

  if (!relevantQuestions.length) return null;

  const answeredAll = relevantQuestions.every((q) => answers[q.id] !== undefined);
  const visibleScore = {
    correct: relevantQuestions.filter((q) => answers[q.id] === q.correct_index).length,
    total: relevantQuestions.length,
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.bronzeText }]}>📝 Check your understanding</Text>

      {relevantQuestions.map((q, qi) => {
        const picked = answers[q.id];
        const isAnswered = picked !== undefined;
        return (
          <Card key={q.id} style={styles.qCard}>
            <Text style={[styles.qText, { color: colors.bronzeText }]}>
              {qi + 1}. {q.question_text}
            </Text>
            {q.options.map((opt, oi) => {
              const isPicked = picked === oi;
              const isCorrect = oi === q.correct_index;
              const showState = isAnswered && (isPicked || isCorrect);
              const bg = !showState
                ? colors.marbleBase
                : isCorrect
                  ? colors.emeraldMid + '22'
                  : colors.marbleBase;
              const border = showState
                ? isCorrect
                  ? colors.emeraldMid
                  : isPicked
                    ? colors.mutedText
                    : 'transparent'
                : 'transparent';
              return (
                <Pressable
                  key={oi}
                  disabled={isAnswered}
                  onPress={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                >
                  <Text style={[styles.optionText, { color: colors.bronzeText }]}>
                    {showState ? (isCorrect ? '✅ ' : isPicked ? '❌ ' : '') : ''}
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
            {isAnswered && q.hint_text ? (
              <Text style={[styles.hint, { color: colors.mutedText }]}>💡 {q.hint_text}</Text>
            ) : null}
          </Card>
        );
      })}

      {answeredAll ? (
        <Text style={[styles.scoreText, { color: colors.emeraldMid }]}>
          Score: {visibleScore.correct} / {visibleScore.total}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.md,
  },
  heading: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  qCard: {
    marginBottom: SPACING.md,
  },
  qText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  option: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  optionText: {
    fontSize: FONT_SIZES.base,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  scoreText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});

const QUIZ_STOP_WORDS = new Set([
  'about',
  'after',
  'allah',
  'also',
  'answer',
  'because',
  'before',
  'being',
  'between',
  'could',
  'does',
  'during',
  'every',
  'from',
  'hadith',
  'have',
  'into',
  'islam',
  'lesson',
  'more',
  'most',
  'muslim',
  'only',
  'other',
  'over',
  'prophet',
  'question',
  'should',
  'than',
  'that',
  'their',
  'there',
  'these',
  'they',
  'this',
  'through',
  'understanding',
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'would',
  'your',
]);

function toKeywords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !QUIZ_STOP_WORDS.has(word));
}

function isQuizQuestionRelevant(question: LearningQuizQuestion, lessonContext: string) {
  const context = new Set(toKeywords(lessonContext));
  if (context.size < 3) return true;

  const questionWords = toKeywords([
    question.question_text,
    question.hint_text ?? '',
    ...(question.options ?? []),
  ].join(' '));

  const matches = questionWords.filter((word) => context.has(word));
  return new Set(matches).size >= 2;
}
