import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared app background using the Wrigley Field rainbow photo.
 * - Fixed cover image with parallax via background-attachment: fixed
 * - Dark gradient overlay (::before via .wrigley-rainbow-bg in index.css)
 * - All children render above overlay (z-index: 1)
 */
export function WrigleyRainbowBackground({ children, className = '' }: Props) {
  return (
    <div className={`wrigley-rainbow-bg ${className}`}>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
