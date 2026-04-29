import { useNavigate } from 'react-router-dom';
import { useTeammates } from '@/hooks/useTeammates';
import { Users, ChevronRight } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export function TeammatesSummary() {
  const navigate = useNavigate();
  const { data: teammates, isLoading } = useTeammates();
  const count = teammates?.length ?? 0;
  const previews = (teammates ?? []).slice(0, 5);

  return (
    <button
      onClick={() => navigate('/dugout')}
      className="w-full rounded-2xl border-2 border-[#002F6C]/20 bg-white/95 p-4 text-left shadow-md hover:shadow-lg active:scale-[0.99] transition-all min-h-[72px] flex items-center gap-3"
    >
      <div className="h-12 w-12 rounded-xl bg-[#002F6C] text-white flex items-center justify-center shadow">
        <Users className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-[#002F6C] text-base">My Dugout</h3>
          <span className="rounded-full bg-[#C8102E] px-2 py-0.5 text-[11px] font-bold text-white">
            {isLoading ? '…' : count}
          </span>
        </div>
        <p className="text-xs text-[#002F6C]/70 mt-0.5">
          {count === 0 ? 'No Teammates yet — recruit some fans.' : 'Flip through your roster of Teammates'}
        </p>
        {previews.length > 0 && (
          <div className="mt-2 flex -space-x-2">
            {previews.map(t => (
              <div key={t.user_id} className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-white bg-[#002F6C]/20 flex items-center justify-center text-xs">
                {t.profile_photo ? (
                  <img src={t.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : ''}
              </div>
            ))}
            {count > previews.length && (
              <div className="h-7 w-7 rounded-full ring-2 ring-white bg-[#002F6C] text-white text-[10px] font-bold flex items-center justify-center">
                +{count - previews.length}
              </div>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-[#002F6C]/60" />
    </button>
  );
}
