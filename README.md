# kanji-flash-card-react-app

Flashcards and a quiz for the JLPT N4 kanji, for Android phones. There are 602 example words for 209 kanji across 39 lessons ("Tata Bahasa 01–39"), and the meanings are in Indonesian. The app opens on a home screen listing its two features. Android back, or the ← button, returns to it.

### Flashcards

Every card shows one example word: the word in kanji with furigana over its kanji, its meaning, and the kanji it illustrates.

- **Next / Previous** at the bottom, a swipe on the card, or the arrow keys. The deck wraps around at either end.
- **Lesson** picker: all lessons, or one.
- **Shuffle**: a random order, kept until it's turned off.
- The app remembers the lesson, shuffle and card, and opens there next time.

### Quiz

20 different words, picked at random from all 602. Each question shows one side of a word (the kanji, the furigana or the meaning) and asks for one of the other two, with 4 choices. There's no time limit.

- After a pick, the choices lock, the right one turns green (a wrong pick turns red), and the whole word is shown with its furigana and meaning.
- At the end: the score, and every missed word to review. **New quiz** starts another.
- Wrong choices never also fit the prompt. For example, 今晩 and 今夜 are both "Malam Ini", so one is never a wrong choice for the other.
- Opening the quiz again, or New quiz, picks new questions and choices. A quiz in progress isn't saved, so leaving it discards it.

It's built with React 19, TypeScript and Vite, with the same setup as `tabata-interval-react-app`. It ships two ways from the same code:

- **Installable PWA** that works offline (`vite-plugin-pwa`).
- **Android APK** for sideloading, wrapped with Capacitor.

## Card data

`N4-kanji.md` is the source. `npm run data` (`scripts/convert-kanji.mjs`) converts it into `src/data/n4-kanji.json`, which the app bundles:

```json
{ "lessons": [{ "id": "01", "title": "Tata Bahasa 01", "kanji": [
  { "kanji": "朝", "meaning": "Pagi", "words": [
    { "word": "朝日", "reading": "あさひ", "meaning": "Matahari Pagi" } ] } ] }] }
```

After editing the Markdown, run `npm run data` again. Furigana are worked out at display time (`src/cards/furigana.ts`), so okurigana stay bare: 昼休み gets ひるやす over 昼休 only. If a reading doesn't fit the word's kana, it goes over the whole word. This happens for 到着する, whose reading is とうちゃく in the source.

## Develop

```sh
npm install
npm run dev        # dev server
npm run test:run   # Vitest + React Testing Library
npm run lint       # oxlint
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve dist/ to test install and offline use
```

## Build the Android APK

Needs the Android SDK (`android/local.properties` points Gradle at it with `sdk.dir`) and a full JDK 21 with `javac`; a JRE isn't enough. On this PC the JDK is Temurin in `~/.jdks/`, because apt was blocked:

```sh
export JAVA_HOME="$HOME/.jdks/jdk-21.0.13+9"
npm run build:android
```

This writes the debug APK to `android/app/build/outputs/apk/debug/app-debug.apk`. Install it with `adb install -r <apk>`.
