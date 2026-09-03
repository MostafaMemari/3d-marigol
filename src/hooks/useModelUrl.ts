import { useMemo } from 'react';
import { QUERY_PARAM_ID, buildModelUrl } from '../lib/constants';

export interface ModelUrlResult {
  id: string | null;
  modelUrl: string | null;
  isMissing: boolean;
}

/** Reads `?id=` from the URL and builds the Arvan model URL. */
export function useModelUrl(): ModelUrlResult {
  return useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get(QUERY_PARAM_ID) ?? '').trim();
      if (!raw) return { id: null, modelUrl: null, isMissing: true };
      return { id: raw, modelUrl: buildModelUrl(raw), isMissing: false };
    } catch {
      return { id: null, modelUrl: null, isMissing: true };
    }
  }, []);
}
