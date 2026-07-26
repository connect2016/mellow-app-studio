/**
 * Neutral, unbranded fan silhouette used as a default avatar.
 * No team marks, no logos — just a fan in a plain ballcap on a navy backdrop.
 */
export function FanAvatarFallback({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', aspectRatio: '1 / 1', height: 'auto', display: 'block' }}
    >
      {/* Navy background */}
      <rect width="100" height="100" fill="hsl(var(--brand-navy))" />

      {/* Shoulders / torso */}
      <path
        d="M10 100 C 14 78, 30 70, 50 70 C 70 70, 86 78, 90 100 Z"
        fill="#E8ECF3"
        opacity="0.95"
      />

      {/* Head */}
      <circle cx="50" cy="48" r="18" fill="#E8ECF3" />

      {/* Ballcap crown (plain, unbranded) */}
      <path
        d="M32 42 C 32 30, 68 30, 68 42 L 68 46 L 32 46 Z"
        fill="hsl(var(--brand-navy))"
      />
      {/* Cap brim */}
      <path
        d="M28 46 L 72 46 C 74 46, 74 50, 72 50 L 50 52 L 32 50 C 30 50, 30 46, 32 46 Z"
        fill="hsl(var(--brand-navy))"
        opacity="0.92"
      />
      {/* Cap button */}
      <circle cx="50" cy="34" r="1.4" fill="#E8ECF3" opacity="0.7" />
    </svg>
  );
}
