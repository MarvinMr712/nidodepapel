# Nido de Papel

Sitio de la biblioteca rotativa de cuentos infantiles en Lima.

> Pequeños lectores, grandes vuelos.

## Qué es

Un catálogo público de 172 títulos que rotan por edad. El visitante elige su
rango de edad, ve los libros disponibles y arma su kit. No hay carrito ni pagos:
la reserva se termina conversando por WhatsApp.

## Stack

- Astro 7 con salida estática y TypeScript
- React 19 para las islas interactivas (`@astrojs/react`)
- Tailwind CSS 4 mediante `@tailwindcss/vite`
- `motion` para las animaciones, con `prefers-reduced-motion` respetado
- Sin base de datos: los datos son un JSON

Requiere Node 22.23.4 o superior.

## Puesta en marcha

```bash
npm install
npm run dev
```

Queda en http://localhost:4321/nidodepapel/

## Publicar

El build siempre es estático y escribe la carpeta `out/`:

```bash
npm run build
```

El workflow `.github/workflows/desplegar-pages.yml` ya publica en GitHub Pages
solo, con el repositorio en `main`. El sitio queda en
https://marvinmr712.github.io/nidodepapel/.

### Configuración

Copia `.env.example` a `.env` y ajusta:

| Variable | Para qué sirve |
| --- | --- |
| `PUBLIC_SITE_URL` | URL pública completa, con subcarpeta si aplica |
| `PUBLIC_BASE_PATH` | Subcarpeta del sitio; `/` para un dominio en la raíz |
| `PUBLIC_CONTACTO_EMAIL` | Correo de contacto |

Por defecto el sitio usa `https://marvinmr712.github.io/nidodepapel` y
`/nidodepapel`, que es donde publica GitHub Pages. Los nombres antiguos
`NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_CONTACTO_EMAIL` se siguen aceptando como
respaldo.

## Datos

Hay dos archivos de catálogo y la diferencia importa:

- **`src/data/libros.json`** — se sube al repositorio. Títulos, autores, edad,
  categoría, formato. Es lo único que usa el sitio.
- **`src/data/libros-privados.json`** — **no se sube**, está en `.gitignore`.
  El detalle de cada ejemplar: código, estado y nombre de quien lo tiene.

Si clonaste el repositorio en otra máquina, copia a mano el segundo archivo o el
conteo de ejemplares aparecerá como 0.

## Estructura

```
src/
  pages/          rutas: /, /catalogo, /etapas, /libros/[slug], /categorias...
  layouts/        Layout.astro con header, footer y metadatos
  components/     islas React y piezas reutilizables
  styles/         globals.css: tokens, animaciones y utilidades
  data/           los dos archivos de catálogo
  lib/
    catalogo.ts   acceso a datos, filtros y SITE
    types.ts      tipos
public/           logo, imagen para compartir, favicon
scripts/          utilidades de mantenimiento (leer scripts/README.md)
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Revisa tipos y errores de Astro |
| `npm run lint` | Alias de `npm run check` |
| `npm run build` | Build estático en `out/` |
| `npm run preview` | Sirve el build estático |
| `npm start` | Alias de `npm run preview` |
