import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export interface PolledData<T> {
  data: T | null;
  loading: boolean; // true only on the very first load (for the current deps)
  refreshing: boolean; // true on background refreshes
  error: string | null;
  lastUpdated: Date | null;
  reload: () => void;
}

interface Options {
  /** Polling interval in ms. Default 60000 (60s). 0 disables polling. */
  intervalMs?: number;
  /** Re-run the fetcher whenever any value in this array changes. */
  deps?: ReadonlyArray<unknown>;
}

/**
 * Generic data hook: fetches once, then polls on an interval. Distinguishes the
 * first load (`loading`) from background refreshes (`refreshing`) so the UI can
 * keep showing data while quietly updating. Tracks `lastUpdated`. When `deps`
 * change the data resets and a fresh load runs.
 */
export function usePolledData<T>(
  fetcher: () => Promise<T>,
  { intervalMs = 60000, deps = [] }: Options = {},
): PolledData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Keep the latest fetcher in a ref so the polling effect needn't depend on it.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Guards against state updates after unmount / after deps change mid-flight.
  const runIdRef = useRef(0);

  // `fresh` clears existing data and shows the main spinner; otherwise it's a
  // quiet background refresh that leaves current data in place.
  const runFetch = useCallback(async (fresh: boolean) => {
    const myRun = ++runIdRef.current;
    if (fresh) {
      setLoading(true);
      setData(null);
    } else {
      setRefreshing(true);
    }
    try {
      const result = await fetcherRef.current();
      if (myRun !== runIdRef.current) return; // superseded
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (myRun !== runIdRef.current) return;
      const message =
        err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(message);
    } finally {
      if (myRun === runIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Fresh load whenever deps change, then poll in the background. The setState
  // calls happen asynchronously inside runFetch (data fetching is exactly the
  // kind of external-system sync effects are for), so the set-state-in-effect
  // heuristic is a false positive here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runFetch(true);
    if (intervalMs <= 0) return;
    const id = window.setInterval(() => void runFetch(false), intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runFetch, intervalMs, ...deps]);

  const reload = useCallback(() => void runFetch(false), [runFetch]);

  return { data, loading, refreshing, error, lastUpdated, reload };
}
