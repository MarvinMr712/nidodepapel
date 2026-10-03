/**
 * Rutas internas que sobreviven al hosting.
 *
 * Astro expone el prefijo del sitio en `import.meta.env.BASE_URL`: "/" si vive
 * en la raiz de un dominio, "/nido-de-papel/" si se publica en un subdirectorio
 * como un repositorio de GitHub Pages. Escribir "/catalogo" a mano funciona
 * solo en el primer caso; con `ruta()` el mismo sitio funciona en los dos sin
 * tocar nada.
 *
 * Con "/" (el valor por defecto) `ruta("/catalogo")` devuelve "/catalogo", o sea
 * exactamente la misma direccion de siempre.
 */
export function ruta(destino: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const limpio = destino.startsWith("/") ? destino : `/${destino}`;
  return `${base}${limpio === "/" ? "/" : limpio.replace(/\/+$/, "")}` || "/";
}

/**
 * Direccion absoluta, para canonical, sitemap y Open Graph.
 *
 * `import.meta.env.SITE` lo define Astro a partir de la opcion `site` de
 * astro.config.mjs, que a su vez lee la variable SITE_URL del entorno.
 */
export function absoluta(url: string): string {
  const base = (import.meta.env.SITE || "").replace(/\/+$/, "");
  return `${base}${ruta(url)}`;
}

/**
 * La ruta interna de una URL, sin el prefijo del hosting.
 *
 * `Astro.url.pathname` incluye el prefijo: con el sitio en un subdirectorio,
 * "/nido-de-papel/catalogo" llega tal cual. Compararlo contra "/catalogo" nunca
 * sale, y lo que se rompe es lo que se marca como la página actual. Quitando el
 * prefijo, la comparación vuelve a ser entre rutas internas.
 *
 * Con "/" (el valor por defecto) esto no cambia nada.
 */
export function sinBase(pathname: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const limpio = pathname.replace(/\/+$/, "") || "/";
  if (!base) return limpio;
  if (limpio === base) return "/";
  if (limpio.startsWith(`${base}/`)) return limpio.slice(base.length) || "/";
  return limpio;
}
