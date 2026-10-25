import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FlashcardScreen from './FlashcardScreen.tsx'
import { renderWithProviders } from '../test/render.tsx'

const card = () => screen.getByRole('article', { name: 'Flashcard' })

// The visible word with its furigana, e.g. "朝日(あさひ)" (rp brackets included).
const word = () => card().querySelector('.card__word')!

describe('Flashcards', () => {
  it('opens on the first card, showing the kanji word, its furigana and its meaning', () => {
    renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    expect(word()).toHaveTextContent('朝日(あさひ)')
    expect(word().querySelector('rt')).toHaveTextContent('あさひ')
    expect(within(card()).getByText('Matahari Pagi')).toBeInTheDocument()
    expect(within(card()).getByText('朝')).toBeInTheDocument()
    expect(screen.getByText('Card 1 of 602')).toBeInTheDocument()
  })

  it('puts furigana only over the kanji: 昼休み shows ひるやす over 昼休', async () => {
    const { user } = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), '01')
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(word()).toHaveTextContent('昼休(ひるやす)み')
    expect(within(card()).getByText('Istirahat Siang')).toBeInTheDocument()
  })

  it('Next and Previous move through the cards and wrap around at the ends', async () => {
    const { user } = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(word()).toHaveTextContent('毎朝(まいあさ)')
    expect(screen.getByText('Card 2 of 602')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Card 602 of 602')).toBeInTheDocument()
  })

  it('swiping left on the card shows the next card, and right the previous one', () => {
    renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    fireEvent.pointerDown(card(), { clientX: 300 })
    fireEvent.pointerUp(card(), { clientX: 200 })
    expect(screen.getByText('Card 2 of 602')).toBeInTheDocument()

    fireEvent.pointerDown(card(), { clientX: 100 })
    fireEvent.pointerUp(card(), { clientX: 200 })
    expect(screen.getByText('Card 1 of 602')).toBeInTheDocument()

    fireEvent.pointerDown(card(), { clientX: 100 })
    fireEvent.pointerUp(card(), { clientX: 120 }) // too short: a tap, not a swipe
    expect(screen.getByText('Card 1 of 602')).toBeInTheDocument()
  })

  it('the arrow keys move between cards', async () => {
    const { user } = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByText('Card 3 of 602')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('Card 2 of 602')).toBeInTheDocument()
  })

  it('choosing a lesson shows only its cards, from its first card', async () => {
    const { user } = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), '02')

    expect(within(card()).getByText('Tata Bahasa 02')).toBeInTheDocument()
    expect(screen.getByText(/^Card 1 of \d+$/)).not.toHaveTextContent('602')
  })

  it('Shuffle mixes the deck, starting from its first card, and turning it off restores book order', async () => {
    const { user } = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)
    const shuffle = screen.getByRole('button', { name: 'Shuffle' })

    await user.click(shuffle)
    expect(shuffle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Card 1 of 602')).toBeInTheDocument()

    await user.click(shuffle)
    expect(shuffle).toHaveAttribute('aria-pressed', 'false')
    expect(word()).toHaveTextContent('朝日(あさひ)')
  })

  it('the next launch continues at the same lesson and card', async () => {
    const first = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)
    await first.user.selectOptions(screen.getByRole('combobox', { name: 'Lesson' }), '01')
    await first.user.click(screen.getByRole('button', { name: 'Next' }))
    first.unmount()

    renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Lesson' })).toHaveValue('01')
    expect(word()).toHaveTextContent('毎朝(まいあさ)')
  })

  it('a shuffled deck reopens in the same order', async () => {
    const first = renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)
    await first.user.click(screen.getByRole('button', { name: 'Shuffle' }))
    await first.user.click(screen.getByRole('button', { name: 'Next' }))
    const before = word().textContent
    first.unmount()

    renderWithProviders(<FlashcardScreen onHome={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Shuffle' })).toHaveAttribute('aria-pressed', 'true')
    expect(word().textContent).toBe(before)
  })
})
