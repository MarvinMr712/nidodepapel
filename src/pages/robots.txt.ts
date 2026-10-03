import { absoluta } from "@/lib/rutas";

/**
 * robots.txt escrito en el build.
 *
 * En un sitio estático este archivo también se genera una sola vez y queda en
 * `dist/robots.txt`.
 */
export function GET(): Response {
  const texto =
    `User-Agent: *\n` +
    `Allow: /\n` +
    `\n` +
    `Sitemap: ${absoluta("/sitemap.xml")}\n`;

  return new Response(texto, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
