import {
  allPositions,
  pcAt,
  positionsOfPc,
  STANDARD_TUNING,
  type FretPosition,
} from '../../lib/guitar';
import { FLAT_NAMES, isNatural, SHARP_NAMES, type Spelling } from '../../lib/music';

export interface FretboardSettings {
  /** Enabled strings (0 = low E). */
  strings: number[];
  minFret: number;
  maxFret: number;
  naturalsOnly: boolean;
  spelling: Spelling;
  /** Ask for a note anywhere on the neck, or on a specific string. */
  scope: 'anywhere' | 'string';
  /** After a correct answer in Play mode, show every position of that note. */
  showAnswer: boolean;
}

export const DEFAULT_FRETBOARD_SETTINGS: FretboardSettings = {
  strings: [0, 1, 2, 3, 4, 5],
  minFret: 0,
  maxFret: 12,
  naturalsOnly: false,
  spelling: 'both',
  scope: 'anywhere',
  showAnswer: true,
};

/** A note to find: a pitch class, optionally restricted to one string. */
export interface NoteTarget {
  id: string;
  pc: number;
  string: number | null;
}

export const targetId = (t: NoteTarget) => t.id;

/** Stats ids look like "7" (anywhere) or "7@2" (on string 2); both group by pitch class. */
export const pcOfTargetId = (id: string) => id.split('@')[0];

const PITCH_CLASSES = Array.from({ length: 12 }, (_, pc) => pc);

/** Every note the current settings can ask for (only ones that exist in the fret range). */
export function noteTargets(s: FretboardSettings): NoteTarget[] {
  const pcs = PITCH_CLASSES.filter((pc) => !s.naturalsOnly || isNatural(pc));
  const exists = (pc: number, strings: number[]) =>
    positionsOfPc(pc, strings, s.minFret, s.maxFret).length > 0;

  if (s.scope === 'anywhere') {
    return pcs
      .filter((pc) => exists(pc, s.strings))
      .map((pc) => ({ id: `${pc}`, pc, string: null }));
  }
  return s.strings.flatMap((string) =>
    pcs.filter((pc) => exists(pc, [string])).map((pc) => ({ id: `${pc}@${string}`, pc, string })),
  );
}

/** Where the target note can be played, given the settings. */
export function targetPositions(t: NoteTarget, s: FretboardSettings): FretPosition[] {
  return positionsOfPc(t.pc, t.string === null ? s.strings : [t.string], s.minFret, s.maxFret);
}

/** Every fret position the Name exercise can ask about. */
export function positionTargets(s: FretboardSettings): FretPosition[] {
  return allPositions(s.strings, s.minFret, s.maxFret).filter(
    (p) => !s.naturalsOnly || isNatural(pcAt(p)),
  );
}

/** Spells a pitch class for a prompt; with "both", sharps and flats alternate at random. */
export function spellForPrompt(pc: number, spelling: Spelling): string {
  if (isNatural(pc)) return SHARP_NAMES[pc];
  if (spelling === 'both') return Math.random() < 0.5 ? SHARP_NAMES[pc] : FLAT_NAMES[pc];
  return spelling === 'flat' ? FLAT_NAMES[pc] : SHARP_NAMES[pc];
}

/** A single-name spelling for labels (markers, feedback). */
export function labelSpelling(spelling: Spelling): 'sharp' | 'flat' {
  return spelling === 'flat' ? 'flat' : 'sharp';
}

export function stringName(string: number): string {
  return STANDARD_TUNING[string].name;
}
