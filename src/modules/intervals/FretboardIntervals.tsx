import { useState } from 'react';
import { playInterval } from '../../audio/synth';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { PlayIcon } from '../../components/icons';
import { StatsStrip } from '../../components/StatsStrip';
import { midiAt } from '../../lib/guitar';
import { useTimeout } from '../../lib/hooks';
import {
  INTERVALS,
  intervalInfo,
  intervalPhrase,
  semitonesOfId,
  spellInterval,
} from '../../lib/intervals';
import { groupStats, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import { IntervalPicker, type AnswerState } from './IntervalPicker';
import {
  boardWindow,
  itemId,
  pickBoardQuestion,
  type BoardQuestion,
  type IntervalSettings,
} from './settings';

const STATS_ITEMS = INTERVALS.map((i) => ({ id: `${i.semitones}`, label: i.short }));

/** A root and a second note are marked on the neck; you name the interval. */
export function FretboardIntervals({ settings }: { settings: IntervalSettings }) {
  const [stats, setStats] = usePersistentState<StatsMap>('intervals.stats.board', {});
  const [question, setQuestion] = useState<BoardQuestion & { shownAt: number }>(() => ({
    ...pickBoardQuestion(settings, stats),
    shownAt: performance.now(),
  }));
  const [picked, setPicked] = useState<number | null>(null);
  const [session, setSession] = useState({ answered: 0, correct: 0 });
  const timeout = useTimeout();

  const rootMidi = midiAt(question.root);
  const names = spellInterval(rootMidi, question.semitones, question.direction);
  const info = intervalInfo(question.semitones);
  const answered = picked !== null;
  const correct = picked === question.semitones;

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    setQuestion({
      ...pickBoardQuestion(settings, currentStats, question),
      shownAt: performance.now(),
    });
    setPicked(null);
  };

  const onPick = (semitones: number) => {
    if (answered) return;
    const isCorrect = semitones === question.semitones;
    const ms = performance.now() - question.shownAt;
    const newStats = recordResult(stats, itemId(question), isCorrect, isCorrect ? ms : undefined);
    setStats(newStats);
    setPicked(semitones);
    setSession((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
    if (isCorrect) timeout.schedule(() => next(newStats), 900);
  };

  const hear = () => playInterval(rootMidi, midiAt(question.second), question.direction);

  const showNames = answered || settings.showNoteNames;
  const markers: FretMarker[] = [
    { ...question.root, tone: 'root', label: showNames ? names.root : 'R' },
    {
      ...question.second,
      tone: answered ? (correct ? 'correct' : 'wrong') : 'target',
      label: showNames ? names.second : '?',
    },
  ];
  const [minFret, maxFret] = boardWindow(question, settings);

  const states: Partial<Record<number, AnswerState>> = {};
  if (answered) {
    states[question.semitones] = 'correct';
    if (!correct) states[picked] = 'wrong';
  }
  const direction = question.direction === 'down' ? 'down' : 'up';

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.correct}</strong>/{session.answered} correct
        </span>
      </div>

      <section
        className={`card prompt-card prompt-compact${answered ? (correct ? ' prompt-correct' : ' prompt-wrong') : ''}`}
      >
        <div className="prompt-kicker">Name the interval</div>
        <div className="prompt-main">{direction === 'up' ? '↑ Up' : '↓ Down'}</div>
        <div className="prompt-sub">from the root (R) to the other note</div>
      </section>

      <Fretboard
        minFret={minFret}
        maxFret={maxFret}
        markers={markers}
        activeStrings={settings.strings}
        label="Interval on the fretboard"
      />

      <IntervalPicker
        intervals={settings.intervals}
        states={states}
        onPick={onPick}
        disabled={answered}
      />

      <div className="feedback" aria-live="polite">
        {!answered ? null : correct ? (
          <p className="feedback-good">
            ✓ {info.name} {direction} · {names.root} → {names.second}
          </p>
        ) : (
          <>
            <p className="feedback-bad">
              That’s {intervalPhrase(question.semitones)} {direction} ({names.root} → {names.second}
              ), not {intervalPhrase(picked)}.
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

      <StatsStrip
        items={STATS_ITEMS}
        stats={groupStats(stats, semitonesOfId)}
        onReset={() => setStats({})}
      />
    </div>
  );
}
