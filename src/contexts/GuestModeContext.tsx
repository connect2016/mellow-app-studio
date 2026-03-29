import { createContext, useContext, useState, ReactNode } from 'react';

interface GuestModeContextType {
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType>({
  isGuest: false,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
});

export const useGuestMode = () => useContext(GuestModeContext);

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);

  return (
    <GuestModeContext.Provider
      value={{
        isGuest,
        enterGuestMode: () => setIsGuest(true),
        exitGuestMode: () => setIsGuest(false),
      }}
    >
      {children}
    </GuestModeContext.Provider>
  );
}
