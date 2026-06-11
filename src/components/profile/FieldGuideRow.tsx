import { ChevronRight, ClipboardList } from 'lucide-react';
import { useBucketList } from '@/hooks/useBucketList';

export function openFieldGuide() {
  window.dispatchEvent(new CustomEvent('open-field-guide'));
}

export function FieldGuideRow() {
  const { completedCount, totalCount } = useBucketList();

  return (
    <button
      type="button"
      onClick={openFieldGuide}
      aria-label={`Open Field Guide, ${completedCount} of ${totalCount} complete`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 12,
        margin: '12px 16px',
        cursor: 'pointer',
        width: 'calc(100% - 32px)',
        border: 'none',
        minHeight: 56,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ClipboardList size={20} style={{ color: 'hsl(var(--brand-navy))' }} aria-hidden="true" />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          Field Guide
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'hsl(var(--brand-navy))', fontWeight: 700, fontSize: 14 }}>
          {completedCount}/{totalCount}
        </span>
        <ChevronRight size={18} style={{ color: 'hsl(var(--brand-navy))' }} aria-hidden="true" />
      </span>
    </button>
  );
}
