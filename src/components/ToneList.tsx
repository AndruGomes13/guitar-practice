import { CHORD_QUALITIES, noteName, type Chord } from '../lib/music';

const TONE_CLASSES = ['root', 'third', 'fifth', 'seventh'] as const;

/** The chord tones, colored by their role (root, third, fifth, seventh). */
export function ToneList({ chord, size = 'large' }: { chord: Chord; size?: 'large' | 'small' }) {
  const { degrees } = CHORD_QUALITIES[chord.quality];
  return (
    <div className={`tones tones-${size}`}>
      {chord.tones.map((tone, i) => (
        <div key={i} className={`tone tone-${TONE_CLASSES[i]}`}>
          <span className="tone-name">{noteName(tone)}</span>
          <span className="tone-degree">{degrees[i]}</span>
        </div>
      ))}
    </div>
  );
}
