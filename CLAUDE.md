# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

A kanji flashcard and quiz app (React 19, TypeScript ~6.0, Vite 8, oxlint), modelled on `~/Documents/github/tabata-interval-react-app`. `App.tsx` switches between three screens:

- `src/home/HomeScreen.tsx`: the start screen, listing the features (Flashcards first, Quiz second).
- `src/cards/FlashcardScreen.tsx`: one card at a time from `buildDeck(lessonId, seed)`, with a lesson picker, a Shuffle toggle, and Previous/Next (also by swipe and arrow keys). Every card must show the kanji word, its furigana and its meaning.
- `src/quiz/QuizScreen.tsx`: opens on a setup form asking how many questions (default 20, 1 to the number of distinct words), then builds them with `buildQuiz(cards, random, length)` (`src/quiz/quiz.ts`). Most questions show one side (`word`, `reading` or `meaning`), ask for one of the other two, and offer 4 choices. Unless turned off by the setup form's "Typed questions" switch, about 1 in 7 (`TYPED_SHARE`) instead show the kanji and ask to type the furigana in a text box: `normalizeKana` makes katakana, spaces and width not matter, any reading of the same word counts, and words whose reading isn't kana (天ぷら) never get one. `isRight(question, pick)` checks both kinds. The answer shows after a pick. There's no timer. A new quiz is built on every "Start quiz". "New quiz" goes back to the setup form. The count and the switch are saved to `localStorage` under `kanji-app:quiz-length` and `kanji-app:quiz-typed` on start (`src/quiz/persistence.ts`) and offered next time; the quizzes themselves are never saved. Wrong choices exclude any value of a word that shares the prompt, so only one choice can be right. The 4 choices (or the typed answer box) always sit at the bottom of the screen (thumb zone): `.quiz__stage` grows above them, and the Next button appears between the stage and the choices so the choices never move.

Navigation: opening a feature pushes one history entry, and `popstate` returns home. The ← Home button sets home and calls `history.back()`. In the APK, `android/app/src/main/java/com/raihan/kanji/MainActivity.java` sends Android back into the WebView's history. Don't regenerate `android/` without keeping it. jsdom's `history.back()` never fires `popstate`, so tests dispatch `PopStateEvent` themselves.

## Data

- `N4-kanji.md` is the source of truth. `npm run data` (`scripts/convert-kanji.mjs`) regenerates `src/data/n4-kanji.json`. Never hand-edit the JSON.
- The JSON is `lessons[] → kanji[] → words[] { word, reading, meaning }`. `src/cards/deck.ts` flattens it into `Card`s.
- `src/cards/deck.test.ts` pins the counts (39 lessons, 209 kanji, 602 words). Update them when the Markdown changes.
- `toFurigana(word, reading)` aligns the reading with the word's kanji runs. When the kana don't line up, it puts the whole reading over the whole word.

## Target platform

The app is an installable, offline-capable PWA for **Android only**. The same web build is also wrapped in a Capacitor debug APK for sideloading. It isn't React Native. Follow Material Design 3 conventions:
- Tap targets of at least 48dp (`--touch-min` in `src/index.css`).
- Spacing on the 8dp grid (`--space`), with a 16dp phone gutter (`--gutter`).
- Never take over the system back button.

PWA setup lives in `vite.config.ts` (`vite-plugin-pwa`). The service worker only exists in `npm run build` output, so use `npm run preview` to test install and offline behaviour. The APK (`capacitor.config.ts`, "N4 Kanji (APK)", `com.raihan.kanji`) bundles `vite build --mode android` output from `dist-android/`, with the PWA plugin turned off.

## Commands

- `npm run dev`, `npm run build` (`tsc -b` then `vite build`), `npm run lint`, `npm run preview`
- `npm run data`: regenerate the card JSON from `N4-kanji.md`
- `npm run build:android`: build `dist-android/`, `cap sync android`, then `./gradlew assembleDebug`
- `npm test` runs Vitest in watch mode, and `npm run test:run` runs it once. Single file: `npx vitest run src/App.test.tsx`.

Tests use Vitest + React Testing Library in jsdom and sit next to the code they test. Shared helpers live in `src/test/`. `src/test/setup.ts` clears `localStorage` after each test.

## Structure and conventions

- Entry: `index.html` → `src/main.tsx` → `<App />` → `HomeScreen` / `FlashcardScreen` / `QuizScreen`.
- `src/cards/Furigana.tsx` renders a word with `<ruby>` furigana. Use it wherever a full word is shown.
- Randomness takes a `() => number` source (`shuffleWith`, `buildQuiz`), so tests pass `seededRandom(seed)` or mock `Math.random` with it.
- `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no `enum`), `noUnusedLocals`/`noUnusedParameters`, and `allowImportingTsExtensions` (local imports include `.ts`/`.tsx`).
- Progress (`lessonId`, shuffle `seed`, `index`) is saved to `localStorage` under `kanji-app:progress` (`src/cards/persistence.ts`). Shuffle saves only its seed, so the order is rebuilt identically.
