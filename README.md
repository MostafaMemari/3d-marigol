# Marigol 3D viewer

Static React + TypeScript + Vite viewer for the assets on
`s3.ir-thr-at1.arvanstorage.ir/marigol/`. Everything is client side: one
download per view, no backend, no tracking.

## URLs

| URL                        | Renders                                         |
| -------------------------- | ----------------------------------------------- |
| `/?id=14257`               | GLB model (default, unchanged)                  |
| `/?type=model&id=14257`    | Same, explicit                                  |
| `/?type=material&id=14768` | Material package (`{id}.zip`) on a PBR preview  |

`?type=` is optional and only `material` changes the behaviour; anything else
stays on the model path.

## Material packages

A material ZIP is inflated in the browser (fflate) and file names are matched
to PBR channels:

| Channel           | Filename keywords                        |
| ----------------- | ---------------------------------------- |
| Base color        | albedo, diffuse, basecolor, base, color  |
| Normal            | normal, normalmap                        |
| Roughness         | roughness, rough                         |
| Metallic          | metallic, metalness, metal               |
| Ambient occlusion | ao, ambient, ambientocclusion, occlusion |
| Height / bump     | height, bump, displacement, displace     |

Keywords match whole words, so `wood_base_color`, `wood_normal_map` and
folder layouts such as `normal/wood.jpg` all resolve.

### One material per texture set

Every JPG in the archive becomes a selectable material, in natural name order
(`STONE 2` before `STONE 10`):

```
STONE 01.jpg  +  STONE 01 BUMP.jpg   →  material "STONE 01"  (base colour + height)
STONE 02.jpg  +  STONE 02 BUMP.jpg   →  material "STONE 02"
```

Channel words are stripped from the end of a file name to find its material,
so `wood_bump.jpg`, `wood-bump.jpg`, `wood.bump.jpg` and `wood BUMP.jpg` all
pair with `wood.jpg` — the `_bump` convention needs no new code. A channel file
with no colour map (`orphan_bump.jpg`) cannot be previewed and is listed as an
extra image instead of failing the page.

Only the material being looked at is decoded: thumbnails come from scaled
`createImageBitmap` passes, and the full-size textures of the previous material
are disposed the moment you switch. A package with fifty photos therefore holds
two textures at a time.

See [CACHING.md](./CACHING.md) for the runtime request and memory strategy.

---

## Tooling notes

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
