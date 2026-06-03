import { useContext } from 'react';
import { LastUpdatedContext } from './LastUpdatedContext';
import type { LastUpdatedContextValue } from './LastUpdatedContext';

export function useLastUpdated(): LastUpdatedContextValue {
  const ctx = useContext(LastUpdatedContext);
  if (!ctx) {
    throw new Error('useLastUpdated must be used within a LastUpdatedProvider');
  }
  return ctx;
}
