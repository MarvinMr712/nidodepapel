import type { APIRoute } from "astro";
import { SITE } from "@/lib/catalogo";

export const GET: APIRoute = () => {
  const body = `User-Agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
