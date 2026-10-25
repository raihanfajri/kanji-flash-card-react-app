// Remembers the last quiz's setup (how many questions, and whether to include
// typed questions), so the setup form offers the same next time. Tolerates unavailable storage like the flashcard
// progress does: the form then just offers the default.

import { QUIZ_LENGTH } from './quiz.ts'

const KEY = 'kanji-app:quiz-length'
const TYPED_KEY = 'kanji-app:quiz-typed'

// The saved length, or the default when nothing valid (1 to max) is saved.
export function loadQuizLength(max: number): number {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return Number.isInteger(saved) && (saved as number) >= 1 && (saved as number) <= max
      ? (saved as number)
      : QUIZ_LENGTH
  } catch {
    return QUIZ_LENGTH
  }
}

export function saveQuizLength(length: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify(length))
  } catch {
    // Storage unavailable or full.
  }
}

// Whether to include typed questions. On unless turned off.
export function loadQuizTyped(): boolean {
  try {
    return localStorage.getItem(TYPED_KEY) !== 'false'
  } catch {
    return true
  }
}

export function saveQuizTyped(typed: boolean) {
  try {
    localStorage.setItem(TYPED_KEY, String(typed))
  } catch {
    // Storage unavailable or full.
  }
}
