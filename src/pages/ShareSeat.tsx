import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrivacyLevel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Armchair } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

export default function ShareSeat() {
  const { toast } = useToast();
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [isBleachers, setIsBleachers] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyLevel>('MatchesOnly');

  const handleBleachers = () => {
    setIsBleachers(true);
    setSection('');
    setRow('');
    setSeat('');
  };

  const handleSave = () => {
    const location = isBleachers
      ? 'the Bleachers'
      : `Section ${section}${row ? `, Row ${row}` : ''}${seat ? `, Seat ${seat}` : ''}`;
    toast({
      title: '<ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Seat location shared!',
      description: `You're in ${location}`,
    });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(var(--stadium-seat))' }}>
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'hsl(var(--stadium-seat-dark))' }}
          >
            <MapPin className="h-7 w-7" style={{ color: 'hsl(var(--stadium-seat-foreground))' }} />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'hsl(var(--stadium-seat-foreground))' }}
          >
            Share Your Seat
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--stadium-seat-foreground) / 0.7)' }}>
            Let nearby fans know where you're sitting
          </p>
        </motion.div>

        {/* Seat form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-5 shadow-lg"
          style={{
            backgroundColor: 'hsl(var(--stadium-seat-dark) / 0.5)',
            borderColor: 'hsl(var(--stadium-seat-light) / 0.3)',
          }}
        >
          {/* Section / Row / Seat inputs */}
          <div className="space-y-4">
            <div>
              <Label
                className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                style={{ color: 'hsl(var(--stadium-seat-foreground) / 0.7)' }}
              >
                Your seat location
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Section"
                  value={isBleachers ? 'BLK' : section}
                  onChange={(e) => {
                    setIsBleachers(false);
                    setSection(e.target.value);
                  }}
                  disabled={isBleachers}
                  className="border-none text-center font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--stadium-seat-dark))',
                    color: 'hsl(var(--stadium-seat-foreground))',
                  }}
                />
                <Input
                  placeholder="Row"
                  value={row}
                  onChange={(e) => setRow(e.target.value)}
                  disabled={isBleachers}
                  className="border-none text-center font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--stadium-seat-dark))',
                    color: 'hsl(var(--stadium-seat-foreground))',
                  }}
                />
                <Input
                  placeholder="Seat"
                  value={seat}
                  onChange={(e) => setSeat(e.target.value)}
                  disabled={isBleachers}
                  className="border-none text-center font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--stadium-seat-dark))',
                    color: 'hsl(var(--stadium-seat-foreground))',
                  }}
                />
              </div>
            </div>

            {/* Choose Bleachers button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBleachers}
              className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold transition-all ${
                isBleachers ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: isBleachers
                  ? 'hsl(var(--stadium-seat-foreground))'
                  : 'hsl(var(--stadium-seat-light))',
                color: isBleachers
                  ? 'hsl(var(--stadium-seat-dark))'
                  : 'hsl(var(--stadium-seat-foreground))',
                
                
                '--tw-ring-color': 'hsl(var(--stadium-seat-foreground))',
                '--tw-ring-offset-color': 'hsl(var(--stadium-seat))',
              } as React.CSSProperties}
            >
              <Armchair className="h-5 w-5" />
              Choose Bleachers
            </motion.button>

            {isBleachers && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs"
                style={{ color: 'hsl(var(--stadium-seat-foreground) / 0.7)' }}
              >
                <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> Bleacher section selected — no seat number needed!
              </motion.p>
            )}
          </div>

          {/* Privacy selector */}
          <div className="mt-6">
            <Label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: 'hsl(var(--stadium-seat-foreground) / 0.7)' }}
            >
              Who can see this?
            </Label>
            <Select value={privacy} onValueChange={(v) => setPrivacy(v as PrivacyLevel)}>
              <SelectTrigger
                className="border-none"
                style={{
                  backgroundColor: 'hsl(var(--stadium-seat-dark))',
                  color: 'hsl(var(--stadium-seat-foreground))',
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Everyone</SelectItem>
                <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Button
            onClick={handleSave}
            className="w-full rounded-xl py-6 text-base font-bold border-none"
            style={{
              backgroundColor: 'hsl(var(--stadium-seat-foreground))',
              color: 'hsl(var(--stadium-seat-dark))',
              
            }}
          >
            Share My Seat
          </Button>
          <p
            className="mt-3 text-center text-xs"
            style={{ color: 'hsl(var(--stadium-seat-foreground) / 0.5)' }}
          >
            Your location will auto-expire after the game ends
          </p>
        </motion.div>
      </div>
    </div>
  );
}
