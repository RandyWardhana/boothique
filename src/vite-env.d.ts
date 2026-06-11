/// <reference types="vite/client" />
/// <reference types="dom-webcodecs" />

interface ImportMetaEnv {
  readonly VITE_SHARE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
