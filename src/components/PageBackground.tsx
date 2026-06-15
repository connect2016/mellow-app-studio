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
      {/* Photo */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
          // Prefer crisp downscaling on retina/mobile; avoid any inherited blur.
          imageRendering: 'auto',
          filter: 'none',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      />
      {/* Solid navy scrim — 55% */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'hsl(var(--brand-navy) / 0.55)' }}
      />
      {/* Bottom-anchoring gradient — navy/75% at bottom → transparent */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--brand-navy) / 0.75) 0%, hsl(var(--brand-navy) / 0.25) 35%, transparent 70%)',
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
