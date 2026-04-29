/**
 * ConceptThumb — circular-cropped real-photo thumbnail for feature
 * concepts (bars, food, baseball, fans, meetups). Used in data-driven
 * surfaces (carousel cards, list rows, section accents) instead of
 * outline icons.
 *
 * Use ConceptIcon for nav, buttons, inline labels.
 * Use ConceptThumb when you want a feature accent photo.
 */

import { cn } from '@/lib/utils';
import beerThumb from '@/assets/thumbs/beer.jpg';
import hotdogThumb from '@/assets/thumbs/hotdog.jpg';
import baseballThumb from '@/assets/thumbs/baseball.jpg';
import fansThumb from '@/assets/thumbs/fans.jpg';
import meetupThumb from '@/assets/thumbs/meetup.jpg';
import barThumb from '@/assets/thumbs/bar.jpg';
import ivyThumb from '@/assets/thumbs/ivy.jpg';
import scoreboardThumb from '@/assets/thumbs/scoreboard.jpg';
import pizzaThumb from '@/assets/thumbs/pizza.jpg';
import burgerThumb from '@/assets/thumbs/burger.jpg';
import coffeeThumb from '@/assets/thumbs/coffee.jpg';
import wflagThumb from '@/assets/thumbs/wflag.jpg';

/**
 * Map of concept keys → photo thumbnail src. Keys cover both
 * canonical concept names and the most common emoji characters
 * found in the data libraries (bars, eats, bucket list, etc.).
 */
export const THUMB_MAP: Record<string, string> = {
  // Drinks / bars
  beer: beerThumb,
  drink: beerThumb,
  cocktails: beerThumb,
  'craft-beer': beerThumb,
  '🍺': beerThumb,
  '🍻': beerThumb,
  '🍷': beerThumb,
  '🍹': beerThumb,
  '🥃': beerThumb,
  '🍸': beerThumb,
  bar: barThumb,
  'sports-bar': barThumb,
  '🏟️': barThumb,
  '📺': barThumb,

  // Food
  hotdog: hotdogThumb,
  '🌭': hotdogThumb,
  pizza: pizzaThumb,
  '🍕': pizzaThumb,
  burger: burgerThumb,
  burgers: burgerThumb,
  '🍔': burgerThumb,
  coffee: coffeeThumb,
  '☕': coffeeThumb,

  // Baseball
  baseball: baseballThumb,
  '⚾': baseballThumb,
  scoreboard: scoreboardThumb,
  ivy: ivyThumb,
  '🌿': ivyThumb,
  '🍃': ivyThumb,
  wflag: wflagThumb,
  '🏳️': wflagThumb,

  // People / social
  fans: fansThumb,
  fan: fansThumb,
  '🐻': fansThumb,
  bear: fansThumb,
  cubs: fansThumb,
  '👥': fansThumb,
  '👫': fansThumb,
  '👬': fansThumb,
  '👭': fansThumb,
  crew: fansThumb,
  meetup: meetupThumb,
  meetups: meetupThumb,
  '🍴': meetupThumb,
  '🍽️': meetupThumb,
  food: meetupThumb,
  eats: meetupThumb,
};

/**
 * Returns the photo src for a given concept key, or null when
 * no thumbnail exists (caller should fall back to ConceptIcon).
 */
export function getConceptThumb(name: string | undefined | null): string | null {
  if (!name) return null;
  const key = name.trim();
  return THUMB_MAP[key] ?? THUMB_MAP[key.toLowerCase()] ?? null;
}

const SIZE_CLASS: Record<NonNullable<ConceptThumbProps['size']>, string> = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

export interface ConceptThumbProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'size'> {
  /** Concept key (e.g. "beer") or emoji char (e.g. "🍺"). */
  name: string | undefined | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ringClassName?: string;
}

/**
 * Renders a circular real-photo thumbnail with a subtle ring.
 * Returns null when no thumbnail exists for the concept — callers
 * usually pair it with ConceptIcon as a fallback.
 */
export function ConceptThumb({
  name,
  size = 'sm',
  className,
  ringClassName,
  alt,
  ...rest
}: ConceptThumbProps) {
  const src = getConceptThumb(name);
  if (!src) return null;
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0',
        'ring-1 ring-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        SIZE_CLASS[size],
        ringClassName,
        className,
      )}
    >
      <img
        src={src}
        alt={alt ?? (typeof name === 'string' ? name : '')}
        loading="lazy"
        decoding="async"
        width={120}
        height={120}
        className="h-full w-full object-cover"
        draggable={false}
        {...rest}
      />
    </span>
  );
}

/**
 * "Smart" concept visual: renders ConceptThumb when a photo exists,
 * otherwise falls back to ConceptIcon. Drop-in replacement for
 * places that previously rendered `{item.emoji}` as text.
 */
export function ConceptVisual({
  name,
  size = 'sm',
  className,
  iconClassName,
}: {
  name: string | undefined | null;
  size?: ConceptThumbProps['size'];
  className?: string;
  iconClassName?: string;
}) {
  const src = getConceptThumb(name);
  if (src) {
    return <ConceptThumb name={name} size={size} className={className} />;
  }
  // Lazy require to avoid a circular import at module init time.
  const { ConceptIcon } = require('./ConceptIcon') as typeof import('./ConceptIcon');
  return (
    <ConceptIcon
      name={name ?? ''}
      className={cn(
        SIZE_CLASS[size ?? 'sm'],
        'text-foreground/80',
        iconClassName ?? className,
      )}
    />
  );
}
