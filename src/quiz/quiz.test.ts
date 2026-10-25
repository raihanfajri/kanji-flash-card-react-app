import { describe, expect, it } from 'vitest'
import { cardsFor, LESSONS, seededRandom } from '../cards/deck.ts'
import {
  buildQuiz,
  canType,
  CHOICE_COUNT,
  isRight,
  normalizeKana,
  QUIZ_LENGTH,
  type ChoiceQuestion,
  type TypedQuestion,
} from './quiz.ts'

const cards = cardsFor(LESSONS, null)

describe('buildQuiz', () => {
  // Many seeds, so every combination of prompt and answer side is exercised.
  const quizzes = Array.from({ length: 50 }, (_, seed) => buildQuiz(cards, seededRandom(seed)))
  const questions = quizzes.flat()
  const choiceQuestions = questions.filter((q): q is ChoiceQuestion => q.kind === 'choice')
  const typedQuestions = questions.filter((q): q is TypedQuestion => q.kind === 'typed')

  it('has 20 questions, each on a different word', () => {
    for (const quiz of quizzes) {
      expect(quiz).toHaveLength(QUIZ_LENGTH)
      expect(new Set(quiz.map((q) => q.card.word)).size).toBe(QUIZ_LENGTH)
    }
  })

  it('asks for a different side than it shows', () => {
    for (const q of questions) expect(q.answer).not.toBe(q.prompt)
  })

  it('shows every side and asks for every other side from choices across quizzes', () => {
    const pairs = new Set(choiceQuestions.map((q) => `${q.prompt}→${q.answer}`))
    expect([...pairs].sort()).toEqual([
      'meaning→reading',
      'meaning→word',
      'reading→meaning',
      'reading→word',
      'word→meaning',
      'word→reading',
    ])
  })

  it('offers 4 different choices of the asked side, one of them the right answer', () => {
    for (const q of choiceQuestions) {
      expect(q.choices).toHaveLength(CHOICE_COUNT)
      expect(new Set(q.choices).size).toBe(CHOICE_COUNT)
      expect(q.choices[q.correct]).toBe(q.card[q.answer])
      const values = new Set(cards.map((c) => c[q.answer]))
      for (const choice of q.choices) expect(values.has(choice)).toBe(true)
    }
  })

  it('never offers a wrong choice that also fits the prompt (今晩 and 今夜 are both "Malam Ini")', () => {
    for (const q of choiceQuestions) {
      q.choices.forEach((choice, i) => {
        if (i === q.correct) return
        const fits = cards.some((c) => c[q.prompt] === q.card[q.prompt] && c[q.answer] === choice)
        expect(fits, `${q.card[q.prompt]} → ${choice}`).toBe(false)
      })
    }
  })

  it('some questions ask to type the furigana of the kanji, about 1 in 7', () => {
    expect(typedQuestions.length / questions.length).toBeGreaterThan(0.08)
    expect(typedQuestions.length / questions.length).toBeLessThan(0.22)
    for (const q of typedQuestions) {
      expect([q.prompt, q.answer]).toEqual(['word', 'reading'])
      expect(canType(q.card)).toBe(true)
      expect(isRight(q, q.card.reading)).toBe(true)
    }
  })

  it('a typed share of 0 asks no typed questions', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(buildQuiz(cards, seededRandom(seed), QUIZ_LENGTH, 0).every((q) => q.kind === 'choice')).toBe(true)
    }
  })

  it('a different random source gives different questions', () => {
    const ids = (seed: number) => buildQuiz(cards, seededRandom(seed)).map((q) => q.card.id)
    expect(ids(1)).not.toEqual(ids(2))
  })
})

describe('typed furigana', () => {
  const card = (word: string) => cards.find((c) => c.word === word)!

  it('reads katakana as hiragana and ignores spaces and width', () => {
    expect(normalizeKana(' チャーハン ')).toBe('ちゃーはん')
    expect(normalizeKana('ﾁｬｰﾊﾝ')).toBe('ちゃーはん')
    expect(normalizeKana('きょう　と')).toBe('きょうと')
  })

  it('only words whose reading is kana and differs from the word can be typed', () => {
    expect(canType(card('炒飯'))).toBe(true)
    expect(canType(card('天ぷら'))).toBe(false)
  })

  it('a typed answer is right only when it matches a reading of the word', () => {
    const [q] = buildQuiz([card('炒飯')], () => 0)
    expect(q.kind).toBe('typed')
    expect(isRight(q, 'ちゃーはん')).toBe(true)
    expect(isRight(q, 'チャーハン')).toBe(true)
    expect(isRight(q, 'ちゃはん')).toBe(false)
    expect(isRight(q, 0)).toBe(false)
    expect(isRight(q, undefined)).toBe(false)
  })
})
