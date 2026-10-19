/**
 * Core music theory helpers: note spelling, pitch classes, and triads.
 *
 * A "pitch class" (pc) is an integer 0–11 where 0 = C. A "spelled note" also
 * keeps the letter name, so that e.g. A major is spelled A–C♯–E (not A–D♭–E).
 */

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const LETTER_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface SpelledNote {
  letter: Letter;
  /** Positive = sharps, negative = flats. */
  accidental: number;
}

export type Spelling = 'sharp' | 'flat' | 'both';

export const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function isNatural(pc: number): boolean {
  return SHARP_NAMES[mod12(pc)].length === 1;
}

export function pitchClassOf(note: SpelledNote): number {
  return mod12(LETTER_PC[note.letter] + note.accidental);
}

export function noteName(note: SpelledNote): string {
  const { letter, accidental } = note;
  if (accidental === 0) return letter;
  if (accidental === 2) return `${letter}𝄪`;
  if (accidental === -2) return `${letter}𝄫`;
  return letter + (accidental > 0 ? '♯'.repeat(accidental) : '♭'.repeat(-accidental));
}

/** Parses names like "C", "F#", "Bb", "C♯", "D♭". */
export function parseNote(name: string): SpelledNote {
  const letter = name[0]?.toUpperCase() as Letter;
  if (!LETTERS.includes(letter)) throw new Error(`Invalid note name: ${name}`);
  let accidental = 0;
  for (const ch of name.slice(1)) {
    if (ch === '#' || ch === '♯') accidental++;
    else if (ch === 'b' || ch === '♭') accidental--;
    else throw new Error(`Invalid note name: ${name}`);
  }
  return { letter, accidental };
}

/** Name for a pitch class, e.g. pcName(1, 'both') === 'C♯/D♭'. */
export function pcName(pc: number, spelling: Spelling = 'sharp'): string {
  const i = mod12(pc);
  if (spelling === 'sharp' || isNatural(i)) return SHARP_NAMES[i];
  if (spelling === 'flat') return FLAT_NAMES[i];
  return `${SHARP_NAMES[i]}/${FLAT_NAMES[i]}`;
}

/**
 * Moves a note up by a number of letter steps and semitones, keeping correct
 * spelling. transpose(A, 2, 4) === C♯ (a major third above A).
 */
export function transpose(note: SpelledNote, letterSteps: number, semitones: number): SpelledNote {
  const letter = LETTERS[(LETTERS.indexOf(note.letter) + letterSteps) % 7];
  const targetPc = pitchClassOf(note) + semitones;
  // Pick the accidental closest to zero that lands on the target pitch class.
  const accidental = mod12(targetPc - LETTER_PC[letter] + 6) - 6;
  return { letter, accidental };
}

// ---------------------------------------------------------------------------
// Triads
// ---------------------------------------------------------------------------

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';
export type SeventhQuality = 'maj7' | 'dom7' | 'min7' | 'half-dim7' | 'dim7';
export type ChordQuality = TriadQuality | SeventhQuality;

export interface ChordQualityInfo {
  label: string;
  symbol: string;
  /** Semitones above the root for each chord tone (root, 3rd, 5th, 7th). */
  semitones: number[];
  degrees: string[];
  formula: string;
}

export const CHORD_QUALITIES: Record<ChordQuality, ChordQualityInfo> = {
  major: {
    label: 'Major',
    symbol: '',
    semitones: [0, 4, 7],
    degrees: ['1', '3', '5'],
    formula: 'Root + major 3rd (4 semitones) + perfect 5th (7 semitones)',
  },
  minor: {
    label: 'Minor',
    symbol: 'm',
    semitones: [0, 3, 7],
    degrees: ['1', '♭3', '5'],
    formula: 'Root + minor 3rd (3 semitones) + perfect 5th (7 semitones)',
  },
  diminished: {
    label: 'Diminished',
    symbol: '°',
    semitones: [0, 3, 6],
    degrees: ['1', '♭3', '♭5'],
    formula: 'Root + minor 3rd (3 semitones) + diminished 5th (6 semitones)',
  },
  augmented: {
    label: 'Augmented',
    symbol: '+',
    semitones: [0, 4, 8],
    degrees: ['1', '3', '♯5'],
    formula: 'Root + major 3rd (4 semitones) + augmented 5th (8 semitones)',
  },
  maj7: {
    label: 'Major 7th',
    symbol: 'maj7',
    semitones: [0, 4, 7, 11],
    degrees: ['1', '3', '5', '7'],
    formula: 'Major triad + major 7th (11 semitones)',
  },
  dom7: {
    label: 'Dominant 7th',
    symbol: '7',
    semitones: [0, 4, 7, 10],
    degrees: ['1', '3', '5', '♭7'],
    formula: 'Major triad + minor 7th (10 semitones)',
  },
  min7: {
    label: 'Minor 7th',
    symbol: 'm7',
    semitones: [0, 3, 7, 10],
    degrees: ['1', '♭3', '5', '♭7'],
    formula: 'Minor triad + minor 7th (10 semitones)',
  },
  'half-dim7': {
    label: 'Half-diminished',
    symbol: 'm7♭5',
    semitones: [0, 3, 6, 10],
    degrees: ['1', '♭3', '♭5', '♭7'],
    formula: 'Diminished triad + minor 7th (10 semitones)',
  },
  dim7: {
    label: 'Diminished 7th',
    symbol: '°7',
    semitones: [0, 3, 6, 9],
    degrees: ['1', '♭3', '♭5', '𝄫7'],
    formula: 'Diminished triad + diminished 7th (9 semitones)',
  },
};

export const TRIAD_QUALITY_ORDER: readonly TriadQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
];

export const SEVENTH_QUALITY_ORDER: readonly SeventhQuality[] = [
  'maj7',
  'dom7',
  'min7',
  'half-dim7',
  'dim7',
];

export const CHORD_QUALITY_ORDER: readonly ChordQuality[] = [
  ...TRIAD_QUALITY_ORDER,
  ...SEVENTH_QUALITY_ORDER,
];

/** Root names offered in the UI, in chromatic order. */
export const ROOT_NAMES = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
] as const;

export interface Chord {
  id: string;
  root: SpelledNote;
  quality: ChordQuality;
  /** Root, third, fifth (and seventh) — correctly spelled. */
  tones: SpelledNote[];
}

/** Chord tones are stacked thirds: root, 3rd, 5th, 7th are 0, 2, 4, 6 letter names up. */
export function buildChord(root: SpelledNote, quality: ChordQuality): Chord {
  return {
    id: `${noteName(root)}-${quality}`,
    root,
    quality,
    tones: CHORD_QUALITIES[quality].semitones.map((semitones, i) =>
      transpose(root, i * 2, semitones),
    ),
  };
}

/** Short symbol like "A♭m", "B°" or "G7". */
export function chordSymbol(chord: Chord): string {
  return noteName(chord.root) + CHORD_QUALITIES[chord.quality].symbol;
}

/** Long name like "A♭ minor" or "G dominant 7th". */
export function chordName(chord: Chord): string {
  return `${noteName(chord.root)} ${CHORD_QUALITIES[chord.quality].label.toLowerCase()}`;
}

export function chordPitchClasses(chord: Chord): number[] {
  return chord.tones.map(pitchClassOf);
}

/** A close, root-position voicing for playback, with the root between C3 and B3. */
export function chordMidis(chord: Chord): number[] {
  const root = 48 + pitchClassOf(chord.root);
  return CHORD_QUALITIES[chord.quality].semitones.map((s) => root + s);
}

/**
 * All chords of the given qualities. Chords that would need double sharps or
 * double flats (e.g. D♯ major = D♯–F𝄪–A♯) are left out to keep practice sane.
 */
export interface RootOptions {
  /** Include sharp roots (C♯, F♯…). */
  sharps: boolean;
  /** Include flat roots (B♭, E♭…). */
  flats: boolean;
}

export function chordPool(qualities: readonly ChordQuality[], roots: RootOptions): Chord[] {
  const pool: Chord[] = [];
  for (const quality of qualities) {
    for (const rootName of ROOT_NAMES) {
      const root = parseNote(rootName);
      if (root.accidental > 0 && !roots.sharps) continue;
      if (root.accidental < 0 && !roots.flats) continue;
      const chord = buildChord(root, quality);
      if (chord.tones.every((t) => Math.abs(t.accidental) <= 1)) pool.push(chord);
    }
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Frequencies / MIDI
// ---------------------------------------------------------------------------

export function frequencyToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Scientific pitch notation octave (MIDI 60 = C4). */
export function midiOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}
