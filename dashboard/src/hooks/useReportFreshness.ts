import { useEffect } from 'react';
import { useLastUpdated } from '../lastupdated/useLastUpdated';

/**
 * Pushes a page's most-recent data timestamp up to the topbar "last updated"
 * readout. Pass the `lastUpdated` value from usePolledData.
 */
export function useReportFreshness(lastUpdated: Date | null): void {
  const { setLastUpdated } = useLastUpdated();
  useEffect(() => {
    if (lastUpdated) setLastUpdated(lastUpdated);
  }, [lastUpdated, setLastUpdated]);

  // Clear the readout when the page unmounts so a stale time isn't shown.
  useEffect(() => {
    return () => setLastUpdated(null);
  }, [setLastUpdated]);
}
