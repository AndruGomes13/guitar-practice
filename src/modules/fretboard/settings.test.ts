import { describe, expect, it } from 'vitest';
import { positionsOfPc } from '../../lib/guitar';
import { recordResult, type StatsMap } from '../../lib/stats';
import {
  DEFAULT_FRETBOARD_SETTINGS,
  describeString,
  noteTargets,
  pickTarget,
  questionKey,
  spellForPrompt,
  targetPositions,
  targetStatsId,
  type FretboardSettings,
} from './settings';

const settings = (patch: Partial<FretboardSettings> = {}): FretboardSettings => ({
  ...DEFAULT_FRETBOARD_SETTINGS,
  ...patch,
});

describe('fretboard questions', () => {
  it('only asks for notes that exist on the chosen string within the fret range', () => {
    const s = settings({ strings: [1], minFret: 0, maxFret: 4 });
    // A string, frets 0–4: A A♯ B C C♯
    expect(noteTargets(s).map((t) => t.pc)).toEqual([0, 1, 9, 10, 11]);
    for (let i = 0; i < 50; i++) {
      const t = pickTarget(s, {});
      expect(t.string).toBe(1);
      expect(positionsOfPc(t.pc, [t.string], 0, 4).length).toBeGreaterThan(0);
    }
  });

  it('always comes with a string, in both scopes', () => {
    for (const scope of ['string', 'anywhere'] as const) {
      for (let i = 0; i < 50; i++) {
        const t = pickTarget(settings({ scope, strings: [2, 4] }), {});
        expect([2, 4]).toContain(t.string);
      }
    }
  });

  it('does not repeat the previous note name', () => {
    const s = settings({ naturalsOnly: true });
    let previous = pickTarget(s, {});
    for (let i = 0; i < 100; i++) {
      const next = pickTarget(s, {}, previous);
      expect(next.pc).not.toBe(previous.pc);
      previous = next;
    }
  });

  it('keys stats by note, plus string when the string is asked for', () => {
    const t = { pc: 7, string: 2 };
    expect(targetStatsId(t, 'string')).toBe('7@2');
    expect(targetStatsId(t, 'anywhere')).toBe('7');
  });

  it('favors weak notes', () => {
    // Every note but C is well known; C keeps being missed.
    const s = settings({ scope: 'anywhere', naturalsOnly: true });
    let stats: StatsMap = {};
    for (const pc of [2, 4, 5, 7, 9, 11]) {
      for (let i = 0; i < 5; i++) stats = recordResult(stats, `${pc}`, true, 500);
    }
    stats = recordResult(stats, '0', false);
    let cCount = 0;
    for (let i = 0; i < 400; i++) if (pickTarget(s, stats).pc === 0) cCount++;
    expect(cCount / 400).toBeGreaterThan(0.5);
  });

  it('accepts positions on the given string, or anywhere', () => {
    const t = { pc: 0, string: 1 }; // C, A string
    expect(targetPositions(t, settings({ scope: 'string' }))).toEqual([{ string: 1, fret: 3 }]);
    expect(targetPositions(t, settings({ scope: 'anywhere' }))).toHaveLength(6);
  });

  it('keeps the question when only scope or spelling change', () => {
    const base = settings();
    expect(questionKey({ ...base, scope: 'anywhere', spelling: 'flat' })).toBe(questionKey(base));
    expect(questionKey({ ...base, maxFret: 5 })).not.toBe(questionKey(base));
  });
});

describe('labels', () => {
  it('spells prompts', () => {
    expect(spellForPrompt(1, 'sharp', true)).toBe('C♯');
    expect(spellForPrompt(1, 'flat', false)).toBe('D♭');
    expect(spellForPrompt(1, 'both', true)).toBe('D♭');
    expect(spellForPrompt(1, 'both', false)).toBe('C♯');
    expect(spellForPrompt(4, 'flat', true)).toBe('E');
  });

  it('names strings by name and number', () => {
    expect(describeString(0)).toBe('low E string (6th)');
    expect(describeString(1)).toBe('A string (5th)');
  });
});
