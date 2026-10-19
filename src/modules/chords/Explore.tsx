import { playArpeggioThenChord, playChords } from '../../audio/synth';
import { ChordDiagram } from '../../components/ChordDiagram';
import { Fretboard, type FretMarker } from '../../components/Fretboard';
import { PlayIcon } from '../../components/icons';
import { NotePicker, type KeyState } from '../../components/NotePicker';
import { positionsOfPc, STANDARD_TUNING } from '../../lib/guitar';
import { chordVoicings, voicingMidis } from '../../lib/shapes';
import {
  buildChord,
  noteName,
  parseNote,
  pitchClassOf,
  CHORD_QUALITIES,
  SEVENTH_QUALITY_ORDER,
  TRIAD_QUALITY_ORDER,
  chordName,
  chordSymbol,
  type ChordQuality,
} from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';
import { TONE_CLASSES } from './settings';
import { ToneList } from '../../components/ToneList';

const NATURAL_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTAL_ROOTS = ['C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'];
const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

/** Pick any root and quality and see (and hear) what the chord is made of. */
export function Explore() {
  const [rootName, setRootName] = usePersistentState('triads.explore.root', 'C');
  const [quality, setQuality] = usePersistentState<ChordQuality>('triads.explore.quality', 'major');

  const chord = buildChord(parseNote(rootName), quality);
  const info = CHORD_QUALITIES[quality];

  const keyStates: Partial<Record<number, KeyState>> = {};
  chord.tones.forEach((tone, i) => (keyStates[pitchClassOf(tone)] = TONE_CLASSES[i]));

  const markers: FretMarker[] = chord.tones.flatMap((tone, i) =>
    positionsOfPc(pitchClassOf(tone), ALL_STRINGS, 0, 12).map((pos) => ({
      ...pos,
      tone: TONE_CLASSES[i],
      label: noteName(tone),
    })),
  );

  const rootMidi = 48 + pitchClassOf(chord.root);
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

  const qualityChip = (q: ChordQuality) => (
    <button
      key={q}
      type="button"
      className={`chip${q === quality ? ' active' : ''}`}
      aria-pressed={q === quality}
      onClick={() => setQuality(q)}
    >
      {CHORD_QUALITIES[q].label}
    </button>
  );

  return (
    <div className="stack">
      <section className="card">
        <div className="root-picker">
          <div className="chip-row">{NATURAL_ROOTS.map(rootChip)}</div>
          <div className="chip-row">{ACCIDENTAL_ROOTS.map(rootChip)}</div>
        </div>
        <div className="quality-picker" role="group" aria-label="Chord quality">
          <div className="chip-row">{TRIAD_QUALITY_ORDER.map(qualityChip)}</div>
          <div className="chip-row">{SEVENTH_QUALITY_ORDER.map(qualityChip)}</div>
        </div>
      </section>

      <section className="card chord-display">
        <div className="chord-heading">
          <div>
            <div className="chord-symbol">{chordSymbol(chord)}</div>
            <div className="chord-name">{chordName(chord)}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => playArpeggioThenChord(voicing)}
          >
            <PlayIcon width={18} height={18} /> Hear it
          </button>
        </div>
        <ToneList chord={chord} />
        <p className="muted formula">{info.formula}</p>
        <NotePicker states={keyStates} />
      </section>

      <section className="card">
        <h3 className="card-title">Common shapes</h3>
        <div className="shape-grid">
          {chordVoicings(chord).map((v) => (
            <button
              key={v.shape.name}
              type="button"
              className="shape-card"
              onClick={() => playChords([voicingMidis(v)])}
            >
              <ChordDiagram voicing={v} chord={chord} />
              <span className="shape-name">{v.shape.name}</span>
              <span className="shape-sub">
                Root: {STANDARD_TUNING[v.shape.rootString].ordinal} string
              </span>
              <span className="shape-sub">{v.rootFret > 0 ? `Fret ${v.rootFret}` : 'Open'}</span>
            </button>
          ))}
        </div>
        <p className="muted small center shape-hint">
          Tap a shape to hear it. Dots show each note’s degree; × means don’t play that string.
        </p>
      </section>

      <section className="card">
        <h3 className="card-title">On the neck</h3>
        <Fretboard minFret={0} maxFret={12} markers={markers} label={`${chordName(chord)} tones`} />
        <div className="legend">
          <span className="legend-item tone-root">Root</span>
          <span className="legend-item tone-third">3rd</span>
          <span className="legend-item tone-fifth">5th</span>
          {chord.tones.length > 3 ? <span className="legend-item tone-seventh">7th</span> : null}
        </div>
      </section>
    </div>
  );
}
