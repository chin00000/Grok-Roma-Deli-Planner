import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

/** Compact notes with hover preview (portaled to document.body) and click/focus to expand the row downward. */
export function NotesCell({
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  'aria-label': string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState<{
    text: string;
    left: number;
    top: number;
    above: boolean;
  } | null>(null);

  function onNotesEnter(e: MouseEvent<HTMLElement>) {
    if (!value.trim() || expanded) {
      setHover(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    let left = r.left;
    let top = r.bottom + 8;
    let above = false;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (left < 12) left = 12;
    if (r.bottom + 160 > window.innerHeight && r.top > 140) {
      above = true;
      top = r.top - 8;
    }
    setHover({ text: value, left, top, above });
  }

  function expand() {
    setExpanded(true);
    setHover(null);
  }

  const noteRows = Math.min(
    12,
    Math.max(3, value.split('\n').length, Math.ceil((value.length || 1) / 42)),
  );

  return (
    <td
      className={['notes-cell', className].filter(Boolean).join(' ')}
      onMouseEnter={onNotesEnter}
      onMouseLeave={() => setHover(null)}
      onClick={expand}
    >
      {expanded ? (
        <textarea
          className="cell notes-edit"
          value={value}
          rows={noteRows}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setExpanded(false)}
          onClick={(e) => e.stopPropagation()}
          aria-label={ariaLabel}
        />
      ) : (
        <input
          className="cell notes-compact"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={expand}
          aria-label={ariaLabel}
        />
      )}
      {hover && !expanded && hover.text.trim()
        ? createPortal(
            <div
              className={`notes-preview${hover.above ? ' above' : ''}`}
              style={{ left: hover.left, top: hover.top }}
              role="tooltip"
            >
              {hover.text}
            </div>,
            document.body,
          )
        : null}
    </td>
  );
}
