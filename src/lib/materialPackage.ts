import * as THREE from 'three';
import { MATERIAL_MAX_ANISOTROPY } from './constants';
import {
  TEXTURE_MAP_ORDER,
  detectTextureMaps,
  findUnusedImages,
  getFileExtension,
  isImageFile,
} from './materialMaps';
import type {
  MaterialMapKind,
  MaterialPackage,
  MaterialPackageResult,
  MaterialSourceFile,
} from '../types/material';

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
};

/** Only the base colour map carries sRGB data; the rest are linear data maps. */
const COLOR_MAPS = new Set<MaterialMapKind>(['basecolor']);

function toBlob(data: Uint8Array, fileName: string): Blob {
  const type = IMAGE_MIME[getFileExtension(fileName)] ?? 'application/octet-stream';
  return new Blob([new Uint8Array(data)], { type });
}

/** Inflates every image entry of the archive in the browser (fflate). */
async function unpackImages(archive: Uint8Array): Promise<Record<string, Uint8Array>> {
  // Loaded on demand: model viewers never pay for the zip decoder.
  const { unzip } = await import('fflate');
  return new Promise((resolve, reject) => {
    unzip(
      archive,
      { filter: (file) => !file.name.endsWith('/') && isImageFile(file.name) },
      (error, files) => {
        if (error) reject(error);
        else resolve(files);
      },
    );
  });
}

async function createTexture(
  name: string,
  url: string,
  kind: MaterialMapKind,
): Promise<THREE.Texture> {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.name = name;
  texture.colorSpace = COLOR_MAPS.has(kind) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Three clamps this to the GPU limit when uploading.
  texture.anisotropy = MATERIAL_MAX_ANISOTROPY;
  return texture;
}

function disposeAll(textures: MaterialPackage['textures'], urls: string[]): void {
  Object.values(textures).forEach((texture) => texture?.dispose());
  urls.forEach((url) => URL.revokeObjectURL(url));
}

/**
 * Unpacks a material ZIP entirely on the client: inflates the archive, maps
 * file names to PBR channels and decodes each match into a Three.js texture.
 * Nothing is uploaded or processed anywhere else.
 */
export async function extractMaterialPackage(blob: Blob): Promise<MaterialPackageResult> {
  let files: Record<string, Uint8Array>;
  try {
    files = await unpackImages(new Uint8Array(await blob.arrayBuffer()));
  } catch {
    return { ok: false, kind: 'bad-package' };
  }

  const names = Object.keys(files);
  const detected = detectTextureMaps(names);
  if (detected.size === 0) return { ok: false, kind: 'empty-package' };
  const extraImages = findUnusedImages(names, detected);

  const textures: MaterialPackage['textures'] = {};
  const sources: MaterialSourceFile[] = [];
  const urls: string[] = [];

  try {
    // Canonical channel order, so the map list and the material always agree.
    for (const kind of TEXTURE_MAP_ORDER) {
      const name = detected.get(kind);
      if (!name) continue;
      const data = files[name];
      if (!data) continue;
      const url = URL.createObjectURL(toBlob(data, name));
      urls.push(url);
      textures[kind] = await createTexture(name, url, kind);
      sources.push({ name, kind, url });
    }
  } catch {
    disposeAll(textures, urls);
    return { ok: false, kind: 'bad-package' };
  }

  if (sources.length === 0) return { ok: false, kind: 'empty-package' };

  return {
    ok: true,
    value: {
      textures,
      files: sources,
      extraImages,
      dispose: () => disposeAll(textures, urls),
    },
  };
}
