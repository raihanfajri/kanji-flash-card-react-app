import { shuffleWith, type Card } from '../cards/deck.ts'

// A quiz is 20 different words picked at random. Most questions show one side
// of a word (kanji, furigana or meaning) and ask for one of the other two, from
// 4 choices. Some instead show the kanji and ask to type the furigana. A new
// quiz is built every time a quiz starts.

export type Side = 'word' | 'reading' | 'meaning'

export const SIDES: Side[] = ['word', 'reading', 'meaning']
export const QUIZ_LENGTH = 20
export const CHOICE_COUNT = 4
// The share of typed questions, among words that can have one: one of the 7
// variations (6 side pairs with choices, plus kanji → typed furigana).
export const TYPED_SHARE = 1 / 7

export interface ChoiceQuestion {
  kind: 'choice'
  card: Card
  prompt: Side
  answer: Side
  choices: string[]
  correct: number
}

export interface TypedQuestion {
  kind: 'typed'
  card: Card
  prompt: 'word'
  answer: 'reading'
  // Every reading of the word, normalized: any of them counts as right.
  accepted: string[]
}

export type Question = ChoiceQuestion | TypedQuestion

// What was answered: a choice's index, or the text typed.
export type Pick = number | string

// Ignores spaces and full/half-width differences, and reads katakana as
// hiragana, so チャーハン and ちゃーはん are the same answer.
export const normalizeKana = (text: string) =>
  text
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

const isKana = (text: string) => /^[\u3041-\u3096\u30fc]+$/.test(text)

// The reading must be typeable in kana and must not be the word itself
// (天ぷら's reading is stored as 天ぷら).
export const canType = (card: Card) => card.word !== card.reading && isKana(normalizeKana(card.reading))

export function isRight(question: Question, pick: Pick | undefined): boolean {
  if (pick === undefined) return false
  return question.kind === 'choice'
    ? pick === question.correct
    : typeof pick === 'string' && question.accepted.includes(normalizeKana(pick))
}

const pick = <T,>(items: T[], next: () => number) => items[Math.floor(next() * items.length)]

export function buildTypedQuestion(card: Card, cards: Card[]): TypedQuestion {
  const accepted = new Set(cards.filter((c) => c.word === card.word).map((c) => normalizeKana(c.reading)))
  return { kind: 'typed', card, prompt: 'word', answer: 'reading', accepted: [...accepted] }
}

export function buildChoiceQuestion(card: Card, cards: Card[], next: () => number): ChoiceQuestion {
  const prompt = pick(SIDES, next)
  const answer = pick(
    SIDES.filter((s) => s !== prompt),
    next,
  )
  // Wrong choices must differ from the right one, and must not belong to a word
  // that shares the prompt (e.g. 今晩 and 今夜 are both "Malam Ini"), or two
  // choices would be right.
  const wrong = new Set(
    cards
      .filter((c) => c[prompt] !== card[prompt] && c[answer] !== card[answer])
      .map((c) => c[answer]),
  )
  const choices = shuffleWith(
    [card[answer], ...shuffleWith([...wrong], next).slice(0, CHOICE_COUNT - 1)],
    next,
  )
  return { kind: 'choice', card, prompt, answer, choices, correct: choices.indexOf(card[answer]) }
}

// `typedShare` is 0 when typed questions are turned off in the quiz setup.
export function buildQuestion(card: Card, cards: Card[], next: () => number, typedShare = TYPED_SHARE): Question {
  return canType(card) && next() < typedShare
    ? buildTypedQuestion(card, cards)
    : buildChoiceQuestion(card, cards, next)
}

export function buildQuiz(
  cards: Card[],
  next: () => number = Math.random,
  length = QUIZ_LENGTH,
  typedShare = TYPED_SHARE,
): Question[] {
  // Some words appear under more than one kanji; ask each word at most once.
  const seen = new Set<string>()
  const picked = shuffleWith(cards, next)
    .filter((c) => !seen.has(c.word) && seen.add(c.word))
    .slice(0, length)
  return picked.map((card) => buildQuestion(card, cards, next, typedShare))
}
