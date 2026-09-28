import { midiOctave, pcName, type Spelling } from '../lib/music';
import type { Pitch } from '../lib/pitch';

interface Props {
  pitch: Pitch | null;
  /** Input RMS level, 0–1. */
  level: number;
  spelling: Spelling;
}

/** Shows the note the microphone hears, how in tune it is, and the input level. */
export function PitchMeter({ pitch, level, spelling }: Props) {
  // Map -54 dB .. -14 dB to 0..1 so quiet rooms and loud strums both read sensibly.
  const db = 20 * Math.log10(Math.max(level, 1e-6));
  const levelPct = Math.round(Math.min(1, Math.max(0, (db + 54) / 40)) * 100);
  const name = pitch
    ? pcName(pitch.midi, spelling === 'flat' ? 'flat' : 'sharp') + midiOctave(pitch.midi)
    : '—';
  const cents = pitch ? Math.round(pitch.cents) : 0;
  const inTune = pitch !== null && Math.abs(cents) <= 10;

  return (
    <div className="pitch-meter" aria-live="off">
      <div className={`pm-note${pitch ? '' : ' pm-note-empty'}`}>
        <span className="pm-label">Hearing</span>
        <span className="pm-name">{name}</span>
      </div>
      <div className="pm-gauges">
        <div
          className="pm-cents"
          title={pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : undefined}
        >
          <div className="pm-cents-zone" />
          {pitch ? (
            <div
              className={`pm-needle${inTune ? ' in-tune' : ''}`}
              style={{ left: `${50 + cents}%` }}
            />
          ) : null}
          <span className="pm-cents-text">
            {pitch ? `${cents > 0 ? '+' : ''}${cents}¢` : 'tuning'}
          </span>
        </div>
        <div className="pm-level" aria-label="Input level">
          <div className="pm-level-fill" style={{ width: `${levelPct}%` }} />
        </div>
      </div>
    </div>
  );
}
