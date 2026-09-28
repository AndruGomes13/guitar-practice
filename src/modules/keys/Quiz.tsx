import { useState } from 'react';
import { playChords } from '../../audio/synth';
import { ChoiceGrid } from '../../components/ChoiceGrid';
import { answerStates } from '../../components/choices';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { StatsStrip } from '../../components/StatsStrip';
import { useTimeout } from '../../lib/hooks';
import { keyById, keyName } from '../../lib/keys';
import { noteName, pcName, pitchClassOf, triadMidis, triadSymbol } from '../../lib/music';
import { groupStats, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import {
  chordsOf,
  DEGREE_CHIP_LABELS,
  degreeOfQuizId,
  pickQuizQuestion,
  quizId,
  type KeySettings,
  type QuizQuestion,
} from './settings';

const STATS_ITEMS = DEGREE_CHIP_LABELS.map((label, degree) => ({ id: `${degree}`, label }));

/** "What's the IV in G?" or "What's Em in G?", mixed. */
export function Quiz({ settings }: { settings: KeySettings }) {
  const [stats, setStats] = usePersistentState<StatsMap>('keys.stats.quiz', {});
  const [question, setQuestion] = useState<QuizQuestion & { shownAt: number }>(() => ({
    ...pickQuizQuestion(settings, stats),
    shownAt: performance.now(),
  }));
  /** A pitch class (when naming the chord) or a degree (when naming the numeral). */
  const [picked, setPicked] = useState<number | null>(null);
  const [session, setSession] = useState({ answered: 0, correct: 0 });
  const timeout = useTimeout();

  const key = keyById(question.keyId);
  const chords = chordsOf(key, settings);
  const chord = chords[question.degree];
  const symbol = triadSymbol(chord.triad);
  const rootPc = pitchClassOf(chord.triad.root);
  const expected = question.ask === 'chord' ? rootPc : question.degree;
  const answered = picked !== null;
  const correct = picked === expected;

  const next = (currentStats: StatsMap) => {
    timeout.cancel();
    setQuestion({
      ...pickQuizQuestion(settings, currentStats, question),
      shownAt: performance.now(),
    });
    setPicked(null);
  };

  const onPick = (value: number) => {
    if (answered) return;
    const isCorrect = value === expected;
    const ms = performance.now() - question.shownAt;
    const newStats = recordResult(stats, quizId(question), isCorrect, isCorrect ? ms : undefined);
    setStats(newStats);
    setPicked(value);
    setSession((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
    if (isCorrect) timeout.schedule(() => next(newStats), 900);
  };

  const keyStates: Partial<Record<number, KeyState>> = {};
  if (answered && question.ask === 'chord') {
    keyStates[rootPc] = 'correct';
    if (!correct) keyStates[picked] = 'wrong';
  }
  const numeralChoices = settings.degrees.map((d) => ({ value: d, label: chords[d].numeral }));
  const notes = chord.triad.tones.map(noteName).join(' ');
  const wrongAnswer =
    picked === null
      ? ''
      : question.ask === 'chord'
        ? pcName(picked, 'both')
        : chords[picked]?.numeral;

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.correct}</strong>/{session.answered} correct
        </span>
      </div>

      <section
        className={`card prompt-card${answered ? (correct ? ' prompt-correct' : ' prompt-wrong') : ''}`}
      >
        <div className="prompt-kicker">In {keyName(key)}</div>
        <div className="prompt-main">{question.ask === 'chord' ? chord.numeral : symbol}</div>
        <div className="prompt-sub">
          {question.ask === 'chord'
            ? 'Which chord is this? Tap its root.'
            : 'Which degree is this chord?'}
        </div>
      </section>

      {question.ask === 'chord' ? (
        <NotePicker states={keyStates} onPick={onPick} disabled={answered} />
      ) : (
        <ChoiceGrid
          label="Degrees"
          choices={numeralChoices}
          states={answerStates(question.degree, picked)}
          onPick={onPick}
          disabled={answered}
        />
      )}

      <div className="feedback" aria-live="polite">
        {!answered ? null : correct ? (
          <p className="feedback-good">
            ✓ {chord.numeral} in {keyName(key)} is {symbol} ({notes})
          </p>
        ) : (
          <>
            <p className="feedback-bad">
              {chord.numeral} in {keyName(key)} is {symbol} ({notes}), not {wrongAnswer}.
            </p>
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => playChords([triadMidis(chord.triad)])}
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

      <StatsStrip
        items={STATS_ITEMS}
        stats={groupStats(stats, degreeOfQuizId)}
        onReset={() => setStats({})}
      />
    </div>
  );
}
