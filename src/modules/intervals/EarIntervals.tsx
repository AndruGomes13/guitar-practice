import { useEffect, useEffectEvent, useState } from 'react';
import { playInterval } from '../../audio/synth';
import { PlayIcon, ReplayIcon } from '../../components/icons';
import { StatsStrip } from '../../components/StatsStrip';
import { useTimeout } from '../../lib/hooks';
import {
  INTERVALS,
  intervalInfo,
  intervalPhrase,
  semitonesOfId,
  spellInterval,
  type Direction,
} from '../../lib/intervals';
import { groupStats, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import { answerStates } from '../../components/choices';
import { IntervalPicker } from './IntervalPicker';
import {
  itemId,
  pickEarQuestion,
  secondMidi,
  type EarQuestion,
  type IntervalSettings,
} from './settings';

const STATS_ITEMS = INTERVALS.map((i) => ({ id: `${i.semitones}`, label: i.short }));

const HOW_PLAYED: Record<Direction, string> = {
  up: 'Two notes, going up',
  down: 'Two notes, going down',
  together: 'Two notes played together',
};

const play = (q: EarQuestion) => playInterval(q.rootMidi, secondMidi(q), q.direction);

/** Plays two notes; you name the interval. */
export function EarIntervals({ settings }: { settings: IntervalSettings }) {
  const [stats, setStats] = usePersistentState<StatsMap>('intervals.stats.ear', {});
  const [question, setQuestion] = useState(() => pickEarQuestion(settings, stats));
  /** When the current question was first played; null until you've heard it. */
  const [heardAt, setHeardAt] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [session, setSession] = useState({ answered: 0, correct: 0 });
  const timeout = useTimeout();

  const answered = picked !== null;
  const correct = picked === question.semitones;
  const info = intervalInfo(question.semitones);
  const names = spellInterval(question.rootMidi, question.semitones, question.direction);

  const replay = () => {
    play(question);
    if (heardAt === null) setHeardAt(performance.now());
  };

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    const q = pickEarQuestion(settings, currentStats, question);
    setQuestion(q);
    setPicked(null);
    setHeardAt(performance.now());
    play(q);
  };

  const onPick = (semitones: number) => {
    if (answered || heardAt === null) return;
    const isCorrect = semitones === question.semitones;
    const ms = performance.now() - heardAt;
    const newStats = recordResult(stats, itemId(question), isCorrect, isCorrect ? ms : undefined);
    setStats(newStats);
    setPicked(semitones);
    setSession((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
    if (isCorrect) timeout.schedule(() => next(newStats), 1100);
  };

  /** Plays what your (wrong) answer would have sounded like, from the same root. */
  const hearYourAnswer = () => {
    if (picked === null) return;
    playInterval(
      question.rootMidi,
      secondMidi({ ...question, semitones: picked }),
      question.direction,
    );
  };

  // Keyboard: space replays; enter goes to the next interval after a miss.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('dialog, input, select')) return;
    if (e.key === ' ') {
      e.preventDefault();
      replay();
    } else if (e.key === 'Enter' && answered && !correct) {
      e.preventDefault();
      next(stats);
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const states = answerStates(question.semitones, picked);

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.correct}</strong>/{session.answered} correct
        </span>
      </div>

      <section
        className={`card prompt-card ear-card${answered ? (correct ? ' prompt-correct' : ' prompt-wrong') : ''}`}
      >
        <div className="prompt-kicker">Listen</div>
        <button
          type="button"
          className="play-button"
          onClick={replay}
          aria-label={heardAt === null ? 'Play the interval' : 'Play it again'}
        >
          {heardAt === null ? (
            <PlayIcon width={40} height={40} />
          ) : (
            <ReplayIcon width={36} height={36} />
          )}
        </button>
        <div className="prompt-sub">
          {heardAt === null ? 'Tap to hear the first interval' : HOW_PLAYED[question.direction]}
        </div>
      </section>

      <IntervalPicker
        intervals={settings.intervals}
        states={states}
        onPick={onPick}
        disabled={heardAt === null || answered}
      />

      <div className="feedback" aria-live="polite">
        {!answered ? null : correct ? (
          <p className="feedback-good">
            ✓ {info.name} {question.direction} · {names.root} → {names.second}
          </p>
        ) : (
          <>
            <p className="feedback-bad">
              That was {intervalPhrase(question.semitones)} ({names.root} → {names.second}), not{' '}
              {intervalPhrase(picked)}.
            </p>
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={replay}>
                <ReplayIcon width={18} height={18} /> Hear it again
              </button>
              <button type="button" className="btn btn-secondary" onClick={hearYourAnswer}>
                Hear {intervalInfo(picked).short}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => next(stats)}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
      <p className="muted center small keyboard-hint">Keyboard: Space to replay · Enter for next</p>

      <StatsStrip
        items={STATS_ITEMS}
        stats={groupStats(stats, semitonesOfId)}
        onReset={() => setStats({})}
      />
    </div>
  );
}
