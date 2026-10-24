/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_BASE_PATH?: string;
  readonly PUBLIC_CONTACTO_EMAIL?: string;
  readonly NEXT_PUBLIC_SITE_URL?: string;
  readonly NEXT_PUBLIC_CONTACTO_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
