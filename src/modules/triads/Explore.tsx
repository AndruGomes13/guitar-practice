import { playArpeggioThenChord } from '../../audio/synth';
import { Segmented } from '../../components/controls';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { positionsOfPc } from '../../lib/guitar';
import {
  buildTriad,
  noteName,
  parseNote,
  pitchClassOf,
  TRIAD_QUALITIES,
  TRIAD_QUALITY_ORDER,
  triadName,
  triadSymbol,
  type TriadQuality,
} from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';
import { TONE_CLASSES } from './settings';
import { ToneList } from '../../components/ToneList';

const NATURAL_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTAL_ROOTS = ['C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'];
const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

/** Pick any root and quality and see (and hear) what the triad is made of. */
export function Explore() {
  const [rootName, setRootName] = usePersistentState('triads.explore.root', 'C');
  const [quality, setQuality] = usePersistentState<TriadQuality>('triads.explore.quality', 'major');

  const triad = buildTriad(parseNote(rootName), quality);
  const info = TRIAD_QUALITIES[quality];

  const keyStates: Partial<Record<number, KeyState>> = {};
  triad.tones.forEach((tone, i) => (keyStates[pitchClassOf(tone)] = TONE_CLASSES[i]));

  const markers: FretMarker[] = triad.tones.flatMap((tone, i) =>
    positionsOfPc(pitchClassOf(tone), ALL_STRINGS, 0, 12).map((pos) => ({
      ...pos,
      tone: TONE_CLASSES[i],
      label: noteName(tone),
    })),
  );

  const rootMidi = 48 + pitchClassOf(triad.root);
  const voicing = info.semitones.map((s) => rootMidi + s);

  const rootChip = (name: string) => (
    <button
      key={name}
      type="button"
      className={`chip chip-note${name === rootName ? ' active' : ''}`}
      aria-pressed={name === rootName}
      onClick={() => setRootName(name)}
    >
      {noteName(parseNote(name))}
    </button>
  );

  return (
    <div className="stack">
      <section className="card">
        <div className="root-picker">
          <div className="chip-row">{NATURAL_ROOTS.map(rootChip)}</div>
          <div className="chip-row">{ACCIDENTAL_ROOTS.map(rootChip)}</div>
        </div>
        <Segmented
          label="Chord quality"
          value={quality}
          onChange={setQuality}
          options={TRIAD_QUALITY_ORDER.map((q) => ({ value: q, label: TRIAD_QUALITIES[q].label }))}
        />
      </section>

      <section className="card chord-display">
        <div className="chord-heading">
          <div>
            <div className="chord-symbol">{triadSymbol(triad)}</div>
            <div className="chord-name">{triadName(triad)}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => playArpeggioThenChord(voicing)}
          >
            <PlayIcon width={18} height={18} /> Hear it
          </button>
        </div>
        <ToneList triad={triad} />
        <p className="muted formula">{info.formula}</p>
        <NotePicker states={keyStates} />
      </section>

      <section className="card">
        <h3 className="card-title">On the neck</h3>
        <Fretboard minFret={0} maxFret={12} markers={markers} label={`${triadName(triad)} tones`} />
        <div className="legend">
          <span className="legend-item tone-root">Root</span>
          <span className="legend-item tone-third">3rd</span>
          <span className="legend-item tone-fifth">5th</span>
        </div>
      </section>
    </div>
  );
}
