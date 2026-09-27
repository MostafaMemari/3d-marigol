import type { Texture } from 'three';

/** PBR channels a material package can provide, listed in panel order. */
export type MaterialMapKind =
  | 'basecolor'
  | 'normal'
  | 'roughness'
  | 'metallic'
  | 'ao'
  | 'height';

/** Geometry the material is wrapped around for inspection. */
export type MaterialShape = 'sphere' | 'cube' | 'plane';

export interface MaterialSourceFile {
  /** File name inside the package, e.g. `wood_basecolor.jpg`. */
  name: string;
  kind: MaterialMapKind;
  /** Object URL of the extracted image — used for the panel thumbnails. */
  url: string;
}

export interface MaterialPackage {
  /** Detected channels only; a channel with no matching file is absent. */
  textures: Partial<Record<MaterialMapKind, Texture>>;
  /** Every detected file, for the map list UI. */
  files: MaterialSourceFile[];
  /** Images in the archive that no channel claimed (photo-set packages). */
  extraImages: string[];
  /** Releases the textures and object URLs created for this package. */
  dispose: () => void;
}

export type MaterialPackageResult =
  | { ok: true; value: MaterialPackage }
  | { ok: false; kind: 'bad-package' | 'empty-package' };
