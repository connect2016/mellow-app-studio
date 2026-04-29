import { cn } from '@/lib/utils';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export type WhenFilter = 'all' | 'soon' | 'today' | 'later';
export type WhereFilter = 'all' | 'wrigley' | 'bars';

interface MeetupFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  when: WhenFilter;
  onWhen: (v: WhenFilter) => void;
  where: WhereFilter;
  onWhere: (v: WhereFilter) => void;
}

const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'soon', label: 'Next hour' },
  { value: 'today', label: 'Today' },
  { value: 'later', label: 'Later' },
];

const WHERE_OPTIONS: { value: WhereFilter; label: string }[] = [
  { value: 'all', label: 'Anywhere' },
  { value: 'wrigley', label: ' Wrigley' },
  { value: 'bars', label: ' Bars' },
];

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all min-h-[36px]',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function MeetupFilters({ search, onSearch, when, onWhen, where, onWhere }: MeetupFiltersProps) {
  return (
    <div className="space-y-2.5">
      <input
        type="search"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search by bar, host, or vibe..."
        className="w-full h-11 rounded-full bg-muted px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="Search meetups"
      />
      <ChipRow options={WHEN_OPTIONS} value={when} onChange={onWhen} ariaLabel="Filter by time" />
      <ChipRow options={WHERE_OPTIONS} value={where} onChange={onWhere} ariaLabel="Filter by location" />
    </div>
  );
}
