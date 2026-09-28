import { noteName, parseNote, pitchClassOf, SHARP_NAMES, FLAT_NAMES, transpose } from './music';

export interface IntervalInfo {
  semitones: number;
  /** Short name, e.g. "m3". */
  short: string;
  /** Long name, e.g. "Minor 3rd". */
  name: string;
  /** Letter-name steps used to spell it, e.g. 2 for any kind of third. */
  letterSteps: number;
}

export const INTERVALS: readonly IntervalInfo[] = [
  { semitones: 1, short: 'm2', name: 'Minor 2nd', letterSteps: 1 },
  { semitones: 2, short: 'M2', name: 'Major 2nd', letterSteps: 1 },
  { semitones: 3, short: 'm3', name: 'Minor 3rd', letterSteps: 2 },
  { semitones: 4, short: 'M3', name: 'Major 3rd', letterSteps: 2 },
  { semitones: 5, short: 'P4', name: 'Perfect 4th', letterSteps: 3 },
  // Spelled as an augmented 4th (C–F♯).
  { semitones: 6, short: 'TT', name: 'Tritone', letterSteps: 3 },
  { semitones: 7, short: 'P5', name: 'Perfect 5th', letterSteps: 4 },
  { semitones: 8, short: 'm6', name: 'Minor 6th', letterSteps: 5 },
  { semitones: 9, short: 'M6', name: 'Major 6th', letterSteps: 5 },
  { semitones: 10, short: 'm7', name: 'Minor 7th', letterSteps: 6 },
  { semitones: 11, short: 'M7', name: 'Major 7th', letterSteps: 6 },
  { semitones: 12, short: 'P8', name: 'Octave', letterSteps: 7 },
];

export function intervalInfo(semitones: number): IntervalInfo {
  const info = INTERVALS.find((i) => i.semitones === semitones);
  if (!info) throw new Error(`Unknown interval: ${semitones} semitones`);
  return info;
}

/** The interval's name with an article, for sentences: "a minor 3rd", "an octave". */
export function intervalPhrase(semitones: number): string {
  const name = intervalInfo(semitones).name.toLowerCase();
  return `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`;
}

/** How the two notes are presented: second note higher, lower, or both at once. */
export type Direction = 'up' | 'down' | 'together';

export const DIRECTION_LABELS: Record<Direction, string> = {
  up: 'Up',
  down: 'Down',
  together: 'Together',
};

/** Stats id for an interval in a direction, e.g. "3u" for a minor 3rd going up. */
export function intervalId(semitones: number, direction: Direction): string {
  return `${semitones}${direction[0]}`;
}

/** Groups stats ids by interval, ignoring direction ("3u" and "3d" -> "3"). */
export const semitonesOfId = (id: string) => id.slice(0, -1);

/**
 * Spells both notes of an interval, e.g. a minor 3rd up from MIDI 60 is C–E♭
 * (not C–D♯). When the root is a black key, picks the spelling with fewer
 * accidentals. "down" means the second note is below the root.
 */
export function spellInterval(
  rootMidi: number,
  semitones: number,
  direction: Direction,
): { root: string; second: string } {
  const pc = pitchClassOf(parseNote(SHARP_NAMES[((rootMidi % 12) + 12) % 12]));
  const rootOptions = [...new Set([SHARP_NAMES[pc], FLAT_NAMES[pc]])].map(parseNote);
  const { letterSteps } = intervalInfo(semitones);

  let best: { root: string; second: string; cost: number } | null = null;
  for (const root of rootOptions) {
    // Going down by an interval lands on the same note name as going up by its inversion.
    const second =
      direction === 'down'
        ? transpose(root, (7 - letterSteps) % 7, (12 - semitones) % 12)
        : transpose(root, letterSteps % 7, semitones % 12);
    const cost = Math.abs(root.accidental) + Math.abs(second.accidental);
    if (!best || cost < best.cost) best = { root: noteName(root), second: noteName(second), cost };
  }
  return { root: best!.root, second: best!.second };
}
