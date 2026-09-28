import { useState } from 'react';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { NoteStatsStrip } from '../../components/NoteStatsStrip';
import { pcAt, samePosition, type FretPosition } from '../../lib/guitar';
import { useTimeout } from '../../lib/hooks';
import { pcName } from '../../lib/music';
import { groupStats, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import {
  labelSpelling,
  pcOfTargetId,
  pickTarget,
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
  misses: number;
  revealed: boolean;
}

const makePrompt = (target: NoteTarget): Prompt => ({
  target,
  preferFlat: Math.random() < 0.5,
  misses: 0,
  revealed: false,
});

/** Shows a note; you tap every place it lives on the neck. No guitar needed. */
export function FindMode({ settings }: { settings: FretboardSettings }) {
  const [stats, setStats] = usePersistentState<StatsMap>('fretboard.stats.find', {});
  const [prompt, setPrompt] = useState(() => makePrompt(pickTarget(settings, stats)));
  const [found, setFound] = useState<FretPosition[]>([]);
  const [wrongTap, setWrongTap] = useState<FretPosition | null>(null);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState({ answered: 0, perfect: 0 });
  const advanceTimeout = useTimeout();
  const flashTimeout = useTimeout();

  const onString = settings.scope === 'string';
  const positions = targetPositions(prompt.target, settings);
  const spelling = labelSpelling(settings.spelling);
  const label = spellForPrompt(prompt.target.pc, settings.spelling, prompt.preferFlat);

  const advance = (currentStats: StatsMap, previous: NoteTarget) => {
    advanceTimeout.cancel();
    setPrompt(makePrompt(pickTarget(settings, currentStats, previous)));
    setFound([]);
    setWrongTap(null);
    setDone(false);
  };

  const finish = (perfect: boolean) => {
    const newStats = recordResult(stats, targetStatsId(prompt.target, settings.scope), perfect);
    setStats(newStats);
    setDone(true);
    setSession((s) => ({ answered: s.answered + 1, perfect: s.perfect + (perfect ? 1 : 0) }));
    return newStats;
  };

  const onTap = (pos: FretPosition) => {
    if (done) return;
    if (!positions.some((p) => samePosition(p, pos))) {
      setWrongTap(pos);
      setPrompt({ ...prompt, misses: prompt.misses + 1 });
      flashTimeout.schedule(() => setWrongTap(null), 900);
      return;
    }
    if (found.some((p) => samePosition(p, pos))) return;
    const nowFound = [...found, pos];
    setFound(nowFound);
    if (nowFound.length === positions.length) {
      const newStats = finish(prompt.misses === 0 && !prompt.revealed);
      advanceTimeout.schedule(() => advance(newStats, prompt.target), 1100);
    }
  };

  const markers: FretMarker[] = [];
  for (const p of positions) {
    const isFound = done || found.some((f) => samePosition(f, p));
    if (isFound) markers.push({ ...p, tone: 'correct', label });
    else if (prompt.revealed) markers.push({ ...p, tone: 'hint', label });
  }
  if (wrongTap)
    markers.push({ ...wrongTap, tone: 'wrong', label: pcName(pcAt(wrongTap), spelling) });

  const count =
    positions.length > 1 ? `${found.length} of ${positions.length} found` : 'tap where it is';

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.perfect}</strong>/{session.answered} without mistakes
        </span>
      </div>

      <section className={`card prompt-card prompt-compact${done ? ' prompt-correct' : ''}`}>
        <div className="prompt-kicker">Find</div>
        <div className="prompt-main">{label}</div>
        {onString ? <StringPill string={prompt.target.string} /> : null}
        <div className="prompt-sub">{onString ? count : `every one, ${count}`}</div>
      </section>

      <Fretboard
        minFret={settings.minFret}
        maxFret={settings.maxFret}
        markers={markers}
        activeStrings={onString ? [prompt.target.string] : settings.strings}
        highlightString={onString ? prompt.target.string : null}
        onTap={onTap}
      />

      <div className="button-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={done || prompt.revealed}
          onClick={() => setPrompt({ ...prompt, revealed: true })}
        >
          Show me
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={done}
          onClick={() => advance(finish(false), prompt.target)}
        >
          Skip
        </button>
      </div>

      <NoteStatsStrip
        stats={groupStats(stats, pcOfTargetId)}
        spelling={settings.spelling}
        onReset={() => setStats({})}
        showTimes={false}
      />
    </div>
  );
}
