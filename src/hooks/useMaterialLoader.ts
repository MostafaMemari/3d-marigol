import { useEffect, useState } from 'react';
import { useAssetDownload } from './useAssetDownload';
import { MATERIAL_BLOB_TYPE, MATERIAL_EXTRACT_PROGRESS } from '../lib/constants';
import { extractMaterialPackage } from '../lib/materialPackage';
import type { LoaderState, ModelErrorKind } from '../types/model';
import type { MaterialPackage } from '../types/material';

export interface MaterialLoaderResult {
  state: LoaderState;
  /** Unpacked package (variants + thumbnails), or null until extraction ends. */
  material: MaterialPackage | null;
  hasAsset: boolean;
  retry: () => void;
}

/**
 * Downloads a material ZIP and unpacks it in the browser, reporting progress
 * through the same `LoaderState` the model viewer uses so the shell keeps a
 * single loading and error path. Textures are decoded later, per variant.
 */
export function useMaterialLoader(materialUrl: string | null): MaterialLoaderResult {
  const download = useAssetDownload(materialUrl, { blobType: MATERIAL_BLOB_TYPE });
  const [material, setMaterial] = useState<MaterialPackage | null>(null);
  const [failure, setFailure] = useState<ModelErrorKind | null>(null);

  // New URL or a retry empties the archive: drop the preview while it reloads.
  useEffect(() => {
    if (download.blob) return;
    setMaterial(null);
    setFailure(null);
  }, [download.blob]);

  useEffect(() => {
    const archive = download.blob;
    if (!archive) return;

    let cancelled = false;

    void extractMaterialPackage(archive).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setFailure(result.kind);
        return;
      }
      setMaterial(result.value);
    });

    return () => {
      cancelled = true;
    };
  }, [download.blob]);

  const extracting = download.blob !== null && material === null && failure === null;

  const state: LoaderState = {
    ...download.state,
    status: failure ? 'error' : extracting ? 'processing' : download.state.status,
    progress: extracting ? MATERIAL_EXTRACT_PROGRESS : download.state.progress,
    blobUrl: null,
    errorKind: failure ?? download.state.errorKind,
  };

  return { state, material, hasAsset: material !== null, retry: download.retry };
}
