/**
 * Revisa que el sitio se vea bien en cualquier pantalla.
 *
 * El problema tipico de Tailwind con Astro es que una clase se usa en el HTML
 * pero su variante no llega al CSS: el archivo se genera bien, la pagina se ve
 * bien en escritorio y en el movil se rompe el `<details>`, la imagen se sale o
 * el grid deja de tener columnas. No hay error, solo una regla que falta.
 *
 * Aqui se cruzan dos listas:
 *
 *   - Las clases que usa el HTML generado, con y sin variante.
 *   - Los selectores que hay en el CSS construido.
 *
 * Y se avisa de tres cosas:
 *
 *   1. Variantes de Tailwind que se usan pero no existen en el CSS. Estas son
 *      un fallo claro: sin la regla, ese elemento no cambia con el ancho.
 *   2. Otras clases que faltan. Se listan aparte porque pueden ser clases
 *      propias del sitio en vez de utilidades de Tailwind.
 *   3. Anchos fijos que no entran en una pantalla de 360px.
 *
 * Las clases sueltas que se ven dentro de los scripts se cuentan aparte: las
 * escribe el navegador en caliente y no aparecen en el HTML inicial.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "dist";
const fallos = [];
const avisos = [];

/** Pantalla mas estrecha que se mira en serio. */
const ANCHO_MINIMO = 360;

/* ------------------------------------------------------------- CSS generado */

const archivoCss = readdirSync(join(RAIZ, "_astro")).find((n) => n.endsWith(".css"));
if (!archivoCss) {
  console.error("No hay CSS en dist/_astro. Ejecuta `npm run build` primero.");
  process.exit(2);
}
const css = readFileSync(join(RAIZ, "_astro", archivoCss), "utf8");

/* ------------------------------------------------------ clases del HTML */

/**
 * Tailwind escapa en el CSS los caracteres que tiene reservas en un selector:
 * `sm:grid-cols-3` se escribe `.sm\:grid-cols-3` y `min-[420px]:inline` se
 * escribe `.min-\[420px\]\:inline`. Sin esta conversion, la busqueda no
 * encuentra nada y todos los avisos serian falsos.
 */
const escapar = (clase) =>
  clase.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "\\$&");

const paginas = [];
const caminar = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) caminar(completo);
    else if (nombre.endsWith(".html")) paginas.push(completo);
  }
};
caminar(RAIZ);

const usadasHtml = new Map(); // clase -> pagina donde se vio
const usadasJs = new Set();

for (const pagina of paginas) {
  const bruto = readFileSync(pagina, "utf8");

  /* El texto de los scripts se separa para no confundir una cadena de
   * JavaScript con una clase. */
  const sinScripts = bruto.replace(/<script[\s\S]*?<\/script>/g, " ");

  for (const m of sinScripts.matchAll(/class="([^"]*)"/g)) {
    for (const clase of m[1].split(/\s+/)) {
      if (clase) usadasHtml.set(clase, (usadasHtml.get(clase) ?? "") + pagina);
    }
  }

  for (const m of bruto.matchAll(/<script[\s\S]*?<\/script>/g)) {
    for (const c of m[0].matchAll(/"([a-z0-9][^"]{3,300})"/g)) {
      for (const clase of c[1].split(/\s+/)) {
        if (/^[a-z0-9[\]:/.-]+$/i.test(clase)) usadasJs.add(clase);
      }
    }
  }
}

/* ---------------------------------------------------------------- informe */

/* Una variante es una clase con prefijo de punto de ruptura o de estado. Para
 * los cortes arbitrarios no basta con mirar lo que va justo despues de
 * `min-[`, porque el ancho va en medio: `min-[420px]:hidden`. */
const VARIANTES =
  /^(sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover|first|last|odd|even|motion-safe|motion-reduce|print):|^(min|max)-\[|^[\w-]+:\[/;

/* --------------------------------------------------------- anchos fijos */

/* `w-[420px]` y `min-w-[500px]` no entran en una pantalla estrecha. Los
 * anchos en `vw` y los porcentuales se dejan fuera: esos se adaptan solos. */
const anchosFijos = new Map();
for (const [clase, donde] of usadasHtml) {
  const m = clase.match(/^(min-)?w-\[(\d+)px\]$/);
  if (m && Number(m[2]) > ANCHO_MINIMO) {
    anchosFijos.set(clase, donde);
  }
}

/* ----------------------------------------------------------- informe */

const faltanVariante = [];
const faltanOtras = [];

/* Los anchos demasiado grandes ya se reportan como fallo mas abajo. No se
 * anotan tambien aqui, o el mismo problema sale dos veces en el informe. */
const yaReportados = new Set(anchosFijos.keys());

for (const [clase, donde] of usadasHtml) {
  if (css.includes(`.${escapar(clase)}`)) continue;

  if (VARIANTES.test(clase)) faltanVariante.push([clase, donde]);
  else if (!yaReportados.has(clase)) faltanOtras.push([clase, donde]);
}

/* ------------------------------------------------------------- viewport */

for (const pagina of paginas) {
  const bruto = readFileSync(pagina, "utf8");
  const meta = bruto.match(
    /<meta name="viewport" content="([^"]*)"/,
  );
  if (!meta) {
    fallos.push(`${pagina.replace(/\\/g, "/")}: sin meta viewport`);
  } else if (!meta[1].includes("width=device-width")) {
    fallos.push(
      `${pagina.replace(/\\/g, "/")}: viewport sin width=device-width`,
    );
  }
}

/* ---------------------------------------------------------------- salida */

console.log(`Paginas revisadas: ${paginas.length}`);
console.log(`Clases distintas en el HTML: ${usadasHtml.size}`);
console.log(`CSS: ${(css.length / 1024).toFixed(1)} KB`);

if (faltanVariante.length) {
  console.log(`\nVariantes que FALTAN en el CSS (${faltanVariante.length}):`);
  for (const [clase, donde] of faltanVariante) {
    console.log(`  x ${clase}   en ${String(donde).split(",")[0]}`);
    fallos.push(`falta la variante ${clase}`);
  }
}

if (anchosFijos.size) {
  console.log(`\nAnchos fijos mas anchos que ${ANCHO_MINIMO}px (${anchosFijos.size}):`);
  for (const [clase, donde] of anchosFijos) {
    console.log(`  x ${clase}   en ${String(donde).split(",")[0]}`);
    fallos.push(`ancho fijo ${clase}`);
  }
}

if (faltanOtras.length) {
  console.log(`\nClases sin regla en el CSS (${faltanOtras.length}), a revisar:`);
  for (const [clase] of faltanOtras.slice(0, 25)) {
    console.log(`  ? ${clase}`);
  }
  avisos.push(`${faltanOtras.length} clases sin regla: pueden ser propias del sitio`);
}

/* Los scripts de JavaScript pueden pedir clases que no estan en el HTML. */
const faltanEnJs = [...usadasJs].filter(
  (c) => VARIANTES.test(c) && !css.includes(`.${escapar(c)}`),
);
if (faltanEnJs.length) {
  console.log(`\nVariantes que solo pide el JavaScript y no estan (${faltanEnJs.length}):`);
  for (const c of faltanEnJs.slice(0, 25)) console.log(`  ? ${c}`);
  avisos.push(`${faltanEnJs.length} variantes usadas solo por JavaScript`);
}

console.log("");
if (fallos.length) {
  console.log(`FALLOS (${fallos.length}). Revisar tambien los avisos.`);
  process.exitCode = 1;
} else if (avisos.length) {
  console.log(`Sin fallos, con ${avisos.length} aviso(s) por confirmar a mano.`);
} else {
  console.log("OK - Todas las variantes responsive estan en el CSS.");
}
