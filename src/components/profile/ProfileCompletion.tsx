import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ProfileLike = {
  display_name?: string | null;
  profile_photo?: string | null;
  zip_code?: string | null;
  favorite_gate?: string | null;
  vibe_tags?: string[] | null;
};

type FieldKey = 'display_name' | 'profile_photo' | 'zip_code' | 'favorite_gate' | 'vibe_tags';

type FieldDef = {
  key: FieldKey;
  isComplete: (p: ProfileLike) => boolean;
  cta: string;
};

const FIELDS: FieldDef[] = [
  {
    key: 'display_name',
    isComplete: (p) =>
      !!p.display_name && p.display_name.trim().length > 0 && p.display_name.toUpperCase() !== 'FAN',
    cta: 'Add your fan name →',
  },
  {
    key: 'profile_photo',
    isComplete: (p) => !!p.profile_photo && p.profile_photo.trim().length > 0,
    cta: 'Add your photo →',
  },
  {
    key: 'zip_code',
    isComplete: (p) => !!p.zip_code && String(p.zip_code).trim().length > 0,
    cta: 'Set your location →',
  },
  {
    key: 'favorite_gate',
    isComplete: (p) => !!p.favorite_gate && String(p.favorite_gate).trim().length > 0,
    cta: 'Pick your favorite gate →',
  },
  {
    key: 'vibe_tags',
    isComplete: (p) => Array.isArray(p.vibe_tags) && p.vibe_tags.length > 0,
    cta: 'Choose your game-day vibe →',
  },
];

export function getProfileCompletion(profile: ProfileLike | null | undefined) {
  if (!profile) return { pct: 0, completed: 0, total: FIELDS.length, firstMissing: FIELDS[0] };
  const completedFlags = FIELDS.map((f) => f.isComplete(profile));
  const completed = completedFlags.filter(Boolean).length;
  const pct = Math.round((completed / FIELDS.length) * 100);
  const firstMissing = FIELDS.find((_, i) => !completedFlags[i]) ?? null;
  return { pct, completed, total: FIELDS.length, firstMissing };
}

export function ProfileCompletion({ profile }: { profile: ProfileLike }) {
  const navigate = useNavigate();
  const { pct, firstMissing } = getProfileCompletion(profile);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate width from 0 → pct on mount (CSS transition handles the timing)
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  if (pct >= 100 || !firstMissing) return null;

  return (
    <div className="rounded-2xl bg-card/90 backdrop-blur p-4 shadow-sm border border-border/50 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Your fan card is {pct}% complete
        </p>
        <span className="text-sm font-bold text-[#0E3386] tabular-nums">{pct}%</span>
      </div>

      <div
        className="w-full overflow-hidden rounded-[3px] bg-neutral-200"
        style={{ height: 6 }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-[3px] bg-[#0E3386]"
          style={{
            width: `${width}%`,
            transition: 'width 600ms ease-out',
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => navigate(`/onboarding?focus=${firstMissing.key}&edit=1`)}
        className="text-sm font-semibold text-[#0E3386] hover:underline underline-offset-4 min-h-[44px] flex items-center"
      >
        {firstMissing.cta}
      </button>
    </div>
  );
}

export function FullFanBadge() {
  return (
    <span className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
      Full Fan ✓
    </span>
  );
}
