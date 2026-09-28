import { describe, expect, it } from 'vitest';
import { midiAt } from '../../lib/guitar';
import { recordResult, type StatsMap } from '../../lib/stats';
import {
  boardItems,
  boardPairs,
  boardWindow,
  DEFAULT_INTERVAL_SETTINGS,
  EAR_HIGHEST,
  EAR_LOWEST,
  HAND_SPAN,
  pickBoardQuestion,
  pickEarQuestion,
  secondMidi,
  type IntervalSettings,
} from './settings';

const settings = (patch: Partial<IntervalSettings> = {}): IntervalSettings => ({
  ...DEFAULT_INTERVAL_SETTINGS,
  ...patch,
});

describe('fretboard interval questions', () => {
  it('places the second note the right distance and direction from the root', () => {
    const s = settings({ intervals: [1, 3, 7, 12], boardDirections: ['up', 'down'] });
    for (let i = 0; i < 200; i++) {
      const q = pickBoardQuestion(s, {});
      const delta = midiAt(q.second) - midiAt(q.root);
      expect(delta).toBe(q.direction === 'up' ? q.semitones : -q.semitones);
      expect(Math.abs(q.second.fret - q.root.fret)).toBeLessThanOrEqual(HAND_SPAN);
      expect(q.root.fret).toBeGreaterThanOrEqual(0);
      expect(q.second.fret).toBeLessThanOrEqual(12);
    }
  });

  it('respects enabled strings', () => {
    const s = settings({ strings: [2, 3] });
    for (let i = 0; i < 50; i++) {
      const q = pickBoardQuestion(s, {});
      expect([2, 3]).toContain(q.root.string);
      expect([2, 3]).toContain(q.second.string);
    }
  });

  it('drops intervals that cannot be shown', () => {
    // On one string within a hand position, only intervals up to 4 frets exist.
    const s = settings({ strings: [0], intervals: [3, 4, 7, 12] });
    expect(boardItems(s).map((i) => i.semitones)).toEqual([3, 4]);
    expect(
      boardPairs({ semitones: 12, direction: 'up' }, settings({ span: 'neck', strings: [0] })),
    ).toHaveLength(1); // open E to 12th fret E
  });

  it('draws a compact window around both notes', () => {
    const s = settings();
    const q = {
      semitones: 7,
      direction: 'up' as const,
      root: { string: 0, fret: 5 },
      second: { string: 1, fret: 7 },
    };
    expect(boardWindow(q, s)).toEqual([4, 8]);
    const open = { ...q, root: { string: 0, fret: 0 }, second: { string: 1, fret: 2 } };
    expect(boardWindow(open, s)).toEqual([0, 4]);
  });
});

describe('ear interval questions', () => {
  it('keeps both notes in range', () => {
    const s = settings({ intervals: [1, 12], earDirections: ['up', 'down', 'together'] });
    for (let i = 0; i < 300; i++) {
      const q = pickEarQuestion(s, {});
      for (const midi of [q.rootMidi, secondMidi(q)]) {
        expect(midi).toBeGreaterThanOrEqual(EAR_LOWEST);
        expect(midi).toBeLessThanOrEqual(EAR_HIGHEST);
      }
    }
  });

  it('favors intervals you miss', () => {
    const s = settings({ intervals: [3, 4, 5, 7] });
    let stats: StatsMap = {};
    for (const id of ['4u', '5u', '7u']) {
      for (let i = 0; i < 5; i++) stats = recordResult(stats, id, true, 1000);
    }
    stats = recordResult(stats, '3u', false);
    let minorThirds = 0;
    for (let i = 0; i < 400; i++) if (pickEarQuestion(s, stats).semitones === 3) minorThirds++;
    expect(minorThirds / 400).toBeGreaterThan(0.5);
  });

  it('does not repeat the same interval twice in a row', () => {
    const s = settings();
    let previous = pickEarQuestion(s, {});
    for (let i = 0; i < 100; i++) {
      const next = pickEarQuestion(s, {}, previous);
      expect(next.semitones === previous.semitones && next.direction === previous.direction).toBe(
        false,
      );
      previous = next;
    }
  });
});
