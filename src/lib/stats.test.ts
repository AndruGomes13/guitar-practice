import { describe, expect, it } from 'vitest';
import {
  accuracy,
  averageMs,
  groupStats,
  itemWeight,
  pickWeighted,
  recordResult,
  type StatsMap,
} from './stats';

describe('stats', () => {
  it('records results', () => {
    let stats: StatsMap = {};
    stats = recordResult(stats, 'a', true, 1000);
    stats = recordResult(stats, 'a', false);
    stats = recordResult(stats, 'a', true, 3000);
    expect(stats.a).toEqual({ attempts: 3, correct: 2, streak: 1, totalMs: 4000, timedCount: 2 });
    expect(accuracy(stats.a)).toBeCloseTo(2 / 3);
    expect(averageMs(stats.a)).toBe(2000);
  });

  it('weights missed items above mastered ones', () => {
    let stats: StatsMap = {};
    for (let i = 0; i < 5; i++) stats = recordResult(stats, 'easy', true, 800);
    stats = recordResult(stats, 'hard', false);
    expect(itemWeight(stats.hard)).toBeGreaterThan(itemWeight(stats.easy));
    expect(itemWeight(undefined)).toBeGreaterThan(itemWeight(stats.easy));
  });

  it('never repeats the avoided item when there is a choice', () => {
    const items = ['a', 'b'];
    for (let i = 0; i < 20; i++) {
      expect(pickWeighted(items, (x) => x, {}, 'a')).toBe('b');
    }
    expect(pickWeighted(['a'], (x) => x, {}, 'a')).toBe('a');
  });

  it('picks proportionally to weight', () => {
    let stats: StatsMap = {};
    for (let i = 0; i < 5; i++) stats = recordResult(stats, 'easy', true, 800);
    // random() = 0 always selects the first candidate; 0.999 the last.
    expect(
      pickWeighted(
        ['easy', 'new'],
        (x) => x,
        stats,
        undefined,
        () => 0.999,
      ),
    ).toBe('new');
    expect(
      pickWeighted(
        ['easy', 'new'],
        (x) => x,
        stats,
        undefined,
        () => 0,
      ),
    ).toBe('easy');
  });
});

describe('groupStats', () => {
  it('sums stats per group', () => {
    let stats: StatsMap = {};
    stats = recordResult(stats, 'C@0', true, 1000);
    stats = recordResult(stats, 'C@1', false);
    stats = recordResult(stats, 'D@0', true, 2000);
    const grouped = groupStats(stats, (id) => id.split('@')[0]);
    expect(grouped.C).toEqual({ attempts: 2, correct: 1, streak: 0, totalMs: 1000, timedCount: 1 });
    expect(grouped.D.attempts).toBe(1);
  });
});
