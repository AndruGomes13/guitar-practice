import { describe, expect, it } from 'vitest';
import { pcAt } from './guitar';
import {
  buildChord,
  CHORD_QUALITY_ORDER,
  chordPitchClasses,
  parseNote,
  SHARP_NAMES,
} from './music';
import { chordVoicings, voiceShape, CHORD_SHAPES } from './shapes';

describe('chord shapes', () => {
  // Every shape, for every chord type, in every key.
  it.each(CHORD_QUALITY_ORDER)('play exactly the notes of every %s chord', (quality) => {
    for (const rootName of SHARP_NAMES) {
      const chord = buildChord(parseNote(rootName.replace('♯', '#')), quality);
      const expected = new Set(chordPitchClasses(chord));
      for (const v of chordVoicings(chord)) {
        const played = v.notes.map(pcAt);
        const label = `${rootName} ${quality} ${v.shape.name}`;
        // Only chord tones, and all of them.
        expect(
          played.every((pc) => expected.has(pc)),
          label,
        ).toBe(true);
        expect(new Set(played), label).toEqual(expected);
        // The root is the lowest note, on the shape's root string.
        expect(v.notes[0], label).toEqual({ string: v.shape.rootString, fret: v.rootFret });
        expect(pcAt(v.notes[0]), label).toBe(chordPitchClasses(chord)[0]);
        // Nothing below the nut, nothing silly high.
        expect(Math.min(...v.notes.map((n) => n.fret)), label).toBeGreaterThanOrEqual(0);
        expect(Math.max(...v.notes.map((n) => n.fret)), label).toBeLessThanOrEqual(15);
      }
    }
  });

  it('has three shapes for every chord type', () => {
    for (const quality of CHORD_QUALITY_ORDER) expect(CHORD_SHAPES[quality]).toHaveLength(3);
  });

  it('places open chords at the nut', () => {
    const e = voiceShape(CHORD_SHAPES.major[0], buildChord(parseNote('E'), 'major'));
    expect(e.rootFret).toBe(0);
    expect(e.notes.map((n) => n.fret)).toEqual([0, 2, 2, 1, 0, 0]);
    const g = voiceShape(CHORD_SHAPES.major[0], buildChord(parseNote('G'), 'major'));
    expect(g.notes.map((n) => n.fret)).toEqual([3, 5, 5, 4, 3, 3]);
  });
});
