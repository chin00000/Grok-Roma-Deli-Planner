import { money } from '../format';

const PALETTE = ['#5f6e3d', '#c4a574', '#8c7a62', '#3f6b4a', '#9a6b2f'];

export function StackBar({
  parts,
}: {
  parts: { label: string; value: number; color?: string }[];
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  return (
    <>
      <div className="bar" aria-hidden="true">
        {parts.map((p, i) => (
          <span
            key={p.label}
            style={{
              width: `${(Math.max(0, p.value) / total) * 100}%`,
              background: p.color ?? PALETTE[i % PALETTE.length],
            }}
          />
        ))}
      </div>
      <div className="legend">
        {parts.map((p, i) => (
          <span key={p.label}>
            <i className="swatch" style={{ background: p.color ?? PALETTE[i % PALETTE.length] }} />
            {p.label} · {money(p.value)}
          </span>
        ))}
      </div>
    </>
  );
}

export function Donut({
  parts,
}: {
  parts: { label: string; value: number; color?: string }[];
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="row">
      <svg className="chart" viewBox="0 0 120 120" role="img" aria-label="Revenue mix">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--paper-2)" strokeWidth="14" />
        {parts.map((p, i) => {
          const frac = total === 0 ? 0 : Math.max(0, p.value) / total;
          const dash = frac * c;
          const el = (
            <circle
              key={p.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={p.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="13" fill="currentColor">
          Mix
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" fill="currentColor">
          {money(total)}
        </text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column' }}>
        {parts.map((p, i) => (
          <span key={p.label}>
            <i className="swatch" style={{ background: p.color ?? PALETTE[i % PALETTE.length] }} />
            {p.label} · {money(p.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PayoffChart({
  series,
  colors,
}: {
  series: { name: string; points: { month: number; closing: number }[] }[];
  colors: string[];
}) {
  const maxM = Math.max(12, ...series.map((s) => s.points.length - 1), 1);
  const maxY = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.closing)));
  const w = 640;
  const h = 200;
  const pad = { l: 44, r: 12, t: 12, b: 24 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const x = (m: number) => pad.l + (m / maxM) * iw;
  const y = (v: number) => pad.t + (1 - v / maxY) * ih;
  const path = (pts: { month: number; closing: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.month)},${y(p.closing)}`).join(' ');

  return (
    <svg className="pay-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Debt payoff">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={y(maxY * t)}
            y2={y(maxY * t)}
            stroke="currentColor"
            opacity="0.12"
          />
          <text x={4} y={y(maxY * t) + 4} fontSize="10" fill="currentColor" opacity="0.6">
            {money(maxY * t)}
          </text>
        </g>
      ))}
      {series.map((s, i) => (
        <path key={s.name} d={path(s.points.slice(0, maxM + 1))} fill="none" stroke={colors[i]} strokeWidth="2.4" />
      ))}
      <text x={pad.l} y={h - 6} fontSize="10" fill="currentColor" opacity="0.6">
        Month 0
      </text>
      <text x={w - 70} y={h - 6} fontSize="10" fill="currentColor" opacity="0.6">
        Month {maxM}
      </text>
    </svg>
  );
}
