import { allPositions, midiAt, type FretPosition } from '../../lib/guitar';
import { INTERVALS, intervalId, type Direction } from '../../lib/intervals';
import { pickWeighted, type StatsMap } from '../../lib/stats';

export type BoardDirection = Exclude<Direction, 'together'>;

export interface IntervalSettings {
  /** Selected intervals, in semitones. */
  intervals: number[];
  boardDirections: BoardDirection[];
  earDirections: Direction[];
  strings: number[];
  minFret: number;
  maxFret: number;
  /** Keep both notes within one hand position, or allow them anywhere in the fret range. */
  span: 'hand' | 'neck';
  /** Label the fretboard notes by name instead of "R" and "?". */
  showNoteNames: boolean;
}

/** A good first set: the thirds, fourth, fifth and octave. */
export const BEGINNER_INTERVALS = [3, 4, 5, 7, 12];

export const DEFAULT_INTERVAL_SETTINGS: IntervalSettings = {
  intervals: BEGINNER_INTERVALS,
  boardDirections: ['up'],
  earDirections: ['up'],
  strings: [0, 1, 2, 3, 4, 5],
  minFret: 0,
  maxFret: 12,
  span: 'hand',
  showNoteNames: false,
};

export const ALL_INTERVALS = INTERVALS.map((i) => i.semitones);

/** How many frets apart two notes can be and still sit under one hand position. */
export const HAND_SPAN = 4;

export interface IntervalItem {
  semitones: number;
  direction: Direction;
}

export const itemId = (item: IntervalItem) => intervalId(item.semitones, item.direction);

/** Picks an item weighted by stats, avoiding an exact repeat of the previous one. */
function pickItem<T extends IntervalItem>(
  items: readonly T[],
  stats: StatsMap,
  previous: IntervalItem | undefined,
  random: () => number,
): T {
  const fresh = previous ? items.filter((i) => itemId(i) !== itemId(previous)) : items;
  return pickWeighted(fresh.length > 0 ? fresh : items, itemId, stats, undefined, random);
}

// ---------------------------------------------------------------------------
// Fretboard
// ---------------------------------------------------------------------------

export interface BoardQuestion extends IntervalItem {
  root: FretPosition;
  second: FretPosition;
}

/** Every (root, second note) pair on the neck that forms this interval under the settings. */
export function boardPairs(
  item: IntervalItem,
  s: IntervalSettings,
): [FretPosition, FretPosition][] {
  const positions = allPositions(s.strings, s.minFret, s.maxFret);
  const delta = item.direction === 'down' ? -item.semitones : item.semitones;
  const pairs: [FretPosition, FretPosition][] = [];
  for (const root of positions) {
    for (const second of positions) {
      if (midiAt(second) - midiAt(root) !== delta) continue;
      if (s.span === 'hand' && Math.abs(second.fret - root.fret) > HAND_SPAN) continue;
      pairs.push([root, second]);
    }
  }
  return pairs;
}

/** Interval/direction combinations that can actually be shown with these settings. */
export function boardItems(s: IntervalSettings): IntervalItem[] {
  return s.intervals
    .flatMap((semitones) => s.boardDirections.map((direction) => ({ semitones, direction })))
    .filter((item) => boardPairs(item, s).length > 0);
}

export function pickBoardQuestion(
  s: IntervalSettings,
  stats: StatsMap,
  previous?: IntervalItem,
  random: () => number = Math.random,
): BoardQuestion {
  const item = pickItem(boardItems(s), stats, previous, random);
  const pairs = boardPairs(item, s);
  const [root, second] = pairs[Math.floor(random() * pairs.length)];
  return { ...item, root, second };
}

/**
 * The frets to draw: just around the two notes (so the neck stays compact on a
 * phone), at least five frets wide, within the configured range.
 */
export function boardWindow(q: BoardQuestion, s: IntervalSettings): [number, number] {
  let lo = Math.max(s.minFret, Math.min(q.root.fret, q.second.fret) - 1);
  let hi = Math.min(s.maxFret, Math.max(q.root.fret, q.second.fret) + 1);
  while (hi - lo < 4) {
    if (hi < s.maxFret) hi++;
    else if (lo > s.minFret) lo--;
    else break;
  }
  return [lo, hi];
}

/** Settings that change which fretboard questions are possible. */
export function boardKey(s: IntervalSettings): string {
  return JSON.stringify([s.intervals, s.boardDirections, s.strings, s.minFret, s.maxFret, s.span]);
}

// ---------------------------------------------------------------------------
// Ear
// ---------------------------------------------------------------------------

/** Both notes stay within this range (A2–E5), where the synth sounds like a guitar. */
export const EAR_LOWEST = 45;
export const EAR_HIGHEST = 76;

export interface EarQuestion extends IntervalItem {
  rootMidi: number;
}

export function earItems(s: IntervalSettings): IntervalItem[] {
  return s.intervals.flatMap((semitones) =>
    s.earDirections.map((direction) => ({ semitones, direction })),
  );
}

export function secondMidi(q: { rootMidi: number; semitones: number; direction: Direction }) {
  return q.direction === 'down' ? q.rootMidi - q.semitones : q.rootMidi + q.semitones;
}

export function pickEarQuestion(
  s: IntervalSettings,
  stats: StatsMap,
  previous?: IntervalItem,
  random: () => number = Math.random,
): EarQuestion {
  const item = pickItem(earItems(s), stats, previous, random);
  const low = item.direction === 'down' ? EAR_LOWEST + item.semitones : EAR_LOWEST;
  const high = item.direction === 'down' ? EAR_HIGHEST : EAR_HIGHEST - item.semitones;
  return { ...item, rootMidi: low + Math.floor(random() * (high - low + 1)) };
}

/** Settings that change which ear questions are possible. */
export function earKey(s: IntervalSettings): string {
  return JSON.stringify([s.intervals, s.earDirections]);
}
