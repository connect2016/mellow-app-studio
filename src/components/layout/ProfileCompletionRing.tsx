interface Props {
  /** 0–100 */
  percent: number;
  /** total diameter in px (icon + ring) */
  size?: number;
}

/**
 * 2px Cubs-blue progress ring around the Profile tab icon.
 * Renders nothing once percent >= 100.
 */
export function ProfileCompletionRing({ percent, size = 26 }: Props) {
  if (percent >= 100) return null;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="absolute inset-0 -m-[3px] pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={stroke}
      />
      {/* progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--brand-navy))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
