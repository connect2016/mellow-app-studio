import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export function GuestBanner() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight truncate">
            You're viewing the Wrigleyville live feed.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Sign up to connect with fans!
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/auth')}
          className="shrink-0 rounded-full bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 gap-1.5 text-xs"
        >
          <Zap className="h-3.5 w-3.5" />
          Join Now
        </Button>
      </div>
    </motion.div>
  );
}
