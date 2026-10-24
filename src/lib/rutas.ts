/**
 * Rutas internas que sobreviven al hosting.
 *
 * Astro expone el prefijo del sitio en `import.meta.env.BASE_URL`: "/" si vive
 * en la raiz de un dominio, "/nidodepapel/" si se publica en un subdirectorio
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
