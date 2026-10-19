import { STANDARD_TUNING, midiAt, type FretPosition } from './guitar';
import { mod12, pitchClassOf, type Chord, type ChordQuality } from './music';

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
