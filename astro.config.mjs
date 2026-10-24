import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const normalizar = (ruta) =>
  ruta === undefined || ruta === null ? "" : "/" + String(ruta).replace(/^\/+|\/+$/g, "");

const separar = (bruto) => {
  try {
    const url = new URL(bruto);
    return {
      origen: url.origin,
      prefijo: url.pathname === "/" ? "" : normalizar(url.pathname),
    };
  } catch {
    return { origen: bruto, prefijo: "" };
  }
};

/*
 * Valores por defecto: el sitio donde vive de verdad, en
 * https://marvinmr712.github.io/nidodepapel. Se dejan puestos para que un clon
 * recien bajado construya ya con las URLs correctas, sin tocar nada. Si algun
 * dia cambia el dominio o se publica en otro sitio, se ajustan
 * PUBLIC_SITE_URL y PUBLIC_BASE_PATH en el entorno (o en .env).
 *
 * `PUBLIC_SITE_URL` puede incluir la subcarpeta; en ese caso se separa aqui y
 * se pasa a `base`, que es donde corresponde. Si se prefiere dar solo el
 * origen, `PUBLIC_BASE_PATH` indica la subcarpeta. Para un dominio propio en la
 * raiz, usar PUBLIC_SITE_URL=https://mi-dominio.com y PUBLIC_BASE_PATH=/.
 */
const DOMINIO = "https://marvinmr712.github.io";
const SUBCARPETA = "/nidodepapel";

const bruto = String(
  process.env.PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    DOMINIO,
).replace(/\/+$/, "");
const { origen, prefijo } = separar(bruto);

const baseDeclarada = process.env.PUBLIC_BASE_PATH ?? process.env.BASE_PATH;
const base =
  baseDeclarada !== undefined && baseDeclarada !== ""
    ? normalizar(baseDeclarada)
    : prefijo || SUBCARPETA;

export default defineConfig({
  site: origen,
  base,
  output: "static",
  outDir: "./out",
  trailingSlash: "never",
  build: {
    // /catalogo se escribe como catalogo/index.html, que es lo que
    // GitHub Pages sirve sin necesitar un servidor.
    format: "directory",
  },
  compressHTML: true,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "DM Serif Display",
      cssVariable: "--font-dm-serif",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: ["100 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],
});
