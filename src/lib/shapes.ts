import { STANDARD_TUNING, midiAt, type FretPosition } from './guitar';
import { mod12, noteName, parseNote, pitchClassOf, type Chord, type ChordQuality } from './music';

/**
 * A movable chord shape. `offsets` are frets relative to the root's fret, low E
 * to high e; null means the string isn't played. Shapes are named after the
 * open chord they come from (the "E shape" is an open E chord, moved up).
 */
export interface ChordShape {
  name: string;
  /** String the root is played on (0 = low E). */
  rootString: number;
  offsets: (number | null)[];
  /** Strings covered by a barre at the root's fret, when the shape isn't in open position. */
  barre?: [from: number, to: number];
}

const X = null;
const E_SHAPE = { name: 'E shape', rootString: 0 } as const;
const A_SHAPE = { name: 'A shape', rootString: 1 } as const;
const D_SHAPE = { name: 'D shape', rootString: 2 } as const;

export const CHORD_SHAPES: Record<ChordQuality, ChordShape[]> = {
  major: [
    { ...E_SHAPE, offsets: [0, 2, 2, 1, 0, 0], barre: [0, 5] },
    { ...A_SHAPE, offsets: [X, 0, 2, 2, 2, 0], barre: [1, 5] },
    { ...D_SHAPE, offsets: [X, X, 0, 2, 3, 2] },
  ],
  minor: [
    { ...E_SHAPE, offsets: [0, 2, 2, 0, 0, 0], barre: [0, 5] },
    { ...A_SHAPE, offsets: [X, 0, 2, 2, 1, 0], barre: [1, 5] },
    { ...D_SHAPE, offsets: [X, X, 0, 2, 3, 1] },
  ],
  diminished: [
    { ...E_SHAPE, offsets: [0, 1, 2, 0, X, X] },
    { ...A_SHAPE, offsets: [X, 0, 1, 2, 1, X] },
    { ...D_SHAPE, offsets: [X, X, 0, 1, 3, 1] },
  ],
  augmented: [
    { ...E_SHAPE, offsets: [0, 3, 2, 1, 1, 0] },
    { ...A_SHAPE, offsets: [X, 0, 3, 2, 2, 1] },
    { ...D_SHAPE, offsets: [X, X, 0, 3, 3, 2] },
  ],
  maj7: [
    { ...E_SHAPE, offsets: [0, X, 1, 1, 0, X] },
    { ...A_SHAPE, offsets: [X, 0, 2, 1, 2, 0] },
    { ...D_SHAPE, offsets: [X, X, 0, 2, 2, 2] },
  ],
  dom7: [
    { ...E_SHAPE, offsets: [0, 2, 0, 1, 0, 0], barre: [0, 5] },
    { ...A_SHAPE, offsets: [X, 0, 2, 0, 2, 0], barre: [1, 5] },
    { ...D_SHAPE, offsets: [X, X, 0, 2, 1, 2] },
  ],
  min7: [
    { ...E_SHAPE, offsets: [0, 2, 0, 0, 0, 0], barre: [0, 5] },
    { ...A_SHAPE, offsets: [X, 0, 2, 0, 1, 0], barre: [1, 5] },
    { ...D_SHAPE, offsets: [X, X, 0, 2, 1, 1] },
  ],
  'half-dim7': [
    { ...E_SHAPE, offsets: [0, X, 0, 0, -1, X] },
    { ...A_SHAPE, offsets: [X, 0, 1, 0, 1, X] },
    { ...D_SHAPE, offsets: [X, X, 0, 1, 1, 1] },
  ],
  dim7: [
    { ...E_SHAPE, offsets: [0, X, -1, 0, -1, X] },
    { ...A_SHAPE, offsets: [X, 0, 1, -1, 1, X] },
    { ...D_SHAPE, offsets: [X, X, 0, 1, 0, 1] },
  ],
};

export interface Voicing {
  shape: ChordShape;
  /** Fretted or open notes, low to high; muted strings are left out. */
  notes: FretPosition[];
  /** Strings that aren't played. */
  muted: number[];
  /** The fret the root is played at. */
  rootFret: number;
}

/**
 * Places a shape for a chord: the lowest position on the neck where the root
 * falls on the shape's root string and no note goes below the nut.
 */
export function voiceShape(shape: ChordShape, chord: Chord): Voicing {
  const open = STANDARD_TUNING[shape.rootString].openMidi;
  let rootFret = mod12(pitchClassOf(chord.root) - open);
  const lowest = Math.min(...shape.offsets.filter((o): o is number => o !== null));
  if (rootFret + lowest < 0) rootFret += 12;

  const notes: FretPosition[] = [];
  const muted: number[] = [];
  shape.offsets.forEach((offset, string) => {
    if (offset === null) muted.push(string);
    else notes.push({ string, fret: rootFret + offset });
  });
  return { shape, notes, muted, rootFret };
}

/** The common shapes for a chord, placed on the neck. */
export function chordVoicings(chord: Chord): Voicing[] {
  return CHORD_SHAPES[chord.quality].map((shape) => voiceShape(shape, chord));
}

/** MIDI notes of a voicing, low to high, for playback. */
export function voicingMidis(voicing: Voicing): number[] {
  return voicing.notes.map(midiAt);
}

// ---------------------------------------------------------------------------
// Open chords and the shape quiz
// ---------------------------------------------------------------------------

/** A standard open-position voicing: absolute frets low E to high e, null = not played. */
export interface OpenChord {
  root: string;
  quality: ChordQuality;
  frets: (number | null)[];
}

export const OPEN_CHORDS: readonly OpenChord[] = [
  { root: 'C', quality: 'major', frets: [X, 3, 2, 0, 1, 0] },
  { root: 'A', quality: 'major', frets: [X, 0, 2, 2, 2, 0] },
  { root: 'G', quality: 'major', frets: [3, 2, 0, 0, 0, 3] },
  { root: 'E', quality: 'major', frets: [0, 2, 2, 1, 0, 0] },
  { root: 'D', quality: 'major', frets: [X, X, 0, 2, 3, 2] },
  { root: 'A', quality: 'minor', frets: [X, 0, 2, 2, 1, 0] },
  { root: 'E', quality: 'minor', frets: [0, 2, 2, 0, 0, 0] },
  { root: 'D', quality: 'minor', frets: [X, X, 0, 2, 3, 1] },
  { root: 'C', quality: 'dom7', frets: [X, 3, 2, 3, 1, 0] },
  { root: 'A', quality: 'dom7', frets: [X, 0, 2, 0, 2, 0] },
  { root: 'G', quality: 'dom7', frets: [3, 2, 0, 0, 0, 1] },
  { root: 'E', quality: 'dom7', frets: [0, 2, 0, 1, 0, 0] },
  { root: 'D', quality: 'dom7', frets: [X, X, 0, 2, 1, 2] },
  { root: 'B', quality: 'dom7', frets: [X, 2, 1, 2, 0, 2] },
  { root: 'A', quality: 'min7', frets: [X, 0, 2, 0, 1, 0] },
  { root: 'E', quality: 'min7', frets: [0, 2, 0, 0, 0, 0] },
  { root: 'D', quality: 'min7', frets: [X, X, 0, 2, 1, 1] },
  { root: 'C', quality: 'maj7', frets: [X, 3, 2, 0, 0, 0] },
  { root: 'F', quality: 'maj7', frets: [X, X, 3, 2, 1, 0] },
  { root: 'A', quality: 'maj7', frets: [X, 0, 2, 1, 2, 0] },
  { root: 'D', quality: 'maj7', frets: [X, X, 0, 2, 2, 2] },
  { root: 'E', quality: 'maj7', frets: [0, 2, 1, 1, 0, 0] },
];

/** Turns absolute frets into a voicing (the "shape" here is the open chord itself). */
function voicingFromFrets(frets: (number | null)[], name: string): Voicing {
  const notes: FretPosition[] = [];
  const muted: number[] = [];
  frets.forEach((fret, string) =>
    fret === null ? muted.push(string) : notes.push({ string, fret }),
  );
  return {
    shape: { name, rootString: notes[0].string, offsets: frets },
    notes,
    muted,
    rootFret: notes[0].fret,
  };
}

/** The same voicing an octave (or any number of frets) higher. */
function shiftVoicing(v: Voicing, frets: number): Voicing {
  return {
    ...v,
    notes: v.notes.map((n) => ({ string: n.string, fret: n.fret + frets })),
    rootFret: v.rootFret + frets,
  };
}

export type ShapeKind = 'open' | 'movable';

export interface ShapeQuizItem {
  id: string;
  chord: Chord;
  voicing: Voicing;
  /** "open" if any string rings open; "movable" for fully fretted shapes. */
  kind: ShapeKind;
}

/** Highest fret a quiz shape may reach. */
const MAX_SHAPE_FRET = 15;

/**
 * Every diagram the shape quiz can show for these chords: the standard open
 * chords, plus each movable shape at its lowest position and an octave up.
 */
export function shapeQuizItems(
  chords: readonly Chord[],
  kinds: readonly ShapeKind[],
): ShapeQuizItem[] {
  const items = new Map<string, ShapeQuizItem>();
  const add = (chord: Chord, voicing: Voicing) => {
    const kind: ShapeKind = voicing.notes.some((n) => n.fret === 0) ? 'open' : 'movable';
    if (!kinds.includes(kind)) return;
    const frets = voicing.shape.offsets.map((_, s) => {
      const note = voicing.notes.find((n) => n.string === s);
      return note ? note.fret : 'x';
    });
    // Keyed by the actual frets, so an E shape at the nut and the open E chord count once.
    const id = `${chord.id}:${frets.join(',')}`;
    if (!items.has(id)) items.set(id, { id, chord, voicing, kind });
  };

  for (const chord of chords) {
    for (const open of OPEN_CHORDS) {
      if (
        open.quality === chord.quality &&
        noteName(chord.root) === noteName(parseNote(open.root))
      ) {
        add(chord, voicingFromFrets(open.frets, 'Open chord'));
      }
    }
    for (const v of chordVoicings(chord)) {
      add(chord, v);
      const up = shiftVoicing(v, 12);
      if (Math.max(...up.notes.map((n) => n.fret)) <= MAX_SHAPE_FRET) add(chord, up);
    }
  }
  return [...items.values()];
}
