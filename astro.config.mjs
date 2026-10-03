// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

/**
 * Sitio estatico de Nido de Papel.
 *
 * Todo se genera por adelantado: no hay servidor, ni base de datos, ni API.
 * `output: "static"` hace que `npm run build` escriba el sitio completo en
 * `dist/`, listo para cualquier hosting estatico (GitHub Pages, Netlify,
 * Cloudflare Pages, un servidor de archivos...).
 *
 * `build.format: "directory"` escribe `catalogo/index.html` en vez de
 * `catalogo.html`. Es lo que necesita un hosting estatico: al recargar
 * `/catalogo` o al compartir ese enlace, el servidor encuentra el archivo y no
 * devuelve 404.
 *
 * Las dos variables de despliegue hacen que el sitio funcione igual en la raiz
 * de un dominio propio que en un subdirectorio de un repositorio de GitHub
 * Pages:
 *
 *   SITE_URL   Solo el origen: "https://tu-dominio.com". Sin ruta final.
 *   BASE_PATH  La subcarpeta, o "/" si el sitio vive en la raiz.
 *
 * Que `SITE_URL` sea solo el origen no es cosmetico: Astro espera ahi un origen,
 * y darle una ruta completa (`https://tu-dominio.github.io/mi-sitio`) deja el
 * build colgado sin un solo error en pantalla. Para tolerar esa forma, que es el
 * error mas facil de cometer al desplegar, la ruta se separa aqui y se pasa a
 * `base`, que es donde corresponde. Asi el build termina y las URLs salen
 * igual de correctas.
 */
const normalizar = (/** @type {string | undefined | null} */ ruta) =>
  ruta === undefined || ruta === null ? "" : "/" + String(ruta).replace(/^\/+|\/+$/g, "");

/** SITE_URL partido en origen y subcarpeta, sin fallar si no es una URL valida. */
const separar = (/** @type {string} */ bruto) => {
  try {
    const url = new URL(bruto);
    return { origen: url.origin, prefijo: normalizar(url.pathname) };
  } catch {
    return { origen: bruto, prefijo: "" };
  }
};

/*
 * Valores por defecto: el sitio donde vive de verdad, en
 * https://marvinmr712.github.io/nidodepapel. Se dejan puestos para que un clon
 * recien bajado construya ya con las URLs correctas, sin tocar nada. Si algún
 * dia cambia el dominio o se publica en otro sitio, se ajustan SITE_URL y
 * BASE_PATH en el entorno (o en .env) y no hay que editar este archivo.
 */
const DOMINIO = "https://marvinmr712.github.io";
const SUBCARPETA = "/nidodepapel";

const bruto = String(process.env.SITE_URL || DOMINIO).replace(/\/+$/, "");
const { origen, prefijo } = separar(bruto);
const declarado = normalizar(process.env.BASE_PATH || SUBCARPETA);

/* Si la subcarpeta ya venia en SITE_URL y BASE_PATH la repite, no la doblamos. */
const base =
  prefijo && declarado !== prefijo && !declarado.startsWith(`${prefijo}/`)
    ? normalizar(prefijo + declarado)
    : declarado || "/";

export default defineConfig({
  site: origen,
  output: "static",
  base,
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
