import { cn } from "@/lib/utils";
import type { CSSProperties, HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
}

function Skeleton({ width, height, className, style, ...props }: SkeletonProps) {
  const mergedStyle: CSSProperties = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700", className)}
      style={mergedStyle}
      {...props}
    />
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="rounded-full" width={56} height={56} />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="shimmer rounded-full shrink-0" style={{ width: 44, height: 44 }} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="shimmer rounded-md" style={{ height: 14, width: '55%' }} />
          <div className="shimmer rounded-md" style={{ height: 10, width: '35%' }} />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="shimmer rounded-md" style={{ height: 10, width: '80%' }} />
        <div className="shimmer rounded-md" style={{ height: 10, width: '60%' }} />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="shimmer rounded-full" style={{ height: 24, width: 64 }} />
        <div className="shimmer rounded-full" style={{ height: 24, width: 48 }} />
      </div>
    </div>
  );
}

function CrewCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[72px]">
      <div className="shimmer rounded-xl" style={{ width: 48, height: 48, flexShrink: 0 }} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="shimmer rounded-md" style={{ height: 14, width: '50%' }} />
        <div className="shimmer rounded-md" style={{ height: 10, width: '70%' }} />
      </div>
      <div className="shimmer rounded-lg" style={{ height: 32, width: 72, flexShrink: 0 }} />
    </div>
  );
}

function BuddyListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Skeleton className="rounded-full" width={44} height={44} />
      <div className="flex-1 space-y-2">
        <Skeleton height={12} width="50%" />
        <Skeleton height={10} width="70%" />
      </div>
      <Skeleton height={32} width={72} className="rounded-lg" />
    </div>
  );
}

export { Skeleton, ProfileCardSkeleton, BuddyListItemSkeleton, CrewCardSkeleton, SkeletonCard };
