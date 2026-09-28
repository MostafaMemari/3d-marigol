import { useCallback, useState } from 'react';
import { DEFAULT_MATERIAL_VIEW } from '../lib/constants';
import type { MaterialViewSettings } from '../lib/constants';
import type { MaterialMapKind, MaterialShape } from '../types/material';

/** Owns the material-preview controls shown in the settings panel. */
export function useMaterialView() {
  const [view, setView] = useState<MaterialViewSettings>(DEFAULT_MATERIAL_VIEW);

  const setShape = useCallback((shape: MaterialShape) => {
    setView((v) => ({ ...v, shape, solo: null }));
  }, []);

  /** Switching material also leaves channel view, which is per material. */
  const setVariant = useCallback((variant: number) => {
    setView((v) => ({ ...v, variant, solo: null }));
  }, []);

  const setTile = useCallback((tile: number) => {
    setView((v) => ({ ...v, tile }));
  }, []);

  const setRelief = useCallback((relief: number) => {
    setView((v) => ({ ...v, relief }));
  }, []);

  /** Channel isolation view — tapping the active channel returns to the PBR preview. */
  const toggleSolo = useCallback((kind: MaterialMapKind) => {
    setView((v) => ({ ...v, solo: v.solo === kind ? null : kind }));
  }, []);

  const reset = useCallback(() => setView(DEFAULT_MATERIAL_VIEW), []);

  return { view, setShape, setVariant, setTile, setRelief, toggleSolo, reset };
}
