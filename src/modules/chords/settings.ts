import type { ChordQuality } from '../../lib/music';

export interface ChordSettings {
  qualities: ChordQuality[];
  /** Include natural roots (C D E F G A B). Turn off to focus on sharps or flats. */
  naturalRoots: boolean;
  /** Include sharp roots (C♯, F♯…). */
  sharpRoots: boolean;
  /** Include flat roots (B♭, E♭…). */
  flatRoots: boolean;
  /** What the flashcard shows first. */
  cardFront: 'name' | 'notes';
  /** Name it: show the notes as root–3rd–5th(–7th), or shuffled. */
  nameOrder: 'ordered' | 'shuffled';
  /** Shapes: which diagrams to show. */
  shapeKinds: 'both' | 'open' | 'movable';
}

export const DEFAULT_CHORD_SETTINGS: ChordSettings = {
  qualities: ['major', 'minor'],
  naturalRoots: true,
  sharpRoots: true,
  flatRoots: false,
  cardFront: 'name',
  nameOrder: 'ordered',
  shapeKinds: 'both',
};

export const TONE_CLASSES = ['root', 'third', 'fifth', 'seventh'] as const;
