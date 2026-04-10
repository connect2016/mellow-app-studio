import { useState } from 'react';
import { MapPin, Eye, EyeOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBarCheckins } from '@/hooks/useBarCheckins';

interface Props {
  barName: string;
}

export function BarCheckInButton({ barName }: Props) {
  const { myCheckin, checkIn, checkOut } = useBarCheckins(barName);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const isCheckedInHere = myCheckin?.bar_name === barName;
  const isCheckedInElsewhere = myCheckin && !isCheckedInHere;

  if (isCheckedInHere) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => checkOut.mutate()}
        disabled={checkOut.isPending}
      >
        <LogOut className="h-4 w-4" />
        Check Out
      </Button>
    );
  }

  if (showPrivacy) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">How would you like to appear?</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="gap-1.5 rounded-xl min-h-[44px] text-xs font-bold"
            onClick={() => {
              checkIn.mutate({ barName, visibility: 'visible' });
              setShowPrivacy(false);
            }}
            disabled={checkIn.isPending}
          >
            <Eye className="h-3.5 w-3.5" />
            Visible
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 rounded-xl min-h-[44px] text-xs font-bold"
            onClick={() => {
              checkIn.mutate({ barName, visibility: 'incognito' });
              setShowPrivacy(false);
            }}
            disabled={checkIn.isPending}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Incognito
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      className="w-full gap-2 rounded-xl min-h-[48px] text-sm font-bold"
      onClick={() => setShowPrivacy(true)}
    >
      <MapPin className="h-4 w-4" />
      {isCheckedInElsewhere ? `Switch to ${barName}` : 'Check In Here'}
    </Button>
  );
}
