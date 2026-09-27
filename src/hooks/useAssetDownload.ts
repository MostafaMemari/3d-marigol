import { useCallback, useEffect, useRef, useState } from 'react';
import { MODEL_BLOB_TYPE } from '../lib/constants';
import type { LoaderState, ModelErrorKind } from '../types/model';

const INITIAL: LoaderState = {
  status: 'downloading',
  progress: 0,
  loadedBytes: 0,
  totalBytes: null,
  blobUrl: null,
  errorKind: null,
};

function classifyError(status: number | null): ModelErrorKind {
  if (status === 404 || status === 400) return 'not-found';
  return 'network';
}

interface AssetDownloadOptions {
  /** MIME type of the produced blob (`.glb` vs `.zip`). */
  blobType?: string;
}

export interface AssetDownload {
  state: LoaderState;
  /** The downloaded bytes, for consumers that read the archive itself. */
  blob: Blob | null;
  retry: () => void;
  markReady: () => void;
}

/**
 * Downloads an asset with real byte-level progress via streaming fetch, then
 * exposes it as a blob URL. Handles missing Content-Length with an
 * indeterminate state. Shared by every asset type so loading, progress and
 * error classification live in exactly one place.
 */
export function useAssetDownload(
  assetUrl: string | null,
  options: AssetDownloadOptions = {},
): AssetDownload {
  const [state, setState] = useState<LoaderState>(INITIAL);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!assetUrl) return;
    const target: string = assetUrl;
    const blobType = options.blobType ?? MODEL_BLOB_TYPE;

    const controller = new AbortController();
    abortRef.current = controller;
    let objectUrl: string | null = null;
    let cancelled = false;

    setState({ ...INITIAL });
    setBlob(null);

    async function run() {
      try {
        const res = await fetch(target, { signal: controller.signal });
        if (!res.ok) {
          if (!cancelled) {
            setState((s) => ({
              ...s,
              status: 'error',
              errorKind: classifyError(res.status),
            }));
          }
          return;
        }

        const totalHeader = res.headers.get('content-length');
        const total = totalHeader ? Number.parseInt(totalHeader, 10) : NaN;
        const totalBytes = Number.isFinite(total) && total > 0 ? total : null;

        if (!res.body) {
          // Fallback: non-streaming download
          const blob = await res.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setBlob(blob);
          setState({
            status: 'processing',
            progress: 100,
            loadedBytes: blob.size,
            totalBytes: blob.size,
            blobUrl: objectUrl,
            errorKind: null,
          });
          return;
        }

        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let loaded = 0;

        setState((s) => ({ ...s, totalBytes, progress: totalBytes ? 0 : null }));

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelled) {
            reader.cancel().catch(() => undefined);
            return;
          }
          if (value) {
            chunks.push(value as BlobPart);
            loaded += value.byteLength;
            setState((s) => ({
              ...s,
              loadedBytes: loaded,
              totalBytes,
              progress: totalBytes ? Math.min(99, (loaded / totalBytes) * 100) : null,
            }));
          }
        }

        if (cancelled) return;
        const blob = new Blob(chunks, { type: blobType });
        objectUrl = URL.createObjectURL(blob);
        setBlob(blob);
        setState({
          status: 'processing',
          progress: totalBytes ? 100 : null,
          loadedBytes: loaded,
          totalBytes: totalBytes ?? loaded,
          blobUrl: objectUrl,
          errorKind: null,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!cancelled) {
          setState((s) => ({ ...s, status: 'error', errorKind: 'network' }));
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetUrl, options.blobType, reloadKey]);

  const markReady = useCallback(() => {
    setState((s) => ({ ...s, status: 'ready', progress: 100 }));
  }, []);

  return { state, blob, retry, markReady };
}
