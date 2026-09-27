import { useEffect, useRef, useState } from 'react';
import { useAssetDownload } from './useAssetDownload';
import { MATERIAL_BLOB_TYPE, MATERIAL_EXTRACT_PROGRESS } from '../lib/constants';
import { extractMaterialPackage } from '../lib/materialPackage';
import type { LoaderState, ModelErrorKind } from '../types/model';
import type { MaterialPackage } from '../types/material';

export interface MaterialLoaderResult {
  state: LoaderState;
  /** Extracted package with its PBR textures, or null until extraction ends. */
  material: MaterialPackage | null;
  hasAsset: boolean;
  retry: () => void;
}

/**
 * Downloads a material ZIP and unpacks it in the browser, reporting progress
 * through the same `LoaderState` the model viewer uses so the shell keeps a
 * single loading and error path.
 */
export function useMaterialLoader(materialUrl: string | null): MaterialLoaderResult {
  const download = useAssetDownload(materialUrl, { blobType: MATERIAL_BLOB_TYPE });
  const [material, setMaterial] = useState<MaterialPackage | null>(null);
  const [failure, setFailure] = useState<ModelErrorKind | null>(null);
  const packageRef = useRef<MaterialPackage | null>(null);

  // New URL or a retry empties the archive: drop the preview before anything
  // from the previous package is released.
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
      if (cancelled) {
        if (result.ok) result.value.dispose();
        return;
      }
      if (!result.ok) {
        setFailure(result.kind);
        return;
      }
      packageRef.current?.dispose();
      packageRef.current = result.value;
      setMaterial(result.value);
    });

    return () => {
      cancelled = true;
    };
  }, [download.blob]);

  // Unmount only: release the textures and object URLs of the live package.
  useEffect(
    () => () => {
      packageRef.current?.dispose();
      packageRef.current = null;
    },
    [],
  );

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
