import { describe, expect, it } from 'vitest';
import {
  ALL_KEYS,
  diatonicChords,
  keyById,
  keyLabel,
  keyName,
  relativeKey,
  romanNumeral,
  scaleNotes,
} from './keys';
import { noteName, triadSymbol } from './music';

const chords = (id: string, majorVInMinor = false) =>
  diatonicChords(keyById(id), { majorVInMinor }).map((c) => triadSymbol(c.triad));
const numerals = (id: string, majorVInMinor = false) =>
  diatonicChords(keyById(id), { majorVInMinor }).map((c) => c.numeral);

describe('keys', () => {
  it('has all twelve major and minor keys', () => {
    expect(ALL_KEYS).toHaveLength(24);
    expect(keyName(keyById('F#'))).toBe('F♯ major');
    expect(keyLabel(keyById('Ebm'))).toBe('E♭m');
  });

  it('spells scales with one of each letter', () => {
    expect(scaleNotes(keyById('D')).map(noteName).join(' ')).toBe('D E F♯ G A B C♯');
    expect(scaleNotes(keyById('F')).map(noteName).join(' ')).toBe('F G A B♭ C D E');
    expect(scaleNotes(keyById('Am')).map(noteName).join(' ')).toBe('A B C D E F G');
    expect(scaleNotes(keyById('F#')).map(noteName).join(' ')).toBe('F♯ G♯ A♯ B C♯ D♯ E♯');
  });

  it('builds the diatonic chords of major keys', () => {
    expect(chords('C')).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
    expect(chords('G')).toEqual(['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F♯°']);
    expect(chords('F')).toEqual(['F', 'Gm', 'Am', 'B♭', 'C', 'Dm', 'E°']);
    expect(chords('Eb')).toEqual(['E♭', 'Fm', 'Gm', 'A♭', 'B♭', 'Cm', 'D°']);
    expect(numerals('C')).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
  });

  it('builds the diatonic chords of minor keys', () => {
    expect(chords('Am')).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
    expect(numerals('Am')).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
    expect(chords('Am', true)[4]).toBe('E');
    expect(numerals('Am', true)[4]).toBe('V');
  });

  it('writes Roman numerals', () => {
    expect(romanNumeral(4, 'major')).toBe('V');
    expect(romanNumeral(1, 'minor')).toBe('ii');
    expect(romanNumeral(6, 'diminished')).toBe('vii°');
    expect(romanNumeral(2, 'augmented')).toBe('III+');
  });

  it('finds relative keys', () => {
    expect(relativeKey(keyById('C')).id).toBe('Am');
    expect(relativeKey(keyById('Em')).id).toBe('G');
    expect(relativeKey(keyById('Eb')).id).toBe('Cm');
    expect(relativeKey(keyById('F#')).id).toBe('Ebm');
  });
});
