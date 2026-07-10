export function buildLessonShareText(params: {
  title: string
  description?: string
  lessonId: string
}) {
  const parts = [
    `I completed a lesson on Authentic Hadith: ${params.title}`,
    params.description?.trim() ? params.description.trim() : '',
    `Deep link: authentichadith://learn/lesson/${params.lessonId}`,
  ].filter(Boolean)

  return parts.join('\n\n')
}

export function buildQuizShareText(params: {
  title: string
  score: number
  total: number
  quizMode?: string
}) {
  const modeLabel = params.quizMode ? ` (${params.quizMode})` : ''
  return [
    `I finished ${params.title}${modeLabel} on Authentic Hadith.`,
    `Score: ${params.score}/${params.total}`,
  ].join('\n\n')
}

export function buildBadgeShareText(params: {
  name: string
  description: string
}) {
  return [
    `I earned a badge on Authentic Hadith: ${params.name}`,
    params.description.trim(),
  ].join('\n\n')
}
