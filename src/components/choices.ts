export type ChoiceState = 'correct' | 'wrong';

export interface Choice<T> {
  value: T;
  label: string;
  sublabel?: string;
}

/** Marks the right answer green and, if different, the picked one red. */
export function answerStates<T>(correct: T, picked: T | null): Map<T, ChoiceState> {
  const states = new Map<T, ChoiceState>();
  if (picked === null) return states;
  states.set(correct, 'correct');
  if (picked !== correct) states.set(picked, 'wrong');
  return states;
}
