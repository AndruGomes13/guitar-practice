import { describe, expect, it } from 'vitest';
import { keyById } from '../../lib/keys';
import { recordResult, type StatsMap } from '../../lib/stats';
import {
  DEFAULT_KEY_SETTINGS,
  DEGREE_CHIP_LABELS,
  pickProgressionQuestion,
  pickQuizQuestion,
  progressionById,
  progressionItems,
  progressionNumerals,
  quizItems,
  type KeySettings,
} from './settings';

const settings = (patch: Partial<KeySettings> = {}): KeySettings => ({
  ...DEFAULT_KEY_SETTINGS,
  ...patch,
});

describe('key quiz', () => {
  it('asks about every selected key, degree and direction', () => {
    expect(quizItems(settings({ keys: ['C', 'G'], degrees: [0, 3, 4], ask: 'both' }))).toHaveLength(
      12,
    );
    expect(quizItems(settings({ keys: ['C'], degrees: [4], ask: 'chord' }))).toEqual([
      { keyId: 'C', degree: 4, ask: 'chord' },
    ]);
  });

  it('never asks about the same chord twice in a row', () => {
    const s = settings({ keys: ['C', 'G'], degrees: [0, 4] });
    let previous = pickQuizQuestion(s, {});
    for (let i = 0; i < 100; i++) {
      const next = pickQuizQuestion(s, {}, previous);
      expect(next.keyId === previous.keyId && next.degree === previous.degree).toBe(false);
      previous = next;
    }
  });

  it('favors chords you miss', () => {
    const s = settings({ keys: ['C'], degrees: [0, 3, 4], ask: 'chord' });
    let stats: StatsMap = {};
    for (const id of ['C:0:chord', 'C:3:chord']) {
      for (let i = 0; i < 5; i++) stats = recordResult(stats, id, true, 800);
    }
    stats = recordResult(stats, 'C:4:chord', false);
    let fifths = 0;
    for (let i = 0; i < 400; i++) if (pickQuizQuestion(s, stats).degree === 4) fifths++;
    expect(fifths / 400).toBeGreaterThan(0.5);
  });

  it('labels degree chips as in a major key', () => {
    expect(DEGREE_CHIP_LABELS).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  });
});

describe('progressions', () => {
  it('only uses progressions that match the key and the selected degrees', () => {
    const items = progressionItems(settings({ keys: ['C', 'Am'], degrees: [0, 3, 4] }));
    expect(items).toEqual([
      { keyId: 'C', progressionId: 'I-IV-V' },
      { keyId: 'Am', progressionId: 'i-iv-v' },
    ]);
  });

  it('writes the numerals for the key', () => {
    const minor = progressionById('i-iv-v');
    expect(progressionNumerals(minor, keyById('Am'), settings())).toEqual(['i', 'iv', 'v']);
    expect(progressionNumerals(minor, keyById('Am'), settings({ majorVInMinor: true }))).toEqual([
      'i',
      'iv',
      'V',
    ]);
  });

  it('picks a different progression than last time when it can', () => {
    const s = settings({ keys: ['G'] });
    let previous = pickProgressionQuestion(s, {});
    for (let i = 0; i < 50; i++) {
      const next = pickProgressionQuestion(s, {}, previous);
      expect(next.progressionId).not.toBe(previous.progressionId);
      previous = next;
    }
  });
});
