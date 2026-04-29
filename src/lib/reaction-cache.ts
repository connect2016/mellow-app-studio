/**
 * Reactions are now icon components (no images to preload).
 * Kept as a no-op to preserve callers; safe to remove later.
 */

export function preloadReactionImages(): void {
  // no-op: reactions are SVG icons rendered inline
}

export function getCachedReaction(_key: string): undefined {
  return undefined;
}
