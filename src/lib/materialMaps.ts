import type { MaterialMapKind, MaterialVariant } from '../types/material';

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

/** Natural order so `STONE 2` sorts before `STONE 10`. */
const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function compareNaturally(a: string, b: string): number {
  return COLLATOR.compare(a, b);
}

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
 * Splits a file name into the material it belongs to and the channel word it
 * carries: `STONE 01 BUMP.jpg` → `STONE 01` + bump, `wood_normal.png` → `wood`
 * + normal. Any trailing channel words are stripped, which is what makes the
 * `_bump` / `-normal` / ` BUMP` naming conventions all pair up with their
 * colour map without extra rules.
 */
function splitChannelSuffix(fileName: string): { name: string; key: string } {
  const stem = (fileName.split(/[\\/]/).pop() ?? fileName).replace(/\.[^.]+$/, '');
  const parts = stem.split(/[^a-z0-9]+/i).filter(Boolean);
  const kept = [...parts];
  while (kept.length > 1 && isChannelToken(kept[kept.length - 1])) kept.pop();
  const name = kept.join(' ');
  return { name: name || stem.trim(), key: normalizeKey(name || stem) };
}

/** Groups `STONE 02` with `STONE 2` — the label keeps the original spelling. */
function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => (/^0\d+$/.test(token) ? String(Number(token)) : token))
    .join(' ');
}

function isChannelToken(token: string): boolean {
  const lower = token.toLowerCase();
  return Object.values(MAP_KEYWORDS).some((keywords) => keywords.includes(lower));
}

/**
 * Groups the archive images into previewable materials: one variant per colour
 * map, with any channel file that shares its name attached to it. A lone
 * `STONE 01 BUMP.jpg` has nothing to preview, so it is reported as extra.
 */
export function groupVariants(fileNames: string[]): {
  variants: MaterialVariant[];
  extraImages: string[];
} {
  const groups = new Map<string, MaterialVariant>();
  const orphans: string[] = [];

  fileNames
    .filter(isImageFile)
    .sort(compareNaturally)
    .forEach((fileName) => {
      const { name, key } = splitChannelSuffix(fileName);
      const kind = detectTextureMap(fileName) ?? 'basecolor';
      const group = groups.get(key) ?? { name, maps: {} };
      if (!group.maps[kind]) group.maps[kind] = fileName;
      groups.set(key, group);
    });

  const variants: MaterialVariant[] = [];
  groups.forEach((group) => {
    if (group.maps.basecolor) variants.push(group);
    else orphans.push(...Object.values(group.maps));
  });

  const claimed = new Set(variants.flatMap((variant) => Object.values(variant.maps)));

  return {
    variants: variants.sort((a, b) => compareNaturally(a.name, b.name)),
    extraImages: orphans
      .filter((name) => !claimed.has(name))
      .sort(compareNaturally),
  };
}
