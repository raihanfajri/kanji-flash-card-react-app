import { describe, expect, it, vi } from 'vitest'
import { loadQuizLength, loadQuizTyped, saveQuizLength, saveQuizTyped } from './persistence.ts'
import { QUIZ_LENGTH } from './quiz.ts'

describe('quiz setup persistence', () => {
  it('loads what was saved', () => {
    saveQuizLength(7)
    expect(loadQuizLength(100)).toBe(7)
  })

  it('falls back to the default when nothing is saved', () => {
    expect(loadQuizLength(100)).toBe(QUIZ_LENGTH)
  })

  it('ignores corrupt or out-of-range data', () => {
    localStorage.setItem('kanji-app:quiz-length', '{nope')
    expect(loadQuizLength(100)).toBe(QUIZ_LENGTH)
    for (const bad of [0, 2.5, 101, '7']) {
      localStorage.setItem('kanji-app:quiz-length', JSON.stringify(bad))
      expect(loadQuizLength(100)).toBe(QUIZ_LENGTH)
    }
  })

  it('tolerates blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveQuizLength(7)).not.toThrow()
    expect(loadQuizLength(100)).toBe(QUIZ_LENGTH)
    expect(() => saveQuizTyped(false)).not.toThrow()
    expect(loadQuizTyped()).toBe(true)
  })

  it('typed questions are on by default, and remember being turned off', () => {
    expect(loadQuizTyped()).toBe(true)
    saveQuizTyped(false)
    expect(loadQuizTyped()).toBe(false)
    saveQuizTyped(true)
    expect(loadQuizTyped()).toBe(true)
  })
})
