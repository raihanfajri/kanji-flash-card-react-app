import { describe, expect, it } from 'vitest'
import { toFurigana } from './furigana.ts'

describe('toFurigana', () => {
  it('puts the whole reading over an all-kanji word', () => {
    expect(toFurigana('朝日', 'あさひ')).toEqual([{ text: '朝日', ruby: 'あさひ' }])
  })

  it('keeps okurigana out of the furigana: 昼休み → [昼休]ひるやす + み', () => {
    expect(toFurigana('昼休み', 'ひるやすみ')).toEqual([
      { text: '昼休', ruby: 'ひるやす' },
      { text: 'み' },
    ])
  })

  it('handles kana between kanji: 昼ご飯 → [昼]ひる + ご + [飯]はん', () => {
    expect(toFurigana('昼ご飯', 'ひるごはん')).toEqual([
      { text: '昼', ruby: 'ひる' },
      { text: 'ご' },
      { text: '飯', ruby: 'はん' },
    ])
  })

  it('matches katakana in the word against a hiragana reading', () => {
    expect(toFurigana('赤ワイン', 'あかわいん')).toEqual([
      { text: '赤', ruby: 'あか' },
      { text: 'ワイン' },
    ])
  })

  it('returns a kana-only word unchanged, without furigana', () => {
    expect(toFurigana('ひらがな', 'ひらがな')).toEqual([{ text: 'ひらがな' }])
  })

  it("puts the whole reading over the word when its kana don't appear in the reading", () => {
    expect(toFurigana('後ろ', 'あと')).toEqual([{ text: '後ろ', ruby: 'あと' }])
  })
})
