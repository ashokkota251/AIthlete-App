interface Props {
  /** 0–1 */
  percent: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  stroke?: number;
  /** Optional center label override; defaults to "{n}%". */
  label?: string;
  /** Optional subline under the percent. */
  subline?: string;
}

export function GoalProgressRing({
  percent,
  size = 74,
  stroke = 8,
  label,
  subline = "READY",
}: Props) {
  const pct = Math.max(0, Math.min(1, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashoff = c * (1 - pct);
  const readyPct = Math.round(pct * 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1E7E0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#F2541B"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c.toFixed(0)}
        strokeDashoffset={dashoff.toFixed(0)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          animation: `ringFill 1.1s cubic-bezier(0.4,0,0.2,1) 0.2s both`,
          ["--ring-target" as never]: dashoff.toFixed(0),
        }}
      />
      <text
        x={size / 2}
        y={size / 2 - 1}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize={Math.round(size * 0.22)}
        fill="#1B1620"
      >
        {label ?? `${readyPct}%`}
      </text>
      <text
        x={size / 2}
        y={size / 2 + Math.round(size * 0.18)}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="600"
        fontSize={Math.round(size * 0.11)}
        fill="#9C948D"
      >
        {subline}
      </text>
    </svg>
  );
}
