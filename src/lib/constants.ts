import type { BackgroundOption, ScenePresetName, SceneSettings } from '../types/model';

export const MODEL_BASE_URL =
  'https://s3.ir-thr-at1.arvanstorage.ir/marigol/models';

export const QUERY_PARAM_ID = 'id';

export const TARGET_MODEL_SIZE = 2.4;

export const CAMERA_DEFAULT_POSITION: [number, number, number] = [3.2, 2.2, 4.2];
export const CAMERA_DEFAULT_FOV = 38;

export const APP_NAME = 'Marigol';
export const APP_TITLE = '3D Product Viewer';
export const APP_TAGLINE = 'Interactive product preview';

/** Brand palette — single source of truth for the pink/red identity. */
export const BRAND_COLORS = {
  from: '#b80045',
  via: '#ce004f',
  to: '#ff4d8d',
  soft: '#fde6ee',
  mist: '#ffd6e5',
  track: '#fde8ef',
} as const;

export const BRAND_GRADIENT_CSS = `linear-gradient(135deg, ${BRAND_COLORS.from}, ${BRAND_COLORS.via}, ${BRAND_COLORS.to})`;

/** Resume auto-rotation this long after the user stops interacting. */
export const AUTOROTATE_RESUME_MS = 3000;

export function buildModelUrl(id: string): string {
  const cleanId = id.trim();
  return `${MODEL_BASE_URL}/${encodeURIComponent(cleanId)}.glb`;
}

export function buildProductUrl(id: string): string {
  return `https://marigol.ir/?p=${encodeURIComponent(id.trim())}`;
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

/* ---------- scene presets ---------- */

export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  preset: 'studio',
  shadows: true,
  wireframe: false,
  mainLight: 1.2,
  ambientLight: 0.5,
  lightColor: '#ffffff',
  exposure: 0.6,
  background: 'white',
};

export const SCENE_PRESETS: Record<ScenePresetName, SceneSettings> = {
  studio: {
    preset: 'studio',
    shadows: true,
    wireframe: false,
    mainLight: 1.2,
    ambientLight: 0.5,
    lightColor: '#ffffff',
    exposure: 0.6,
    background: 'white',
  },
  product: {
    preset: 'product',
    shadows: true,
    wireframe: false,
    mainLight: 1.7,
    ambientLight: 0.65,
    lightColor: '#fff4e2',
    exposure: 0.8,
    background: 'gray',
  },
  dark: {
    preset: 'dark',
    shadows: true,
    wireframe: false,
    mainLight: 1.1,
    ambientLight: 0.35,
    lightColor: '#dbe4ff',
    exposure: 0.85,
    background: 'dark',
  },
  wireframe: {
    preset: 'wireframe',
    shadows: false,
    wireframe: true,
    mainLight: 1.0,
    ambientLight: 0.6,
    lightColor: '#c7d2fe',
    exposure: 0.7,
    background: 'dark',
  },
};

export const PRESET_ORDER: ScenePresetName[] = ['studio', 'product', 'dark', 'wireframe'];

export const BACKGROUND_OPTIONS: BackgroundOption[] = ['white', 'gray', 'dark', 'transparent'];

/** Canvas clear color per background (null = transparent canvas). */
export const BACKGROUND_CANVAS_COLOR: Record<BackgroundOption, string | null> = {
  white: '#f4f4f5',
  gray: '#8e939e',
  dark: '#101218',
  transparent: null,
};

/** Page backdrop behind the canvas (visible with transparent bg). */
export const BACKGROUND_CSS: Record<BackgroundOption, string> = {
  white: '#f4f4f5',
  gray: '#8e939e',
  dark: '#101218',
  transparent: '#1a1d24',
};
