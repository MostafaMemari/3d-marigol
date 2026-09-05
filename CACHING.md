# Caching strategy

The viewer is a fully static app (`npm run build` → `dist/`). No backend, no
analytics, no tracking, no third-party calls. At runtime the only network
requests are:

1. The app shell (HTML/CSS/JS, same origin, content-hashed by Vite).
2. Exactly one GLB download from Arvan Object Storage per model view.

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

## Memory

- On unmount the viewer traverses the cloned scene and disposes geometries,
  materials, and textures, drops the `useGLTF` cache entry, revokes the blob
  URL, and disposes the PMREM environment — no GPU/CPU leaks when leaving.
