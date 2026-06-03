import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LastUpdatedContext } from './LastUpdatedContext';
import type { LastUpdatedContextValue } from './LastUpdatedContext';

/**
 * Holds the timestamp of the most recent successful data refresh so the topbar
 * can show a single "อัปเดตล่าสุด" readout regardless of which page is active.
 */
export function LastUpdatedProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const value = useMemo<LastUpdatedContextValue>(
    () => ({ lastUpdated, setLastUpdated }),
    [lastUpdated],
  );
  return (
    <LastUpdatedContext.Provider value={value}>
      {children}
    </LastUpdatedContext.Provider>
  );
}
