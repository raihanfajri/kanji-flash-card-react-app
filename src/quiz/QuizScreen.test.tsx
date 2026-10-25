import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cardsFor, LESSONS, seededRandom } from '../cards/deck.ts'
import { renderWithProviders } from '../test/render.tsx'
import QuizScreen from './QuizScreen.tsx'

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(1))
})

const choices = () => within(screen.getByRole('list', { name: 'Choices' })).getAllByRole('button')
const isRight = (button: HTMLElement) => button.dataset.state === 'correct'

// Picks the first choice and returns whether it was right. Once a choice is
// picked, the right one is the only choice marked "correct".
type User = ReturnType<typeof renderWithProviders>['user']

const pickFirst = async (user: User) => {
  await user.click(choices()[0])
  return isRight(choices()[0])
}

const typedBox = () => screen.queryByRole('textbox', { name: 'Furigana' })

// Answers any question: picks the first choice, or types a wrong furigana.
// Returns whether it was right.
const answerAny = async (user: User) => {
  if (!typedBox()) return pickFirst(user)
  await user.type(typedBox()!, 'ん{Enter}')
  return false
}

// Answers questions until a typed one shows, then returns its kanji word.
const skipToTyped = async (user: User) => {
  while (!typedBox()) {
    await pickFirst(user)
    await user.click(screen.getByRole('button', { name: 'Next question' }))
  }
  return document.querySelector('.quiz__prompt')!.textContent!
}

const cardOf = (word: string) => cardsFor(LESSONS, null).find((c) => c.word === word)!
const toKatakana = (text: string) => text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))

// Opens the quiz screen and starts a quiz of the default 20 questions.
const startQuiz = async (onHome = vi.fn()) => {
  const rendered = renderWithProviders(<QuizScreen onHome={onHome} />)
  await rendered.user.click(screen.getByRole('button', { name: 'Start quiz' }))
  return rendered
}

describe('Quiz setup', () => {
  it('asks how many questions before starting, defaulting to 20', () => {
    renderWithProviders(<QuizScreen onHome={vi.fn()} />)

    expect(screen.getByRole('spinbutton', { name: 'Number of questions' })).toHaveValue(20)
    expect(screen.getByRole('button', { name: 'Start quiz' })).toBeEnabled()
    expect(screen.queryByRole('list', { name: 'Choices' })).not.toBeInTheDocument()
  })

  it('starts a quiz of the number typed, and New quiz keeps it', async () => {
    const { user } = renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    const input = screen.getByRole('spinbutton', { name: 'Number of questions' })

    await user.clear(input)
    await user.type(input, '3{Enter}')

    for (let i = 1; i <= 3; i++) {
      expect(screen.getByText(`Question ${i} / 3`)).toBeInTheDocument()
      await pickFirst(user)
      await user.click(screen.getByRole('button', { name: i < 3 ? 'Next question' : 'See results' }))
    }
    expect(screen.getByRole('heading', { name: 'Quiz complete' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New quiz' }))
    expect(screen.getByRole('spinbutton', { name: 'Number of questions' })).toHaveValue(3)
  })

  it('remembers the number of questions the next time the quiz opens', async () => {
    const first = renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    const input = screen.getByRole('spinbutton', { name: 'Number of questions' })
    await first.user.clear(input)
    await first.user.type(input, '5{Enter}')
    first.unmount()

    renderWithProviders(<QuizScreen onHome={vi.fn()} />)

    expect(screen.getByRole('spinbutton', { name: 'Number of questions' })).toHaveValue(5)
  })

  it('typed questions are on by default and can be turned off, which is remembered', async () => {
    const first = renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    const toggle = () => screen.getByRole('switch', { name: /Typed questions/ })
    expect(toggle()).toBeChecked()

    await first.user.click(toggle())
    expect(toggle()).not.toBeChecked()
    await first.user.click(screen.getByRole('button', { name: 'Start quiz' }))
    first.unmount()

    renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    expect(toggle()).not.toBeChecked()
  })

  it('with typed questions off, every question has choices', async () => {
    const { user } = renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    await user.click(screen.getByRole('switch', { name: /Typed questions/ }))
    await user.click(screen.getByRole('button', { name: 'Start quiz' }))

    for (let i = 1; i <= 20; i++) {
      expect(typedBox()).not.toBeInTheDocument()
      await pickFirst(user)
      await user.click(screen.getByRole('button', { name: i < 20 ? 'Next question' : 'See results' }))
    }
  })

  it.each(['', '0', '2.5', '100000'])('cannot start with %j questions', async (text) => {
    const { user } = renderWithProviders(<QuizScreen onHome={vi.fn()} />)
    const input = screen.getByRole('spinbutton', { name: 'Number of questions' })

    await user.clear(input)
    if (text) await user.type(input, text)

    expect(screen.getByRole('button', { name: 'Start quiz' })).toBeDisabled()
  })
})

describe('Quiz screen', () => {
  it('shows question 1 of 20 with one side of a word, what to choose, and 4 choices', async () => {
    await startQuiz()

    expect(screen.getByText('Question 1 / 20')).toBeInTheDocument()
    expect(screen.getByText('Score 0')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Choose the (kanji|furigana|meaning)$/ })).toBeInTheDocument()
    expect(choices()).toHaveLength(4)
    for (const c of choices()) expect(c).toBeEnabled()
  })

  it('the choices are the last thing on the screen, before and after a pick (CSS keeps them at the bottom)', async () => {
    const { user } = await startQuiz()
    const choiceList = () => screen.getByRole('list', { name: 'Choices' })

    expect(choiceList()).toBe(screen.getByRole('main').lastElementChild)
    await pickFirst(user)
    expect(choiceList()).toBe(screen.getByRole('main').lastElementChild)
  })

  it('the answer is hidden until a choice is picked', async () => {
    await startQuiz()

    expect(screen.queryByText(/^(Correct!|Not quite)$/)).not.toBeInTheDocument()
    expect(document.querySelector('.quiz__answer')).not.toBeInTheDocument()
    expect(choices().some((c) => c.dataset.state)).toBe(false)
  })

  it('after a pick, marks the right choice, locks the choices and shows the whole word with furigana and meaning', async () => {
    const { user } = await startQuiz()

    const wasRight = await pickFirst(user)

    expect(choices().filter(isRight)).toHaveLength(1)
    for (const c of choices()) expect(c).toBeDisabled()
    expect(screen.getByText(wasRight ? 'Correct!' : 'Not quite')).toBeInTheDocument()
    if (!wasRight) expect(choices()[0]).toHaveAttribute('data-state', 'wrong')
    const shown = document.querySelector('.quiz__answer')!
    expect(shown.querySelector('rt')).not.toBeNull()
    expect(shown.querySelector('.quiz__answer-meaning')!.textContent).not.toBe('')
    expect(screen.getByText(`Score ${wasRight ? 1 : 0}`)).toBeInTheDocument()
  })

  it('Next question moves on, and after the 20th answer shows the score and the words to review', async () => {
    const { user } = await startQuiz()
    let score = 0

    for (let i = 1; i <= 20; i++) {
      expect(screen.getByText(`Question ${i} / 20`)).toBeInTheDocument()
      const wasRight = await answerAny(user)
      if (wasRight) score++
      await user.click(screen.getByRole('button', { name: i < 20 ? 'Next question' : 'See results' }))
    }

    expect(screen.getByRole('heading', { name: 'Quiz complete' })).toBeInTheDocument()
    expect(screen.getByText(`${score} / 20`)).toBeInTheDocument()
    if (score < 20) {
      expect(screen.getByRole('heading', { name: 'To review' })).toBeInTheDocument()
      expect(document.querySelectorAll('.quiz__missed li')).toHaveLength(20 - score)
    }
  })

  it('New quiz returns to setup, then starts over at question 1 with different questions', async () => {
    const { user } = await startQuiz()
    const firstQuiz: string[] = []
    for (let i = 1; i <= 20; i++) {
      firstQuiz.push(document.querySelector('.quiz__prompt')!.textContent!)
      await answerAny(user)
      await user.click(screen.getByRole('button', { name: i < 20 ? 'Next question' : 'See results' }))
    }

    await user.click(screen.getByRole('button', { name: 'New quiz' }))
    await user.click(screen.getByRole('button', { name: 'Start quiz' }))

    expect(screen.getByText('Question 1 / 20')).toBeInTheDocument()
    expect(screen.getByText('Score 0')).toBeInTheDocument()
    expect(document.querySelector('.quiz__prompt')!.textContent).not.toBe(firstQuiz[0])
  })

  it('opening the quiz again gives a new set of questions', async () => {
    const first = await startQuiz()
    const prompt = document.querySelector('.quiz__prompt')!.textContent
    const options = choices().map((c) => c.textContent)
    first.unmount()

    await startQuiz()

    expect([document.querySelector('.quiz__prompt')!.textContent, choices().map((c) => c.textContent)]).not.toEqual([
      prompt,
      options,
    ])
  })

  it('some questions show the kanji and ask to type the furigana instead of choosing', async () => {
    const { user } = await startQuiz()

    await skipToTyped(user)

    expect(screen.getByText('kanji')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Type the furigana' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Choices' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
    // The answer area is the last thing on the screen, like the choices.
    expect(screen.getByRole('form', { name: 'Your answer' })).toBe(screen.getByRole('main').lastElementChild)
  })

  it('a typed furigana is right in hiragana or katakana, ignoring spaces', async () => {
    const { user } = await startQuiz()
    const word = await skipToTyped(user)

    await user.type(typedBox()!, ` ${toKatakana(cardOf(word).reading)} `)
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(typedBox()).toBeDisabled()
    expect(typedBox()).toHaveAttribute('data-state', 'correct')
    expect(document.querySelector('.quiz__answer rt')).not.toBeNull()
  })

  it('a wrong typed furigana shows the right answer and counts as missed', async () => {
    const { user } = await startQuiz()
    const word = await skipToTyped(user)
    const scoreBefore = screen.getByText(/^Score \d+$/).textContent

    await user.type(typedBox()!, 'ん{Enter}')

    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(typedBox()).toHaveValue('ん')
    expect(typedBox()).toHaveAttribute('data-state', 'wrong')
    expect(document.querySelector('.quiz__answer-meaning')!.textContent).toBe(cardOf(word).meaning)
    expect(screen.getByText(/^Score \d+$/).textContent).toBe(scoreBefore)
  })

  it('the Home button calls onHome', async () => {
    const onHome = vi.fn()
    const { user } = await startQuiz(onHome)

    await user.click(screen.getByRole('button', { name: 'Home' }))

    expect(onHome).toHaveBeenCalledOnce()
  })
})
