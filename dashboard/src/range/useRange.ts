import { useContext } from 'react';
import { RangeContext } from './RangeContext';
import type { RangeContextValue } from './RangeContext';

export function useRange(): RangeContextValue {
  const ctx = useContext(RangeContext);
  if (!ctx) {
    throw new Error('useRange must be used within a RangeProvider');
  }
  return ctx;
}
