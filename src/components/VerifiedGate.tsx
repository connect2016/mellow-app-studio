import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VerifiedGateProps {
  featureName: string;
}

/**
 * Shows a prompt to get verified before accessing a feature.
 */
export function VerifiedGate({ featureName }: VerifiedGateProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
        Verified Fans Only
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {featureName} is available to Verified Fans. Take a quick selfie to get your blue checkmark and unlock this feature.
      </p>
      <Button onClick={() => navigate('/verify')} className="rounded-xl gap-2 font-semibold">
        <ShieldCheck className="h-4 w-4" />
        Get Verified
      </Button>
    </motion.div>
  );
}
