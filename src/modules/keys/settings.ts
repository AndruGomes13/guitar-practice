import {
  diatonicChords,
  keyById,
  type DiatonicChord,
  type KeyMode,
  type MusicalKey,
} from '../../lib/keys';
import { pickWeighted, type StatsMap } from '../../lib/stats';

export interface KeySettings {
  /** Key ids to practice: "G" (major), "Em" (minor). */
  keys: string[];
  /** Scale degrees to practice, 0 = I … 6 = VII. */
  degrees: number[];
  /** Quiz direction: name the chord for a numeral, name the numeral for a chord, or both. */
  ask: 'chord' | 'numeral' | 'both';
  /** In minor keys, use a major V (E in A minor) instead of v. */
  majorVInMinor: boolean;
}

/** Keys that are comfortable on guitar: a good place to start. */
export const GUITAR_KEYS = ['C', 'G', 'D', 'A', 'E', 'F'];
export const ALL_DEGREES = [0, 1, 2, 3, 4, 5, 6];
/** The primary chords: I, IV and V. */
export const PRIMARY_DEGREES = [0, 3, 4];

export const DEFAULT_KEY_SETTINGS: KeySettings = {
  keys: GUITAR_KEYS,
  degrees: ALL_DEGREES,
  ask: 'both',
  majorVInMinor: false,
};

export function chordsOf(key: MusicalKey, s: KeySettings): DiatonicChord[] {
  return diatonicChords(key, { majorVInMinor: s.majorVInMinor });
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export type QuizDirection = 'chord' | 'numeral';

export interface QuizQuestion {
  keyId: string;
  degree: number;
  /** "chord": shown the numeral, name the chord. "numeral": shown the chord, name the numeral. */
  ask: QuizDirection;
}

export const quizId = (q: QuizQuestion) => `${q.keyId}:${q.degree}:${q.ask}`;

/** Quiz stats ids look like "G:4:chord"; group them by degree ("4"). */
export const degreeOfQuizId = (id: string) => id.split(':')[1];

export function quizItems(s: KeySettings): QuizQuestion[] {
  const directions: QuizDirection[] = s.ask === 'both' ? ['chord', 'numeral'] : [s.ask];
  return s.keys.flatMap((keyId) =>
    s.degrees.flatMap((degree) => directions.map((ask) => ({ keyId, degree, ask }))),
  );
}

/** Picks the next question, favoring ones you miss; never the same chord twice in a row. */
export function pickQuizQuestion(
  s: KeySettings,
  stats: StatsMap,
  previous?: QuizQuestion,
  random: () => number = Math.random,
): QuizQuestion {
  const items = quizItems(s);
  const fresh = previous
    ? items.filter((q) => q.keyId !== previous.keyId || q.degree !== previous.degree)
    : items;
  return pickWeighted(fresh.length > 0 ? fresh : items, quizId, stats, undefined, random);
}

/** Settings that change which quiz questions are possible. */
export function quizKey(s: KeySettings): string {
  return JSON.stringify([s.keys, s.degrees, s.ask, s.majorVInMinor]);
}

// ---------------------------------------------------------------------------
// Progressions
// ---------------------------------------------------------------------------

export interface Progression {
  id: string;
  name: string;
  mode: KeyMode;
  degrees: number[];
}

export const PROGRESSIONS: readonly Progression[] = [
  { id: 'I-IV-V', name: 'Three-chord', mode: 'major', degrees: [0, 3, 4] },
  { id: 'I-V-vi-IV', name: 'Pop', mode: 'major', degrees: [0, 4, 5, 3] },
  { id: 'I-vi-IV-V', name: '50s', mode: 'major', degrees: [0, 5, 3, 4] },
  { id: 'vi-IV-I-V', name: 'Pop, minor feel', mode: 'major', degrees: [5, 3, 0, 4] },
  { id: 'I-IV-vi-V', name: 'Ballad', mode: 'major', degrees: [0, 3, 5, 4] },
  { id: 'ii-V-I', name: 'Jazz ii–V–I', mode: 'major', degrees: [1, 4, 0] },
  {
    id: 'I-V-vi-iii-IV-I-IV-V',
    name: 'Pachelbel',
    mode: 'major',
    degrees: [0, 4, 5, 2, 3, 0, 3, 4],
  },
  { id: 'i-iv-v', name: 'Minor three-chord', mode: 'minor', degrees: [0, 3, 4] },
  { id: 'i-VI-III-VII', name: 'Epic minor', mode: 'minor', degrees: [0, 5, 2, 6] },
  { id: 'i-VII-VI-VII', name: 'Minor rock', mode: 'minor', degrees: [0, 6, 5, 6] },
  { id: 'i-iv-VII-III', name: 'Minor circle', mode: 'minor', degrees: [0, 3, 6, 2] },
];

/** The numerals of a progression in a key, respecting the minor-V setting ("i–iv–V"). */
export function progressionNumerals(p: Progression, key: MusicalKey, s: KeySettings): string[] {
  const chords = chordsOf(key, s);
  return p.degrees.map((d) => chords[d].numeral);
}

export interface ProgressionQuestion {
  keyId: string;
  progressionId: string;
}

export const progressionQuestionId = (q: ProgressionQuestion) => `${q.keyId}:${q.progressionId}`;

/** Progressions that fit the selected keys and only use the selected degrees. */
export function progressionItems(s: KeySettings): ProgressionQuestion[] {
  return s.keys.flatMap((keyId) => {
    const key = keyById(keyId);
    return PROGRESSIONS.filter(
      (p) => p.mode === key.mode && p.degrees.every((d) => s.degrees.includes(d)),
    ).map((p) => ({ keyId, progressionId: p.id }));
  });
}

export function pickProgressionQuestion(
  s: KeySettings,
  stats: StatsMap,
  previous?: ProgressionQuestion,
  random: () => number = Math.random,
): ProgressionQuestion {
  const items = progressionItems(s);
  const fresh = previous
    ? items.filter((q) => progressionQuestionId(q) !== progressionQuestionId(previous))
    : items;
  return pickWeighted(
    fresh.length > 0 ? fresh : items,
    progressionQuestionId,
    stats,
    undefined,
    random,
  );
}

export function progressionById(id: string): Progression {
  const p = PROGRESSIONS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown progression: ${id}`);
  return p;
}

/** Settings that change which progressions are possible. */
export function progressionKey(s: KeySettings): string {
  return JSON.stringify([s.keys, s.degrees, s.majorVInMinor]);
}

/** Degree chip labels, written as in a major key: I, ii, iii, IV, V, vi, vii°. */
export const DEGREE_CHIP_LABELS = diatonicChords(keyById('C')).map((c) => c.numeral);
