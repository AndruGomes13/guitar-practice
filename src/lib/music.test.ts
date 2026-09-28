import { describe, expect, it } from 'vitest';
import {
  buildTriad,
  frequencyToMidi,
  noteName,
  parseNote,
  pcName,
  transpose,
  triadName,
  triadPitchClasses,
  triadPool,
  triadSymbol,
  type TriadQuality,
} from './music';

const spell = (root: string, quality: TriadQuality) =>
  buildTriad(parseNote(root), quality).tones.map(noteName).join(' ');

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

  it('names triads', () => {
    const t = buildTriad(parseNote('Ab'), 'minor');
    expect(triadSymbol(t)).toBe('A♭m');
    expect(triadName(t)).toBe('A♭ minor');
    expect(triadPitchClasses(t)).toEqual([8, 11, 3]);
  });

  it('builds a pool without double accidentals', () => {
    const pool = triadPool(['major', 'minor', 'diminished', 'augmented'], true);
    expect(pool.length).toBeGreaterThan(40);
    for (const t of pool) {
      for (const tone of t.tones) expect(Math.abs(tone.accidental)).toBeLessThanOrEqual(1);
    }
    expect(pool.some((t) => t.id === 'D♯-major')).toBe(false);
  });

  it('can limit the pool to natural roots', () => {
    const pool = triadPool(['major'], false);
    expect(pool.map(triadSymbol)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });
});

describe('frequencies', () => {
  it('maps concert A and the open strings', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69);
    expect(frequencyToMidi(82.41)).toBeCloseTo(40, 1);
    expect(frequencyToMidi(329.63)).toBeCloseTo(64, 1);
  });
});
