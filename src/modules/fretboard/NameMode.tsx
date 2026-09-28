import { useMemo, useState } from 'react';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { NoteStatsStrip } from '../../components/NoteStatsStrip';
import { pcAt, positionId, type FretPosition } from '../../lib/guitar';
import { useTimeout } from '../../lib/hooks';
import { pcName } from '../../lib/music';
import { groupStats, pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import { labelSpelling, positionTargets, stringName, type FretboardSettings } from './settings';

interface Question {
  position: FretPosition;
  shownAt: number;
}

/** Stats ids are "string:fret"; group them by the note at that position. */
const pcOfPositionId = (id: string) => {
  const [string, fret] = id.split(':').map(Number);
  return `${pcAt({ string, fret })}`;
};

/** Highlights a spot on the neck; you say which note it is. */
export function NameMode({ settings }: { settings: FretboardSettings }) {
  const items = useMemo(() => positionTargets(settings), [settings]);
  const [stats, setStats] = usePersistentState<StatsMap>('fretboard.stats.name', {});
  const [question, setQuestion] = useState<Question>(() => ({
    position: pickWeighted(items, positionId, stats),
    shownAt: performance.now(),
  }));
  const [picked, setPicked] = useState<number | null>(null);
  const [session, setSession] = useState({ answered: 0, correct: 0, totalMs: 0 });
  const timeout = useTimeout();

  const { position } = question;
  const answer = pcAt(position);
  const spelling = labelSpelling(settings.spelling);

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    setQuestion({
      position: pickWeighted(items, positionId, currentStats, positionId(position)),
      shownAt: performance.now(),
    });
    setPicked(null);
  };

  const onPick = (pc: number) => {
    if (picked !== null) return;
    const correct = pc === answer;
    const ms = performance.now() - question.shownAt;
    const newStats = recordResult(stats, positionId(position), correct, ms);
    setStats(newStats);
    setPicked(pc);
    setSession((s) => ({
      answered: s.answered + 1,
      correct: s.correct + (correct ? 1 : 0),
      totalMs: s.totalMs + (correct ? ms : 0),
    }));
    if (correct) timeout.schedule(() => next(newStats), 800);
  };

  const answered = picked !== null;
  const correct = picked === answer;
  const markers: FretMarker[] = [
    answered
      ? { ...position, tone: correct ? 'correct' : 'wrong', label: pcName(answer, spelling) }
      : { ...position, tone: 'target', label: '?' },
  ];
  const keyStates: Partial<Record<number, KeyState>> = {};
  if (answered) {
    keyStates[answer] = 'correct';
    if (!correct) keyStates[picked] = 'wrong';
  }

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.correct}</strong>/{session.answered} correct
        </span>
        <span>
          Avg{' '}
          <strong>
            {session.correct ? `${(session.totalMs / session.correct / 1000).toFixed(1)}s` : '–'}
          </strong>
        </span>
      </div>

      <Fretboard
        minFret={settings.minFret}
        maxFret={settings.maxFret}
        markers={markers}
        activeStrings={settings.strings}
        highlightString={position.string}
      />

      <div className="feedback" aria-live="polite">
        {!answered ? (
          <p className="muted">
            Which note is at fret {position.fret} on the {stringName(position.string)} string?
          </p>
        ) : correct ? (
          <p className="feedback-good">✓ {pcName(answer, settings.spelling)}</p>
        ) : (
          <>
            <p className="feedback-bad">
              That’s {pcName(answer, settings.spelling)}, not {pcName(picked, settings.spelling)}.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => next(stats)}>
              Next
            </button>
          </>
        )}
      </div>

      <NotePicker states={keyStates} onPick={onPick} spelling={settings.spelling} />

      <NoteStatsStrip
        stats={groupStats(stats, pcOfPositionId)}
        spelling={settings.spelling}
        onReset={() => setStats({})}
      />
    </div>
  );
}
