import {
  allPositions,
  pcAt,
  positionsOfPc,
  STANDARD_TUNING,
  type FretPosition,
} from '../../lib/guitar';
import { FLAT_NAMES, isNatural, SHARP_NAMES, type Spelling } from '../../lib/music';
import type { MicSensitivity } from '../../lib/pitch';
import { pickWeighted, type StatsMap } from '../../lib/stats';

export interface FretboardSettings {
  /** Enabled strings (0 = low E). */
  strings: number[];
  minFret: number;
  maxFret: number;
  naturalsOnly: boolean;
  spelling: Spelling;
  /** Tell you which string to use (Play and Find), or accept the note on any string. */
  scope: 'string' | 'anywhere';
  /** After a correct answer in Play mode, show every position of that note. */
  showAnswer: boolean;
  /** How loud a plucked note must be for the mic to count it. */
  micSensitivity: MicSensitivity;
}

export const DEFAULT_FRETBOARD_SETTINGS: FretboardSettings = {
  strings: [0, 1, 2, 3, 4, 5],
  minFret: 0,
  maxFret: 12,
  naturalsOnly: false,
  spelling: 'both',
  scope: 'string',
  showAnswer: true,
  micSensitivity: 'high',
};

/**
 * The settings that decide which questions are possible. Changing anything else
 * (like scope or spelling) keeps the current question, so the mic keeps running.
 */
export function questionKey(s: FretboardSettings): string {
  return JSON.stringify([s.strings, s.minFret, s.maxFret, s.naturalsOnly]);
}

/**
 * A note to find. Every question comes with a string, even when any string is
 * accepted, so switching scope never invalidates the current question.
 */
export interface NoteTarget {
  pc: number;
  string: number;
}

/** Stats id: "7@2" when asked for on string 2, "7" when any string is accepted. */
export function targetStatsId(t: NoteTarget, scope: FretboardSettings['scope']): string {
  return scope === 'string' ? `${t.pc}@${t.string}` : `${t.pc}`;
}

/** Both kinds of stats id group by pitch class. */
export const pcOfTargetId = (id: string) => id.split('@')[0];

const PITCH_CLASSES = Array.from({ length: 12 }, (_, pc) => pc);

/** Every (note, string) pair the settings allow: ones that exist within the fret range. */
export function noteTargets(s: FretboardSettings): NoteTarget[] {
  const pcs = PITCH_CLASSES.filter((pc) => !s.naturalsOnly || isNatural(pc));
  return s.strings.flatMap((string) =>
    pcs
      .filter((pc) => positionsOfPc(pc, [string], s.minFret, s.maxFret).length > 0)
      .map((pc) => ({ pc, string })),
  );
}

/**
 * Picks the next question, favoring notes you're weak at. Avoids repeating the
 * previous note name, which would still be ringing on the guitar.
 */
export function pickTarget(
  s: FretboardSettings,
  stats: StatsMap,
  previous?: NoteTarget,
  random: () => number = Math.random,
): NoteTarget {
  const all = noteTargets(s);
  const fresh = all.filter((t) => t.pc !== previous?.pc);
  const pool = fresh.length > 0 ? fresh : all;
  if (s.scope === 'string') {
    return pickWeighted(pool, (t) => targetStatsId(t, 'string'), stats, undefined, random);
  }
  // Any string: weight by note name, then pick one of its strings at random.
  const pcs = [...new Set(pool.map((t) => t.pc))];
  const pc = pickWeighted(pcs, (p) => `${p}`, stats, undefined, random);
  const options = pool.filter((t) => t.pc === pc);
  return options[Math.floor(random() * options.length)];
}

/** Where the target note can be played: on its string, or anywhere if any string is accepted. */
export function targetPositions(t: NoteTarget, s: FretboardSettings): FretPosition[] {
  const strings = s.scope === 'string' ? [t.string] : s.strings;
  return positionsOfPc(t.pc, strings, s.minFret, s.maxFret);
}

/** Every fret position the Name exercise can ask about. */
export function positionTargets(s: FretboardSettings): FretPosition[] {
  return allPositions(s.strings, s.minFret, s.maxFret).filter(
    (p) => !s.naturalsOnly || isNatural(pcAt(p)),
  );
}

/**
 * Spells a pitch class for a prompt. With "both", `preferFlat` (rolled once per
 * question) decides, so sharps and flats alternate at random.
 */
export function spellForPrompt(pc: number, spelling: Spelling, preferFlat: boolean): string {
  if (isNatural(pc)) return SHARP_NAMES[pc];
  const flat = spelling === 'flat' || (spelling === 'both' && preferFlat);
  return flat ? FLAT_NAMES[pc] : SHARP_NAMES[pc];
}

/** A single-name spelling for labels (markers, feedback). */
export function labelSpelling(spelling: Spelling): 'sharp' | 'flat' {
  return spelling === 'flat' ? 'flat' : 'sharp';
}

/** E.g. "A string (5th)" or "low E string (6th)". */
export function describeString(string: number): string {
  const { name, ordinal } = STANDARD_TUNING[string];
  return `${name} string (${ordinal})`;
}
