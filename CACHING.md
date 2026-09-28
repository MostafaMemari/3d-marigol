# Caching strategy

The viewer is a fully static app (`npm run build` → `dist/`). No backend, no
analytics, no tracking, no third-party calls. At runtime the only network
requests are:

1. The app shell (HTML/CSS/JS, same origin, content-hashed by Vite).
2. Exactly one asset download from Arvan Object Storage per view — the GLB
   for a model, or the ZIP package for a material.

## Static assets (Cloudflare Pages)

`public/_headers` ships with the build and sets:

| Path          | Policy                                  | Why                                      |
| ------------- | --------------------------------------- | ---------------------------------------- |
| `/assets/*`   | `public, max-age=31536000, immutable`   | Vite content-hashes filenames; safe forever |
| `/favicon.svg`| `public, max-age=86400`                 | Rarely changes, cheap to revalidate      |
| `/robots.txt` | `public, max-age=86400`                 | Crawler file, day-long cache             |
| `/*.html`     | `public, max-age=0, must-revalidate`    | Entry points always fresh (new asset hashes) |

GitHub Pages ignores `_headers` and serves its own sensible defaults
(hashed `/assets/*` files remain cache-friendly everywhere).

## GLB model (Arvan Object Storage)

The model is fetched **once** per view:

- `useModelLoader` runs a single streaming `fetch` per model URL; the result
  is held as an in-memory blob URL. Re-renders never re-trigger it
  (memoized URL + stable effect deps; retry only via explicit user action).
- Three.js parses the blob locally via a single `useGLTF` instance — no
  second network request. Textures/materials are shared with the parsed
  scene (the viewer clones the scene graph, not the GPU resources).
- Browser HTTP caching of the `.glb` itself follows Arvan's response
  headers. For repeat views, serve the bucket (or a CDN in front of it) with
  `Cache-Control: public, max-age=31536000, immutable` since model URLs are
  content-addressed by ID (`{id}.glb` changes only when the model changes).

## Material package (Arvan Object Storage)

Material views download one ZIP (`{id}.zip`) and unpack it **entirely in the
browser** — no upload, no server-side processing:

- `useMaterialLoader` streams the archive through the same download path as
  models (one request, byte-level progress, abort on unmount), then hands the
  blob to `extractMaterialPackage`.
- The ZIP is inflated in the browser with **fflate**, which is loaded as a
  lazy chunk (`dist/assets/browser-*.js`) only when a material is opened —
  model views never download it.
- `materialMaps.ts` groups the images into one material per colour map and
  attaches the channel files that share its name. Only **list-sized
  thumbnails** (scaled `createImageBitmap`, 64px) are decoded for the whole
  archive; full-size textures are decoded on demand by
  `useVariantTextures` and disposed when the user switches material, so peak
  GPU memory is two textures regardless of how many JPGs the package holds.
- Same caching recommendation as models: material URLs are content-addressed
  by ID, so `immutable` is safe once the package is published.

## Memory

- On unmount the viewer traverses the cloned scene and disposes geometries,
  materials, and textures, drops the `useGLTF` cache entry, revokes the blob
  URL, and disposes the PMREM environment — no GPU/CPU leaks when leaving.
- Material packages keep only extracted image bytes in memory; every texture,
  object URL and thumbnail is released by `useVariantTextures` and
  `disposeTextures` when the material changes or the viewer unmounts.
