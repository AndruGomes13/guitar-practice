import { playChords } from '../../audio/synth';
import { Segmented } from '../../components/controls';
import {
  ALL_KEYS,
  diatonicChords,
  keyById,
  keyLabel,
  keyName,
  MAJOR_KEYS,
  MINOR_KEYS,
  relativeKey,
  scaleNotes,
  type KeyMode,
} from '../../lib/keys';
import { noteName, triadMidis, triadSymbol } from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';

/** Pick a key and see (and hear) its seven chords. */
export function Chart({ majorVInMinor }: { majorVInMinor: boolean }) {
  const [storedId, setKeyId] = usePersistentState('keys.chart.key', 'C');
  const key = ALL_KEYS.find((k) => k.id === storedId) ?? keyById('C');
  const chords = diatonicChords(key, { majorVInMinor });
  const relative = relativeKey(key);

  const keyChip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      className={`chip chip-note${id === key.id ? ' active' : ''}`}
      aria-pressed={id === key.id}
      onClick={() => setKeyId(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="stack">
      <section className="card key-picker">
        <Segmented<KeyMode>
          label="Major or minor"
          value={key.mode}
          // Switching mode jumps to the relative key (C major <-> A minor).
          onChange={(mode) => mode !== key.mode && setKeyId(relative.id)}
          options={[
            { value: 'major', label: 'Major keys' },
            { value: 'minor', label: 'Minor keys' },
          ]}
        />
        <div className="chip-row key-chips">
          {(key.mode === 'major' ? MAJOR_KEYS : MINOR_KEYS).map((k) => keyChip(k.id, keyLabel(k)))}
        </div>
        <p className="muted small">In circle-of-fifths order.</p>
      </section>

      <section className="card chart">
        <div className="chart-heading">
          <div>
            <div className="chord-symbol">{keyName(key)}</div>
            <div className="chord-name">Scale: {scaleNotes(key).map(noteName).join(' ')}</div>
          </div>
        </div>

        <div className="degree-grid">
          {chords.map((c) => (
            <button
              key={c.degree}
              type="button"
              className={`degree-card quality-${c.triad.quality}`}
              onClick={() => playChords([triadMidis(c.triad)])}
              aria-label={`${c.numeral}: ${triadSymbol(c.triad)}. Tap to hear it.`}
            >
              <span className="degree-numeral">{c.numeral}</span>
              <span className="degree-chord">{triadSymbol(c.triad)}</span>
              <span className="degree-notes">{c.triad.tones.map(noteName).join(' ')}</span>
            </button>
          ))}
        </div>

        <div className="legend">
          <span className="legend-item quality-major">Major</span>
          <span className="legend-item quality-minor">Minor</span>
          <span className="legend-item quality-diminished">Diminished</span>
        </div>
        <p className="muted small center">
          Tap a chord to hear it. Relative {relative.mode}:{' '}
          <button type="button" className="link-btn" onClick={() => setKeyId(relative.id)}>
            {keyName(relative)}
          </button>
        </p>
      </section>
    </div>
  );
}
