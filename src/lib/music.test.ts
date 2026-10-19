import { describe, expect, it } from 'vitest';
import {
  buildChord,
  frequencyToMidi,
  noteName,
  parseNote,
  pcName,
  transpose,
  chordName,
  chordPitchClasses,
  chordPool,
  chordSymbol,
  type ChordQuality,
} from './music';

const spell = (root: string, quality: ChordQuality) =>
  buildChord(parseNote(root), quality).tones.map(noteName).join(' ');

describe('note spelling', () => {
  it('parses and names notes', () => {
    expect(noteName(parseNote('C'))).toBe('C');
    expect(noteName(parseNote('F#'))).toBe('F♯');
    expect(noteName(parseNote('Bb'))).toBe('B♭');
    expect(noteName(parseNote('D♭'))).toBe('D♭');
  });

  it('rejects invalid names', () => {
    expect(() => parseNote('H')).toThrow();
    expect(() => parseNote('Cx')).toThrow();
  });

  it('transposes by interval with correct letters', () => {
    expect(noteName(transpose(parseNote('A'), 2, 4))).toBe('C♯');
    expect(noteName(transpose(parseNote('Eb'), 2, 3))).toBe('G♭');
    expect(noteName(transpose(parseNote('B'), 4, 6))).toBe('F');
    expect(noteName(transpose(parseNote('G#'), 4, 8))).toBe('D𝄪');
  });

  it('names pitch classes', () => {
    expect(pcName(1, 'sharp')).toBe('C♯');
    expect(pcName(1, 'flat')).toBe('D♭');
    expect(pcName(1, 'both')).toBe('C♯/D♭');
    expect(pcName(4, 'both')).toBe('E');
  });
});

describe('triads', () => {
  it('spells major triads', () => {
    expect(spell('C', 'major')).toBe('C E G');
    expect(spell('A', 'major')).toBe('A C♯ E');
    expect(spell('Db', 'major')).toBe('D♭ F A♭');
    expect(spell('F#', 'major')).toBe('F♯ A♯ C♯');
  });

  it('spells minor, diminished and augmented triads', () => {
    expect(spell('A', 'minor')).toBe('A C E');
    expect(spell('Eb', 'minor')).toBe('E♭ G♭ B♭');
    expect(spell('B', 'diminished')).toBe('B D F');
    expect(spell('C#', 'diminished')).toBe('C♯ E G');
    expect(spell('C', 'augmented')).toBe('C E G♯');
  });

  it('spells 7th chords', () => {
    expect(spell('C', 'maj7')).toBe('C E G B');
    expect(spell('G', 'dom7')).toBe('G B D F');
    expect(spell('A', 'min7')).toBe('A C E G');
    expect(spell('B', 'half-dim7')).toBe('B D F A');
    expect(spell('B', 'dim7')).toBe('B D F A♭');
    expect(spell('F#', 'min7')).toBe('F♯ A C♯ E');
    expect(spell('Eb', 'maj7')).toBe('E♭ G B♭ D');
    expect(chordSymbol(buildChord(parseNote('D'), 'dom7'))).toBe('D7');
    expect(chordSymbol(buildChord(parseNote('C#'), 'half-dim7'))).toBe('C♯m7♭5');
    expect(chordName(buildChord(parseNote('G'), 'dom7'))).toBe('G dominant 7th');
  });

  it('includes 7th chords in the pool, without double accidentals', () => {
    const pool = chordPool(['dim7'], { sharps: true, flats: true });
    // C°7 needs B𝄫, so it's left out; B°7 (B D F A♭) is in.
    expect(pool.some((c) => c.id === 'C-dim7')).toBe(false);
    expect(pool.some((c) => c.id === 'B-dim7')).toBe(true);
    expect(pool.every((c) => c.tones.length === 4)).toBe(true);
  });

  it('names triads', () => {
    const t = buildChord(parseNote('Ab'), 'minor');
    expect(chordSymbol(t)).toBe('A♭m');
    expect(chordName(t)).toBe('A♭ minor');
    expect(chordPitchClasses(t)).toEqual([8, 11, 3]);
  });

  it('builds a pool without double accidentals', () => {
    const pool = chordPool(['major', 'minor', 'diminished', 'augmented'], {
      sharps: true,
      flats: true,
    });
    expect(pool.length).toBeGreaterThan(40);
    for (const t of pool) {
      for (const tone of t.tones) expect(Math.abs(tone.accidental)).toBeLessThanOrEqual(1);
    }
    expect(pool.some((t) => t.id === 'D♯-major')).toBe(false);
  });

  it('can include sharp roots without flat ones', () => {
    const roots = chordPool(['major'], { sharps: true, flats: false }).map((t) => noteName(t.root));
    expect(roots).toContain('F♯');
    expect(roots).toContain('C♯');
    expect(roots.some((r) => r.includes('♭'))).toBe(false);
  });

  it('can limit the pool to natural roots', () => {
    const pool = chordPool(['major'], { sharps: false, flats: false });
    expect(pool.map(chordSymbol)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });
});

describe('frequencies', () => {
  it('maps concert A and the open strings', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69);
    expect(frequencyToMidi(82.41)).toBeCloseTo(40, 1);
    expect(frequencyToMidi(329.63)).toBeCloseTo(64, 1);
  });
});
