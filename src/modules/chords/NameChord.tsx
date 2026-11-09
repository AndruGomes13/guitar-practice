import { playArpeggioThenChord } from '../../audio/synth';
import { Segmented } from '../../components/controls';
import {
  chordMidis,
  noteName,
  type Chord,
  type ChordQuality,
  type Spelling,
} from '../../lib/music';
import { ChordQuiz } from './ChordQuiz';
import type { ChordSettings } from './settings';

/** A shuffled order of n notes (from a per-question seed) that never starts with the root. */
function shuffledOrder(n: number, seed: number): number[] {
  // Small seeded generator so the order stays put while you answer.
  let state = Math.floor(seed * 2 ** 31) || 1;
  const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
  let order: number[];
  do {
    order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order[0] === 0);
  return order;
}

interface Props {
  pool: readonly Chord[];
  qualities: readonly ChordQuality[];
  spelling: Spelling;
  order: ChordSettings['nameOrder'];
  onOrderChange: (order: ChordSettings['nameOrder']) => void;
}

/** Shows a chord's notes; you name the chord (root, then type). */
export function NameChord({ pool, qualities, spelling, order, onOrderChange }: Props) {
  const items = pool.map((chord) => ({ id: chord.id, chord }));
  return (
    <ChordQuiz
      items={items}
      statsKey="triads.stats.name"
      qualities={qualities}
      spelling={spelling}
      kicker="Which chord is this?"
      controls={
        <Segmented
          label="Note order"
          value={order}
          onChange={onOrderChange}
          options={[
            { value: 'ordered', label: 'In order' },
            { value: 'shuffled', label: 'Shuffled' },
          ]}
        />
      }
      renderPrompt={({ chord }, seed) => {
        const shown =
          order === 'ordered'
            ? chord.tones
            : shuffledOrder(chord.tones.length, seed).map((i) => chord.tones[i]);
        return (
          <div className="note-tokens">
            {shown.map((tone, i) => (
              <span key={i} className="note-token">
                {noteName(tone)}
              </span>
            ))}
          </div>
        );
      }}
      hear={({ chord }) => playArpeggioThenChord(chordMidis(chord))}
    />
  );
}
