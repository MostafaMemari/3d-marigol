export const MODEL_BASE_URL =
  'https://s3.ir-thr-at1.arvanstorage.ir/marigol/models';

export const QUERY_PARAM_ID = 'id';

export const TARGET_MODEL_SIZE = 2.4;

export const CAMERA_DEFAULT_POSITION: [number, number, number] = [3.2, 2.2, 4.2];
export const CAMERA_DEFAULT_FOV = 38;

export const APP_NAME = 'Marigol';
export const APP_TITLE = '3D Product Viewer';
export const APP_TAGLINE = 'Interactive product preview';

export function buildModelUrl(id: string): string {
  const cleanId = id.trim();
  return `${MODEL_BASE_URL}/${encodeURIComponent(cleanId)}.glb`;
}

export function getLoadingMessage(progress: number | null): string {
  if (progress === null) return 'Connecting to model…';
  if (progress < 20) return 'Connecting to model…';
  if (progress < 70) return 'Downloading 3D assets…';
  if (progress < 90) return 'Preparing geometry…';
  if (progress < 100) return 'Optimizing materials…';
  return 'Ready';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
