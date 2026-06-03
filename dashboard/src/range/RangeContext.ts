import { createContext } from 'react';
import type { DateRange } from '../types';

export interface RangeContextValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

export const RangeContext = createContext<RangeContextValue | undefined>(
  undefined,
);
