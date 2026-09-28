import { FLAT_NAMES, SHARP_NAMES, type Spelling } from '../lib/music';

export type KeyState = 'selected' | 'correct' | 'wrong' | 'missed' | 'root' | 'third' | 'fifth';

interface Props {
  states?: Partial<Record<number, KeyState>>;
  onPick?: (pc: number) => void;
  disabled?: boolean;
  spelling?: Spelling;
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
// Grid column (of 14 half-columns) where each black key starts, centered between white keys.
const BLACK_KEYS: [pc: number, column: number][] = [
  [1, 2],
  [3, 4],
  [6, 8],
  [8, 10],
  [10, 12],
];

/** The 12 pitch classes laid out like one octave of a piano keyboard. */
export function NotePicker({ states = {}, onPick, disabled, spelling = 'both' }: Props) {
  const key = (pc: number, column: number, black: boolean) => {
    const state = states[pc];
    const className = ['key', black ? 'key-black' : 'key-white', state && `key-${state}`]
      .filter(Boolean)
      .join(' ');
    const style = { gridColumn: `${column} / span 2` };
    const label =
      black && spelling === 'both' ? (
        <span className="key-label key-label-stack">
          <span>{SHARP_NAMES[pc]}</span>
          <span>{FLAT_NAMES[pc]}</span>
        </span>
      ) : (
        <span className="key-label">{spelling === 'flat' ? FLAT_NAMES[pc] : SHARP_NAMES[pc]}</span>
      );

    if (!onPick) {
      return (
        <div key={pc} className={className} style={style}>
          {label}
        </div>
      );
    }
    return (
      <button
        key={pc}
        type="button"
        className={className}
        style={style}
        disabled={disabled}
        aria-pressed={state === 'selected'}
        onClick={() => onPick(pc)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="note-picker" role="group" aria-label="Notes">
      <div className="note-row note-row-black">
        {BLACK_KEYS.map(([pc, column]) => key(pc, column, true))}
      </div>
      <div className="note-row note-row-white">
        {WHITE_KEYS.map((pc, i) => key(pc, i * 2 + 1, false))}
      </div>
    </div>
  );
}
