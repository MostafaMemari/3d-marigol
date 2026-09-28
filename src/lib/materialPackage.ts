import * as THREE from 'three';
import { MATERIAL_MAX_ANISOTROPY, MATERIAL_THUMBNAIL_SIZE } from './constants';
import { TEXTURE_MAP_ORDER, getFileExtension, groupVariants, isImageFile } from './materialMaps';
import type {
  MaterialMapKind,
  MaterialPackage,
  MaterialPackageResult,
  MaterialTextures,
  MaterialVariant,
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

/** Ceiling so a huge archive cannot stall the loading screen. */
const MAX_THUMBNAILS = 120;

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

/**
 * Small preview for the variant list. `createImageBitmap` with a resize hint
 * lets the browser decode a scaled JPEG, so ten megabytes of photos never turn
 * into ten full-size GPU textures.
 */
async function createThumbnail(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: MATERIAL_THUMBNAIL_SIZE * 2,
      resizeQuality: 'low',
    });
    try {
      const canvas = document.createElement('canvas');
      canvas.width = MATERIAL_THUMBNAIL_SIZE;
      canvas.height = MATERIAL_THUMBNAIL_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      // Centre crop so non-square textures still read as a swatch.
      const side = Math.min(bitmap.width, bitmap.height);
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        MATERIAL_THUMBNAIL_SIZE,
        MATERIAL_THUMBNAIL_SIZE,
      );
      return canvas.toDataURL('image/jpeg', 0.72);
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

/**
 * Unpacks a material ZIP entirely on the client: inflates the archive, groups
 * the images into materials and builds list-sized thumbnails. Full-size
 * textures stay undecoded until a variant is opened.
 */
export async function extractMaterialPackage(blob: Blob): Promise<MaterialPackageResult> {
  let files: Record<string, Uint8Array>;
  try {
    files = await unpackImages(new Uint8Array(await blob.arrayBuffer()));
  } catch {
    return { ok: false, kind: 'bad-package' };
  }

  const names = Object.keys(files);
  const { variants, extraImages } = groupVariants(names);
  if (variants.length === 0) return { ok: false, kind: 'empty-package' };

  const used = [...new Set(variants.flatMap((variant) => Object.values(variant.maps)))]
    .sort()
    .slice(0, MAX_THUMBNAILS);

  const pairs = await Promise.all(
    used.map(async (name) => [name, await createThumbnail(toBlob(files[name], name))] as const),
  );

  const thumbnails: Record<string, string> = {};
  const sources: Record<string, Uint8Array> = {};
  pairs.forEach(([name, thumb]) => {
    sources[name] = files[name];
    if (thumb) thumbnails[name] = thumb;
  });

  return { ok: true, value: { variants, thumbnails, sources, extraImages } };
}

function createTexture(texture: THREE.Texture, kind: MaterialMapKind): void {
  texture.colorSpace = COLOR_MAPS.has(kind) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Three clamps this to the GPU limit when uploading.
  texture.anisotropy = MATERIAL_MAX_ANISOTROPY;
}

/**
 * Decodes one variant's maps into GPU textures. The object URL is released as
 * soon as the image is decoded, so switching variants frees memory instead of
 * accumulating one URL per file.
 */
export async function decodeVariantTextures(
  source: MaterialPackage['sources'],
  variant: MaterialVariant,
): Promise<MaterialTextures> {
  const loader = new THREE.TextureLoader();
  const textures: MaterialTextures = {};
  const urls: string[] = [];

  try {
    for (const kind of TEXTURE_MAP_ORDER) {
      const name = variant.maps[kind];
      const data = name ? source[name] : undefined;
      if (!name || !data) continue;
      const url = URL.createObjectURL(toBlob(data, name));
      urls.push(url);
      const texture = await loader.loadAsync(url);
      texture.name = name;
      createTexture(texture, kind);
      textures[kind] = texture;
    }
  } finally {
    urls.forEach((url) => URL.revokeObjectURL(url));
  }

  return textures;
}

export function disposeTextures(textures: MaterialTextures | null): void {
  if (!textures) return;
  Object.values(textures).forEach((texture) => texture?.dispose());
}
