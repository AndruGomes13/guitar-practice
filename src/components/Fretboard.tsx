import { STANDARD_TUNING, STRING_COUNT, type FretPosition } from '../lib/guitar';
import { useMediaQuery } from '../lib/hooks';

export type MarkerTone =
  'root' | 'third' | 'fifth' | 'correct' | 'wrong' | 'target' | 'hint' | 'neutral';

export interface FretMarker extends FretPosition {
  tone: MarkerTone;
  label?: string;
}

interface Props {
  minFret: number;
  maxFret: number;
  markers?: readonly FretMarker[];
  onTap?: (position: FretPosition) => void;
  /** Strings that are part of the exercise; others are drawn faded and aren't tappable. */
  activeStrings?: readonly number[];
  highlightString?: number | null;
  /** "auto" draws the neck vertically on portrait phones, horizontally otherwise. */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  label?: string;
}

const SINGLE_INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAYS = new Set([12, 24]);
const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

/**
 * An SVG guitar neck. Coordinates are computed along the neck ("along", from
 * the headstock) and across it, then mapped to x/y depending on orientation.
 */
export function Fretboard({
  minFret,
  maxFret,
  markers = [],
  onTap,
  activeStrings = ALL_STRINGS,
  highlightString = null,
  orientation = 'auto',
  label = 'Fretboard',
}: Props) {
  const portraitPhone = useMediaQuery('(max-width: 640px) and (orientation: portrait)');
  const vertical = orientation === 'vertical' || (orientation === 'auto' && portraitPhone);

  const cellLength = vertical ? 44 : 56;
  const stringGap = vertical ? 50 : 32;
  const woodPad = stringGap * 0.5;
  const headGutter = 26; // string names
  const numberGutter = 24; // fret numbers
  const cells = maxFret - minFret + 1;
  const neckLength = cells * cellLength;
  const neckWidth = stringGap * (STRING_COUNT - 1);
  const hasNut = minFret === 0;

  // Horizontal: high e on top (like tab). Vertical: low E on the left (like a chord chart).
  const across = (string: number) => (vertical ? string : STRING_COUNT - 1 - string) * stringGap;
  const fretCenter = (fret: number) => (fret - minFret + 0.5) * cellLength;

  const width = vertical ? numberGutter + woodPad * 2 + neckWidth + 4 : headGutter + neckLength + 6;
  const height = vertical ? headGutter + neckLength + 6 : woodPad * 2 + neckWidth + numberGutter;

  /** Maps (along, across) neck coordinates to SVG x/y. */
  const pt = (along: number, acr: number) =>
    vertical
      ? { x: numberGutter + woodPad + acr, y: headGutter + along }
      : { x: headGutter + along, y: woodPad + acr };

  const rect = (a0: number, c0: number, a1: number, c1: number) => {
    const p0 = pt(a0, c0);
    const p1 = pt(a1, c1);
    return {
      x: Math.min(p0.x, p1.x),
      y: Math.min(p0.y, p1.y),
      width: Math.abs(p1.x - p0.x),
      height: Math.abs(p1.y - p0.y),
    };
  };

  const line = (a0: number, c0: number, a1: number, c1: number) => {
    const p0 = pt(a0, c0);
    const p1 = pt(a1, c1);
    return { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y };
  };

  const frets: number[] = [];
  for (let f = minFret; f <= maxFret; f++) frets.push(f);

  const markerRadius = vertical ? 16 : 13;

  return (
    <div className={`fretboard${vertical ? ' fretboard-vertical' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {/* Wood (the open-string area in front of the nut has none) */}
        <rect
          className="fb-wood"
          rx={3}
          {...rect(hasNut ? cellLength : 0, -woodPad, neckLength, neckWidth + woodPad)}
        />

        {/* Inlays */}
        {frets.map((f) => {
          if (SINGLE_INLAYS.has(f)) {
            const p = pt(fretCenter(f), neckWidth / 2);
            return <circle key={f} className="fb-inlay" cx={p.x} cy={p.y} r={5} />;
          }
          if (DOUBLE_INLAYS.has(f)) {
            const p1 = pt(fretCenter(f), stringGap * 1.5);
            const p2 = pt(fretCenter(f), stringGap * 3.5);
            return (
              <g key={f}>
                <circle className="fb-inlay" cx={p1.x} cy={p1.y} r={5} />
                <circle className="fb-inlay" cx={p2.x} cy={p2.y} r={5} />
              </g>
            );
          }
          return null;
        })}

        {/* Fret wires; the wire at the far end of the fret-0 cell is the nut */}
        {!hasNut && <line className="fb-fret" {...line(0, -woodPad, 0, neckWidth + woodPad)} />}
        {frets.map((f) => {
          const a = (f - minFret + 1) * cellLength;
          return (
            <line
              key={f}
              className={f === 0 ? 'fb-nut' : 'fb-fret'}
              {...line(a, -woodPad, a, neckWidth + woodPad)}
            />
          );
        })}

        {/* Strings */}
        {STANDARD_TUNING.map((_, i) => {
          const classes = ['fb-string'];
          if (!activeStrings.includes(i)) classes.push('fb-string-inactive');
          if (highlightString === i) classes.push('fb-string-highlight');
          return (
            <line
              key={i}
              className={classes.join(' ')}
              strokeWidth={1 + (STRING_COUNT - 1 - i) * 0.35}
              {...line(0, across(i), neckLength, across(i))}
            />
          );
        })}

        {/* String names */}
        {STANDARD_TUNING.map((s, i) => {
          const p = pt(-headGutter / 2, across(i));
          return (
            <text
              key={i}
              className={`fb-string-label${highlightString === i ? ' fb-string-label-highlight' : ''}`}
              x={p.x}
              y={p.y}
            >
              {s.label}
            </text>
          );
        })}

        {/* Fret numbers */}
        {frets.map((f) => {
          if (f === 0) return null;
          const p = pt(
            fretCenter(f),
            vertical ? -woodPad - numberGutter / 2 : neckWidth + woodPad + numberGutter / 2,
          );
          const major = SINGLE_INLAYS.has(f) || DOUBLE_INLAYS.has(f);
          return (
            <text key={f} className={`fb-fret-number${major ? ' major' : ''}`} x={p.x} y={p.y}>
              {f}
            </text>
          );
        })}

        {/* Tap targets */}
        {onTap &&
          activeStrings.map((string) =>
            frets.map((fret) => (
              <rect
                key={`${string}:${fret}`}
                className="fb-tap"
                {...rect(
                  (fret - minFret) * cellLength,
                  across(string) - stringGap / 2,
                  (fret - minFret + 1) * cellLength,
                  across(string) + stringGap / 2,
                )}
                onClick={() => onTap({ string, fret })}
              />
            )),
          )}

        {/* Markers */}
        {markers
          .filter((m) => m.fret >= minFret && m.fret <= maxFret)
          .map((m) => {
            const p = pt(fretCenter(m.fret), across(m.string));
            return (
              <g
                key={`${m.tone}:${m.string}:${m.fret}`}
                className={`fb-marker fb-marker-${m.tone}`}
              >
                <circle cx={p.x} cy={p.y} r={markerRadius} />
                {m.label ? (
                  <text x={p.x} y={p.y}>
                    {m.label}
                  </text>
                ) : null}
              </g>
            );
          })}
      </svg>
    </div>
  );
}
