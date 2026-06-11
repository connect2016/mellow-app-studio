import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const CUBS_BLUE = 'hsl(var(--brand-navy))';

type Spoke = {
  key: string;
  label: string;
  icon: string;
  to: string;
  // translate relative to center (px)
  tx: number;
  ty: number;
};

const SPOKES: Spoke[] = [
  { key: 'hot-spots',    label: 'Hot Spots',    icon: 'fire',      to: '/bar-map',        tx:   8, ty:  -96 },
  { key: 'nearby',       label: 'Nearby',       icon: 'people',    to: '/buddy-heatmap',  tx: -40, ty:  -88 },
  { key: 'vibes',        label: 'Vibes',        icon: 'camera',    to: '/vibe-feed',      tx: -78, ty:  -60 },
  { key: 'missions',     label: 'Missions',     icon: 'trophy',    to: '/missions',       tx: -96, ty:  -20 },
  { key: 'hall-of-fame', label: 'Hall of Fame', icon: 'trophy',    to: '/league-leaders', tx: -92, ty:   24 },
  { key: 'field-guide',  label: 'Field Guide',  icon: 'check',     to: '#field-guide',    tx: -60, ty:   62 },
  { key: 'map',          label: 'Map',          icon: 'pin',       to: '/bar-map',        tx: -16, ty:   80 },
];

interface Props {
  activeKey?: string | null;
}

export function QuickMenuWheel({ activeKey = null }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSpoke = (s: Spoke) => {
    setOpen(false);
    if (s.to === '#field-guide') {
      window.dispatchEvent(new CustomEvent('open-field-guide'));
      return;
    }
    navigate(s.to);
  };

  return (
    <>
      {/* Backdrop tap-catcher */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 94,
            background: 'rgba(0,0,0,0.15)',
          }}
        />
      )}

      {/* Wheel container — anchors the spokes */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: 20,
          zIndex: 95,
          width: 60,
          height: 60,
        }}
      >
        {/* Spokes */}
        {SPOKES.map((s, i) => {
          const isActive = activeKey === s.key;
          return (
            <button
              key={s.key}
              type="button"
              aria-label={s.label}
              onClick={() => handleSpoke(s)}
              tabIndex={open ? 0 : -1}
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: isActive ? CUBS_BLUE : '#ffffff',
                border: `2px solid ${CUBS_BLUE}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                color: isActive ? '#ffffff' : CUBS_BLUE,
                transform: open
                  ? `translate(${s.tx}px, ${s.ty}px) scale(1)`
                  : 'translate(0, 0) scale(0)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transition: `transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40}ms, opacity 0.2s ease ${i * 40}ms, background-color 0.15s ease`,
              }}
            >
              <ConceptIcon name={s.icon} className="h-5 w-5" />
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  marginTop: 2,
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  color: isActive ? '#ffffff' : CUBS_BLUE,
                  maxWidth: 48,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}

        {/* "Quick Menu" floating label — only when collapsed */}
        {!open && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 66,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Quick Menu
          </span>
        )}

        {/* Center toggle button */}
        <button
          type="button"
          aria-label={open ? 'Close quick menu' : 'Open quick menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            position: 'absolute',
            inset: 0,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: CUBS_BLUE,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            color: '#ffffff',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {open ? (
            <X size={26} strokeWidth={2.5} />
          ) : (
            <ConceptIcon name="baseball" className="h-[26px] w-[26px]" />
          )}
        </button>
      </div>
    </>
  );
}

export default QuickMenuWheel;
