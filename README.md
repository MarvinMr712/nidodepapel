# Nido de Papel

Sitio estatico, generado con Astro. Reemplaza al proyecto anterior en Next.js y
produce el mismo HTML, con las mismas 186 paginas, sin servidor.

## Arrancar

```bash
npm install
npm run dev
```

Queda en `http://localhost:4321`.

## Verificar

```bash
npm run verificar
```

Encadena seis comprobaciones y se detiene en la primera que falle:

| Paso | Que revisa |
| --- | --- |
| `verificar:fuentes` | Caracteres invisibles, restos de una edicion a medias, CSS desbalanceado y saltos de linea mezclados. |
| `check` | Tipos de Astro y TypeScript. |
| `build` | Genera `dist/`. |
| `verificar:paginas` | Recuento de paginas, sitemap, enlaces internos, contadores y datos personales. |
| `verificar:scripts` | Sintaxis del JavaScript que se inserta en las paginas, y los bloques JSON-LD. |
| `verificar:texto` | Que las 107 frases del proyecto anterior sigan apareciendo en el HTML. |
| `verificar:responsivo` | Que toda variante `sm:`, `md:`, `lg:` o `min-[...]` usada en el HTML exista de verdad en el CSS, y que ninguna anchura fija se salga de una pantalla de 360 px. |

Los pasos que requeriren `dist/` se pueden lanzar por separado despues de un
`npm run build`.

## Desplegar

Dos variables deciden como quedan las URLs. Copia `.env.example` a `.env` y
ajustalas:

```ini
SITE_URL=https://tu-dominio.com
BASE_PATH=/
PUBLIC_CONTACTO_EMAIL=hola@nidodepapel.pe
```

- `SITE_URL`: **solo el origen, sin ruta**, y es el dominio y protocolo
  definitivos. Entra en los enlaces canonicos, en `sitemap.xml`, en
  `robots.txt` y en los datos de Open Graph. Si se deja el valor de ejemplo, el
  sitio funciona pero publica URLs con un dominio de mentira.
- `BASE_PATH`: subcarpeta del sitio. En la raiz es `/`. Si el proyecto se
  publica en `https://tu-usuario.github.io/nido-de-papel`, entonces:

  ```ini
  SITE_URL=https://tu-usuario.github.io
  BASE_PATH=/nido-de-papel
  ```

La subcarpeta va en `BASE_PATH` y **no** en `SITE_URL`. Astro espera un origen
en `site`; darle ahi una ruta completa (`https://tu-usuario.github.io/nido-de-papel`)
deja `npm run build` colgado de forma indefinida y sin imprimir un solo error.
`astro.config.mjs` separa la subcarpeta si se la pone por error y la pasa a
`base`, pero lo correcto es escribirla en `BASE_PATH`.

Para desplegar en GitHub Pages hay que aadir un paso antes del build:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- run: npm run build
  env:
    SITE_URL: https://tu-usuario.github.io
    BASE_PATH: /nido-de-papel
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
```

Ambas variables tienen que estar definidas tambien al desplegar. Si no,
`SITE_URL` cae en el dominio de ejemplo y las URLs absolutas salen mal.

## Datos personales

`src/data/` trae unicamente informacion publica. Los datos de los ejemplares
con nombre de propietario se leen de un archivo que vive fuera de este proyecto
y **no se copian aqui**. Si alguna vez se autoriza incluirlos, el `.gitignore`
ya esta preparado para que no acaben en el repositorio.
