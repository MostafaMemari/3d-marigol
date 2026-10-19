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
 *
 * The short forms real libraries ship are listed too (`wood_nrm`,
 * `wood_rgh`, `wood_met`, `wood_bmp`), so a folder of abbreviated maps still
 * resolves to the right channel.
 */
const MAP_KEYWORDS: Record<MaterialMapKind, string[]> = {
  basecolor: ['albedo', 'diffuse', 'basecolor', 'base', 'color', 'col', 'clr', 'tex'],
  normal: ['normalmap', 'normal', 'nrm', 'nor'],
  roughness: ['roughness', 'rough', 'rgh', 'gloss'],
  metallic: ['metallic', 'metalness', 'metal', 'met'],
  ao: ['ambientocclusion', 'occlusion', 'ambient', 'ao'],
  height: ['displacement', 'displace', 'bump', 'height', 'bmp', 'disp'],
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

/**
 * Resolves the channel a texture file represents from its path and name.
 * The extension is ignored, so `wood.bmp` is not read as a bump map.
 */
export function detectTextureMap(fileName: string): MaterialMapKind | null {
  const candidates = tokenize(stemOf(fileName));
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

/** Directory part of an archive path (`wood/grain/albedo.png` → `wood/grain`). */
function parentPath(fileName: string): string {
  const normalized = fileName.replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
}

/** Last path segment of a file name. */
function baseName(fileName: string): string {
  return fileName.replace(/\\/g, '/').split('/').pop() ?? fileName;
}

/** File name without its extension (`wood_base.png` → `wood_base`). */
function stemOf(fileName: string): string {
  return baseName(fileName).replace(/\.[^.]+$/, '');
}

/** Case- and separator-insensitive key of a name, so `PBR Wood` == `pbr-wood`. */
function normalizeStem(value: string): string {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join(' ');
}

/**
 * Folder names that only organise a material's maps instead of naming a
 * material. A folder called `textures` or `normal_maps` is a container, so
 * the material it holds is named after its parent.
 */
function isContainerName(name: string): boolean {
  const key = normalizeStem(name);
  if (!key) return false;
  if (/(^| )(textures?|maps?|channels?|pbr)( |$)/.test(key)) return true;
  if (/^\d+k$/.test(key)) return true;
  return false;
}

/** Every folder of a path, from the archive root down to the folder itself. */
function pathChain(dir: string): string[] {
  const parts = dir.split('/').filter(Boolean);
  const chain: string[] = [];
  let current = '';
  parts.forEach((part) => {
    current = current ? `${current}/${part}` : part;
    chain.push(current);
  });
  return chain;
}

/**
 * Decides which material a folder's images belong to.
 *
 * The material is the deepest folder of the path whose name is not a mere
 * container, so every folder that names a surface becomes one material:
 *
 * - `wood/albedo.png` + `wood/normal.png` → the `wood` material;
 * - `textures/wood/albedo.png` → the `wood` material (the `textures` wrapper
 *   only organises);
 * - `wood/maps/normal.png` → the `wood` material, since `maps` only organises.
 */
function resolveOwner(dir: string): string {
  const chain = pathChain(dir);
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (!isContainerName(leafName(chain[i]))) return chain[i];
  }
  return dir;
}

/**
 * The label of a material folder. A container folder lends its name to the
 * parent that holds it, so `wood/maps/normal.png` is still called `wood`.
 */
function materialName(owner: string): string {
  const chain = pathChain(owner);
  const named = [...chain].reverse().find((ancestor) => !isContainerName(leafName(ancestor)));
  return (named ? leafName(named) : leafName(owner)).trim() || owner;
}

/** Last segment of a folder path. */
function leafName(dir: string): string {
  return dir.split('/').pop() ?? dir;
}

/**
 * Turns one folder into exactly one material.
 *
 * A folder is the unit of a material: the images inside it are the PBR
 * channels of a single surface, whatever their format — `wood/` holding
 * `wood.png`, `wood_normal.png` and `wood_roughness.png` is one `wood`
 * material, not three.
 *
 * Channel resolution inside the folder:
 *
 * - a file named after the folder is its colour map (`wood/wood.jpg`);
 * - otherwise the file name decides the channel (`albedo`, `normal`,
 *   `roughness`, `metal`, `ao`, `bump`, …);
 * - a folder holding a single image is always that material's colour map;
 * - leftovers that carry no channel word become the colour map when the
 *   folder has none, and are reported as extra images otherwise.
 */
function variantFromFolder(
  name: string,
  files: string[],
): { variant: MaterialVariant; extraImages: string[] } {
  const maps: Partial<Record<MaterialMapKind, string>> = {};
  const extraImages: string[] = [];

  // A lone image in a folder is the material's colour map by convention.
  if (files.length === 1) {
    maps.basecolor = files[0];
    return {
      variant: { name, maps, preview: files[0] },
      extraImages,
    };
  }

  // A file named after its folder is that folder's colour map.
  const folderKey = normalizeStem(name);
  const named = files.find((file) => normalizeStem(stemOf(file)) === folderKey);
  if (named) maps.basecolor = named;

  const unnamed: string[] = [];
  files.forEach((file) => {
    if (file === named) return;
    const kind = detectTextureMap(baseName(file));
    if (!kind) {
      unnamed.push(file);
      return;
    }
    if (!maps[kind]) maps[kind] = file;
    else extraImages.push(file);
  });

  // Channel-less files: the first one covers the colour map when it is free.
  unnamed.forEach((file) => {
    if (!maps.basecolor) maps.basecolor = file;
    else extraImages.push(file);
  });

  const variant: MaterialVariant = { name, maps };
  variant.preview = maps.basecolor ?? Object.values(maps)[0] ?? files[0];

  return { variant, extraImages };
}

/** Groups images that live directly in the archive root, by their file name. */
function groupByName(fileNames: string[]): {
  variants: MaterialVariant[];
  extraImages: string[];
} {
  const groups = new Map<string, MaterialVariant>();
  const orphans: string[] = [];

  fileNames.forEach((fileName) => {
    const { name, key } = splitChannelSuffix(fileName);
    const kind = detectTextureMap(baseName(fileName)) ?? 'basecolor';
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
    variants,
    extraImages: orphans.filter((name) => !claimed.has(name)).sort(compareNaturally),
  };
}

/** Makes sure two materials never share a label — the list keys on it. */
function uniquifyNames(variants: MaterialVariant[]): void {
  const used = new Map<string, number>();
  variants.forEach((variant) => {
    const count = used.get(variant.name) ?? 0;
    used.set(variant.name, count + 1);
    if (count === 0) return;
    variant.name = `${variant.name} (${count + 1})`;
  });
}

/**
 * Groups the archive images into previewable materials.
 *
 * Two archive shapes are supported:
 *
 * - **Foldered packages** — every folder that holds images is one material,
 *   and the images inside it are that material's PBR channels (`wood/` holding
 *   `albedo.png`, `normal.png`, `roughness.png` becomes a single `wood`
 *   material). This is the shape a real material library ships in.
 * - **Flat packages** — images directly in the archive root are grouped by
 *   their file name, the way `STONE 01.jpg` + `STONE 01 BUMP.jpg` pair up.
 */
export function groupVariants(fileNames: string[]): {
  variants: MaterialVariant[];
  extraImages: string[];
} {
  const images = fileNames.filter(isImageFile).sort(compareNaturally);

  // Images grouped by the folder that directly holds them.
  const folders = new Map<string, string[]>();
  const rootFiles: string[] = [];
  images.forEach((fileName) => {
    const dir = parentPath(fileName);
    if (!dir) {
      rootFiles.push(fileName);
      return;
    }
    const list = folders.get(dir);
    if (list) list.push(fileName);
    else folders.set(dir, [fileName]);
  });

  // A folder that only organises maps (`wood/maps/`) belongs to the closest
  // ancestor that names a material (`wood/`).
  const owners = new Map<string, string[]>();
  [...folders.entries()]
    .sort((a, b) => compareNaturally(a[0], b[0]))
    .forEach(([dir, files]) => {
      const owner = resolveOwner(dir);
      const list = owners.get(owner);
      if (list) list.push(...files);
      else owners.set(owner, [...files]);
    });

  const variants: MaterialVariant[] = [];
  const extraImages: string[] = [];

  // One folder → one material.
  [...owners.entries()]
    .sort((a, b) => compareNaturally(a[0], b[0]))
    .forEach(([owner, files]) => {
      const sorted = [...files].sort(compareNaturally);
      const { variant, extraImages: extra } = variantFromFolder(materialName(owner), sorted);
      variant.folder = owner;
      if (Object.keys(variant.maps).length > 0) variants.push(variant);
      else extraImages.push(...sorted);
      extraImages.push(...extra);
    });

  // Root images keep the name-based pairing, so a mixed archive still works.
  if (rootFiles.length > 0) {
    const flat = groupByName(rootFiles);
    variants.push(...flat.variants);
    extraImages.push(...flat.extraImages);
  }

  uniquifyNames(variants);

  return {
    variants: variants.sort((a, b) => compareNaturally(a.name, b.name)),
    extraImages: [...new Set(extraImages)].sort(compareNaturally),
  };
}
