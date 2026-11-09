import { useState } from 'react';
import { playArpeggioThenChord } from '../../audio/synth';
import { ChoiceGrid } from '../../components/ChoiceGrid';
import { answerStates, type ChoiceState } from '../../components/choices';
import { Segmented } from '../../components/controls';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { ToneList } from '../../components/ToneList';
import { useTimeout } from '../../lib/hooks';
import {
  CHORD_QUALITIES,
  chordMidis,
  chordName,
  chordSymbol,
  matchesChord,
  noteName,
  pcName,
  pitchClassOf,
  type Chord,
  type ChordQuality,
  type Spelling,
} from '../../lib/music';
import { pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ChordSettings } from './settings';

const idOf = (c: Chord) => c.id;

interface Question {
  chord: Chord;
  /** Display order for "shuffled" mode: indexes into chord.tones, never starting with the root. */
  shuffled: number[];
  shownAt: number;
}

function shuffledOrder(n: number): number[] {
  let order: number[];
  do {
    order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order[0] === 0);
  return order;
}

const makeQuestion = (chord: Chord): Question => ({
  chord,
  shuffled: shuffledOrder(chord.tones.length),
  shownAt: performance.now(),
});

interface Props {
  pool: readonly Chord[];
  qualities: readonly ChordQuality[];
  spelling: Spelling;
  order: ChordSettings['nameOrder'];
  onOrderChange: (order: ChordSettings['nameOrder']) => void;
}

/** Shows a chord's notes; you name the chord (root, then type). */
export function NameChord({ pool, qualities, spelling, order, onOrderChange }: Props) {
  const [stats, setStats] = usePersistentState<StatsMap>('triads.stats.name', {});
  const [question, setQuestion] = useState(() => makeQuestion(pickWeighted(pool, idOf, stats)));
  const [root, setRoot] = useState<number | null>(null);
  const [quality, setQuality] = useState<ChordQuality | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const timeout = useTimeout();

  const { chord } = question;
  const rootPc = pitchClassOf(chord.root);
  const shown = order === 'ordered' ? chord.tones : question.shuffled.map((i) => chord.tones[i]);
  const labelSpelling = spelling === 'flat' ? 'flat' : 'sharp';
  const answerSymbol =
    root !== null && quality !== null
      ? pcName(root, labelSpelling) + CHORD_QUALITIES[quality].symbol
      : '';

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    setQuestion(makeQuestion(pickWeighted(pool, idOf, currentStats, chord.id)));
    setRoot(null);
    setQuality(null);
    setResult(null);
  };

  const check = (r: number | null, q: ChordQuality | null) => {
    if (r === null || q === null) return;
    const ok = matchesChord(r, q, chord);
    const ms = performance.now() - question.shownAt;
    const newStats = recordResult(stats, chord.id, ok, ok ? ms : undefined);
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

      <Segmented
        label="Note order"
        value={order}
        onChange={onOrderChange}
        options={[
          { value: 'ordered', label: 'In order (1 3 5 7)' },
          { value: 'shuffled', label: 'Shuffled' },
        ]}
      />

      <section className={`card prompt-card${result ? ` prompt-${result}` : ''}`}>
        <div className="prompt-kicker">Which chord is this?</div>
        <div className="note-tokens">
          {shown.map((tone, i) => (
            <span key={i} className="note-token">
              {noteName(tone)}
            </span>
          ))}
        </div>
        <div className="prompt-sub">Tap the root, then the chord type.</div>
      </section>

      <div className="answer-label">Root</div>
      <NotePicker states={keyStates} onPick={onRoot} spelling={spelling} />
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
              ✓ {chordSymbol(chord)} ({chordName(chord)})
            </p>
            {otherRoot ? (
              <p className="muted small">
                {answerSymbol} has exactly the same notes: this chord is symmetric.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="feedback-bad">
              It’s {chordSymbol(chord)} ({chordName(chord)}), not {answerSymbol}.
            </p>
            <ToneList chord={chord} size="small" />
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => playArpeggioThenChord(chordMidis(chord))}
              >
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
