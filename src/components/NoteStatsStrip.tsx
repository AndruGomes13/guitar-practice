import { pcName, type Spelling } from '../lib/music';
import type { StatsMap } from '../lib/stats';
import { StatsStrip } from './StatsStrip';

interface Props {
  /** Stats keyed by pitch class (0–11). */
  stats: StatsMap;
  spelling: Spelling;
  onReset: () => void;
  showTimes?: boolean;
}

/** Stats per note name, C through B. */
export function NoteStatsStrip({ spelling, ...rest }: Props) {
  const items = Array.from({ length: 12 }, (_, pc) => ({
    id: `${pc}`,
    label: pcName(pc, spelling === 'flat' ? 'flat' : 'sharp'),
  }));
  return <StatsStrip items={items} {...rest} />;
}
