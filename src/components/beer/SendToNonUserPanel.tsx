import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarLocationPreview } from '@/components/BarLocationPreview';
import { findParticipatingBar, PARTICIPATING_BARS, type ParticipatingBar } from '@/lib/wrigleyville-bar-coords';
import {
  UserPlus, MapPin, Share2, Copy, Check, ChevronRight, MessageSquare, Beer,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  amount: number;
  note: string;
  onClaimGenerated: (url: string, recipientName: string) => void;
}

export function SendToNonUserPanel({ amount, note, onClaimGenerated }: Props) {
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [selectedBar, setSelectedBar] = useState<ParticipatingBar | null>(null);
  const [showBarPicker, setShowBarPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');
  const [generated, setGenerated] = useState(false);

  const generateClaimLink = useCallback(() => {
    if (!friendName.trim()) {
      toast.error('Enter your friend\'s name');
      return;
    }
    const bar = selectedBar || PARTICIPATING_BARS[0];
    // Encode claim data (in production, save to DB and return an ID)
    const payload = btoa(`${friendName}|${amount}|${note}|${bar.slug}|${bar.name}|${new Date().toISOString()}`);
    const url = `${window.location.origin}/claim/${payload}`;
    setClaimUrl(url);
    setGenerated(true);
    onClaimGenerated(url, friendName);
  }, [friendName, amount, note, selectedBar, onClaimGenerated]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Claim link copied!');
  };

  const handleShareSMS = () => {
    const text = ` ${friendName}, someone bought you a beer on Wrigleyville Buddies! Claim it here: ${claimUrl}`;
    if (friendPhone) {
      window.open(`sms:${friendPhone}?body=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleShareNative = async () => {
    const shareData = {
      title: ' You got a beer!',
      text: `${friendName}, someone bought you a beer on Wrigleyville Buddies! Claim it now.`,
      url: claimUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  if (generated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3"
      >
        <div className="text-center">
          <p className="text-3xl mb-1"></p>
          <p className="text-sm font-bold text-foreground">Claim link ready for {friendName}!</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Send it via text, DM, or any way you want. They'll sign up and redeem at the bar.
          </p>
        </div>

        {/* Link display */}
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
          <p className="flex-1 text-[11px] text-muted-foreground truncate font-mono">{claimUrl}</p>
          <button onClick={handleCopy} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Share actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={handleShareSMS}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Send via Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={handleShareNative}
          >
            <Share2 className="h-3.5 w-3.5" /> Share Link
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
           When {friendName} taps the link, they'll create a free account and see their beer voucher instantly.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <p className="text-xs font-bold text-foreground">Send to someone not on the app yet</p>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Their name</label>
          <Input
            placeholder="e.g. Jake"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            Phone number <span className="text-muted-foreground/60">(optional, for SMS)</span>
          </label>
          <Input
            type="tel"
            placeholder="+1 555-123-4567"
            value={friendPhone}
            onChange={(e) => setFriendPhone(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Bar picker */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Redeem at</label>
          {selectedBar ? (
            <div className="rounded-xl border border-border p-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs font-semibold text-foreground flex-1">{selectedBar.name}</p>
                <button
                  onClick={() => { setSelectedBar(null); setShowBarPicker(true); }}
                  className="text-[10px] text-primary font-semibold"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto rounded-xl border border-border p-2">
              {PARTICIPATING_BARS.map((bar) => (
                <button
                  key={bar.slug}
                  onClick={() => { setSelectedBar(bar); setShowBarPicker(false); }}
                  className="flex items-center gap-2 w-full rounded-lg p-2 hover:bg-muted/60 transition-colors text-left"
                >
                  <span className="text-sm"></span>
                  <p className="text-xs font-medium text-foreground flex-1 truncate">{bar.name}</p>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={generateClaimLink}
          disabled={!friendName.trim()}
          className="w-full rounded-2xl gap-2 text-sm font-semibold"
        >
          <Beer className="h-4 w-4" />
          Generate Claim Link for {friendName || '…'}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          They'll get a link to sign up & redeem their beer — no app download needed.
        </p>
      </div>
    </motion.div>
  );
}
