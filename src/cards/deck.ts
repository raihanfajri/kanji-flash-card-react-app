import data from '../data/n4-kanji.json'

// Card data comes from src/data/n4-kanji.json, generated from N4-kanji.md by
// `npm run data`. Every card is one example word: the word in kanji, its
// reading (shown as furigana) and its meaning, plus the kanji it illustrates.

export interface Word {
  word: string
  reading: string
  meaning: string
}

export interface KanjiEntry {
  kanji: string
  meaning: string
  words: Word[]
}

export interface Lesson {
  id: string
  title: string
  kanji: KanjiEntry[]
}

export interface Card extends Word {
  id: string
  lessonId: string
  lessonTitle: string
  kanji: string
  kanjiMeaning: string
}

export const LESSONS: Lesson[] = data.lessons

export function cardsFor(lessons: Lesson[], lessonId: string | null): Card[] {
  return lessons
    .filter((lesson) => lessonId === null || lesson.id === lessonId)
    .flatMap((lesson) =>
      lesson.kanji.flatMap((entry) =>
        entry.words.map((w, i) => ({
          ...w,
          id: `${lesson.id}-${entry.kanji}-${i}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          kanji: entry.kanji,
          kanjiMeaning: entry.meaning,
        })),
      ),
    )
}

// mulberry32: a small seeded PRNG, so a shuffled order can be saved as its seed.
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffled<T>(items: T[], seed: number): T[] {
  return shuffleWith(items, seededRandom(seed))
}

// Fisher–Yates with any source of numbers in [0, 1), e.g. Math.random.
export function shuffleWith<T>(items: T[], next: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildDeck(lessonId: string | null, seed: number | null, lessons = LESSONS): Card[] {
  const cards = cardsFor(lessons, lessonId)
  return seed === null ? cards : shuffled(cards, seed)
}
