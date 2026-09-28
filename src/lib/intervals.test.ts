import { describe, expect, it } from 'vitest';
import {
  INTERVALS,
  intervalId,
  intervalInfo,
  intervalPhrase,
  semitonesOfId,
  spellInterval,
} from './intervals';
import { midiToFrequency } from './music';
import { PitchAnalyzer } from './pitch';
import { synthesizePluck } from './pluck';

describe('intervals', () => {
  it('covers every interval up to the octave', () => {
    expect(INTERVALS.map((i) => i.semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(intervalInfo(7).short).toBe('P5');
  });

  it('uses the right article', () => {
    expect(intervalPhrase(3)).toBe('a minor 3rd');
    expect(intervalPhrase(12)).toBe('an octave');
  });

  it('builds and groups stats ids', () => {
    expect(intervalId(3, 'up')).toBe('3u');
    expect(intervalId(12, 'together')).toBe('12t');
    expect(semitonesOfId('12t')).toBe('12');
  });

  it('spells intervals going up', () => {
    const up = (midi: number, s: number) => {
      const { root, second } = spellInterval(midi, s, 'up');
      return `${root}-${second}`;
    };
    expect(up(60, 3)).toBe('C-E♭');
    expect(up(69, 4)).toBe('A-C♯');
    expect(up(64, 1)).toBe('E-F');
    expect(up(60, 6)).toBe('C-F♯');
    expect(up(65, 6)).toBe('F-B');
    expect(up(62, 12)).toBe('D-D');
    // Black-key root: D♭–F (2 accidentals total would be C♯–E♯).
    expect(up(61, 4)).toBe('D♭-F');
  });

  it('spells intervals going down', () => {
    const down = (midi: number, s: number) => {
      const { root, second } = spellInterval(midi, s, 'down');
      return `${root}-${second}`;
    };
    expect(down(60, 3)).toBe('C-A');
    expect(down(64, 7)).toBe('E-A');
    expect(down(60, 1)).toBe('C-B');
    expect(down(67, 12)).toBe('G-G');
  });
});

describe('synthesizePluck', () => {
  const sampleRate = 48000;
  const analyzer = new PitchAnalyzer(4096);

  // From the low E string up to the high e at the 17th fret.
  it.each([40, 45, 52, 57, 64, 69, 72, 76, 81])('is in tune at MIDI %i', (midi) => {
    let seed = midi;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const samples = synthesizePluck(midiToFrequency(midi), sampleRate, 0.5, random);
    const window = samples.slice(4800, 4800 + 4096); // skip the first 0.1 s
    const frame = analyzer.analyze(window, sampleRate);
    expect(frame.pitch?.midi).toBe(midi);
    expect(Math.abs(frame.pitch!.cents)).toBeLessThan(3);
  });
});
