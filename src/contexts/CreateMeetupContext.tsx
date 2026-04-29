import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';

interface CreateMeetupContextValue {
  open: (defaultLocation?: string) => void;
  close: () => void;
  isOpen: boolean;
}

const CreateMeetupContext = createContext<CreateMeetupContextValue | null>(null);

export function CreateMeetupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState<string | undefined>();

  const open = useCallback((loc?: string) => {
    setDefaultLocation(loc);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <CreateMeetupContext.Provider value={{ open, close, isOpen }}>
      {children}
      <CreateMeetupModal open={isOpen} onClose={close} defaultLocation={defaultLocation} />
    </CreateMeetupContext.Provider>
  );
}

export function useCreateMeetup() {
  const ctx = useContext(CreateMeetupContext);
  if (!ctx) throw new Error('useCreateMeetup must be used within CreateMeetupProvider');
  return ctx;
}
