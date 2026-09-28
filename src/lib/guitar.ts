import { mod12 } from './music';

/** A spot on the neck. String 0 is the low E, string 5 the high e. */
export interface FretPosition {
  string: number;
  fret: number;
}

export interface GuitarString {
  /** MIDI note of the open string. */
  openMidi: number;
  /** Short label as usually written on tab ("E", "A", ... "e"). */
  label: string;
  /** Human name, e.g. "A (5th)". */
  name: string;
}

/** Standard tuning, low to high. */
export const STANDARD_TUNING: readonly GuitarString[] = [
  { openMidi: 40, label: 'E', name: 'low E (6th)' },
  { openMidi: 45, label: 'A', name: 'A (5th)' },
  { openMidi: 50, label: 'D', name: 'D (4th)' },
  { openMidi: 55, label: 'G', name: 'G (3rd)' },
  { openMidi: 59, label: 'B', name: 'B (2nd)' },
  { openMidi: 64, label: 'e', name: 'high e (1st)' },
];

export const STRING_COUNT = STANDARD_TUNING.length;

export const MAX_FRET = 22;

export function midiAt({ string, fret }: FretPosition): number {
  return STANDARD_TUNING[string].openMidi + fret;
}

export function pcAt(position: FretPosition): number {
  return mod12(midiAt(position));
}

export function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}

export function positionId({ string, fret }: FretPosition): string {
  return `${string}:${fret}`;
}

/** Every position of a pitch class on the given strings within [minFret, maxFret]. */
export function positionsOfPc(
  pc: number,
  strings: readonly number[],
  minFret: number,
  maxFret: number,
): FretPosition[] {
  const result: FretPosition[] = [];
  for (const string of strings) {
    const first = mod12(pc - STANDARD_TUNING[string].openMidi);
    for (let fret = first; fret <= maxFret; fret += 12) {
      if (fret >= minFret) result.push({ string, fret });
    }
  }
  return result;
}

/** All positions on the given strings within [minFret, maxFret]. */
export function allPositions(
  strings: readonly number[],
  minFret: number,
  maxFret: number,
): FretPosition[] {
  const result: FretPosition[] = [];
  for (const string of strings) {
    for (let fret = minFret; fret <= maxFret; fret++) result.push({ string, fret });
  }
  return result;
}
