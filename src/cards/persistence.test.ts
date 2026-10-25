import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from './persistence.ts'

describe('progress persistence', () => {
  it('loads what was saved', () => {
    saveProgress({ lessonId: '03', seed: 12, index: 4 })
    expect(loadProgress()).toEqual({ lessonId: '03', seed: 12, index: 4 })
  })

  it('falls back to the first card when nothing is saved', () => {
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS)
  })

  it('ignores corrupt or malformed data', () => {
    localStorage.setItem('kanji-app:progress', '{nope')
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS)
    localStorage.setItem('kanji-app:progress', JSON.stringify({ lessonId: 1, seed: null, index: -1 }))
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS)
  })

  it('tolerates blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveProgress(DEFAULT_PROGRESS)).not.toThrow()
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS)
  })
})
