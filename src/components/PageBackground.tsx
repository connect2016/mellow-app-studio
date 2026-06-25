import React from 'react';

interface PageBackgroundProps {
  /** Imported image URL (e.g. `import bg from '@/assets/...'`) or absolute path */
  image: string;
  /** Page content rendered above the scrim. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared full-bleed photo background with a consistent scrim:
 *  - Photo layer (cover, centered, fixed)
 *  - Solid navy overlay at 55% opacity
 *  - Subtle gradient anchoring the bottom nav area
 *    (from navy/75% at the bottom → transparent toward the top)
 *
 * Every page using a photo background should use this component so the visual
 * family stays consistent and foreground text remains legible (white).
 */
export function PageBackground({ image, children, className = '' }: PageBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Navy base — fills any letterbox gaps from `contain` framing on mobile */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'hsl(var(--brand-navy))' }}
      />
      {/* Photo — `contain` on mobile (shows full composition), `cover` on desktop */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 z-0 h-full w-full object-cover object-center pointer-events-none select-none"
        decoding="async"
        draggable={false}
      />
      {/* Solid navy scrim — 55% */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'hsl(var(--brand-navy) / 0.18)' }}
      />
      {/* Bottom-anchoring gradient — navy/75% at bottom → transparent */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--brand-navy) / 0.40) 0%, hsl(var(--brand-navy) / 0.12) 35%, transparent 70%)',
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
