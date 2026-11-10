import { useState, type ReactNode } from 'react';
import { ChoiceGrid } from '../../components/ChoiceGrid';
import { answerStates, type ChoiceState } from '../../components/choices';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { ToneList } from '../../components/ToneList';
import { useTimeout } from '../../lib/hooks';
import {
  CHORD_QUALITIES,
  chordName,
  chordSymbol,
  matchesChord,
  pcName,
  pitchClassOf,
  type Chord,
  type ChordQuality,
} from '../../lib/music';
import { pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';

export interface ChordQuizItem {
  id: string;
  chord: Chord;
}

interface Question<T> {
  item: T;
  /** A random number fixed for this question, for any randomness in how it's shown. */
  seed: number;
  shownAt: number;
}

interface Props<T extends ChordQuizItem> {
  items: readonly T[];
  statsKey: string;
  /** Chord types offered as answers. */
  qualities: readonly ChordQuality[];
  kicker: string;
  /** On-screen options shown above the question. */
  controls?: ReactNode;
  renderPrompt: (item: T, seed: number, answered: boolean) => ReactNode;
  /** Extra details shown once answered (e.g. where the shape sits on the neck). */
  renderDetails?: (item: T) => ReactNode;
  hear: (item: T) => void;
}

const makeQuestion = <T,>(item: T): Question<T> => ({
  item,
  seed: Math.random(),
  shownAt: performance.now(),
});

/**
 * "Which chord is this?" — shows something about a chord (its notes, a shape)
 * and you answer with the root, then the chord type. Notes and chords are named
 * the way you'd read them off the neck: naturals and sharps only (F, not E♯).
 */
export function ChordQuiz<T extends ChordQuizItem>({
  items,
  statsKey,
  qualities,
  kicker,
  controls,
  renderPrompt,
  renderDetails,
  hear,
}: Props<T>) {
  const [stats, setStats] = usePersistentState<StatsMap>(statsKey, {});
  const [question, setQuestion] = useState(() =>
    makeQuestion(pickWeighted(items, (i) => i.id, stats)),
  );
  const [root, setRoot] = useState<number | null>(null);
  const [quality, setQuality] = useState<ChordQuality | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const timeout = useTimeout();

  const { item } = question;
  const { chord } = item;
  const rootPc = pitchClassOf(chord.root);
  const answerSymbol =
    root !== null && quality !== null
      ? pcName(root, 'sharp') + CHORD_QUALITIES[quality].symbol
      : '';

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    setQuestion(makeQuestion(pickWeighted(items, (i) => i.id, currentStats, item.id)));
    setRoot(null);
    setQuality(null);
    setResult(null);
  };

  const check = (r: number | null, q: ChordQuality | null) => {
    if (r === null || q === null) return;
    const ok = matchesChord(r, q, chord);
    const ms = performance.now() - question.shownAt;
    const newStats = recordResult(stats, item.id, ok, ok ? ms : undefined);
    setStats(newStats);
    setResult(ok ? 'correct' : 'wrong');
    setScore((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1,
      streak: ok ? s.streak + 1 : 0,
    }));
    if (ok) timeout.schedule(() => next(newStats), 1300);
  };

  const onRoot = (pc: number) => {
    if (result) return;
    setRoot(pc);
    check(pc, quality);
  };

  const onQuality = (q: ChordQuality) => {
    if (result) return;
    setQuality(q);
    check(root, q);
  };

  const keyStates: Partial<Record<number, KeyState>> = {};
  if (result === 'correct' && root !== null) keyStates[root] = 'correct';
  else if (result === 'wrong') {
    keyStates[rootPc] = 'correct';
    if (root !== null && root !== rootPc) keyStates[root] = 'wrong';
  } else if (root !== null) keyStates[root] = 'selected';

  const qualityStates: ReadonlyMap<ChordQuality, ChoiceState> = result
    ? answerStates(chord.quality, result === 'correct' ? chord.quality : quality)
    : new Map(quality ? [[quality, 'selected']] : []);
  const qualityChoices = qualities.map((q) => ({
    value: q,
    label: CHORD_QUALITIES[q].symbol || 'maj',
    sublabel: CHORD_QUALITIES[q].label,
  }));

  // A symmetric chord named from another root (E+ for C+) is right, but worth pointing out.
  const otherRoot = result === 'correct' && root !== null && root !== rootPc;

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

      {controls}

      <section className={`card prompt-card${result ? ` prompt-${result}` : ''}`}>
        <div className="prompt-kicker">{kicker}</div>
        {renderPrompt(item, question.seed, result !== null)}
        <div className="prompt-sub">Tap the root, then the chord type.</div>
      </section>

      <div className="answer-label">Root</div>
      <NotePicker states={keyStates} onPick={onRoot} spelling="sharp" />
      <div className="answer-label">Type</div>
      <ChoiceGrid
        label="Chord type"
        choices={qualityChoices}
        states={qualityStates}
        onPick={onQuality}
        disabled={result !== null}
      />

      <div className={`feedback${result === 'wrong' ? ' feedback-sticky' : ''}`} aria-live="polite">
        {result === null ? null : result === 'correct' ? (
          <>
            <p className="feedback-good">
              ✓ {chordSymbol(chord, true)} ({chordName(chord, true)})
            </p>
            {otherRoot ? (
              <p className="muted small">
                {answerSymbol} has exactly the same notes: this chord is symmetric.
              </p>
            ) : null}
            {renderDetails?.(item)}
          </>
        ) : (
          <>
            <p className="feedback-bad">
              It’s {chordSymbol(chord, true)} ({chordName(chord, true)}), not {answerSymbol}.
            </p>
            {renderDetails?.(item)}
            <ToneList chord={chord} size="small" simple />
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={() => hear(item)}>
                <PlayIcon width={18} height={18} /> Hear it
              </button>
              <button type="button" className="btn btn-primary" onClick={() => next(stats)}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
