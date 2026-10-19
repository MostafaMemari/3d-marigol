import { useCallback, useEffect, useState } from 'react';
import { useAssetDownload } from './useAssetDownload';
import { MATERIAL_BLOB_TYPE, MATERIAL_PROGRESS } from '../lib/constants';
import { extractMaterialPackage } from '../lib/materialPackage';
import type { LoaderState, ModelErrorKind } from '../types/model';
import type { MaterialPackage, MaterialStage } from '../types/material';

export interface MaterialLoaderResult {
  state: LoaderState;
  /** Unpacked package (variants + thumbnails), or null until extraction ends. */
  material: MaterialPackage | null;
  hasAsset: boolean;
  retry: () => void;
}

/** Progress of each pipeline step, so the bar moves while the ZIP is unpacked. */
const STAGE_PROGRESS: Record<MaterialStage, number> = {
  inflating: MATERIAL_PROGRESS.inflating,
  grouping: MATERIAL_PROGRESS.grouping,
  thumbnails: MATERIAL_PROGRESS.thumbnails,
  ready: MATERIAL_PROGRESS.ready,
};

/**
 * Downloads a material ZIP and unpacks it in the browser, reporting progress
 * through the same `LoaderState` the model viewer uses so the shell keeps a
 * single loading and error path. Textures are decoded later, per variant.
 *
 * Every failure of the pipeline ends in an error state — a rejected promise
 * here used to leave the viewer stuck on the extraction progress forever.
 */
export function useMaterialLoader(materialUrl: string | null): MaterialLoaderResult {
  const download = useAssetDownload(materialUrl, { blobType: MATERIAL_BLOB_TYPE });
  const [material, setMaterial] = useState<MaterialPackage | null>(null);
  const [failure, setFailure] = useState<ModelErrorKind | null>(null);
  const [stage, setStage] = useState<MaterialStage | null>(null);

  // New URL or a retry empties the archive: drop the preview while it reloads.
  useEffect(() => {
    if (download.blob) return;
    setMaterial(null);
    setFailure(null);
    setStage(null);
  }, [download.blob]);

  useEffect(() => {
    const archive = download.blob;
    if (!archive) return;

    let cancelled = false;

    void extractMaterialPackage(archive, (next) => {
      if (!cancelled) setStage(next);
    })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setFailure(result.kind);
          return;
        }
        setMaterial(result.value);
      })
      .catch(() => {
        if (cancelled) return;
        // A crash in the pipeline is still a failed package, not a hang.
        setFailure('bad-package');
      });

    return () => {
      cancelled = true;
    };
  }, [download.blob]);

  const extracting = download.blob !== null && material === null && failure === null;

  const state: LoaderState = {
    ...download.state,
    status: failure ? 'error' : extracting ? 'processing' : download.state.status,
    progress: extracting
      ? stage
        ? STAGE_PROGRESS[stage]
        : MATERIAL_PROGRESS.inflating
      : download.state.progress,
    blobUrl: null,
    errorKind: failure ?? download.state.errorKind,
  };

  const retry = useCallback(() => {
    setMaterial(null);
    setFailure(null);
    setStage(null);
    download.retry();
  }, [download]);

  return { state, material, hasAsset: material !== null, retry };
}
