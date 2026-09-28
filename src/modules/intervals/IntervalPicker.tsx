import { ChoiceGrid } from '../../components/ChoiceGrid';
import type { ChoiceState } from '../../components/choices';
import { intervalInfo } from '../../lib/intervals';

interface Props {
  intervals: readonly number[];
  states?: ReadonlyMap<number, ChoiceState>;
  onPick: (semitones: number) => void;
  disabled?: boolean;
}

/** Answer buttons for the selected intervals. */
export function IntervalPicker({ intervals, ...rest }: Props) {
  const choices = intervals.map((semitones) => {
    const { short, name } = intervalInfo(semitones);
    return { value: semitones, label: short, sublabel: name };
  });
  return <ChoiceGrid label="Intervals" choices={choices} {...rest} />;
}
