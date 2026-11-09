import { playChords } from '../../audio/synth';
import { ChordDiagram } from '../../components/ChordDiagram';
import { Segmented } from '../../components/controls';
import { STANDARD_TUNING } from '../../lib/guitar';
import type { ChordQuality, Spelling } from '../../lib/music';
import { voicingMidis, type ShapeQuizItem } from '../../lib/shapes';
import { ChordQuiz } from './ChordQuiz';
import type { ChordSettings } from './settings';

interface Props {
  items: readonly ShapeQuizItem[];
  qualities: readonly ChordQuality[];
  spelling: Spelling;
  kinds: ChordSettings['shapeKinds'];
  onKindsChange: (kinds: ChordSettings['shapeKinds']) => void;
}

/** Where a shape sits, e.g. "A shape · root on the 5th string, fret 3" or "Open chord". */
function describe({ voicing }: ShapeQuizItem): string {
  const { shape, rootFret } = voicing;
  if (shape.name === 'Open chord') return 'Open chord';
  const where = `root on the ${STANDARD_TUNING[shape.rootString].ordinal} string`;
  return `${shape.name} · ${where}, ${rootFret === 0 ? 'open' : `fret ${rootFret}`}`;
}

/** Shows a chord shape on the neck; you name the chord. */
export function NameShape({ items, qualities, spelling, kinds, onKindsChange }: Props) {
  return (
    <ChordQuiz
      items={items}
      statsKey="chords.stats.shapes"
      qualities={qualities}
      spelling={spelling}
      kicker="Which chord is this shape?"
      controls={
        <Segmented
          label="Shapes"
          value={kinds}
          onChange={onKindsChange}
          options={[
            { value: 'both', label: 'All shapes' },
            { value: 'open', label: 'Open' },
            { value: 'movable', label: 'Movable' },
          ]}
        />
      }
      renderPrompt={(item, _seed, answered) => (
        <div className="shape-quiz-diagram">
          <ChordDiagram voicing={item.voicing} chord={item.chord} reveal={answered} />
        </div>
      )}
      renderDetails={(item) => <p className="muted small">{describe(item)}</p>}
      hear={(item) => playChords([voicingMidis(item.voicing)])}
    />
  );
}
