import { accuracy, averageMs, type StatsMap } from '../lib/stats';

export interface StatsItem {
  /** Key into `stats`. */
  id: string;
  label: string;
}

interface Props {
  items: readonly StatsItem[];
  stats: StatsMap;
  onReset: () => void;
  showTimes?: boolean;
}

function rating(acc: number | null, avg: number | null): string {
  if (acc === null) return 'unseen';
  if (acc < 0.6) return 'weak';
  if (acc < 0.85 || (avg !== null && avg > 5000)) return 'okay';
  return 'strong';
}

/** One cell per item (a note, an interval…) showing accuracy and speed. */
export function StatsStrip({ items, stats, onReset, showTimes = true }: Props) {
  const hasData = Object.keys(stats).length > 0;
  return (
    <section className="note-stats">
      <header className="note-stats-header">
        <h3>How you’re doing</h3>
        {hasData ? (
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              if (window.confirm('Reset the stats for this exercise?')) onReset();
            }}
          >
            Reset
          </button>
        ) : null}
      </header>
      <div className="note-stats-grid">
        {items.map(({ id, label }) => {
          const stat = stats[id];
          const acc = accuracy(stat);
          const avg = averageMs(stat);
          return (
            <div key={id} className={`note-stat note-stat-${rating(acc, avg)}`}>
              <div className="note-stat-name">{label}</div>
              <div className="note-stat-value">
                {acc === null ? '–' : `${Math.round(acc * 100)}%`}
              </div>
              {showTimes ? (
                <div className="note-stat-time">
                  {avg === null ? '' : `${(avg / 1000).toFixed(1)}s`}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
