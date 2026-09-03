export type ViewerPhase = 'missing' | 'loading' | 'ready' | 'error';

export type ModelErrorKind = 'missing-id' | 'not-found' | 'network';

export interface ModelError {
  kind: ModelErrorKind;
  title: string;
  message: string;
}

export type LoaderStatus = 'downloading' | 'processing' | 'ready' | 'error';

export interface LoaderState {
  status: LoaderStatus;
  /** 0–100 when Content-Length is known, null when indeterminate */
  progress: number | null;
  loadedBytes: number;
  totalBytes: number | null;
  blobUrl: string | null;
  errorKind: ModelErrorKind | null;
}

export interface ViewerControlState {
  autoRotate: boolean;
  showGrid: boolean;
}
