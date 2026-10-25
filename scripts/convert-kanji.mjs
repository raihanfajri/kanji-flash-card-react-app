// Converts N4-kanji.md into src/data/n4-kanji.json (`npm run data`).
//
// The Markdown is "## Tata Bahasa NN" lessons, each with "### 漢 (Meaning)"
// kanji headings followed by a | Kanji | Bacaan | Arti | table of example words.
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'N4-kanji.md'
const OUT = 'src/data/n4-kanji.json'

export function parseKanjiMarkdown(markdown) {
  const lessons = []
  let lesson = null
  let kanji = null

  for (const line of markdown.split('\n').map((l) => l.trim())) {
    const lessonHeading = line.match(/^## (.+)$/)
    if (lessonHeading) {
      const title = lessonHeading[1]
      const id = title.match(/(\d+)\s*$/)?.[1] ?? String(lessons.length + 1)
      lesson = { id, title, kanji: [] }
      lessons.push(lesson)
      kanji = null
      continue
    }

    const kanjiHeading = line.match(/^### (\S+)\s*\((.+)\)$/)
    if (kanjiHeading) {
      if (!lesson) throw new Error(`Kanji heading before any lesson: ${line}`)
      kanji = { kanji: kanjiHeading[1], meaning: kanjiHeading[2].trim(), words: [] }
      lesson.kanji.push(kanji)
      continue
    }

    if (!line.startsWith('|')) continue
    const cells = line.slice(1, -1).split('|').map((c) => c.trim())
    if (cells[0] === 'Kanji' || /^-+$/.test(cells[0])) continue // header / divider
    if (!kanji) throw new Error(`Table row before any kanji heading: ${line}`)
    const [word, reading, meaning] = cells
    if (!word || !reading || !meaning) throw new Error(`Incomplete row: ${line}`)
    kanji.words.push({ word, reading, meaning })
  }

  return { lessons }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = parseKanjiMarkdown(readFileSync(SOURCE, 'utf8'))
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')
  const kanjiCount = data.lessons.reduce((n, l) => n + l.kanji.length, 0)
  const wordCount = data.lessons.reduce(
    (n, l) => n + l.kanji.reduce((m, k) => m + k.words.length, 0),
    0,
  )
  console.log(`${OUT}: ${data.lessons.length} lessons, ${kanjiCount} kanji, ${wordCount} words`)
}
