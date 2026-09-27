import { useMemo } from 'react';
import {
  QUERY_PARAM_ID,
  QUERY_PARAM_TYPE,
  buildMaterialUrl,
  buildModelUrl,
  normalizeAssetType,
} from '../lib/constants';
import type { AssetType } from '../types/model';

export interface ModelUrlResult {
  id: string | null;
  /** `?type=` — `model` (default) or `material`. */
  assetType: AssetType;
  /** Package URL for the requested type: `{id}.glb` or `{id}.zip`. */
  assetUrl: string | null;
  isMissing: boolean;
}

/** Reads `?id=` and `?type=` from the URL and builds the Arvan asset URL. */
export function useModelUrl(): ModelUrlResult {
  return useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get(QUERY_PARAM_ID) ?? '').trim();
      const assetType = normalizeAssetType(params.get(QUERY_PARAM_TYPE));
      if (!raw) return { id: null, assetType, assetUrl: null, isMissing: true };
      const assetUrl = assetType === 'material' ? buildMaterialUrl(raw) : buildModelUrl(raw);
      return { id: raw, assetType, assetUrl, isMissing: false };
    } catch {
      return {
        id: null,
        assetType: 'model',
        assetUrl: null,
        isMissing: true,
      };
    }
  }, []);
}
