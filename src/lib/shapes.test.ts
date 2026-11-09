import { describe, expect, it } from 'vitest';
import { pcAt } from './guitar';
import {
  buildChord,
  CHORD_QUALITY_ORDER,
  chordPitchClasses,
  parseNote,
  SHARP_NAMES,
} from './music';
import { chordVoicings, voiceShape, CHORD_SHAPES, OPEN_CHORDS, shapeQuizItems } from './shapes';

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

describe('open chords', () => {
  it.each(OPEN_CHORDS.map((o) => [`${o.root} ${o.quality}`, o] as const))(
    '%s is spelled right',
    (_, o) => {
      const chord = buildChord(parseNote(o.root), o.quality);
      const pcs = chordPitchClasses(chord);
      const played = o.frets.flatMap((fret, string) =>
        fret === null ? [] : [pcAt({ string, fret })],
      );
      // Only chord tones; root is the lowest note; root and 3rd are there (the 5th may be left out).
      expect(played.every((pc) => pcs.includes(pc))).toBe(true);
      expect(played[0]).toBe(pcs[0]);
      expect(played).toContain(pcs[1]);
    },
  );
});

describe('shape quiz items', () => {
  const pool = [buildChord(parseNote('E'), 'major'), buildChord(parseNote('G'), 'dom7')];

  it('includes open chords and movable shapes, without duplicates', () => {
    const items = shapeQuizItems(pool, ['open', 'movable']);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    // The open E chord and the E shape at the nut are the same diagram.
    expect(items.filter((i) => i.id === 'E-major:0,2,2,1,0,0')).toHaveLength(1);
    expect(items.some((i) => i.id === 'G-dom7:3,2,0,0,0,1')).toBe(true); // open G7
    expect(items.some((i) => i.kind === 'movable' && i.chord.id === 'G-dom7')).toBe(true);
  });

  it('filters by kind and stays on the neck', () => {
    const open = shapeQuizItems(pool, ['open']);
    expect(open.every((i) => i.voicing.notes.some((n) => n.fret === 0))).toBe(true);
    const movable = shapeQuizItems(pool, ['movable']);
    expect(movable.every((i) => i.voicing.notes.every((n) => n.fret > 0 && n.fret <= 15))).toBe(
      true,
    );
    // Movable shapes also appear an octave up when they fit.
    expect(movable.some((i) => i.chord.id === 'E-major' && i.voicing.rootFret === 12)).toBe(true);
  });
});
