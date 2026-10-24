# Astro project

- Astro 7 static site. Pages live in `src/pages`, shared markup in `src/layouts`, and browser-only React components in `src/components`.
- React components are islands: hydrate only what needs state with `client:load` or `client:visible`. Keep page chrome and static content as `.astro`.
- Tailwind CSS 4 runs through `@tailwindcss/vite`; global styles and animations live in `src/styles/globals.css`.
- Run `npm run check` before finishing. `npm run build` writes the static site to `out/`.
- Node 22.23.4 or newer is required.
- Catalog data lives in `src/data/libros.json` and `src/lib/catalogo.ts`. Never expose `libros-privados.json` to the client.
- Internal links and public assets must use `ruta()` from `src/lib/rutas.ts`; GitHub Pages serves the site under `/nidodepapel`.
- Public environment variables: `PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH` and `PUBLIC_CONTACTO_EMAIL`. The old `NEXT_PUBLIC_*` names are accepted as a fallback.
