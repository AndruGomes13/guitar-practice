import type { TriadQuality } from '../../lib/music';

export interface TriadSettings {
  qualities: TriadQuality[];
  /** Include roots like F♯ and B♭, not just C D E F G A B. */
  accidentalRoots: boolean;
  /** What the flashcard shows first. */
  cardFront: 'name' | 'notes';
}

export const DEFAULT_TRIAD_SETTINGS: TriadSettings = {
  qualities: ['major', 'minor'],
  accidentalRoots: true,
  cardFront: 'name',
};

export const TONE_CLASSES = ['root', 'third', 'fifth'] as const;
