import { REACTIONS } from '@/components/reactions/reactionData';

const imageCache = new Map<string, HTMLImageElement>();

/** Preload all reaction images into browser cache */
export function preloadReactionImages(): void {
  REACTIONS.forEach((r) => {
    if (imageCache.has(r.key)) return;
    const img = new Image();
    img.src = r.image;
    img.decoding = 'async';
    imageCache.set(r.key, img);
  });
}

/** Get a cached image element if available */
export function getCachedReaction(key: string): HTMLImageElement | undefined {
  return imageCache.get(key);
}
