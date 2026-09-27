import type { MaterialMapKind } from '../types/material';

/** Panel order — the order channels are listed and applied in. */
export const TEXTURE_MAP_ORDER: MaterialMapKind[] = [
  'basecolor',
  'normal',
  'roughness',
  'metallic',
  'ao',
  'height',
];

export const TEXTURE_MAP_LABELS: Record<MaterialMapKind, string> = {
  basecolor: 'Base Color',
  normal: 'Normal',
  roughness: 'Roughness',
  metallic: 'Metallic',
  ao: 'Ambient Occlusion',
  height: 'Height',
};

/**
 * Filename keywords that identify a channel, matched as whole words
 * (`wood_base_color` → `basecolor`, `wood_normal_map` → `normalmap`).
 */
const MAP_KEYWORDS: Record<MaterialMapKind, string[]> = {
  basecolor: ['albedo', 'diffuse', 'basecolor', 'base', 'color'],
  normal: ['normalmap', 'normal'],
  roughness: ['roughness', 'rough'],
  metallic: ['metallic', 'metalness', 'metal'],
  ao: ['ambientocclusion', 'occlusion', 'ambient', 'ao'],
  height: ['displacement', 'displace', 'bump', 'height'],
};

/**
 * Specific channels are probed before base color: `color` and `base` are the
 * most collision-prone keywords, so a file such as `tile_color_normal.png`
 * must resolve to the normal map first.
 */
const DETECTION_ORDER: MaterialMapKind[] = [
  'normal',
  'roughness',
  'metallic',
  'ao',
  'height',
  'basecolor',
];

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'gif']);
const JPEG_EXTENSIONS = new Set(['jpg', 'jpeg']);

export function getFileExtension(fileName: string): string {
  const name = fileName.split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

/** Single words and adjacent word pairs, so both `normal` and `normal_map` hit. */
function tokenize(fileName: string): Set<string> {
  const tokens = fileName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const candidates = new Set<string>();
  tokens.forEach((token, index) => {
    candidates.add(token);
    const next = tokens[index + 1];
    if (next) candidates.add(`${token}${next}`);
  });
  return candidates;
}

/** Resolves the channel a texture file represents from its path and name. */
export function detectTextureMap(fileName: string): MaterialMapKind | null {
  const candidates = tokenize(fileName);
  for (const kind of DETECTION_ORDER) {
    if (MAP_KEYWORDS[kind].some((keyword) => candidates.has(keyword))) return kind;
  }
  return null;
}

/**
 * Maps every image in the package to a channel. The first file wins when a
 * channel is supplied twice, with names sorted so the result is deterministic.
 *
 * Packages that do not follow PBR naming (photo sets such as
 * `STONE 01.jpg` + `STONE 01 BUMP.jpg`) still get a preview: the first
 * unassigned JPEG becomes the base colour. Images left over after that are
 * reported so the UI can say what the archive holds.
 */
export function detectTextureMaps(fileNames: string[]): Map<MaterialMapKind, string> {
  const images = fileNames.filter(isImageFile).sort();
  const detected = new Map<MaterialMapKind, string>();

  images.forEach((name) => {
    const kind = detectTextureMap(name);
    if (kind && !detected.has(kind)) detected.set(kind, name);
  });

  if (!detected.has('basecolor')) {
    const assigned = new Set(detected.values());
    const spare = images.filter((name) => !assigned.has(name));
    const fallback =
      spare.find((name) => JPEG_EXTENSIONS.has(getFileExtension(name))) ?? spare[0];
    if (fallback) detected.set('basecolor', fallback);
  }

  return detected;
}

/** Images present in the archive that no channel claimed. */
export function findUnusedImages(
  fileNames: string[],
  detected: Map<MaterialMapKind, string>,
): string[] {
  const assigned = new Set(detected.values());
  return fileNames
    .filter(isImageFile)
    .sort()
    .filter((name) => !assigned.has(name));
}
