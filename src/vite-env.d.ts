/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for `.glb` models; a bare host is fine. */
  readonly VITE_MODEL_BASE_URL?: string;
  /** Base URL for material `.zip` packages, e.g. `dl.marigol.ir/material`. */
  readonly VITE_MATERIAL_BASE_URL?: string;
  /** Site the Download button points at. */
  readonly VITE_PRODUCT_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
