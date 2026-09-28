import { lazy } from 'react';
import { FretboardIcon, IntervalIcon, TriadIcon } from '../components/icons';
import type { PracticeModule } from './types';

/**
 * Every practice tool in the app. To add a new one, create a folder under
 * src/modules/ with a default-exported component and register it here.
 */
export const MODULES: readonly PracticeModule[] = [
  {
    id: 'triads',
    title: 'Triads',
    description: 'Learn which three notes make each major, minor, diminished and augmented chord.',
    icon: TriadIcon,
    component: lazy(() => import('./triads/TriadsModule')),
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
];
