import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { buildDeck, LESSONS } from './deck.ts'
import Furigana from './Furigana.tsx'
import { loadProgress, saveProgress, type Progress } from './persistence.ts'
import './FlashcardScreen.css'

// A horizontal drag at least this long (px) on the card moves to the next or previous card.
const SWIPE_MIN = 50

const newSeed = () => Math.floor(Math.random() * 2 ** 31)

function FlashcardScreen({ onHome }: { onHome: () => void }) {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const { lessonId, seed } = progress
  const deck = useMemo(() => buildDeck(lessonId, seed), [lessonId, seed])
  // A saved position past the end (e.g. after the data changed) starts over.
  const index = progress.index < deck.length ? progress.index : 0
  const card = deck[index]
  const swipeStart = useRef<number | null>(null)

  useEffect(() => {
    saveProgress({ lessonId, seed, index })
  }, [lessonId, seed, index])

  const go = (step: number) =>
    setProgress((p) => ({ ...p, index: (index + step + deck.length) % deck.length }))

  // Keyboard arrows, for desktop and hardware keyboards.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.target instanceof HTMLSelectElement) return
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
  })
  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const chooseLesson = (id: string) =>
    setProgress((p) => ({ ...p, lessonId: id === '' ? null : id, index: 0 }))

  const toggleShuffle = () =>
    setProgress((p) => ({ ...p, seed: p.seed === null ? newSeed() : null, index: 0 }))

  return (
    <main className="flashcards">
      <header className="flashcards__bar">
        <button type="button" className="home-button" aria-label="Home" onClick={onHome}>
          <span aria-hidden="true">←</span>
        </button>
        <label className="flashcards__lesson">
          <span className="visually-hidden">Lesson</span>
          <select value={lessonId ?? ''} onChange={(e) => chooseLesson(e.target.value)}>
            <option value="">All lessons</option>
            {LESSONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="flashcards__shuffle"
          aria-pressed={seed !== null}
          onClick={toggleShuffle}
        >
          Shuffle
        </button>
      </header>

      <p className="flashcards__count" aria-live="polite">
        <span aria-hidden="true">
          {index + 1} / {deck.length}
        </span>
        <span className="visually-hidden">
          Card {index + 1} of {deck.length}
        </span>
      </p>

      <article
        className="card"
        aria-label="Flashcard"
        onPointerDown={(e) => {
          swipeStart.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (swipeStart.current === null) return
          const dx = e.clientX - swipeStart.current
          swipeStart.current = null
          if (dx <= -SWIPE_MIN) go(1)
          else if (dx >= SWIPE_MIN) go(-1)
        }}
        onPointerCancel={() => {
          swipeStart.current = null
        }}
      >
        <p className="card__kanji">
          <span lang="ja">{card.kanji}</span> · {card.kanjiMeaning}
          <span className="card__lesson">{card.lessonTitle}</span>
        </p>
        <Furigana className="card__word" word={card.word} reading={card.reading} />
        <p className="card__reading" lang="ja">
          {card.reading}
        </p>
        <p className="card__meaning">{card.meaning}</p>
      </article>

      <nav className="flashcards__nav" aria-label="Cards">
        <button type="button" onClick={() => go(-1)}>
          Previous
        </button>
        <button type="button" className="flashcards__next" onClick={() => go(1)}>
          Next
        </button>
      </nav>
    </main>
  )
}

export default FlashcardScreen
