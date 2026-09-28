import { useMemo, useState } from 'react';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { NoteStatsStrip } from '../../components/NoteStatsStrip';
import { pcAt, samePosition, type FretPosition } from '../../lib/guitar';
import { useTimeout } from '../../lib/hooks';
import { pcName } from '../../lib/music';
import { groupStats, pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import {
  labelSpelling,
  noteTargets,
  pcOfTargetId,
  spellForPrompt,
  stringName,
  targetId,
  targetPositions,
  type FretboardSettings,
  type NoteTarget,
} from './settings';

interface Prompt {
  target: NoteTarget;
  label: string;
  misses: number;
  revealed: boolean;
}

const makePrompt = (target: NoteTarget, settings: FretboardSettings): Prompt => ({
  target,
  label: spellForPrompt(target.pc, settings.spelling),
  misses: 0,
  revealed: false,
});

/** Shows a note; you tap every place it lives on the neck. No guitar needed. */
export function FindMode({ settings }: { settings: FretboardSettings }) {
  const items = useMemo(() => noteTargets(settings), [settings]);
  const [stats, setStats] = usePersistentState<StatsMap>('fretboard.stats.find', {});
  const [prompt, setPrompt] = useState(() =>
    makePrompt(pickWeighted(items, targetId, stats), settings),
  );
  const [found, setFound] = useState<FretPosition[]>([]);
  const [wrongTap, setWrongTap] = useState<FretPosition | null>(null);
  const [done, setDone] = useState(false);
  const [session, setSession] = useState({ answered: 0, perfect: 0 });
  const advanceTimeout = useTimeout();
  const flashTimeout = useTimeout();

  const positions = targetPositions(prompt.target, settings);
  const spelling = labelSpelling(settings.spelling);

  const advance = (currentStats: StatsMap, previousId: string) => {
    advanceTimeout.cancel();
    setPrompt(makePrompt(pickWeighted(items, targetId, currentStats, previousId), settings));
    setFound([]);
    setWrongTap(null);
    setDone(false);
  };

  const finish = (perfect: boolean) => {
    const newStats = recordResult(stats, prompt.target.id, perfect);
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
      advanceTimeout.schedule(() => advance(newStats, prompt.target.id), 1100);
    }
  };

  const markers: FretMarker[] = [];
  for (const p of positions) {
    const isFound = done || found.some((f) => samePosition(f, p));
    if (isFound) markers.push({ ...p, tone: 'correct', label: prompt.label });
    else if (prompt.revealed) markers.push({ ...p, tone: 'hint', label: prompt.label });
  }
  if (wrongTap)
    markers.push({ ...wrongTap, tone: 'wrong', label: pcName(pcAt(wrongTap), spelling) });

  const where =
    prompt.target.string === null
      ? `every one, ${found.length} of ${positions.length} found`
      : `on the ${stringName(prompt.target.string)} string` +
        (positions.length > 1 ? ` (${positions.length} places)` : '');

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          <strong>{session.perfect}</strong>/{session.answered} without mistakes
        </span>
      </div>

      <section className={`card prompt-card prompt-compact${done ? ' prompt-correct' : ''}`}>
        <div className="prompt-kicker">Find</div>
        <div className="prompt-main">{prompt.label}</div>
        <div className="prompt-sub">{where}</div>
      </section>

      <Fretboard
        minFret={settings.minFret}
        maxFret={settings.maxFret}
        markers={markers}
        activeStrings={prompt.target.string === null ? settings.strings : [prompt.target.string]}
        highlightString={prompt.target.string}
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
          onClick={() => advance(finish(false), prompt.target.id)}
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
