import { lazy } from 'react';
import { FretboardIcon, IntervalIcon, KeySignatureIcon, TriadIcon } from '../components/icons';
import type { PracticeModule } from './types';

/**
 * Every practice tool in the app. To add a new one, create a folder under
 * src/modules/ with a default-exported component and register it here.
 */
export const MODULES: readonly PracticeModule[] = [
  {
    id: 'chords',
    aliases: ['triads'],
    title: 'Chords',
    description: 'Learn the notes of each chord: triads and 7th chords.',
    icon: TriadIcon,
    component: lazy(() => import('./chords/ChordsModule')),
  },
  {
    id: 'fretboard',
    title: 'Fretboard notes',
    description: 'Find any note on the neck. Play it on your guitar and the mic checks you.',
    icon: FretboardIcon,
    component: lazy(() => import('./fretboard/FretboardModule')),
  },
  {
    id: 'intervals',
    title: 'Intervals',
    description: 'Recognize intervals on the fretboard and by ear, starting with just a few.',
    icon: IntervalIcon,
    component: lazy(() => import('./intervals/IntervalsModule')),
  },
  {
    id: 'keys',
    title: 'Keys',
    description: 'Learn the chords of each key: what the IV or V is in G, and common progressions.',
    icon: KeySignatureIcon,
    component: lazy(() => import('./keys/KeysModule')),
  },
];
