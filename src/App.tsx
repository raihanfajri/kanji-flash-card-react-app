import { useEffect, useState } from 'react'
import FlashcardScreen from './cards/FlashcardScreen.tsx'
import HomeScreen, { type Feature } from './home/HomeScreen.tsx'
import QuizScreen from './quiz/QuizScreen.tsx'

function App() {
  const [screen, setScreen] = useState<'home' | Feature>('home')

  // Android back: opening a feature adds one history entry, so back pops it and
  // fires popstate here (returning home) instead of leaving the app. On the
  // home screen there's no entry left, so back leaves the app.
  useEffect(() => {
    const goHome = () => setScreen('home')
    window.addEventListener('popstate', goHome)
    return () => window.removeEventListener('popstate', goHome)
  }, [])

  const open = (feature: Feature) => {
    window.history.pushState({ screen: feature }, '')
    setScreen(feature)
  }

  // The in-app Home button drops the entry `open` pushed, like Android back.
  const home = () => {
    setScreen('home')
    window.history.back()
  }

  if (screen === 'flashcards') return <FlashcardScreen onHome={home} />
  if (screen === 'quiz') return <QuizScreen onHome={home} />
  return <HomeScreen onOpen={open} />
}

export default App
