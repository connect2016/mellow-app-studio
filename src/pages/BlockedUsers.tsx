import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { useMyBlockedUsers, useUnblockUser } from '@/hooks/useBlockAndReport';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { data: blockedUsers = [], isLoading } = useMyBlockedUsers();
  const unblockUser = useUnblockUser();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-lg px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="h-11 w-11 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Blocked Users</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Blocked fans can't see your profile, message you, or appear in your feeds. Unblocking
          reverses this immediately.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border px-4 py-10 text-center">
            <Ban className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
          </div>
        ) : (
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {blockedUsers.map((u) => (
              <li key={u.user_id} className="flex items-center gap-3 p-4 min-h-[64px]">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {u.profile_photo ? (
                    <img
                      src={u.profile_photo}
                      alt={u.display_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ConceptIcon name="baseball" className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="flex-1 min-w-0 truncate text-[15px] font-semibold">
                  {u.display_name || 'Fan'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={unblockUser.isPending}
                  onClick={() => unblockUser.mutate(u.user_id)}
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
