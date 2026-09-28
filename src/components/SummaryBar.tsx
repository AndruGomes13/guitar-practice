interface Props {
  tags: readonly string[];
  meta: string;
  onClick: () => void;
}

/** A tappable summary of what you're practicing (e.g. selected intervals); opens settings. */
export function SummaryBar({ tags, meta, onClick }: Props) {
  return (
    <button type="button" className="summary-bar" onClick={onClick}>
      <span className="summary-tags">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </span>
      <span className="summary-meta">
        {meta}
        <span className="summary-edit">Change</span>
      </span>
    </button>
  );
}
