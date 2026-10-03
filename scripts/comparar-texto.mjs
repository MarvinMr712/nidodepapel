/**
 * Compara el texto del sitio original con el del sitio construido.
 *
 * La idea es simple: cada frase que se ve en el original tiene que aparecer
 * también en el HTML de Astro. Si al portar una página se cae un párrafo, se
 * cambia una palabra o se rompe una tilde, el HTML sale distinto y aquí se ve.
 *
 * Del `.tsx` original se sacan dos cosas:
 *   1. Cadenas de texto: descripciones de metadata, `aria-label`, mensajes de
 *      WhatsApp y similares.
 *   2. Nodos de texto de JSX: el texto suelto entre etiquetas, que es donde vive
 *      la mayor parte de la prosa.
 *
 * De las cadenas se descartan las de `className` y los tecnicismos, porque no son
 * texto que se lea en pantalla y comparar las daría falso positivo.
 *
 * Cada frase se busca primero en el HTML con etiquetas (para los atributos) y
 * después en el texto sin etiquetas (para la prosa). Así no hace falta distinguir
 * de dónde salió cada una.
 *
 * El original se usa solo como referencia de lectura. No se escribe nada en él.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL ?? "../casa-de-cuentos";
const NUEVO = "dist";

const fallos = [];
const avisos = [];

/* ------------------------------------------------------ tecnicismos a descartar */

const NO_ES_TEXTO = new Set(["use client", "use server"]);

const VALORES_DE_ATRIBUTO = new Set([
  "noopener noreferrer",
  "_blank",
  "noreferrer",
  "lazy",
  "eager",
  "module",
  "canonical",
  "alternate",
  "og",
  "twitter",
  "summary",
  "summary_large_image",
]);

/** Una palabra sin espacios es un identificador, no una frase. */
const pareceClase = (s) =>
  /(^|\s)(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|container|prose|truncate|sr-only|group|peer|contents)(\s|$)/.test(s) ||
  /(^|\s)(text|bg|border|rounded|shadow|opacity|font|leading|tracking|align|object|overflow|z|inset|top|bottom|left|right|gap|space|p|m|w|h|min|max|order|translate|rotate|scale)-/.test(s) ||
  /(^|\s)(sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover|first|last|odd|even):/.test(s) ||
  /\[[0-9]+px\]/.test(s) ||
  /\d+\/\d{2}/.test(s);

const esTecnicismo = (s) =>
  VALORES_DE_ATRIBUTO.has(s) ||
  /^[,\s)}]/.test(s) || // fragmentos de código sueltos
  /^(https?:|mailto:|tel:|#|\/)/.test(s) ||
  /^[A-Za-z_$][\w$]*\s*:/.test(s) || // `label:` de un objeto
  /[{}=]/.test(s) ||
  /\)\s*[.,;]|\)\s*\.[a-z]/.test(s) || // restos de una llamada: `getEtapa(e)) .filter`
  /=>|\?\s|\s\?|: (string|number|boolean|undefined|never)\b/.test(s) ||
  pareceClase(s) ||
  /^[a-z]+(:[a-z]+)?$/.test(s) ||
  /\.(tsx?|astro|json|css|js|png|jpg|webp|svg|ico)$/.test(s);

const esTexto = (s) => {
  if (s.length < 8 || s.length > 400) return false;
  if (!/\p{L}{3}/u.test(s)) return false;
  if (!/\s/.test(s)) return false;
  if (esTecnicismo(s)) return false;
  if (/=>|\$\{|\{\{/.test(s)) return false;
  return true;
};

/* --------------------------------------------------------------- extractores */

/** Cadenas de comillas y de backticks, sin expresiones dentro. */
const cadenas = (fuente) => {
  const salida = [];
  const re = /"([^"\\\n]{8,400})"|'([^'\\\n]{8,400})'|`([^`$\n]{8,400})`/g;
  let m;
  while ((m = re.exec(fuente))) {
    const s = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (s) salida.push(s);
  }
  return salida;
};

/**
 * Nodos de texto de JSX: lo que queda entre `>` y `<`, sin tocar nada dentro.
 *
 * Se descartan los que tienen `className`, etiquetas o expresiones, porque esos
 * son atributos o código, no prosa. El texto se junta con espacios para que una
 * frase partida en varias líneas se vuelva a leer igual que en el HTML final.
 */
const nodosJsx = (fuente) => {
  const salida = [];
  for (const m of fuente.matchAll(/>([^<>{}]{8,400})</g)) {
    const limpio = m[1].replace(/\s+/g, " ").trim();
    if (limpio) salida.push(limpio);
  }
  return salida;
};

/* --------------------------------------------------------- páginas a comparar */

const COMPARACIONES = [
  { tsx: "src/app/layout.tsx", html: ["**todas**"] },
  { tsx: "src/app/page.tsx", html: ["index.html"] },
  { tsx: "src/app/catalogo/page.tsx", html: ["catalogo/index.html"] },
  { tsx: "src/app/categorias/page.tsx", html: ["categorias/index.html"] },
  { tsx: "src/app/categorias/[slug]/page.tsx", html: ["categorias/*"] },
  { tsx: "src/app/etapas/page.tsx", html: ["etapas/index.html"] },
  { tsx: "src/app/etapas/[slug]/page.tsx", html: ["etapas/*"] },
  { tsx: "src/app/libros/[slug]/page.tsx", html: ["libros/*"] },
  { tsx: "src/app/como-funciona/page.tsx", html: ["como-funciona/index.html"] },
  { tsx: "src/app/not-found.tsx", html: ["404.html"] },
  { tsx: "src/components/LibroCard.tsx", html: ["libros/*", "catalogo/index.html"] },
  { tsx: "src/components/SelectorEdad.tsx", html: ["index.html"] },
  { tsx: "src/components/Contador.tsx", html: ["index.html", "como-funciona/index.html"] },
  { tsx: "src/components/CintaTitulos.tsx", html: ["index.html"] },
];

/** Resuelve los patrones: `**todas**`, `carpeta/archivo.html` o `carpeta/*`. */
const resolverHtml = (patron) => {
  if (patron === "**todas**") {
    const salida = [];
    const caminar = (dir) => {
      for (const nombre of readdirSync(dir)) {
        const completo = join(dir, nombre);
        if (statSync(completo).isDirectory()) caminar(completo);
        else if (nombre.endsWith(".html")) salida.push(completo);
      }
    };
    caminar(NUEVO);
    return salida;
  }

  if (!patron.includes("*")) {
    const directa = join(NUEVO, patron);
    return existsSync(directa) ? [directa] : [];
  }

  /* `carpeta/*`: una subcarpeta por página, con su index.html dentro. Es como
   * Astro construye las rutas estáticas, así que calza con el patrón. */
  const padre = join(NUEVO, patron.slice(0, patron.indexOf("*")).replace(/\/$/, ""));
  if (!existsSync(padre)) return [];
  return readdirSync(padre)
    .filter((n) => statSync(join(padre, n)).isDirectory())
    .map((n) => join(padre, n, "index.html"))
    .filter((p) => existsSync(p));
};

/* ------------------------------------------------------------------ comparar */

/**
 * Frases que sí están en el original pero que no pueden salir nunca en un build
 * estático, así que no se comparan.
 *
 * Son las ramas de error y de lista vacía: `notFound()` solo se ejecuta si la
 * ruta no existe, y `getStaticPaths` no genera rutas que no existan; los
 * "todavía no hay libros" solo se ven si una categoría o una etapa se quedan sin
 * títulos, y en este inventario las cinco y las tres tienen. El original tampoco
 * las muestra nunca.
 */
const RAMAS_INALCANZABLES = new Map([
  ["Categoría no encontrada", "notFound() de /categorias/[slug]"],
  ["Etapa no encontrada", "notFound() de /etapas/[slug]"],
  ["Libro no encontrado", "notFound() de /libros/[slug]"],
  ["Todavía no hay libros en esta categoría.", "lista vacía de /categorias/[slug]"],
  ["Todavía no hay libros para esta edad.", "lista vacía de /etapas/[slug]"],
  ["libro sirve", "singular de /etapas/[slug]; toda etapa tiene más de un libro"],
]);

/**
 * Si una rama es inalcanzable, la otra de la misma elección tiene que estar.
 * Sirve para no tapar un fallo con la lista de anteriores: si el singular nunca
 * sale, el plural es el que se ve, y ese sí se comprueba.
 */
const CONTRAPARTE = new Map([
  ["libro sirve", "libros sirven"],
]);

let totalFrases = 0;

for (const cmp of COMPARACIONES) {
  const fuente = join(ORIGINAL, cmp.tsx);
  if (!existsSync(fuente)) {
    avisos.push(`No se encontró ${cmp.tsx} en el original`);
    continue;
  }

  const paginas = cmp.html.flatMap(resolverHtml);
  if (paginas.length === 0) {
    fallos.push(`${cmp.tsx}: no encontré ninguna página HTML que comparar`);
    continue;
  }

  const original = readFileSync(fuente, "utf8");

  /* Con etiquetas: sirve para atributos como aria-label o content. */
  const crudo = paginas.map((p) => readFileSync(p, "utf8")).join("\n");

  /* Los enlaces de WhatsApp van percent-encoded, así que el mensaje aparece con
   * %20 y no con espacios. Sin decodificar, la comparación daría falso negativo
   * justo en los textos más importantes.
   *
   * Los escapes van en UTF-8, así que hay que decodificar la tirada entera de
   * una vez: `informaci%C3%B3n` son dos bytes de una sola letra y decodificarlos
   * por separado daría "informaciÃ³n". */
  const conEtiquetas = crudo
    .replace(/(?:%[0-9A-Fa-f]{2})+/g, (tirada) => {
      try {
        return decodeURIComponent(tirada);
      } catch {
        return tirada;
      }
    })
    .replace(/\s+/g, " ");

  /* Sin etiquetas: para la prosa. Se quitan también los scripts, que si no
   * aportarían cadenas minificadas sin relación con lo que se ve. */
  const soloTexto = crudo
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, ";")
    .replace(/\s+/g, " ");

  const frases = [
    ...new Set([...cadenas(original), ...nodosJsx(original)].map((s) => s.trim())),
  ]
    .filter((s) => !NO_ES_TEXTO.has(s))
    .filter(esTexto);

  const ausentes = [];
  for (const frase of frases) {
    if (RAMAS_INALCANZABLES.has(frase)) {
      /* La rama que sí se ve tiene que estar de verdad. */
      const otra = CONTRAPARTE.get(frase);
      if (otra && !conEtiquetas.includes(otra) && !soloTexto.includes(otra)) {
        fallos.push(`${cmp.tsx}: debería verse "${otra}", que es la rama posible`);
      }
      continue;
    }
    if (conEtiquetas.includes(frase)) continue;
    if (soloTexto.includes(frase)) continue;
    ausentes.push(frase);
  }

  totalFrases += frases.length;

  if (ausentes.length > 0) {
    fallos.push(
      `${cmp.tsx}: ${ausentes.length} de ${frases.length} frases no aparecen en el HTML`,
    );
    for (const a of ausentes) console.log(`    ${cmp.tsx}: "${a}"`);
  } else {
    console.log(`ok  ${cmp.tsx} (${frases.length} frases, ${paginas.length} páginas)`);
  }
}

console.log(`\nFrases comparadas: ${totalFrases}`);

if (avisos.length) {
  console.log("\nAvisos:");
  for (const a of avisos) console.log("  - " + a);
}

if (fallos.length) {
  console.log(`\nFALLOS (${fallos.length}):`);
  for (const f of fallos) console.log("  x " + f);
  process.exitCode = 1;
} else if (totalFrases === 0) {
  /*
   * Sin esta rama, el script que se ejecuta sin el proyecto original al lado
   * terminaba diciendo "OK" sin haber comparado una sola frase. Un verde asi no
   * prueba nada, y es justo el tipo de comprobacion que hace perder la
   * confianza en todo lo demas. Si no hay nada que comparar, se dice.
   */
  console.log(
    "\nSIN COMPARAR - No se encontro el proyecto original, asi que no se " +
      "comparo ninguna frase.\n" +
      "  Apunta ORIGINAL a la carpeta del proyecto en Next.js, por ejemplo:\n" +
      '    ORIGINAL="C:\\ruta\\al\\original" npm run verificar:texto',
  );
} else {
  console.log("\nOK - Todo el texto del original aparece en el HTML generado.");
}
