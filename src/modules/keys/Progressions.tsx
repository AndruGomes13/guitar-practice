import { useState } from 'react';
import { playChords } from '../../audio/synth';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { keyById, keyName } from '../../lib/keys';
import { pcName, pitchClassOf, triadMidis, triadSymbol } from '../../lib/music';
import { recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import {
  chordsOf,
  pickProgressionQuestion,
  progressionById,
  progressionQuestionId,
  type KeySettings,
} from './settings';

/** Fill in each chord of a common progression, then hear it. */
export function Progressions({ settings }: { settings: KeySettings }) {
  const [stats, setStats] = usePersistentState<StatsMap>('keys.stats.progressions', {});
  const [question, setQuestion] = useState(() => pickProgressionQuestion(settings, stats));
  /** How many chords have been filled in so far. */
  const [filled, setFilled] = useState(0);
  const [misses, setMisses] = useState(0);
  const [revealed, setRevealed] = useState(false);
  /** The last wrong root you tapped, shown in red. */
  const [wrong, setWrong] = useState<number | null>(null);
  const [session, setSession] = useState({ done: 0, perfect: 0 });

  const key = keyById(question.keyId);
  const progression = progressionById(question.progressionId);
  const chords = chordsOf(key, settings);
  const slots = progression.degrees.map((d) => chords[d]);
  const done = filled === slots.length;
  const perfect = misses === 0 && !revealed;
  const current = done ? null : slots[filled];
  const hear = () => playChords(slots.map((c) => triadMidis(c.triad)));

  const fillSlot = (viaReveal: boolean) => {
    const nowFilled = filled + 1;
    setFilled(nowFilled);
    setWrong(null);
    if (viaReveal) setRevealed(true);
    if (nowFilled < slots.length) return;
    const clean = perfect && !viaReveal;
    setStats(recordResult(stats, progressionQuestionId(question), clean));
    setSession((s) => ({ done: s.done + 1, perfect: s.perfect + (clean ? 1 : 0) }));
    hear();
  };

  const onPick = (pc: number) => {
    if (!current) return;
    if (pc === pitchClassOf(current.triad.root)) {
      fillSlot(false);
    } else {
      setWrong(pc);
      setMisses((m) => m + 1);
    }
  };

  const next = (currentStats: StatsMap) => {
    setQuestion(pickProgressionQuestion(settings, currentStats, question));
    setFilled(0);
    setMisses(0);
    setRevealed(false);
    setWrong(null);
  };

  const skip = () => {
    const newStats = recordResult(stats, progressionQuestionId(question), false);
    setStats(newStats);
    setSession((s) => ({ ...s, done: s.done + 1 }));
    next(newStats);
  };

  const keyStates: Partial<Record<number, KeyState>> = {};
  if (wrong !== null) keyStates[wrong] = 'wrong';

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.perfect}</strong>/{session.done} without mistakes
        </span>
      </div>

      <section className={`card prompt-card${done ? ' prompt-correct' : ''}`}>
        <div className="prompt-kicker">In {keyName(key)}</div>
        <div className="prompt-sub">{progression.name}</div>
        <div className="prog-slots">
          {slots.map((c, i) => (
            <div
              key={i}
              className={`prog-slot${i < filled ? ' filled' : ''}${i === filled && !done ? ' current' : ''}`}
            >
              <span className="prog-numeral">{c.numeral}</span>
              <span className="prog-chord">{i < filled ? triadSymbol(c.triad) : '?'}</span>
            </div>
          ))}
        </div>
      </section>

      <NotePicker states={keyStates} onPick={onPick} disabled={done} />

      <div className="feedback" aria-live="polite">
        {current ? (
          <>
            <p className={wrong === null ? 'muted' : 'feedback-bad'}>
              {wrong === null
                ? `Tap the root of the ${current.numeral} chord.`
                : `Not ${pcName(wrong, 'both')}. Try again.`}
            </p>
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={() => fillSlot(true)}>
                Show me
              </button>
              <button type="button" className="btn btn-secondary" onClick={skip}>
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={perfect ? 'feedback-good' : undefined}>
              {perfect ? '✓ ' : 'The chords: '}
              {slots.map((c) => triadSymbol(c.triad)).join(' – ')}
            </p>
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={hear}>
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
