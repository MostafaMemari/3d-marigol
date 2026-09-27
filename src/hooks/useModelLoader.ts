import { useAssetDownload } from './useAssetDownload';
import { MODEL_BLOB_TYPE } from '../lib/constants';

export interface ModelLoaderResult {
  state: ReturnType<typeof useAssetDownload>['state'];
  /** Blob URL of the GLB, or null while loading / on error. */
  blobUrl: string | null;
  /** Same gate as `blobUrl !== null`, named for the viewer shell. */
  hasAsset: boolean;
  retry: () => void;
  markReady: () => void;
}

/**
 * Downloads the GLB with real byte-level progress, then exposes it as a blob
 * URL for Three.js to parse. Download mechanics live in `useAssetDownload`.
 */
export function useModelLoader(modelUrl: string | null): ModelLoaderResult {
  const { state, retry, markReady } = useAssetDownload(modelUrl, {
    blobType: MODEL_BLOB_TYPE,
  });

  return { state, blobUrl: state.blobUrl, hasAsset: state.blobUrl !== null, retry, markReady };
}
