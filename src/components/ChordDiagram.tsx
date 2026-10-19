import { pcAt, STRING_COUNT } from '../lib/guitar';
import { CHORD_QUALITIES, chordPitchClasses, type Chord } from '../lib/music';
import type { Voicing } from '../lib/shapes';

const TONE_CLASSES = ['root', 'third', 'fifth', 'seventh'];

const GAP = 18; // between strings
const ROW = 22; // per fret
const LEFT = 34; // room for the starting fret number
const TOP = 24; // room for x / o marks
const DOT = 8.5;

/** A standard chord chart: strings vertical (low E on the left), nut at the top. */
export function ChordDiagram({ voicing, chord }: { voicing: Voicing; chord: Chord }) {
  const fretted = voicing.notes.map((n) => n.fret).filter((f) => f > 0);
  const highest = Math.max(0, ...fretted);
  // Open position if everything fits in the first four frets; otherwise start at the lowest fret.
  const start = highest <= 4 ? 1 : Math.min(...fretted);
  const rows = Math.max(4, highest - start + 1);
  const width = LEFT + GAP * (STRING_COUNT - 1) + 12;
  const height = TOP + ROW * rows + 8;
  const x = (string: number) => LEFT + string * GAP;
  const y = (fret: number) => TOP + (fret - start + 0.5) * ROW;

  const pcs = chordPitchClasses(chord);
  const { degrees } = CHORD_QUALITIES[chord.quality];
  const role = (pc: number) => pcs.indexOf(pc);

  const barre = voicing.shape.barre && voicing.rootFret > 0 ? voicing.shape.barre : null;

  return (
    <svg
      className="chord-diagram"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${voicing.shape.name}, root at fret ${voicing.rootFret}`}
    >
      {/* Frets (the top line is the nut in open position) */}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line
          key={i}
          className={i === 0 && start === 1 ? 'cd-nut' : 'cd-fret'}
          x1={x(0)}
          x2={x(STRING_COUNT - 1)}
          y1={TOP + i * ROW}
          y2={TOP + i * ROW}
        />
      ))}
      {Array.from({ length: STRING_COUNT }, (_, s) => (
        <line key={s} className="cd-string" x1={x(s)} x2={x(s)} y1={TOP} y2={TOP + rows * ROW} />
      ))}
      {start > 1 ? (
        <text className="cd-fret-label" x={LEFT - DOT - 10} y={y(start)}>
          {start}
        </text>
      ) : null}

      {/* Muted and open strings */}
      {voicing.muted.map((s) => (
        <text key={`x${s}`} className="cd-mark" x={x(s)} y={TOP - 10}>
          ×
        </text>
      ))}
      {voicing.notes
        .filter((n) => n.fret === 0)
        .map((n) => {
          const r = role(pcAt(n));
          return (
            <circle
              key={`o${n.string}`}
              className={`cd-open tone-${TONE_CLASSES[r]}`}
              cx={x(n.string)}
              cy={TOP - 10}
              r={5}
            />
          );
        })}

      {barre ? (
        <rect
          className="cd-barre"
          x={x(barre[0]) - DOT}
          y={y(voicing.rootFret) - DOT}
          width={x(barre[1]) - x(barre[0]) + DOT * 2}
          height={DOT * 2}
          rx={DOT}
        />
      ) : null}

      {/* Fretted notes, labeled with their degree */}
      {voicing.notes
        .filter((n) => n.fret > 0)
        .map((n) => {
          const r = role(pcAt(n));
          return (
            <g key={`${n.string}:${n.fret}`} className={`cd-dot tone-${TONE_CLASSES[r]}`}>
              <circle cx={x(n.string)} cy={y(n.fret)} r={DOT} />
              <text x={x(n.string)} y={y(n.fret)}>
                {degrees[r]}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
