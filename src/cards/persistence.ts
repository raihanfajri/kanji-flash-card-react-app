// Remembers where the user was (lesson, shuffle, card) so the next launch
// continues there. Every function tolerates unavailable storage (private
// mode, blocked site data): the app then just starts at the first card.

export interface Progress {
  lessonId: string | null
  // The shuffle's seed, or null for the book's order.
  seed: number | null
  index: number
}

export const DEFAULT_PROGRESS: Progress = { lessonId: null, seed: null, index: 0 }

const KEY = 'kanji-app:progress'

const isProgress = (value: unknown): value is Progress => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (v.lessonId === null || typeof v.lessonId === 'string') &&
    (v.seed === null || Number.isInteger(v.seed)) &&
    Number.isInteger(v.index) &&
    (v.index as number) >= 0
  )
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return DEFAULT_PROGRESS
    const parsed: unknown = JSON.parse(raw)
    return isProgress(parsed) ? parsed : DEFAULT_PROGRESS
  } catch {
    return DEFAULT_PROGRESS
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable or full.
  }
}
