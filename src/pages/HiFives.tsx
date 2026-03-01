import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { MOCK_USERS } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const mockHiFives = [
  { id: '1', fromUserId: '2', time: '5 min ago', responded: false },
  { id: '2', fromUserId: '4', time: '2 hours ago', responded: false },
  { id: '3', fromUserId: '5', time: 'Yesterday', responded: true },
];

export default function HiFives() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <h2 className="mb-1 text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Hi-Fives</h2>
        <p className="mb-6 text-sm text-muted-foreground">Fans who sent you a Hi-Five 🖐️</p>

        {mockHiFives.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">🖐️</p>
            <p className="mt-2 font-semibold">No hi-fives yet</p>
            <p className="text-sm text-muted-foreground">Keep browsing—they'll come!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mockHiFives.map((hf) => {
              const user = MOCK_USERS.find((u) => u.id === hf.fromUserId);
              if (!user) return null;
              return (
                <motion.div
                  key={hf.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4"
                >
                  <img src={user.profile_photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">{hf.time}</p>
                  </div>
                  {!hf.responded ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => toast({ title: '🖐️ Hi-Five returned!', description: `You and ${user.display_name} are now connected!` })}
                    >
                      Hi-Five Back
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Returned ✓</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
