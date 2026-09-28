import { describe, expect, it } from 'vitest';
import { allPositions, midiAt, pcAt, positionsOfPc } from './guitar';

describe('fretboard', () => {
  it('knows the notes on the neck', () => {
    expect(midiAt({ string: 0, fret: 0 })).toBe(40); // low E
    expect(pcAt({ string: 1, fret: 3 })).toBe(0); // C on the A string
    expect(pcAt({ string: 4, fret: 1 })).toBe(0); // C on the B string
    expect(pcAt({ string: 5, fret: 12 })).toBe(4); // E at the 12th fret
  });

  it('finds every position of a note in a fret range', () => {
    const cs = positionsOfPc(0, [0, 1, 2, 3, 4, 5], 0, 12);
    expect(cs).toEqual([
      { string: 0, fret: 8 },
      { string: 1, fret: 3 },
      { string: 2, fret: 10 },
      { string: 3, fret: 5 },
      { string: 4, fret: 1 },
      { string: 5, fret: 8 },
    ]);
    // Open E and 12th-fret E on the low string.
    expect(positionsOfPc(4, [0], 0, 12)).toEqual([
      { string: 0, fret: 0 },
      { string: 0, fret: 12 },
    ]);
    expect(positionsOfPc(4, [0], 1, 11)).toEqual([]);
  });

  it('lists all positions in a range', () => {
    expect(allPositions([2, 3], 5, 7)).toHaveLength(6);
  });
});
