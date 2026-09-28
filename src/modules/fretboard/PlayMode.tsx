import { useEffect, useState } from 'react';
import { useMicFrames, useMicPitch, type MicControls } from '../../audio/useMicPitch';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { MicIcon } from '../../components/icons';
import { NoteStatsStrip } from '../../components/NoteStatsStrip';
import { PitchMeter } from '../../components/PitchMeter';
import { useTimeout } from '../../lib/hooks';
import { midiOctave, mod12, pcName } from '../../lib/music';
import { MIC_SENSITIVITY, StableNoteTracker, type Pitch } from '../../lib/pitch';
import { groupStats, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import {
  labelSpelling,
  pcOfTargetId,
  pickTarget,
  questionKey,
  spellForPrompt,
  targetPositions,
  targetStatsId,
  type FretboardSettings,
  type NoteTarget,
} from './settings';
import { StringPill } from './StringPill';

interface Prompt {
  target: NoteTarget;
  preferFlat: boolean;
  shownAt: number;
  misses: number;
  revealed: boolean;
}

interface Heard {
  midi: number;
  correct: boolean;
}

function makePrompt(target: NoteTarget, now: number): Prompt {
  return { target, preferFlat: Math.random() < 0.5, shownAt: now, misses: 0, revealed: false };
}

/** Held briefly so the display doesn't flicker between frames. */
const PITCH_HOLD_MS = 400;

/** Pause after a correct note: enough to see the green flash, or glance at the positions. */
const NEXT_NOTE_DELAY_MS = 400;
const NEXT_NOTE_DELAY_WITH_POSITIONS_MS = 800;

/** Shows a note; you play it on the guitar and the microphone checks it. */
export function PlayMode({ settings }: { settings: FretboardSettings }) {
  // The mic lives here so it stays on when a settings change restarts the questions.
  const mic = useMicPitch();
  const { detector } = mic;
  useEffect(() => {
    detector?.setThresholds(MIC_SENSITIVITY[settings.micSensitivity]);
  }, [detector, settings.micSensitivity]);
  return <PlayQuestions key={questionKey(settings)} settings={settings} mic={mic} />;
}

function PlayQuestions({ settings, mic }: { settings: FretboardSettings; mic: MicControls }) {
  const [stats, setStats] = usePersistentState<StatsMap>('fretboard.stats.play', {});
  const [prompt, setPrompt] = useState(() =>
    makePrompt(pickTarget(settings, stats), performance.now()),
  );
  const [solved, setSolved] = useState(false);
  const [heard, setHeard] = useState<Heard | null>(null);
  const [display, setDisplay] = useState<{ pitch: Pitch | null; level: number; at: number }>({
    pitch: null,
    level: 0,
    at: 0,
  });
  const [tracker] = useState(() => new StableNoteTracker());
  const [session, setSession] = useState({ answered: 0, firstTry: 0, totalMs: 0 });
  const timeout = useTimeout();

  const advance = (currentStats: StatsMap, previous: NoteTarget) => {
    timeout.cancel();
    // The last note may still be ringing; don't judge it against the new question.
    tracker.ignoreRingingNote();
    setPrompt(makePrompt(pickTarget(settings, currentStats, previous), performance.now()));
    setSolved(false);
    setHeard(null);
  };

  const onNote = (midi: number, now: number) => {
    if (solved) return;
    // Only the pitch class is checked: the mic can't tell which string a note was played
    // on (that part is on the honor system), and phone mics often mistake low notes for
    // the octave above.
    if (mod12(midi) !== prompt.target.pc) {
      setHeard({ midi, correct: false });
      setPrompt({ ...prompt, misses: prompt.misses + 1 });
      return;
    }
    const firstTry = prompt.misses === 0 && !prompt.revealed;
    const ms = now - prompt.shownAt;
    const statsId = targetStatsId(prompt.target, settings.scope);
    const newStats = recordResult(stats, statsId, firstTry, firstTry ? ms : undefined);
    setStats(newStats);
    setSolved(true);
    setHeard({ midi, correct: true });
    setSession((s) => ({
      answered: s.answered + 1,
      firstTry: s.firstTry + (firstTry ? 1 : 0),
      totalMs: s.totalMs + (firstTry ? ms : 0),
    }));
    timeout.schedule(
      () => advance(newStats, prompt.target),
      settings.showAnswer ? NEXT_NOTE_DELAY_WITH_POSITIONS_MS : NEXT_NOTE_DELAY_MS,
    );
  };

  useMicFrames(mic.detector, (frame) => {
    const now = performance.now();
    setDisplay((d) =>
      frame.pitch
        ? { pitch: frame.pitch, level: frame.rms, at: now }
        : { pitch: now - d.at < PITCH_HOLD_MS ? d.pitch : null, level: frame.rms, at: d.at },
    );
    const midi = tracker.feed(frame.pitch, now);
    if (midi !== null) onNote(midi, now);
  });

  const startListening = async () => {
    await mic.start();
    // Start timing from when we can actually hear you.
    setPrompt((p) => ({ ...p, shownAt: performance.now() }));
  };

  const skip = () => {
    const newStats = recordResult(stats, targetStatsId(prompt.target, settings.scope), false);
    setStats(newStats);
    setSession((s) => ({ ...s, answered: s.answered + 1 }));
    advance(newStats, prompt.target);
  };

  const spelling = labelSpelling(settings.spelling);
  const label = spellForPrompt(prompt.target.pc, settings.spelling, prompt.preferFlat);
  const onString = settings.scope === 'string';
  const positions = targetPositions(prompt.target, settings);
  const showPositions = (solved && settings.showAnswer) || prompt.revealed;
  const markers: FretMarker[] = showPositions
    ? positions.map((p) => ({ ...p, tone: solved ? 'correct' : 'hint', label }))
    : [];
  const listening = mic.status === 'listening';
  const heardName = heard ? pcName(heard.midi, spelling) + midiOctave(heard.midi) : '';

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.firstTry}</strong>/{session.answered} first try
        </span>
        <span>
          Avg{' '}
          <strong>
            {session.firstTry ? `${(session.totalMs / session.firstTry / 1000).toFixed(1)}s` : '–'}
          </strong>
        </span>
      </div>

      <section className={`card prompt-card${solved ? ' prompt-correct' : ''}`}>
        <div className="prompt-kicker">Play</div>
        <div className="prompt-main">{label}</div>
        {onString ? (
          <StringPill string={prompt.target.string} />
        ) : (
          <div className="prompt-sub">on any string</div>
        )}
      </section>

      {listening ? (
        <>
          <PitchMeter
            pitch={display.pitch}
            level={display.level}
            threshold={MIC_SENSITIVITY[settings.micSensitivity].minRms}
            spelling={settings.spelling}
          />
          <div className="feedback" aria-live="polite">
            {heard === null ? (
              <p className="muted">Listening… pluck the note.</p>
            ) : heard.correct ? (
              <p className="feedback-good">✓ {heardName}. Nice!</p>
            ) : (
              <p className="feedback-bad">Heard {heardName}. Try again.</p>
            )}
          </div>
          <div className="button-row">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={solved || prompt.revealed}
              onClick={() => setPrompt({ ...prompt, revealed: true })}
            >
              Show me
            </button>
            <button type="button" className="btn btn-secondary" disabled={solved} onClick={skip}>
              Skip
            </button>
            <button type="button" className="btn btn-ghost" onClick={mic.stop}>
              Stop mic
            </button>
          </div>
        </>
      ) : (
        <div className="mic-start">
          <button
            type="button"
            className="btn btn-primary btn-large"
            disabled={mic.status === 'starting'}
            onClick={startListening}
          >
            <MicIcon /> {mic.status === 'starting' ? 'Starting…' : 'Start listening'}
          </button>
          {mic.error ? <p className="feedback-bad small">{mic.error}</p> : null}
          <p className="muted small center">
            Allow microphone access, then play each note on your guitar. Works best in a quiet room.
            The mic checks the note name; it can’t tell which string you used, so that part is up to
            you.
          </p>
        </div>
      )}

      <Fretboard
        minFret={settings.minFret}
        maxFret={settings.maxFret}
        markers={markers}
        activeStrings={settings.strings}
        highlightString={onString ? prompt.target.string : null}
      />

      <NoteStatsStrip
        stats={groupStats(stats, pcOfTargetId)}
        spelling={settings.spelling}
        onReset={() => setStats({})}
      />
    </div>
  );
}
