import {
  buildTriad,
  noteName,
  parseNote,
  pitchClassOf,
  transpose,
  type SpelledNote,
  type Triad,
  type TriadQuality,
} from './music';

export type KeyMode = 'major' | 'minor';

export interface MusicalKey {
  /** "G" for G major, "Em" for E minor. */
  id: string;
  tonic: SpelledNote;
  mode: KeyMode;
}

/** Tonics in circle-of-fifths order, spelled the way the key is usually written. */
export const MAJOR_TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const MINOR_TONICS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];

export const MAJOR_KEYS: readonly MusicalKey[] = MAJOR_TONICS.map((t) => ({
  id: t,
  tonic: parseNote(t),
  mode: 'major',
}));
export const MINOR_KEYS: readonly MusicalKey[] = MINOR_TONICS.map((t) => ({
  id: `${t}m`,
  tonic: parseNote(t),
  mode: 'minor',
}));
export const ALL_KEYS: readonly MusicalKey[] = [...MAJOR_KEYS, ...MINOR_KEYS];

export function keyById(id: string): MusicalKey {
  const key = ALL_KEYS.find((k) => k.id === id);
  if (!key) throw new Error(`Unknown key: ${id}`);
  return key;
}

/** "G major", "F♯ minor". */
export function keyName(key: MusicalKey): string {
  return `${noteName(key.tonic)} ${key.mode}`;
}

/** Short label for chips: "G", "F♯m". */
export function keyLabel(key: MusicalKey): string {
  return noteName(key.tonic) + (key.mode === 'minor' ? 'm' : '');
}

const SCALE_STEPS: Record<KeyMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  // Natural minor.
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const CHORD_QUALITIES: Record<KeyMode, TriadQuality[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
};

/** The seven notes of the key's scale, correctly spelled (one of each letter). */
export function scaleNotes(key: MusicalKey): SpelledNote[] {
  return SCALE_STEPS[key.mode].map((semitones, degree) => transpose(key.tonic, degree, semitones));
}

export const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Roman numeral with the usual case convention: IV (major), ii (minor), vii° (diminished). */
export function romanNumeral(degree: number, quality: TriadQuality): string {
  const base = DEGREE_NUMERALS[degree];
  const upper = quality === 'major' || quality === 'augmented';
  const suffix = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : '';
  return (upper ? base : base.toLowerCase()) + suffix;
}

export interface DiatonicChord {
  /** 0 = I, 6 = VII. */
  degree: number;
  numeral: string;
  triad: Triad;
}

export interface ChordOptions {
  /**
   * In minor keys, use a major V (as in harmonic minor, e.g. E major in A
   * minor) instead of the natural minor v.
   */
  majorVInMinor?: boolean;
}

/** The seven triads built on the key's scale. */
export function diatonicChords(key: MusicalKey, options: ChordOptions = {}): DiatonicChord[] {
  const qualities = [...CHORD_QUALITIES[key.mode]];
  if (key.mode === 'minor' && options.majorVInMinor) qualities[4] = 'major';
  return scaleNotes(key).map((root, degree) => ({
    degree,
    numeral: romanNumeral(degree, qualities[degree]),
    triad: buildTriad(root, qualities[degree]),
  }));
}

/**
 * The relative major or minor, e.g. A minor for C major. Returns the key as
 * listed here, so F♯ major gives E♭ minor (the same notes as D♯ minor).
 */
export function relativeKey(key: MusicalKey): MusicalKey {
  const tonic = scaleNotes(key)[key.mode === 'major' ? 5 : 2];
  const mode: KeyMode = key.mode === 'major' ? 'minor' : 'major';
  const pc = pitchClassOf(tonic);
  return ALL_KEYS.find((k) => k.mode === mode && pitchClassOf(k.tonic) === pc)!;
}
