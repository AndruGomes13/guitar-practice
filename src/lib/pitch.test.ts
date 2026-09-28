import { describe, expect, it } from 'vitest';
import { midiToFrequency } from './music';
import { MIC_SENSITIVITY, PitchAnalyzer, StableNoteTracker, type Pitch } from './pitch';

const SAMPLE_RATE = 48000;
const SIZE = 4096;

/**
 * A crude plucked-string tone: a fundamental plus decaying harmonics, where the
 * 2nd harmonic is louder than the fundamental (common for guitar pickups/mics).
 */
function pluck(frequency: number, amplitude = 0.3): Float32Array {
  const harmonics = [0.6, 1, 0.5, 0.35, 0.2, 0.1];
  const buf = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    const t = i / SAMPLE_RATE;
    let v = 0;
    harmonics.forEach((a, h) => (v += a * Math.sin(2 * Math.PI * frequency * (h + 1) * t + h)));
    buf[i] = (amplitude * v) / 2;
  }
  return buf;
}

describe('PitchAnalyzer', () => {
  const analyzer = new PitchAnalyzer(SIZE);

  // Open strings plus a few fretted notes, from low E (40) to the 12th fret on high e (76).
  it.each([40, 45, 47, 50, 55, 59, 64, 69, 76])('detects MIDI %i', (midi) => {
    const frame = analyzer.analyze(pluck(midiToFrequency(midi)), SAMPLE_RATE);
    expect(frame.pitch?.midi).toBe(midi);
    expect(Math.abs(frame.pitch!.cents)).toBeLessThan(10);
  });

  it('reports cents for a slightly out-of-tune note', () => {
    const frame = analyzer.analyze(pluck(midiToFrequency(57.2)), SAMPLE_RATE);
    expect(frame.pitch?.midi).toBe(57);
    expect(frame.pitch!.cents).toBeGreaterThan(10);
    expect(frame.pitch!.cents).toBeLessThan(30);
  });

  it('hears soft notes only at higher sensitivity', () => {
    const soft = pluck(midiToFrequency(45), 0.012); // RMS ≈ 0.006
    expect(
      new PitchAnalyzer(SIZE, MIC_SENSITIVITY.medium).analyze(soft, SAMPLE_RATE).pitch,
    ).toBeNull();
    expect(
      new PitchAnalyzer(SIZE, MIC_SENSITIVITY.high).analyze(soft, SAMPLE_RATE).pitch?.midi,
    ).toBe(45);
  });

  it('ignores silence', () => {
    const frame = analyzer.analyze(new Float32Array(SIZE), SAMPLE_RATE);
    expect(frame.pitch).toBeNull();
  });

  it('ignores noise', () => {
    let seed = 1;
    const noise = new Float32Array(SIZE).map(() => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.5;
    });
    expect(analyzer.analyze(noise, SAMPLE_RATE).pitch).toBeNull();
  });
});

describe('StableNoteTracker', () => {
  const p = (midi: number): Pitch => ({
    midi,
    frequency: midiToFrequency(midi),
    clarity: 1,
    cents: 0,
  });

  /** Feeds `midi` (or silence) every 30 ms for `ms`, returning detected notes. */
  function play(tracker: StableNoteTracker, midi: number | null, ms: number, start: number) {
    const detected: number[] = [];
    for (let t = start; t < start + ms; t += 30) {
      const note = tracker.feed(midi === null ? null : p(midi), t);
      if (note !== null) detected.push(note);
    }
    return detected;
  }

  it('reports a note once after it holds steady', () => {
    const tracker = new StableNoteTracker();
    expect(play(tracker, 45, 60, 0)).toEqual([]);
    expect(play(tracker, 45, 1000, 60)).toEqual([45]);
  });

  it('reports a new note when the pitch changes', () => {
    const tracker = new StableNoteTracker();
    expect(play(tracker, 45, 300, 0)).toEqual([45]);
    expect(play(tracker, 47, 300, 300)).toEqual([47]);
  });

  it('reports the same note again after silence', () => {
    const tracker = new StableNoteTracker();
    expect(play(tracker, 45, 300, 0)).toEqual([45]);
    play(tracker, null, 300, 300);
    expect(play(tracker, 45, 300, 600)).toEqual([45]);
  });

  it('ignores the ringing note, even with octave errors, after ignoreRingingNote()', () => {
    const tracker = new StableNoteTracker();
    expect(play(tracker, 45, 300, 0)).toEqual([45]);
    tracker.ignoreRingingNote();
    expect(play(tracker, 57, 300, 300)).toEqual([]); // same pitch class, octave up
    expect(play(tracker, 45, 300, 600)).toEqual([]);
    expect(play(tracker, 48, 300, 900)).toEqual([48]); // a new note is heard again
  });
});
