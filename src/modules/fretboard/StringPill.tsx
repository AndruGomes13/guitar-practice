import { STANDARD_TUNING } from '../../lib/guitar';

/** A badge telling you which string to use, by name and number: "A string · 5th". */
export function StringPill({ string }: { string: number }) {
  const { name, ordinal } = STANDARD_TUNING[string];
  return (
    <span className="string-pill">
      <span className="string-pill-name">{name} string</span>
      <span aria-hidden="true">·</span>
      <span>{ordinal}</span>
    </span>
  );
}
