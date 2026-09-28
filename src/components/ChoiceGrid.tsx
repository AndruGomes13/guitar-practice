import type { Choice, ChoiceState } from './choices';

interface Props<T> {
  choices: readonly Choice<T>[];
  states?: ReadonlyMap<T, ChoiceState>;
  onPick: (value: T) => void;
  disabled?: boolean;
  label: string;
}

/** A grid of answer buttons (intervals, Roman numerals…) that turn green/red when answered. */
export function ChoiceGrid<T extends string | number>({
  choices,
  states,
  onPick,
  disabled,
  label,
}: Props<T>) {
  return (
    <div className="choice-grid" role="group" aria-label={label}>
      {choices.map((choice) => {
        const state = states?.get(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            className={`choice-btn${state ? ` choice-${state}` : ''}`}
            disabled={disabled}
            onClick={() => onPick(choice.value)}
          >
            <span className="choice-main">{choice.label}</span>
            {choice.sublabel ? <span className="choice-sub">{choice.sublabel}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
