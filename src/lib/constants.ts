import type { AssetType, BackgroundOption, ScenePresetName, SceneSettings } from '../types/model';
import type { MaterialMapKind, MaterialShape } from '../types/material';

export const MODEL_BASE_URL =
  'https://s3.ir-thr-at1.arvanstorage.ir/marigol/models';

/** Material packages live beside the models as a plain ZIP of texture files. */
export const MATERIAL_BASE_URL =
  'https://s3.ir-thr-at1.arvanstorage.ir/marigol/materials';

export const QUERY_PARAM_ID = 'id';
export const QUERY_PARAM_TYPE = 'type';

export const MODEL_BLOB_TYPE = 'model/gltf-binary';
export const MATERIAL_BLOB_TYPE = 'application/zip';

/** Reported while the browser inflates the ZIP and decodes the textures. */
export const MATERIAL_EXTRACT_PROGRESS = 96;

export const TARGET_MODEL_SIZE = 2.4;

export const CAMERA_DEFAULT_POSITION: [number, number, number] = [3.2, 2.2, 4.2];
export const CAMERA_DEFAULT_FOV = 38;

/* ---------- material preview ---------- */

export const MATERIAL_CAMERA_POSITION: [number, number, number] = [0, 0.3, 4.4];
export const MATERIAL_CAMERA_FOV = 34;
export const MATERIAL_TARGET: [number, number, number] = [0, 0, 0];
export const MATERIAL_PREVIEW_RADIUS = 1;
export const MATERIAL_PREVIEW_SIZE = 1.7;
export const MATERIAL_PLANE_SIZE = 3.2;
/** Sphere/cube segments — dense enough for a displaced height map to read. */
export const MATERIAL_PREVIEW_SEGMENTS = 128;
export const MATERIAL_PLANE_SEGMENTS = 96;

/** Values used until the package provides its own map. */
export const MATERIAL_DEFAULT_ROUGHNESS = 0.82;
export const MATERIAL_DISPLACEMENT_SCALE = 0.045;
export const MATERIAL_MAX_ANISOTROPY = 8;
export const MATERIAL_DEFAULT_ENV_INTENSITY = 0.75;
export const MATERIAL_AUTOROTATE_SPEED = 1.1;

export const MATERIAL_SHAPES: MaterialShape[] = ['sphere', 'cube', 'plane'];

export const MATERIAL_TILE_RANGE = { min: 1, max: 8, step: 1 } as const;
export const MATERIAL_RELIEF_RANGE = { min: 0, max: 2, step: 0.05 } as const;

export interface MaterialViewSettings {
  shape: MaterialShape;
  /** UV repeat applied to every detected map. */
  tile: number;
  /** Height-map displacement strength. */
  relief: number;
  /** Channel shown on its own; null shows the full PBR material. */
  solo: MaterialMapKind | null;
}

export const DEFAULT_MATERIAL_VIEW: MaterialViewSettings = {
  shape: 'sphere',
  tile: 2,
  relief: 0.6,
  solo: null,
};

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

export function buildMaterialUrl(id: string): string {
  const cleanId = id.trim();
  return `${MATERIAL_BASE_URL}/${encodeURIComponent(cleanId)}.zip`;
}

/** `?type=` is optional: anything but `material` keeps the GLB behaviour. */
export function normalizeAssetType(raw: string | null | undefined): AssetType {
  return (raw ?? '').trim().toLowerCase() === 'material' ? 'material' : 'model';
}

export function buildProductUrl(id: string): string {
  return `https://marigol.ir/?p=${encodeURIComponent(id.trim())}`;
}

export function getLoadingMessage(
  progress: number | null,
  assetType: AssetType = 'model',
): string {
  if (assetType === 'material') {
    if (progress === null) return 'Connecting to material…';
    if (progress < 20) return 'Connecting to material…';
    if (progress < 90) return 'Downloading material package…';
    if (progress < 100) return 'Extracting textures…';
    return 'Ready';
  }
  if (progress === null) return 'Connecting to model…';
  if (progress < 20) return 'Connecting to model…';
  if (progress < 70) return 'Downloading 3D assets…';
  if (progress < 90) return 'Preparing geometry…';
  if (progress < 100) return 'Optimizing materials…';
  return 'Ready';
}

export function getInteractionHint(assetType: AssetType = 'model'): string {
  return assetType === 'material'
    ? 'Drag to rotate · Scroll to zoom · Double-click to reset'
    : 'Drag to rotate · Scroll to zoom · Right-drag to pan';
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
