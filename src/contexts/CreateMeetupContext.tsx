import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CreateMeetupModal } from '@/components/lineup/CreateMeetupModal';

export interface GameContext {
  opponent: string;
  gameDate: string;
  gameTime: string;
  gameDateTime: string;
  isHome: boolean;
}

interface CreateMeetupContextValue {
  open: (defaultLocation?: string, gameContext?: GameContext) => void;
  close: () => void;
  isOpen: boolean;
  gameContext: GameContext | undefined;
}

const CreateMeetupContext = createContext<CreateMeetupContextValue | null>(null);

export function CreateMeetupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState<string | undefined>();
  const [gameContext, setGameContext] = useState<GameContext | undefined>();

  const open = useCallback((loc?: string, gameCtx?: GameContext) => {
    setDefaultLocation(loc);
    setGameContext(gameCtx);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setGameContext(undefined), 300);
  }, []);

  return (
    <CreateMeetupContext.Provider value={{ open, close, isOpen, gameContext }}>
      {children}
      <CreateMeetupModal open={isOpen} onClose={close} defaultLocation={defaultLocation} gameContext={gameContext} />
    </CreateMeetupContext.Provider>
  );
}

export function useCreateMeetup() {
  const ctx = useContext(CreateMeetupContext);
  if (!ctx) throw new Error('useCreateMeetup must be used within CreateMeetupProvider');
  return ctx;
}
