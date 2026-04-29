import { useState, useRef, useCallback, useEffect } from 'react';
import { REACTIONS } from './reactionData';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
  onReact: (reaction: { type: string; body: string; key: string }) => void;
  children: React.ReactNode;
}

export function ReactionPicker({ onReact, children }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(true), 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {children}
      </div>

      {open && (
        <div
          className={cn(
            'absolute bottom-full left-0 mb-2 z-50 bg-card border border-border rounded-2xl shadow-lg p-2',
            'grid grid-cols-7 gap-1 min-w-[280px] sm:min-w-[340px]',
            'animate-scale-in'
          )}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                onReact({ type: 'reaction', body: r.shortText, key: r.key });
                setOpen(false);
              }}
              aria-label={r.label}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl hover:bg-primary/10 active:scale-90 transition-all duration-150 min-h-[44px] justify-center"
            >
              <ConceptIcon name={r.icon} className="h-5 w-5 text-foreground" />
              <span className="text-[7px] sm:text-[8px] font-medium text-muted-foreground leading-tight">{r.shortText}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

