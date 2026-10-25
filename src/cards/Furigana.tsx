import { toFurigana } from './furigana.ts'

// A word with its reading as furigana (<ruby>) over each run of kanji.
function Furigana({ word, reading, className }: { word: string; reading: string; className?: string }) {
  return (
    <p className={className} lang="ja">
      {toFurigana(word, reading).map((seg, i) =>
        seg.ruby ? (
          <ruby key={i}>
            {seg.text}
            <rp>(</rp>
            <rt>{seg.ruby}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  )
}

export default Furigana
