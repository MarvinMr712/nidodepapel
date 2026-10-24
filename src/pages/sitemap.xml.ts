import type { APIRoute } from "astro";
import { SITE, getCategorias, getEtapas, getLibros } from "@/lib/catalogo";

interface Entrada {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
}

export const GET: APIRoute = () => {
  const hoy = new Date();

  const estaticas: Entrada[] = [
    { url: `${SITE.url}/`, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/catalogo`, lastModified: hoy, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/como-funciona`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/etapas`, lastModified: hoy, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/categorias`, lastModified: hoy, changeFrequency: "monthly", priority: 0.6 },
  ];

  const categorias: Entrada[] = getCategorias().map((c) => ({
    url: `${SITE.url}/categorias/${c.slug}`,
    lastModified: hoy,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const etapas: Entrada[] = getEtapas().map((e) => ({
    url: `${SITE.url}/etapas/${e.slug}`,
    lastModified: hoy,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // El catálogo es la sección que más busca la gente: prioridad alta.
  const libros: Entrada[] = getLibros().map((l) => ({
    url: `${SITE.url}/libros/${l.slug}`,
    lastModified: hoy,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const entradas = [...estaticas, ...categorias, ...etapas, ...libros];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas
  .map(
    (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
