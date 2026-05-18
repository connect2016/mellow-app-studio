import { useFanFlair } from '@/hooks/useFanFlair';

interface Props {
  userId?: string | null;
  className?: string;
}

const PILL_STYLE: React.CSSProperties = {
  background: 'rgba(14, 51, 134, 0.12)',
  color: '#0E3386',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.05em',
  border: '1px solid rgba(14, 51, 134, 0.25)',
  borderRadius: 20,
  padding: '2px 8px',
  textTransform: 'uppercase',
};

/** Small pill rendered on the front of the profile card, beneath the nameplate / streak. */
export function FanFlairBadge({ userId, className }: Props) {
  const { data } = useFanFlair(userId);
  if (!data?.current) return null;
  return (
    <span
      className={className}
      style={PILL_STYLE}
      title={data.current.description}
      aria-label={`Fan flair: ${data.current.label}`}
    >
      {data.current.label}
    </span>
  );
}
