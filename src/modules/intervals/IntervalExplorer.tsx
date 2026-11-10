import { Chip } from '../../components/controls';
import { Fretboard, type FretMarker, type MarkerTone } from '../../components/Fretboard';
import {
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

/** The root always sits at fret 7, centered with five frets of room on either side. */
const ROOT_FRET = 7;
const REACH = 5;
const MIN_FRET = ROOT_FRET - REACH;
const MAX_SHOWN_FRET = ROOT_FRET + REACH;

const DEFAULT_STATE: ExplorerState = {
  root: { string: 0, fret: ROOT_FRET },
  intervals: [7, 12],
};

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
  const { intervals } = state;
  // Only the string is chosen; the fret stays put so the view never jumps.
  const root: FretPosition = { string: state.root.string, fret: ROOT_FRET };
  const rootPc = pcAt(root);

  const markers: FretMarker[] = [{ ...root, tone: 'root', label: 'R' }];
  for (const semitones of intervals) {
    const { short } = intervalInfo(semitones);
    const pc = (rootPc + semitones) % 12;
    for (const pos of positionsOfPc(pc, ALL_STRINGS, MIN_FRET, MAX_SHOWN_FRET)) {
      if (samePosition(pos, root)) continue;
      markers.push({ ...pos, tone: INTERVAL_TONES[semitones], label: short });
    }
  }

  const setRootString = (string: number) =>
    setState({ ...state, root: { string, fret: ROOT_FRET } });
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
        minFret={MIN_FRET}
        maxFret={MAX_SHOWN_FRET}
        markers={markers}
        highlightString={root.string}
        onTap={(pos) => setRootString(pos.string)}
        label="Intervals around the root"
      />

      <p className="muted small center">
        Root (R): {pcName(rootPc, 'sharp')}, {STANDARD_TUNING[root.string].name} string, fret{' '}
        {ROOT_FRET}. Tap a string on the neck to move the root there.
      </p>
    </div>
  );
}
