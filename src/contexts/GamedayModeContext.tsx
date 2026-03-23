import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface GamedayModeContextType {
  gamedayMode: boolean;
  toggleGamedayMode: () => void;
}

const GamedayModeContext = createContext<GamedayModeContextType>({
  gamedayMode: false,
  toggleGamedayMode: () => {},
});

export function GamedayModeProvider({ children }: { children: ReactNode }) {
  const [gamedayMode, setGamedayMode] = useState(() => {
    try {
      return localStorage.getItem('gamedayMode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('gamedayMode', String(gamedayMode));
  }, [gamedayMode]);

  const toggleGamedayMode = () => setGamedayMode((prev) => !prev);

  return (
    <GamedayModeContext.Provider value={{ gamedayMode, toggleGamedayMode }}>
      {children}
    </GamedayModeContext.Provider>
  );
}

export const useGamedayMode = () => useContext(GamedayModeContext);
