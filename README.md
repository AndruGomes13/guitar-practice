# Guitar Practice

A small web app with focused guitar practice tools. It works on a computer and on a phone, and
it can be added to your phone's home screen like an app.

## Practice tools

**Triads**

- **Explore**: pick a root and a quality (major, minor, diminished, augmented) to see the
  chord's notes with correct spelling (A–C♯–E, not A–D♭–E), where they sit on the neck, and to
  hear the chord.
- **Build**: you're shown a chord name and tap its three notes on a piano-style picker.
- **Flashcards**: flip-card drill. You can show the chord name first or the notes first.

**Fretboard notes**

- **Play**: you're shown a note and play it on your guitar. The microphone detects the pitch
  and checks it.
- **Find**: tap the note on the neck. No guitar needed.
- **Name**: a fret is highlighted and you name the note.

In Play and Find, each question also tells you which string to use (e.g. "A string · 5th").
You can switch that to "Any string". The string chips (E 6 … e 1) choose which strings
questions come from. Both controls sit right on the practice screen, and changing them doesn't
turn the mic off. The mic can't tell strings apart, so using the right string is up to you.

If soft plucks don't register, raise **Mic sensitivity** in the settings. The line on the level
meter shows how loud a note has to be. The settings (sliders icon) also let you choose the fret
range, naturals only, and sharps/flats.

**Intervals**

- **Fretboard**: a root (R) and a second note (?) are marked on the neck, and you name the
  interval. You can ask for intervals going up, down, or both.
- **Ear**: two notes are played (going up, going down, or together) and you name the
  interval. After a miss you can replay it and hear what your answer would have sounded like.

Choose which intervals to practice in the settings. Start with a few (the "Beginner set" is
m3, M3, P4, P5, P8) and add more as they get easy.

Every exercise keeps per-item stats in your browser. Items you miss or answer slowly come up
more often.

## Setup

Requires **Node.js 24 LTS** (pinned in `.nvmrc`; any Node ≥ 22.12 works). All tools are local
dev dependencies, so nothing is installed globally.

```sh
nvm use          # or: fnm use / volta / mise, all of which read .nvmrc
npm install
npm run dev      # http://localhost:5173
```

### Using it on your phone

Browsers only allow microphone access on `https://` pages (or `localhost`). There are two ways
to get that:

1. **Local network (quick):** run `npm run dev:phone`, then on your phone (on the same Wi-Fi)
   open the `https://192.168.x.x:5173` address it prints. Accept the self-signed certificate
   warning ("Show details → visit this website" on iOS; "Advanced → Proceed" on Android).
2. **GitHub Pages (permanent):** push to GitHub and enable the included deploy workflow (see
   [Deploying](#deploying)). You get a real HTTPS URL.

Then use your browser's "Add to Home Screen" to launch it full-screen.

## Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                              |
| `npm run dev:phone` | Dev server over HTTPS on your LAN (for the mic)         |
| `npm run build`     | Type-check and build to `dist/`                         |
| `npm run preview`   | Serve the production build                              |
| `npm test`          | Run unit tests once (`npm run test:watch` to watch)     |
| `npm run lint`      | ESLint                                                  |
| `npm run format`    | Prettier (write)                                        |
| `npm run check`     | Type-check + lint + format check + tests (CI runs this) |

## Project structure

```
src/
  App.tsx              App shell and home screen
  router.ts            Tiny hash router (#/module/tab), so any static host works
  styles.css           All styles; design tokens at the top (dark and light themes)
  lib/                 Framework-free logic, unit tested
    music.ts           Notes, spelling, triads
    intervals.ts       Interval names and spelling (C–E♭, not C–D♯)
    guitar.ts          Tuning and fretboard positions
    pitch.ts           Pitch analysis (McLeod method via `pitchy`) and note-onset tracking
    stats.ts           Per-item stats and weighted "practice what you're weak at" picking
    pluck.ts           Karplus–Strong plucked-string synthesis (tuned to within a few cents)
  audio/
    MicPitchDetector.ts  Microphone → pitch frames (Web Audio)
    useMicPitch.ts       React hook around it
    synth.ts             Plays notes and intervals with the plucked-string synth
  components/          Fretboard (SVG), NotePicker (piano), PitchMeter, controls…
  modules/
    registry.ts        The list of practice tools shown on the home screen
    triads/            Triads tool
    fretboard/         Fretboard notes tool
    intervals/         Intervals tool
```

### Adding a new practice tool

1. Create `src/modules/<name>/<Name>Module.tsx` with a default-exported component that takes
   `ModuleProps` (`{ tab }`, from the URL `#/<name>/<tab>`).
2. Add an entry to `MODULES` in `src/modules/registry.ts`.

Each tool is code-split, so adding more doesn't slow down startup.

## How note detection works

The mic signal is low-passed (guitar fundamentals stop around 1.2 kHz) and analysed about every
30 ms with the McLeod pitch method. A note counts as played once it holds steady for ~100 ms,
and each pluck counts once. When the next question appears, the previous note is ignored while
it's still ringing. Only the note name is checked, not the string, because a mic can't tell
which string produced a pitch.

Tips: play in a quiet room, and watch the "Hearing" meter to confirm the mic picks you up.

## Deploying

The build is a static site in `dist/`, so it can be hosted anywhere. For GitHub Pages:

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: add `DEPLOY_TO_PAGES` = `true`.
3. Push to `main`. The site is published at `https://<user>.github.io/<repo>/`.

## Ideas for later

- Triad inversions and string-set shapes (e.g. triads on strings 1-2-3)
- Scale and arpeggio patterns
- Offline support (service worker)
