import { useState } from 'react';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { useTimeout } from '../../lib/hooks';
import {
  chordName,
  chordPitchClasses,
  chordSymbol,
  type Spelling,
  type Chord,
} from '../../lib/music';
import { pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import { ToneList } from '../../components/ToneList';

const idOf = (t: Chord) => t.id;

interface Score {
  correct: number;
  total: number;
  streak: number;
}

/** Shows a chord name; you tap the notes that make it up. */
export function Build({ pool, spelling }: { pool: readonly Chord[]; spelling: Spelling }) {
  const [stats, setStats] = usePersistentState<StatsMap>('triads.stats.build', {});
  const [chord, setChord] = useState(() => pickWeighted(pool, idOf, stats));
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState<Score>({ correct: 0, total: 0, streak: 0 });
  const timeout = useTimeout();

  const answer = chordPitchClasses(chord);

  const next = (currentStats: StatsMap, previous: Chord) => {
    timeout.cancel();
    setChord(pickWeighted(pool, idOf, currentStats, previous.id));
    setPicked([]);
    setResult(null);
  };

  const onPick = (pc: number) => {
    if (result) return;
    const nowPicked = picked.includes(pc) ? picked.filter((p) => p !== pc) : [...picked, pc];
    setPicked(nowPicked);
    if (nowPicked.length < answer.length) return;

    const ok = nowPicked.every((p) => answer.includes(p));
    const newStats = recordResult(stats, chord.id, ok);
    setStats(newStats);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1,
      streak: ok ? s.streak + 1 : 0,
    }));
    if (ok) timeout.schedule(() => next(newStats, chord), 1200);
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
        <div className="prompt-kicker">Tap the {answer.length} notes of</div>
        <div className="prompt-main">{chordSymbol(chord)}</div>
        <div className="prompt-sub">{chordName(chord)}</div>
      </section>

      <NotePicker states={keyStates} onPick={onPick} spelling={spelling} />

      <div className={`feedback${result === 'wrong' ? ' feedback-sticky' : ''}`} aria-live="polite">
        {result === null ? (
          <p className="muted">
            {picked.length === 0
              ? answer.length === 4
                ? 'Pick the root, 3rd, 5th and 7th.'
                : 'Pick the root, 3rd and 5th.'
              : `${answer.length - picked.length} to go…`}
          </p>
        ) : (
          <>
            <p className={result === 'correct' ? 'feedback-good' : 'feedback-bad'}>
              {result === 'correct' ? 'Correct!' : 'Not quite. The notes are:'}
            </p>
            <ToneList chord={chord} size="small" />
            {result === 'wrong' ? (
              <button type="button" className="btn btn-primary" onClick={() => next(stats, chord)}>
                Next chord
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
