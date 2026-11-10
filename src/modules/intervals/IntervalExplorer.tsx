import { Chip } from '../../components/controls';
import { Fretboard, type FretMarker, type MarkerTone } from '../../components/Fretboard';
import {
  MAX_FRET,
  pcAt,
  positionsOfPc,
  samePosition,
  STANDARD_TUNING,
  STRING_COUNT,
  type FretPosition,
} from '../../lib/guitar';
import { INTERVALS, intervalInfo } from '../../lib/intervals';
import { pcName } from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';

interface ExplorerState {
  root: FretPosition;
  intervals: number[];
}

/** Root at fret 7 leaves five frets of room on either side. */
const DEFAULT_ROOT_FRET = 7;
const DEFAULT_STATE: ExplorerState = {
  root: { string: 0, fret: DEFAULT_ROOT_FRET },
  intervals: [7, 12],
};

/** Frets shown either side of the root. */
const REACH = 5;

const ALL_STRINGS = Array.from({ length: STRING_COUNT }, (_, i) => i);

/** One color per interval family, so e.g. both thirds share a color. */
const INTERVAL_TONES: Record<number, MarkerTone> = {
  1: 'second',
  2: 'second',
  3: 'third',
  4: 'third',
  5: 'fourth',
  6: 'tritone',
  7: 'fifth',
  8: 'sixth',
  9: 'sixth',
  10: 'seventh',
  11: 'seventh',
  12: 'root',
};

/** Pick a root and intervals; every place those intervals sit around the root is shown. */
export function IntervalExplorer() {
  const [state, setState] = usePersistentState<ExplorerState>('intervals.explore', DEFAULT_STATE);
  const { root, intervals } = state;

  const minFret = Math.max(0, Math.min(root.fret - REACH, MAX_FRET - 2 * REACH));
  const maxFret = Math.min(MAX_FRET, minFret + 2 * REACH);
  const rootPc = pcAt(root);

  const markers: FretMarker[] = [{ ...root, tone: 'root', label: 'R' }];
  for (const semitones of intervals) {
    const { short } = intervalInfo(semitones);
    for (const pos of positionsOfPc((rootPc + semitones) % 12, ALL_STRINGS, minFret, maxFret)) {
      if (samePosition(pos, root)) continue;
      markers.push({ ...pos, tone: INTERVAL_TONES[semitones], label: short });
    }
  }

  const setRootString = (string: number) =>
    setState({ ...state, root: { string, fret: root.fret } });
  const toggleInterval = (semitones: number, on: boolean) =>
    setState({
      ...state,
      intervals: INTERVALS.map((i) => i.semitones).filter((s) =>
        s === semitones ? on : intervals.includes(s),
      ),
    });

  return (
    <div className="stack">
      <section className="card explorer-options">
        <div>
          <div className="field-label">Root string</div>
          <div className="string-chips">
            {STANDARD_TUNING.map((s, i) => (
              <Chip key={i} checked={root.string === i} onChange={() => setRootString(i)}>
                <span aria-label={`${s.name} string (${s.ordinal})`}>
                  {s.label}
                  <span className="chip-sub">{STRING_COUNT - i}</span>
                </span>
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="field-label">Intervals</div>
          <div className="chip-row">
            {INTERVALS.map(({ semitones, short, name }) => (
              <Chip
                key={semitones}
                checked={intervals.includes(semitones)}
                onChange={(on) => toggleInterval(semitones, on)}
              >
                <span title={name}>{short}</span>
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <Fretboard
        minFret={minFret}
        maxFret={maxFret}
        markers={markers}
        highlightString={root.string}
        onTap={(pos) => setState({ ...state, root: pos })}
        label="Intervals around the root"
      />

      <p className="muted small center">
        Root (R): {pcName(rootPc, 'sharp')}, {STANDARD_TUNING[root.string].name} string, fret{' '}
        {root.fret}. Tap anywhere on the neck to move the root.
      </p>
    </div>
  );
}
