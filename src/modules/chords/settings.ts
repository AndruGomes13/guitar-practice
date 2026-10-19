import type { ChordQuality } from '../../lib/music';

export interface ChordSettings {
  qualities: ChordQuality[];
  /** Include sharp roots (C♯, F♯…) besides C D E F G A B. */
  sharpRoots: boolean;
  /** Include flat roots (B♭, E♭…). */
  flatRoots: boolean;
  /** What the flashcard shows first. */
  cardFront: 'name' | 'notes';
}

export const DEFAULT_CHORD_SETTINGS: ChordSettings = {
  qualities: ['major', 'minor'],
  sharpRoots: true,
  flatRoots: false,
  cardFront: 'name',
};

export const TONE_CLASSES = ['root', 'third', 'fifth', 'seventh'] as const;
