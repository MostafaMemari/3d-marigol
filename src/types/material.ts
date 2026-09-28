import type { Texture } from 'three';

/** PBR channels a material variant can provide, listed in panel order. */
export type MaterialMapKind =
  | 'basecolor'
  | 'normal'
  | 'roughness'
  | 'metallic'
  | 'ao'
  | 'height';

/** Geometry the material is wrapped around for inspection. */
export type MaterialShape = 'sphere' | 'cube' | 'plane';

/**
 * One previewable material inside a package, e.g. `STONE 01` from
 * `STONE 01.jpg` + `STONE 01 BUMP.jpg`.
 */
export interface MaterialVariant {
  /** Human label taken from the file name, e.g. `STONE 01`. */
  name: string;
  /** Channel → file name inside the package. */
  maps: Partial<Record<MaterialMapKind, string>>;
}

/** Decoded channels of the active variant. */
export type MaterialTextures = Partial<Record<MaterialMapKind, Texture>>;

/**
 * A material package: immutable data, no GPU resources. Textures are decoded
 * per variant on demand so a package with many photos never fills VRAM.
 */
export interface MaterialPackage {
  /** Every previewable material, in natural name order. */
  variants: MaterialVariant[];
  /** 64px preview per image (data URL), keyed by file name. */
  thumbnails: Record<string, string>;
  /** Extracted image bytes, kept so a variant can be decoded on demand. */
  sources: Record<string, Uint8Array>;
  /** Images in the archive that no variant claimed. */
  extraImages: string[];
}

export type MaterialPackageResult =
  | { ok: true; value: MaterialPackage }
  | { ok: false; kind: 'bad-package' | 'empty-package' };
