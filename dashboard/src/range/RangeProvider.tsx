import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DateRange } from '../types';
import { daysAgoISO, todayISO } from '../lib/format';
import { RangeContext } from './RangeContext';
import type { RangeContextValue } from './RangeContext';

/** Default global filter: last 7 days (inclusive of today). */
function defaultRange(): DateRange {
  return { from: daysAgoISO(6), to: todayISO() };
}

export function RangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(defaultRange);

  const value = useMemo<RangeContextValue>(() => ({ range, setRange }), [range]);

  return <RangeContext.Provider value={value}>{children}</RangeContext.Provider>;
}
