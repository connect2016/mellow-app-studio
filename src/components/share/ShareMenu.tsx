import { useState, MouseEvent } from 'react';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export interface ShareMenuProps {
  /** Title shown in the share sheet header. */
  title?: string;
  /** Short description of the thing being shared (e.g. meetup title). */
  shareTitle: string;
  /** Location/venue or context line (e.g. "Murphy's Bleachers"). */
  location?: string;
  /** Canonical URL to share. */
  shareUrl: string;
  /** Optional className for the trigger button. */
  className?: string;
  /** Visual size of the trigger icon button. */
  size?: 'sm' | 'md';
}

function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#25D366" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.3 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0s-.5.1-.8.4c-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.3c1.3.7 2.9 1.1 4.7 1.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.1l-.3-.2-3.2.8.9-3.1-.2-.3C4.2 14.9 3.8 13.5 3.8 12c0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2z" />
    </svg>
  );
}

function XIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#000" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.01L4.6 22H1.34l8.03-9.17L1 2h7.02l4.84 6.4L18.244 2zm-2.4 18h1.9L7.26 4H5.26l10.585 16z" />
    </svg>
  );
}

function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
    </svg>
  );
}

export function ShareMenu({
  title = 'Share',
  shareTitle,
  location,
  shareUrl,
  className,
  size = 'md',
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const dims = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  const whatsAppMsg = location
    ? `Join me for the Cubs game! ${shareTitle} at ${location} — ${shareUrl}`
    : `Join me for the Cubs game! ${shareTitle} — ${shareUrl}`;

  const xText = location
    ? `Watching the Cubs at ${location}! Find your crew at cubbiesbuddies.com ⚾ #CubsTogether #ChicagoCubs`
    : `${shareTitle} — find your Cubs crew at cubbiesbuddies.com ⚾ #CubsTogether #ChicagoCubs`;

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTrigger = (e: MouseEvent) => {
    stop(e);
    setOpen(true);
  };

  const handleWhatsApp = (e: MouseEvent) => {
    stop(e);
    openInNewTab(`https://wa.me/?text=${encodeURIComponent(whatsAppMsg)}`);
    setOpen(false);
  };

  const handleX = (e: MouseEvent) => {
    stop(e);
    openInNewTab(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl)}`
    );
    setOpen(false);
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleInstagramOrCopy = async (e: MouseEvent) => {
    stop(e);
    if (canNativeShare) {
      try {
        await navigator.share({
          title: 'Cubs Game Day — Cubbies Buddies',
          text: 'Find your Cubs crew at cubbiesbuddies.com',
          url: shareUrl,
        });
        setOpen(false);
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        aria-label="Share"
        className={`inline-flex ${dims} items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border text-foreground/80 hover:text-primary hover:border-primary/40 transition active:scale-95 ${className ?? ''}`}
      >
        <Share2 className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-5 bg-white text-[#1a1f2e] border-t-0"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader className="text-left mb-3">
            <SheetTitle className="text-base font-bold text-[#1a1f2e]">{title}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="h-[52px] flex items-center gap-3 px-2 border-b border-[#f0f0f0] text-left active:bg-[#fafafa]"
            >
              <WhatsAppIcon />
              <span className="text-sm font-semibold">Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleX}
              className="h-[52px] flex items-center gap-3 px-2 border-b border-[#f0f0f0] text-left active:bg-[#fafafa]"
            >
              <XIcon />
              <span className="text-sm font-semibold">Share on X</span>
            </button>

            <button
              type="button"
              onClick={handleInstagramOrCopy}
              className="h-[52px] flex items-center gap-3 px-2 text-left active:bg-[#fafafa]"
            >
              {canNativeShare ? <InstagramIcon /> : copied ? <Check className="h-5 w-5 text-[#0E3386]" /> : <LinkIcon className="h-5 w-5 text-[#1a1f2e]" />}
              <span className="text-sm font-semibold">
                {canNativeShare ? 'Share to Instagram / More' : copied ? 'Link copied!' : 'Copy link'}
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
