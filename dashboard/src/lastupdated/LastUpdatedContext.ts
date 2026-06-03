import { createContext } from 'react';

export interface LastUpdatedContextValue {
  lastUpdated: Date | null;
  setLastUpdated: (d: Date | null) => void;
}

export const LastUpdatedContext = createContext<
  LastUpdatedContextValue | undefined
>(undefined);
