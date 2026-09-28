/**
 * Lightweight per-item practice statistics and weighted item selection.
 *
 * Items you miss or answer slowly come up more often; items you keep getting
 * right fade into the background (a very simple form of spaced repetition).
 */

export interface ItemStat {
  attempts: number;
  correct: number;
  /** Consecutive correct answers. */
  streak: number;
  /** Sum and count of response times for correct answers, in ms. */
  totalMs: number;
  timedCount: number;
}

export type StatsMap = Record<string, ItemStat>;

const EMPTY: ItemStat = { attempts: 0, correct: 0, streak: 0, totalMs: 0, timedCount: 0 };

export function recordResult(
  stats: StatsMap,
  id: string,
  correct: boolean,
  responseMs?: number,
): StatsMap {
  const prev = stats[id] ?? EMPTY;
  const timed = correct && responseMs !== undefined;
  return {
    ...stats,
    [id]: {
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      streak: correct ? prev.streak + 1 : 0,
      totalMs: prev.totalMs + (timed ? responseMs : 0),
      timedCount: prev.timedCount + (timed ? 1 : 0),
    },
  };
}

export function accuracy(stat: ItemStat | undefined): number | null {
  return stat && stat.attempts > 0 ? stat.correct / stat.attempts : null;
}

export function averageMs(stat: ItemStat | undefined): number | null {
  return stat && stat.timedCount > 0 ? stat.totalMs / stat.timedCount : null;
}

/** Relative chance of an item being picked next. */
export function itemWeight(stat: ItemStat | undefined, slowMs = 4000): number {
  if (!stat || stat.attempts === 0) return 3;
  const acc = stat.correct / stat.attempts;
  let weight = 1 + (1 - acc) * 4;
  weight /= 1 + stat.streak * 0.75;
  const avg = averageMs(stat);
  if (avg !== null) weight *= Math.min(2, Math.max(0.5, avg / slowMs));
  return Math.max(0.1, weight);
}

/**
 * Picks an item at random, weighted by its stats. `avoidId` (usually the
 * previous item) is skipped when there's anything else to choose from.
 */
export function pickWeighted<T>(
  items: readonly T[],
  idOf: (item: T) => string,
  stats: StatsMap,
  avoidId?: string,
  random: () => number = Math.random,
): T {
  if (items.length === 0) throw new Error('pickWeighted: no items to choose from');
  const candidates = items.length > 1 ? items.filter((it) => idOf(it) !== avoidId) : items;
  const weights = candidates.map((it) => itemWeight(stats[idOf(it)]));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Combines item stats into groups, e.g. per-position stats into per-note stats. */
export function groupStats(stats: StatsMap, groupOf: (id: string) => string | null): StatsMap {
  const grouped: StatsMap = {};
  for (const [id, stat] of Object.entries(stats)) {
    const group = groupOf(id);
    if (group === null) continue;
    const prev = grouped[group];
    if (!prev) {
      grouped[group] = { ...stat };
      continue;
    }
    grouped[group] = {
      attempts: prev.attempts + stat.attempts,
      correct: prev.correct + stat.correct,
      streak: Math.min(prev.streak, stat.streak),
      totalMs: prev.totalMs + stat.totalMs,
      timedCount: prev.timedCount + stat.timedCount,
    };
  }
  return grouped;
}
