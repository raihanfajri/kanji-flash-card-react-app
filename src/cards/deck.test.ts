import { describe, expect, it } from 'vitest'
import { buildDeck, cardsFor, LESSONS, shuffled } from './deck.ts'
import { toFurigana } from './furigana.ts'

describe('card data (src/data/n4-kanji.json)', () => {
  const all = cardsFor(LESSONS, null)

  it('has the 39 lessons, 209 kanji and 602 words of N4-kanji.md', () => {
    expect(LESSONS).toHaveLength(39)
    expect(LESSONS.flatMap((l) => l.kanji)).toHaveLength(209)
    expect(all).toHaveLength(602)
  })

  it('gives every card a kanji word, a reading and a meaning', () => {
    for (const card of all) {
      expect(card.word).not.toBe('')
      expect(card.reading).not.toBe('')
      expect(card.meaning).not.toBe('')
    }
  })

  it('gives every card a unique id', () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length)
  })

  it('lines up furigana with the kanji for every word whose word contains kanji', () => {
    for (const card of all) {
      const ruby = toFurigana(card.word, card.reading).filter((s) => s.ruby !== undefined)
      expect(ruby.length, card.word).toBeGreaterThan(0)
    }
  })
})

describe('buildDeck', () => {
  it("in book order, starts with lesson 01's first word, 朝日", () => {
    expect(buildDeck(null, null)[0]).toMatchObject({
      word: '朝日',
      reading: 'あさひ',
      meaning: 'Matahari Pagi',
      kanji: '朝',
      kanjiMeaning: 'Pagi',
      lessonTitle: 'Tata Bahasa 01',
    })
  })

  it('a lesson deck only holds that lesson’s cards', () => {
    const deck = buildDeck('02', null)
    expect(deck.length).toBeGreaterThan(0)
    expect(deck.every((c) => c.lessonId === '02')).toBe(true)
  })

  it('the same seed always gives the same order, holding the same cards', () => {
    const a = buildDeck(null, 42)
    expect(buildDeck(null, 42)).toEqual(a)
    expect(a.map((c) => c.id)).not.toEqual(buildDeck(null, null).map((c) => c.id))
    expect([...a.map((c) => c.id)].sort()).toEqual(buildDeck(null, null).map((c) => c.id).sort())
  })

  it('shuffled leaves its input alone', () => {
    const items = [1, 2, 3, 4, 5]
    shuffled(items, 7)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })
})
