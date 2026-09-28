import { useState } from 'react';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { useTimeout } from '../../lib/hooks';
import { triadName, triadPitchClasses, triadSymbol, type Triad } from '../../lib/music';
import { pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import { ToneList } from './ToneList';

const idOf = (t: Triad) => t.id;

interface Score {
  correct: number;
  total: number;
  streak: number;
}

/** Shows a chord name; you tap the three notes that make it up. */
export function Build({ pool }: { pool: readonly Triad[] }) {
  const [stats, setStats] = usePersistentState<StatsMap>('triads.stats.build', {});
  const [triad, setTriad] = useState(() => pickWeighted(pool, idOf, stats));
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState<Score>({ correct: 0, total: 0, streak: 0 });
  const timeout = useTimeout();

  const answer = triadPitchClasses(triad);

  const next = (currentStats: StatsMap, previous: Triad) => {
    timeout.cancel();
    setTriad(pickWeighted(pool, idOf, currentStats, previous.id));
    setPicked([]);
    setResult(null);
  };

  const onPick = (pc: number) => {
    if (result) return;
    const nowPicked = picked.includes(pc) ? picked.filter((p) => p !== pc) : [...picked, pc];
    setPicked(nowPicked);
    if (nowPicked.length < 3) return;

    const ok = nowPicked.every((p) => answer.includes(p));
    const newStats = recordResult(stats, triad.id, ok);
    setStats(newStats);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1,
      streak: ok ? s.streak + 1 : 0,
    }));
    if (ok) timeout.schedule(() => next(newStats, triad), 1200);
  };

  const keyStates: Partial<Record<number, KeyState>> = {};
  if (result) {
    for (const pc of answer) keyStates[pc] = picked.includes(pc) ? 'correct' : 'missed';
    for (const pc of picked) if (!answer.includes(pc)) keyStates[pc] = 'wrong';
  } else {
    for (const pc of picked) keyStates[pc] = 'selected';
  }

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{score.correct}</strong>/{score.total} correct
        </span>
        <span>
          Streak <strong>{score.streak}</strong>
        </span>
      </div>
      <section className={`card prompt-card${result ? ` prompt-${result}` : ''}`}>
        <div className="prompt-kicker">Tap the 3 notes of</div>
        <div className="prompt-main">{triadSymbol(triad)}</div>
        <div className="prompt-sub">{triadName(triad)}</div>
      </section>

      <NotePicker states={keyStates} onPick={onPick} />

      <div className="feedback" aria-live="polite">
        {result === null ? (
          <p className="muted">
            {picked.length === 0
              ? 'Pick the root, third and fifth.'
              : `${3 - picked.length} to go…`}
          </p>
        ) : (
          <>
            <p className={result === 'correct' ? 'feedback-good' : 'feedback-bad'}>
              {result === 'correct' ? 'Correct!' : 'Not quite. The notes are:'}
            </p>
            <ToneList triad={triad} size="small" />
            {result === 'wrong' ? (
              <button type="button" className="btn btn-primary" onClick={() => next(stats, triad)}>
                Next chord
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
