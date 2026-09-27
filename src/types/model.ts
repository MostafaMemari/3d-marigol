export type ViewerPhase = 'missing' | 'loading' | 'ready' | 'error';

/** Asset families the viewer can render, selected with `?type=`. */
export type AssetType = 'model' | 'material';

export type ModelErrorKind =
  | 'missing-id'
  | 'not-found'
  | 'network'
  /* material packages only */
  | 'bad-package'
  | 'empty-package';

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

/** Imperative actions every viewer canvas exposes to the shell (App). */
export interface ViewerHandle {
  resetCamera: () => void;
  capture: () => void;
  enterFullscreen: () => void;
}

/* ---------- immersive scene ---------- */

export type ScenePresetName = 'studio' | 'product' | 'dark' | 'wireframe';

export type BackgroundOption = 'white' | 'gray' | 'dark' | 'transparent';

export interface SceneSettings {
  preset: ScenePresetName | 'custom';
  shadows: boolean;
  wireframe: boolean;
  mainLight: number;
  ambientLight: number;
  lightColor: string;
  exposure: number;
  background: BackgroundOption;
}
