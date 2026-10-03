import { getCategorias, getEtapas, getLibros } from "@/lib/catalogo";
import { absoluta } from "@/lib/rutas";

/**
 * Escapa los caracteres reservados de XML. Los slugs son seguros, pero así un
 * título con `&` en el futuro no rompería el archivo.
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Sitemap escrito en el build.
 *
 * En un sitio estático este archivo es un HTML más: `GET` se ejecuta una vez
 * durante `astro build` y su respuesta queda en `dist/sitemap.xml`.
 */
export function GET(): Response {
  const hoy = new Date().toISOString();

  const paginas = [
    { url: absoluta("/"), changeFrequency: "weekly", priority: "1.0" },
    { url: absoluta("/catalogo"), changeFrequency: "weekly", priority: "0.9" },
    { url: absoluta("/como-funciona"), changeFrequency: "monthly", priority: "0.8" },
    { url: absoluta("/etapas"), changeFrequency: "monthly", priority: "0.7" },
    { url: absoluta("/categorias"), changeFrequency: "monthly", priority: "0.6" },
  ];

  const categorias = getCategorias().map((c) => ({
    url: absoluta(`/categorias/${c.slug}`),
    changeFrequency: "monthly",
    priority: "0.7",
  }));

  const etapas = getEtapas().map((e) => ({
    url: absoluta(`/etapas/${e.slug}`),
    changeFrequency: "monthly",
    priority: "0.7",
  }));

  // El catálogo es la sección que más busca la gente: prioridad alta.
  const libros = getLibros().map((l) => ({
    url: absoluta(`/libros/${l.slug}`),
    changeFrequency: "monthly",
    priority: "0.8",
  }));

  const entradas = [...paginas, ...categorias, ...etapas, ...libros]
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${esc(e.url)}</loc>\n` +
        `    <lastmod>${hoy}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entradas}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
