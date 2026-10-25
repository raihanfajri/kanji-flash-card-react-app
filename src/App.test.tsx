import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { renderWithProviders } from './test/render.tsx'

// Android back reaches the page as a popstate event.
const pressBack = () =>
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

describe('Home screen', () => {
  it('opens on the home screen, listing Flashcards first and Quiz second', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: /N4 Kanji/ })).toBeInTheDocument()
    const features = screen.getAllByRole('listitem')
    expect(features).toHaveLength(2)
    expect(features[0]).toHaveTextContent('Flashcards')
    expect(features[1]).toHaveTextContent('Quiz')
    expect(screen.getByText('602 words · 209 kanji · 39 lessons')).toBeInTheDocument()
  })

  it('Flashcards opens the flashcards, and the Home button goes back home', async () => {
    const { user } = renderWithProviders(<App />)

    await user.click(screen.getByRole('button', { name: /Flashcards/ }))
    expect(screen.getByRole('article', { name: 'Flashcard' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Home' }))
    expect(screen.getByRole('heading', { name: /N4 Kanji/ })).toBeInTheDocument()
  })

  it('Quiz opens the quiz, and Android back goes back home', async () => {
    const { user } = renderWithProviders(<App />)

    await user.click(screen.getByRole('button', { name: /Quiz/ }))
    await user.click(screen.getByRole('button', { name: 'Start quiz' }))
    expect(screen.getByText('Question 1 / 20')).toBeInTheDocument()

    await pressBack()
    expect(screen.getByRole('heading', { name: /N4 Kanji/ })).toBeInTheDocument()
  })

  it('opening a feature adds one history entry, so Android back returns home instead of leaving', async () => {
    const { user } = renderWithProviders(<App />)
    const before = window.history.length

    await user.click(screen.getByRole('button', { name: /Quiz/ }))

    expect(window.history.length).toBe(before + 1)
  })
})
