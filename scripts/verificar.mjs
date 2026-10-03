/**
 * Comprobaciones del sitio construido.
 *
 * Se ejecuta sobre `dist/`, no sobre los fuentes, porque lo que importa es lo
 * que se va a publicar. Cubre cuatro cosas: que estén las 172 páginas de
 * libros, que el catálogo y sus filtros estén en el HTML, que no se haya
 * escapado ningún dato personal y que los enlaces internos apunten a páginas
 * que existen de verdad.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = "dist";
const fallos = [];
const avisos = [];

const comprobar = (ok, mensaje, detalle = "") => {
  if (!ok) fallos.push(`${mensaje}${detalle ? ` — ${detalle}` : ""}`);
};

const html = (ruta) => readFileSync(join(RAIZ, ruta), "utf8");

/* ---------------------------------------------------- inventario de salida */

const htmlFiles = [];
const caminar = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) caminar(completo);
    else if (nombre.endsWith(".html")) htmlFiles.push(relative(RAIZ, completo));
  }
};
caminar(RAIZ);

/* ------------------------------------------------------ datos del catálogo */

const datos = JSON.parse(readFileSync("src/data/libros.json", "utf8"));
const libros = datos.libros;
const etapas = datos.etapas;

console.log(`Títulos en libros.json: ${libros.length}`);
console.log(`Ejemplares declarados: ${datos.totalEjemplares}`);
comprobar(libros.length === 172, "libros.json debería traer 172 títulos", String(libros.length));
comprobar(
  datos.totalEjemplares === 180,
  "totalEjemplares debería ser 180",
  String(datos.totalEjemplares),
);

/* --------------------------------------------------- páginas de cada libro */

const faltan = [];
for (const l of libros) {
  const ruta = `libros${l.slug ? "/" + l.slug : ""}/index.html`;
  if (!existsSync(join(RAIZ, ruta))) faltan.push(l.slug);
}
comprobar(faltan.length === 0, "Faltan páginas de libros", faltan.slice(0, 5).join(", "));

const SEP = process.platform === "win32" ? "\\" : "/";

const sobran = htmlFiles.filter((f) => {
  if (!f.startsWith(`libros${SEP}`)) return false;
  const slug = f.slice(`libros${SEP}`.length).split(SEP)[0];
  return !libros.some((l) => l.slug === slug);
});
comprobar(sobran.length === 0, "Hay páginas de libros que no están en el JSON", sobran.join(", "));

/* -------------------------------------------------------------- páginas fijas */

for (const fija of ["index.html", "404.html", "catalogo/index.html", "como-funciona/index.html", "etapas/index.html", "categorias/index.html", "sitemap.xml", "robots.txt"]) {
  comprobar(existsSync(join(RAIZ, fija)), `Falta ${fija}`);
}

/* -------------------------------------------------------------- sitemap */

const sitemap = html("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const esperado = 5 + 5 + etapas.length + libros.length;
console.log(`URLs en sitemap.xml: ${locs.length} (esperado ${esperado})`);

/*
 * El sitio puede publicarse en un subdirectorio, y entonces los enlaces del
 * HTML llevan ese prefijo (`/nidodepapel/catalogo`) mientras que los archivos de
 * `dist/` no lo llevan (`dist/catalogo/`). El prefijo se deduce de la primera
 * URL del sitemap en lugar de repetir la configuracion de astro.config.mjs aqui,
 * para que si un dia cambia no se quede obsoleto y empiecen a fallar enlaces que
 * estan bien.
 */
const PREFIJO = (() => {
  if (!locs.length) return "";
  try {
    const ruta = new URL(locs[0]).pathname;
    return ruta === "/" ? "" : ruta.replace(/\/+$/, "");
  } catch {
    return "";
  }
})();

/** Quita el prefijo de publicacion y deja la ruta interna. */
const interna = (url) => {
  let ruta = url;
  if (/^https?:/i.test(url)) {
    try {
      ruta = new URL(url).pathname;
    } catch {
      return url;
    }
  }
  if (PREFIJO && (ruta === PREFIJO || ruta.startsWith(`${PREFIJO}/`))) {
    return ruta.slice(PREFIJO.length) || "/";
  }
  return ruta;
};

if (PREFIJO) console.log(`Publicado en un subdirectorio: ${PREFIJO}`);
comprobar(locs.length === esperado, "El sitemap no tiene todas las URLs", `${locs.length} vs ${esperado}`);

const huerfanas = locs.filter((u) => {
  const ruta = interna(u);
  return !existsSync(join(RAIZ, `${ruta}/index.html`)) && !existsSync(join(RAIZ, ruta));
});
comprobar(huerfanas.length === 0, "El sitemap apunta a páginas inexistentes", huerfanas.join(", "));

/* ------------------------------------------------------------- robots */

const robots = html("robots.txt");
comprobar(/User-Agent:\s*\*/i.test(robots), "robots.txt sin User-Agent");
comprobar(/Sitemap:\s*\S+sitemap\.xml/i.test(robots), "robots.txt sin referencia al sitemap");

/* --------------------------------------------------- catálogo y sus filtros */

const catalogo = html("catalogo/index.html");
const enlacesLibro = (catalogo.match(new RegExp(`href="${PREFIJO}/libros/`, "g")) || []).length;
const selects = (catalogo.match(/<select/g) || []).length;
const inputs = (catalogo.match(/<input/g) || []).length;
console.log(`Catálogo: ${enlacesLibro} enlaces a libros, ${selects} select, ${inputs} input`);
comprobar(enlacesLibro >= 172, "El catálogo no trae los 172 títulos en el HTML", String(enlacesLibro));
comprobar(selects === 6, "El catálogo debería tener 6 desplegables", String(selects));
comprobar(inputs === 0, "El catálogo no debería tener campos de texto", String(inputs));

/* --------------------------------------- los contadores traen el numero real */

/*
 * El contador anima de cero al valor cuando entra en pantalla, pero el HTML tiene
 * que llevar SIEMPRE el número final. Si en el HTML sale un 0, un visitante sin
 * JavaScript, o un buscador que no lo ejecuta, leería que no hay títulos. Es un
 * fallo que solo se ve desactivando el JavaScript, y por eso se comprueba aquí.
 */
const paginasConContador = ["index.html", "como-funciona/index.html"];
let contadores = 0;

for (const pagina of paginasConContador) {
  const contenido = html(pagina);
  const encontrados = [
    ...contenido.matchAll(
      /<span data-contador="(\d+)"[^>]*>([^<]*)<\/span>/g,
    ),
  ];
  comprobar(
    encontrados.length > 0,
    `${pagina}: no hay ningún contador en el HTML`,
  );
  for (const [, valor, texto] of encontrados) {
    contadores++;
    comprobar(
      Number(texto) === Number(valor),
      `${pagina}: el contador dice "${texto}" en el HTML y debería decir ${valor}`,
      `data-contador="${valor}"`,
    );
    comprobar(
      Number(texto) > 0,
      `${pagina}: hay un contador en 0 en el HTML`,
      texto,
    );
  }
}
console.log(`Contadores con el número real en el HTML: ${contadores}`);

/* ------------------------------------------------------ datos personales */

/*
 * El archivo privado NO se copia a este proyecto a propósito. Para poder
 * comprobar que ningún nombre se escapa al HTML, el script lo lee del proyecto
 * de donde viene. Si no lo encuentra, avisa y sigue: la revisión de fugas solo
 * tiene sentido si tiene contra qué comparar.
 */
const RUTA_PRIVADO =
  process.env.LIBROS_PRIVADOS ?? "../casa-de-cuentos/src/data/libros-privados.json";

let privados = null;
if (existsSync(RUTA_PRIVADO)) {
  privados = readFileSync(RUTA_PRIVADO, "utf8");
} else {
  avisos.push(
    `No se encontró ${RUTA_PRIVADO}: la revisión de datos personales quedó sin comparar.`,
  );
}

const nombres = new Set();
if (privados) {
  for (const bloque of privados.match(/"propietario"\s*:\s*"([^"]+)"/g) || []) {
    nombres.add(bloque.split('"')[3]);
  }
}

console.log(`Nombres de propietarios detectados: ${nombres.size}`);

const fugas = [];
for (const archivo of htmlFiles) {
  const contenido = readFileSync(join(RAIZ, archivo), "utf8");
  for (const nombre of nombres) {
    if (contenido.includes(nombre)) fugas.push(`${archivo}: ${nombre}`);
  }
  if (contenido.includes("propietario")) fugas.push(`${archivo}: la palabra "propietario"`);
  if (contenido.includes("codigo")) fugas.push(`${archivo}: la palabra "codigo"`);
}
comprobar(fugas.length === 0, "Se filtraron datos personales al HTML", fugas.slice(0, 5).join(" | "));

/* ----------------------------------------------- enlaces internos rotos */

const rutasConocidas = new Set([
  "/",
  "/404.html",
  "/catalogo",
  "/como-funciona",
  "/etapas",
  "/categorias",
  "/sitemap.xml",
  "/robots.txt",
]);
for (const f of htmlFiles) {
  const ruta = "/" + f.split("\\").join("/");
  rutasConocidas.add(ruta);
  rutasConocidas.add(ruta.replace(/index\.html$/, ""));
}
for (const e of etapas) rutasConocidas.add(`/etapas/${e.slug}`);
for (const c of ["emociones-vinculo", "habitos-rutinas-valores", "conocimiento", "diversion-imaginacion", "fe"]) {
  rutasConocidas.add(`/categorias/${c}`);
}
for (const l of libros) rutasConocidas.add(`/libros/${l.slug}`);

const rotas = new Set();
for (const archivo of htmlFiles) {
  const contenido = readFileSync(join(RAIZ, archivo), "utf8");
  for (const m of contenido.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = interna(m[1]);
    if (!href.startsWith("/")) continue;
    if (/(\.png|\.jpg|\.webp|\.ico|\.xml|\.txt|\.css|\.js|\.woff2)$/.test(href)) continue;
    const limpio = href.replace(/\/$/, "");
    const existe =
      rutasConocidas.has(href) ||
      rutasConocidas.has(limpio) ||
      rutasConocidas.has(limpio + "/") ||
      rutasConocidas.has(href + "/");
    if (!existe) rotas.add(`${archivo} -> ${href}`);
  }
}
comprobar(rotas.size === 0, "Enlaces internos rotos", [...rotas].slice(0, 8).join(" | "));

/* ------------------------------------------- rutas absolutas que no deben estar */

const absolutas = [];
for (const archivo of htmlFiles) {
  const contenido = readFileSync(join(RAIZ, archivo), "utf8");
  for (const m of contenido.matchAll(/(?:href|src)="([A-Za-z]:\\[^"]*|file:\/\/[^"]*)"/g)) {
    absolutas.push(`${archivo} -> ${m[1]}`);
  }
}
comprobar(absolutas.length === 0, "Hay rutas absolutas de máquina en el HTML", absolutas.slice(0, 5).join(" | "));

/* ------------------------------------------------------ textos y contenido */

const inicio = html("index.html");
for (const texto of [
  "No necesitas más libros",
  "Necesitas los correctos",
  "Kit Básico",
  "Kit Premium",
  "Pequeños lectores, grandes vuelos",
  "955 419 565",
  "51955419565",
]) {
  comprobar(inicio.includes(texto), `Falta un texto esperado en la portada`, texto);
}

const comoFunciona = html("como-funciona/index.html");
for (const texto of ["Sin devolución no hay rotación", "Más elegido", "Barranco", "leirmen"]) {
  comprobar(comoFunciona.includes(texto), `Falta un texto esperado en cómo funciona`, texto);
}

/* ---------------------------------------------------------------- salida */

console.log("");
if (avisos.length) {
  console.log("Avisos:");
  for (const a of avisos) console.log("  - " + a);
  console.log("");
}
if (fallos.length === 0) {
  console.log(`OK — ${htmlFiles.length} páginas HTML comprobadas.`);
} else {
  console.log(`FALLOS (${fallos.length}):`);
  for (const f of fallos) console.log("  x " + f);
  process.exitCode = 1;
}
