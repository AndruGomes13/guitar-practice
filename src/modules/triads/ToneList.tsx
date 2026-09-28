import { noteName, TRIAD_QUALITIES, type Triad } from '../../lib/music';
import { TONE_CLASSES } from './settings';

/** The three chord tones, colored by their role (root, third, fifth). */
export function ToneList({ triad, size = 'large' }: { triad: Triad; size?: 'large' | 'small' }) {
  const { degrees } = TRIAD_QUALITIES[triad.quality];
  return (
    <div className={`tones tones-${size}`}>
      {triad.tones.map((tone, i) => (
        <div key={i} className={`tone tone-${TONE_CLASSES[i]}`}>
          <span className="tone-name">{noteName(tone)}</span>
          <span className="tone-degree">{degrees[i]}</span>
        </div>
      ))}
    </div>
  );
}
