import { useState } from 'react'
import { cardsFor, LESSONS } from '../cards/deck.ts'
import Furigana from '../cards/Furigana.tsx'
import { loadQuizLength, loadQuizTyped, saveQuizLength, saveQuizTyped } from './persistence.ts'
import { buildQuiz, isRight, TYPED_SHARE, type ChoiceQuestion, type Pick, type Question, type Side } from './quiz.ts'
import './QuizScreen.css'

const SIDE_NAME: Record<Side, string> = { word: 'kanji', reading: 'furigana', meaning: 'meaning' }

const isJapanese = (side: Side) => side !== 'meaning'

// The whole word, shown once a question is answered and in the results.
function Answer({ question }: { question: Question }) {
  return (
    <div className="quiz__answer">
      <Furigana className="quiz__answer-word" word={question.card.word} reading={question.card.reading} />
      <p className="quiz__answer-meaning">{question.card.meaning}</p>
    </div>
  )
}

const CARDS = cardsFor(LESSONS, null)
// Each word is asked at most once, so a quiz can't be longer than this.
const MAX_LENGTH = new Set(CARDS.map((c) => c.word)).size

function Choices({
  question,
  picked,
  onPick,
}: {
  question: ChoiceQuestion
  picked: number | undefined
  onPick: (choice: number) => void
}) {
  const answered = picked !== undefined
  return (
    <ul className="quiz__choices" aria-label="Choices">
      {question.choices.map((choice, i) => {
        const state = !answered
          ? undefined
          : i === question.correct
            ? 'correct'
            : i === picked
              ? 'wrong'
              : undefined
        return (
          <li key={choice}>
            <button
              type="button"
              className="quiz__choice"
              data-state={state}
              lang={isJapanese(question.answer) ? 'ja' : undefined}
              disabled={answered}
              onClick={() => onPick(i)}
            >
              {choice}
              {state && (
                <span className="visually-hidden">{state === 'correct' ? ', correct answer' : ', your answer'}</span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// A text box for the furigana. Kana only, so no autocorrect or capitals.
function TypedAnswer({
  picked,
  right,
  onPick,
}: {
  picked: string | undefined
  right: boolean
  onPick: (text: string) => void
}) {
  const [text, setText] = useState('')
  const answered = picked !== undefined
  return (
    <form
      className="quiz__typed"
      aria-label="Your answer"
      onSubmit={(e) => {
        e.preventDefault()
        if (!answered && text.trim()) onPick(text)
      }}
    >
      <input
        type="text"
        className="quiz__input"
        aria-label="Furigana"
        lang="ja"
        placeholder="ひらがな"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        autoFocus
        data-state={answered ? (right ? 'correct' : 'wrong') : undefined}
        disabled={answered}
        value={answered ? picked : text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="quiz__check quiz__primary" disabled={answered || !text.trim()}>
        Check
      </button>
    </form>
  )
}

function QuizScreen({ onHome }: { onHome: () => void }) {
  // How many questions to ask, as typed. Saved on start for the next quiz.
  const [lengthText, setLengthText] = useState(() => String(loadQuizLength(MAX_LENGTH)))
  // Whether some kanji questions ask to type the furigana. Saved on start too.
  const [typed, setTyped] = useState(loadQuizTyped)
  // null until a quiz starts. A fresh random quiz on every "Start quiz".
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [current, setCurrent] = useState(0)
  // What was answered for each question so far: a choice's index or typed text.
  const [picks, setPicks] = useState<Pick[]>([])

  const length = Number(lengthText)
  const validLength = Number.isInteger(length) && length >= 1 && length <= MAX_LENGTH

  const start = () => {
    saveQuizLength(length)
    saveQuizTyped(typed)
    setQuestions(buildQuiz(CARDS, Math.random, length, typed ? TYPED_SHARE : 0))
    setCurrent(0)
    setPicks([])
  }

  const header = (
    <header className="quiz__bar">
      <button type="button" className="home-button" aria-label="Home" onClick={onHome}>
        <span aria-hidden="true">←</span>
      </button>
      <h1 className="quiz__title">Quiz</h1>
    </header>
  )

  if (!questions) {
    return (
      <main className="quiz">
        {header}
        <form
          className="quiz__setup"
          onSubmit={(e) => {
            e.preventDefault()
            if (validLength) start()
          }}
        >
          <label className="quiz__length">
            <span>Number of questions</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_LENGTH}
              step={1}
              required
              value={lengthText}
              aria-describedby="quiz-length-hint"
              onChange={(e) => setLengthText(e.target.value)}
            />
          </label>
          <p id="quiz-length-hint" className="quiz__hint">
            1 to {MAX_LENGTH}
          </p>
          <label className="quiz__toggle">
            <span>
              Typed questions
              <span className="quiz__hint">Type the furigana for some kanji, instead of choosing</span>
            </span>
            <input type="checkbox" role="switch" checked={typed} onChange={(e) => setTyped(e.target.checked)} />
          </label>
          <button type="submit" className="quiz__start quiz__primary" disabled={!validLength}>
            Start quiz
          </button>
        </form>
      </main>
    )
  }

  const score = picks.filter((p, i) => isRight(questions[i], p)).length

  if (current >= questions.length) {
    const missed = questions.filter((q, i) => !isRight(q, picks[i]))
    return (
      <main className="quiz">
        {header}
        <section className="quiz__results" aria-labelledby="quiz-results">
          <h2 id="quiz-results">Quiz complete</h2>
          <p className="quiz__final">
            {score} / {questions.length}
          </p>
          {missed.length > 0 && (
            <>
              <h3>To review</h3>
              <ul className="quiz__missed">
                {missed.map((q) => (
                  <li key={q.card.id}>
                    <Answer question={q} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <div className="quiz__actions">
          <button type="button" onClick={onHome}>
            Home
          </button>
          <button type="button" className="quiz__primary" onClick={() => setQuestions(null)}>
            New quiz
          </button>
        </div>
      </main>
    )
  }

  const question = questions[current]
  const picked = picks[current] as Pick | undefined
  const answered = picked !== undefined
  const right = isRight(question, picked)
  const promptText = question.card[question.prompt]
  const pick = (p: Pick) => setPicks([...picks, p])

  return (
    <main className="quiz">
      {header}
      <p className="quiz__progress">
        <span>
          Question {current + 1} / {questions.length}
        </span>
        <span>Score {score}</span>
      </p>

      {/* Grows to fill the screen, so the answer area always sits at the bottom. */}
      <div className="quiz__stage">
        <section className="quiz__question" aria-label="Question">
          <p className="quiz__label">{SIDE_NAME[question.prompt]}</p>
          <p
            className={`quiz__prompt quiz__prompt--${question.prompt}`}
            lang={isJapanese(question.prompt) ? 'ja' : undefined}
          >
            {promptText}
          </p>
          <h2 className="quiz__ask">
            {question.kind === 'typed' ? 'Type' : 'Choose'} the {SIDE_NAME[question.answer]}
          </h2>
        </section>
        {answered && (
          <section className="quiz__feedback" aria-live="polite">
            <p className="quiz__verdict" data-correct={right}>
              {right ? 'Correct!' : 'Not quite'}
            </p>
            <Answer question={question} />
          </section>
        )}
      </div>

      {/* Next sits above the answer area so showing it doesn't move it. */}
      {answered && (
        <button type="button" className="quiz__next quiz__primary" autoFocus onClick={() => setCurrent(current + 1)}>
          {current + 1 < questions.length ? 'Next question' : 'See results'}
        </button>
      )}

      {question.kind === 'typed' ? (
        // Keyed so each typed question starts with an empty box.
        <TypedAnswer key={current} picked={picked as string | undefined} right={right} onPick={pick} />
      ) : (
        <Choices question={question} picked={picked as number | undefined} onPick={pick} />
      )}
    </main>
  )
}

export default QuizScreen
