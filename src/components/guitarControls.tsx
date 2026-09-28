import { MAX_FRET, STANDARD_TUNING, STRING_COUNT } from '../lib/guitar';
import { Chip } from './controls';

interface StringChipsProps {
  value: readonly number[];
  onChange: (strings: number[]) => void;
}

/** One chip per string, labeled by name and number ("E 6" … "e 1"). At least one stays on. */
export function StringChips({ value, onChange }: StringChipsProps) {
  return (
    <div className="string-chips" role="group" aria-label="Strings">
      {STANDARD_TUNING.map((s, i) => {
        const checked = value.includes(i);
        return (
          <Chip
            key={i}
            checked={checked}
            disabled={checked && value.length === 1}
            onChange={(on) =>
              onChange(
                STANDARD_TUNING.map((_, j) => j).filter((j) => (j === i ? on : value.includes(j))),
              )
            }
          >
            <span aria-label={`${s.name} string (${s.ordinal})`}>
              {s.label}
              <span className="chip-sub">{STRING_COUNT - i}</span>
            </span>
          </Chip>
        );
      })}
    </div>
  );
}

interface FretRangeProps {
  minFret: number;
  maxFret: number;
  onChange: (minFret: number, maxFret: number) => void;
}

const fretOptions = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** "From" and "To" fret selects. */
export function FretRange({ minFret, maxFret, onChange }: FretRangeProps) {
  return (
    <div className="fret-range">
      <label>
        From
        <select value={minFret} onChange={(e) => onChange(Number(e.target.value), maxFret)}>
          {fretOptions(0, maxFret).map((f) => (
            <option key={f} value={f}>
              {f === 0 ? 'Open' : f}
            </option>
          ))}
        </select>
      </label>
      <label>
        To
        <select value={maxFret} onChange={(e) => onChange(minFret, Number(e.target.value))}>
          {fretOptions(Math.max(1, minFret), MAX_FRET).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
