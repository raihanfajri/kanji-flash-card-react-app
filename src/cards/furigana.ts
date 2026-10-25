// Splits a word into segments so furigana sits over the kanji it belongs to,
// not over the okurigana: 昼休み + ひるやすみ → [昼休]ひるやす + み.

export interface Segment {
  text: string
  ruby?: string
}

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆ヶ]/

// Katakana → hiragana, one char for one char, so match positions carry over.
const toHiragana = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function toFurigana(word: string, reading: string): Segment[] {
  const runs: { text: string; kanji: boolean }[] = []
  for (const ch of word) {
    const kanji = KANJI.test(ch)
    const last = runs.at(-1)
    if (last && last.kanji === kanji) last.text += ch
    else runs.push({ text: ch, kanji })
  }
  if (!runs.some((r) => r.kanji)) return [{ text: word }]

  // Each kanji run reads as at least one kana; each kana run must appear as-is.
  const pattern = runs.map((r) => (r.kanji ? '(.+?)' : `(${escapeRegExp(toHiragana(r.text))})`))
  const match = new RegExp(`^${pattern.join('')}$`).exec(toHiragana(reading))
  // The reading doesn't line up with the kana in the word: put it over the whole word.
  if (!match) return [{ text: word, ruby: reading }]

  let at = 0
  return runs.map((run, i) => {
    const length = match[i + 1].length
    const part = reading.slice(at, at + length)
    at += length
    return run.kanji ? { text: run.text, ruby: part } : { text: run.text }
  })
}
