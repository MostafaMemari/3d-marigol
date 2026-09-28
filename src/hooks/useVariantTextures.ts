import { useEffect, useState } from 'react';
import { decodeVariantTextures, disposeTextures } from '../lib/materialPackage';
import type { MaterialPackage, MaterialTextures } from '../types/material';

export type VariantStatus = 'idle' | 'decoding' | 'ready';

export interface VariantTexturesResult {
  /** Decoded channels of the active variant; the previous set until the swap. */
  textures: MaterialTextures | null;
  status: VariantStatus;
}

/**
 * Decodes only the material the user is looking at, and releases the previous
 * one as soon as it changes. A package with twenty photos therefore holds two
 * textures at a time, not forty.
 */
export function useVariantTextures(
  material: MaterialPackage | null,
  index: number,
): VariantTexturesResult {
  const [textures, setTextures] = useState<MaterialTextures | null>(null);
  const [status, setStatus] = useState<VariantStatus>('idle');

  useEffect(() => {
    const variant = material?.variants[index];
    if (!material || !variant) return;

    let cancelled = false;
    setStatus('decoding');

    void decodeVariantTextures(material.sources, variant).then((decoded) => {
      if (cancelled) {
        disposeTextures(decoded);
        return;
      }
      setTextures(decoded);
      setStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [material, index]);

  // The previously decoded set leaves the GPU as soon as it is replaced.
  useEffect(() => () => disposeTextures(textures), [textures]);

  return { textures, status };
}
