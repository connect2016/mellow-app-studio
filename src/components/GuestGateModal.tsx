import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface GuestGateModalProps {
  open: boolean;
  onClose: () => void;
  action?: string;
}

export function GuestGateModal({ open, onClose, action = 'do that' }: GuestGateModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <Sparkles className="h-7 w-7 text-secondary" />
              </div>

              <h2
                className="text-xl font-bold text-foreground mb-1"
               
              >
                Sign Up to Join the Fun
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Create a free account to {action} and connect with Cubs fans in Wrigleyville.
              </p>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full rounded-full bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90"
                size="lg"
              >
                Join Wrigleyville Buddies
              </Button>

              <button
                onClick={onClose}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep browsing as guest
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
