import { cardsFor, LESSONS } from '../cards/deck.ts'
import './HomeScreen.css'

export type Feature = 'flashcards' | 'quiz'

const FEATURES: { id: Feature; icon: string; title: string; description: string }[] = [
  {
    id: 'flashcards',
    icon: '字',
    title: 'Flashcards',
    description: 'Every word with its kanji, furigana and meaning',
  },
  {
    id: 'quiz',
    icon: '問',
    title: 'Quiz',
    description: '20 random questions, 4 choices each',
  },
]

const wordCount = cardsFor(LESSONS, null).length
const kanjiCount = LESSONS.reduce((n, l) => n + l.kanji.length, 0)

function HomeScreen({ onOpen }: { onOpen: (feature: Feature) => void }) {
  return (
    <main className="home">
      <header className="home__header">
        <h1 className="home__title">
          N4 Kanji <span lang="ja">漢字</span>
        </h1>
        <p>
          {wordCount} words · {kanjiCount} kanji · {LESSONS.length} lessons
        </p>
      </header>
      <ul className="home__features">
        {FEATURES.map((f) => (
          <li key={f.id}>
            <button type="button" className="home__feature" onClick={() => onOpen(f.id)}>
              <span className="home__icon" lang="ja" aria-hidden="true">
                {f.icon}
              </span>
              <span className="home__text">
                <span className="home__name">{f.title}</span>
                <span className="home__description">{f.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default HomeScreen
