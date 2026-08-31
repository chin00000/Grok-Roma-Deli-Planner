import { useState } from 'react';
import { commitCategory } from '../groupCategory';

/** Draft locally; write the trimmed category on blur (or Enter). Parent grouping stays put while typing. */
export function CategoryInput({
  value,
  onCommit,
  'aria-label': ariaLabel,
}: {
  value: string | undefined;
  onCommit: (next: string | undefined) => void;
  'aria-label': string;
}) {
  const committed = value ?? '';
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? committed;

  return (
    <input
      className="cell cat-input"
      value={shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = commitCategory(draft ?? committed);
        setDraft(null);
        onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      aria-label={ariaLabel}
    />
  );
}
