import { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared typography primitives. Each component:
 *  - applies an opinionated default type-scale class string
 *  - merges a caller-supplied `className` last (via tailwind-merge in `cn`)
 *    so callers can override any default without `!important`
 *  - accepts an `as` prop for polymorphic rendering
 *
 * NOTE: The default colors use `neutral-*` per spec. The project's broader
 * design system prefers semantic tokens (`text-foreground`,
 * `text-muted-foreground`) which handle dark mode automatically. Pass those
 * via `className` when integrating with themed surfaces.
 *
 * `CardTitle` is intentionally NOT exported here — it would collide with
 * shadcn's existing `CardTitle` from `@/components/ui/card`. Use `CardHeading`.
 */

type TypographyProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function PageTitle<T extends ElementType = "h1">({
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag
      className={cn(
        "text-2xl font-semibold leading-tight text-neutral-900 dark:text-white",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading<T extends ElementType = "h2">({
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag
      className={cn(
        "text-lg font-medium leading-snug text-neutral-800 dark:text-neutral-100",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeading<T extends ElementType = "h3">({
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? "h3") as ElementType;
  return (
    <Tag
      className={cn(
        "text-base font-medium text-neutral-800 dark:text-neutral-200",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function BodyText<T extends ElementType = "p">({
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag
      className={cn(
        "text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Caption<T extends ElementType = "span">({
  as,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={cn(
        "text-xs text-neutral-500 dark:text-neutral-500",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
