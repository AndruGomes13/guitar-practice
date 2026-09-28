import { intervalInfo } from '../../lib/intervals';

export type AnswerState = 'correct' | 'wrong';

interface Props {
  intervals: readonly number[];
  states?: Partial<Record<number, AnswerState>>;
  onPick: (semitones: number) => void;
  disabled?: boolean;
}

/** Answer buttons for the selected intervals. */
export function IntervalPicker({ intervals, states = {}, onPick, disabled }: Props) {
  return (
    <div className="interval-picker" role="group" aria-label="Intervals">
      {intervals.map((semitones) => {
        const { short, name } = intervalInfo(semitones);
        const state = states[semitones];
        return (
          <button
            key={semitones}
            type="button"
            className={`interval-btn${state ? ` interval-${state}` : ''}`}
            disabled={disabled}
            onClick={() => onPick(semitones)}
          >
            <span className="interval-short">{short}</span>
            <span className="interval-name">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
