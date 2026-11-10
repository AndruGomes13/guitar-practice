import { CHORD_QUALITIES, noteName, simpleName, type Chord } from '../lib/music';

const TONE_CLASSES = ['root', 'third', 'fifth', 'seventh'] as const;

interface Props {
  chord: Chord;
  size?: 'large' | 'small';
  /** Name notes as read off the neck (F rather than E♯, A♯ rather than B♭). */
  simple?: boolean;
}

/** The chord tones, colored by their role (root, third, fifth, seventh). */
export function ToneList({ chord, size = 'large', simple = false }: Props) {
  const { degrees } = CHORD_QUALITIES[chord.quality];
  return (
    <div className={`tones tones-${size}`}>
      {chord.tones.map((tone, i) => (
        <div key={i} className={`tone tone-${TONE_CLASSES[i]}`}>
          <span className="tone-name">{simple ? simpleName(tone) : noteName(tone)}</span>
          <span className="tone-degree">{degrees[i]}</span>
        </div>
      ))}
    </div>
  );
}
