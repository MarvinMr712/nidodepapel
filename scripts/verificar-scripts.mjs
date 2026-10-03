/**
 * Revisa el JavaScript y el JSON que Astro inlineo en el HTML.
 *
 * Astro decide por su cuenta si un script va en un archivo aparte o dentro del
 * HTML, asi que aqui no se busca un archivo concreto: se busca que cada bloque
 * que si llego al HTML sea utilizable. Un modulo con un error de sintaxis se
 * lleva por delante la interaccion entera de la pagina, y un JSON mal cerrado
 * rompe el `JSON.parse` del script que lo consume. Los dos fallos son
 * silenciosos en el navegador, asi que conviene cazarlos aqui.
 *
 * Para validar el JavaScript se llama a `node --check` sobre un temporal: es la
 * unica forma de comprobar un modulo ES sin instalar nada, y de paso usa el
 * mismo analizador que el navegador.
 */

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const RAIZ = "dist";
const fallos = [];

const temporal = mkdtempSync(join(tmpdir(), "verificar-scripts-"));
let modulo = 0;

const comprobarSintaxis = (codigo, etiqueta) => {
  const archivo = join(temporal, `modulo-${modulo++}.mjs`);
  writeFileSync(archivo, codigo, "utf8");
  try {
    execFileSync(process.execPath, ["--check", archivo], { stdio: "pipe" });
  } catch (error) {
    const detalle = (error.stderr?.toString() || error.message)
      .split("\n")
      .filter((l) => l.trim() && !l.includes(temporal))
      .slice(0, 3)
      .join(" ");
    fallos.push(`${etiqueta}: JavaScript con error de sintaxis - ${detalle}`);
  }
};

const htmlFiles = [];
const caminar = (dir) => {
  for (const nombre of readdirSync(dir)) {
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) caminar(completo);
    else if (nombre.endsWith(".html")) htmlFiles.push(relative(RAIZ, completo));
  }
};
caminar(RAIZ);

/* Los scripts inlineados de Astro llegan minificados y con caracteres Unicode
 * literales, no escapados. Hay que pasarlos por el mismo tipo de conversion
 * que usa el navegador para no interpretar un acento como dos caracteres. */
const comoElNavegador = (texto) =>
  texto.replace(
    /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g,
    (c) => String.fromCodePoint(c.charCodeAt(0) - 0xd800 + 0x10000),
  );

let modulos = 0;
let jsones = 0;

for (const archivo of htmlFiles) {
  const contenido = readFileSync(join(RAIZ, archivo), "utf8");

  /* ------------------------------------------- scripts de JavaScript */

  /* Solo los inlineados. Los que Astro deja en un archivo aparte ya pasaron por
   * el empaquetador de Vite, que habria fallado antes. */

  for (const m of contenido.matchAll(
    /<script type="module">([\s\S]*?)<\/script>/g,
  )) {
    modulos++;
    comprobarSintaxis(comoElNavegador(m[1]), archivo);
  }

  /* ------------------------------------- scripts JSON y JSON-LD */

  for (const m of contenido.matchAll(
    /<script type="application\/(ld\+)?json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    jsones++;
    const clave = m[1] ? "jsonld" : "data-datos";
    try {
      JSON.parse(comoElNavegador(m[2]));
    } catch (error) {
      fallos.push(`${archivo}: ${clave} no es JSON valido - ${error.message}`);
      continue;
    }
    /* Un JSON-LD con etiquetas HTML sin escapar dentro es el fallo clasico de
     * meter <script type="application/ld+json"> en una plantilla: el HTML lo
     * escapa y el buscador rechaza el bloque entero. Un titulo o un autor con
     * "<" es justo lo que lo dispara. */
    if (/<\/?[a-zA-Z][^>]*>/.test(m[2])) {
      fallos.push(`${archivo}: ${clave} contiene etiquetas HTML sin escapar`);
    }
  }
}

console.log(`Paginas: ${htmlFiles.length}`);
console.log(`Modulos inlineados revisados: ${modulos}`);
console.log(`Bloques JSON revisados: ${jsones}`);

/* ------------------- los datos del selector deben traer lo que se consume */

/*
 * El selector de edad aparece solo en la portada, igual que en el sitio
 * original: en /etapas lo que hay son tres tarjetas de rango y una muestra de
 * títulos, sin pestañas. El bloque se llama data-datos y lleva las tres etapas,
 * el numero de títulos de cada una y los seis títulos que se muestran: nada más.
 * Si aquí apareciera el inventario entero, el navegador recibiría datos que no
 * necesita.
 */

{
  const pagina = "index.html";
  const html = readFileSync(join(RAIZ, pagina), "utf8");
  const bloque = html.match(
    /<script type="application\/json" data-datos>([\s\S]*?)<\/script>/,
  );
  if (!bloque) {
    fallos.push(`${pagina}: falta el bloque data-datos que lee el selector`);
  } else {
    let datos;
    try {
      datos = JSON.parse(comoElNavegador(bloque[1]));
    } catch {
      datos = null; // El error ya se reportó más arriba.
    }

    if (datos) {
      const etapas = datos.etapas ?? [];
      const titulos = Object.values(datos.titulos ?? {});
      console.log(
        `Selector en ${pagina}: ${etapas.length} etapas, ` +
          `${titulos.reduce((n, t) => n + t.length, 0)} títulos`,
      );

      if (etapas.length !== 3) {
        fallos.push(
          `${pagina}: el selector debería traer 3 etapas, trae ${etapas.length}`,
        );
      }

      for (const e of etapas) {
        if (!e.slug || !e.nombre || !e.rango) {
          fallos.push(`${pagina}: la etapa ${e.slug ?? "?"} va sin slug, nombre o rango`);
        }
        if (!(datos.librosPorEtapa?.[e.slug] > 0)) {
          fallos.push(`${pagina}: la etapa ${e.slug} no anuncia ningún título`);
        }
        if (datos.titulos?.[e.slug]?.length !== 6) {
          fallos.push(`${pagina}: la etapa ${e.slug} debería mostrar 6 títulos`);
        }
      }

      /* El bloque solo debe llevar lo que el panel pinta. Que aquí apareciera el
       * inventario entero sería una fuga de datos y además una descarga de más. */
      const permitidas = new Set([
        "etapas",
        "librosPorEtapa",
        "titulos",
        "rutas",
        "vacio",
      ]);
      for (const clave of Object.keys(datos)) {
        if (!permitidas.has(clave)) {
          fallos.push(`${pagina}: el bloque trae "${clave}", que no hace falta`);
        }
      }

      for (const palabra of ["propietario", "codigo", "ejemplar", "copias"]) {
        if (bloque[1].toLowerCase().includes(palabra)) {
          fallos.push(`${pagina}: el bloque del selector menciona "${palabra}"`);
        }
      }
    }
  }

  /* /etapas no lleva el selector, sino tres tarjetas de rango. */
  const etapasHtml = readFileSync(join(RAIZ, "etapas", "index.html"), "utf8");
  if (etapasHtml.includes("data-selector-edad")) {
    fallos.push("etapas/index.html: lleva el selector de edad, que el original no tiene");
  }
  const tarjetas = (etapasHtml.match(/href="\/etapas\/[a-z-]+\/?"(?![^>]*\btitle)/g) || [])
    .length;
  console.log(`Etapas: ${tarjetas} enlaces a páginas de etapa`);
}

/* ------------- el catalogo debe recibir el catalogo completo en el HTML */

const catalogoHtml = readFileSync(join(RAIZ, "catalogo", "index.html"), "utf8");

/* `data-total` va sin valor a proposito: es una marca para el script, y el numero
 * va en el texto del elemento. */
const total = catalogoHtml.match(/data-total[^>]*>([\s\S]*?)<\/span>/)?.[1].trim();
const resumen = catalogoHtml.match(/Los\s+(\d+)\s+títulos/)?.[1];
const tarjetas = (catalogoHtml.match(/<li[^>]*\sdata-libro[\s>]/g) || []).length;

console.log(
  `Catalogo: ${total} en el contador, ${resumen} en el resumen, ${tarjetas} tarjetas`,
);

if (total !== "172") {
  fallos.push(`El contador del catalogo deberia decir 172, dice ${total}`);
}
if (resumen !== "172") {
  fallos.push(`El resumen deberia mencionar 172 titulos, menciona ${resumen}`);
}
if (tarjetas !== 172) {
  fallos.push(`Deberian ser 172 tarjetas en el HTML, hay ${tarjetas}`);
}

/* Cada tarjeta tiene que llevar los datos que usa el filtro del navegador. Si
 * faltara alguno, ese filtro no podría distinguir y el selector no haría nada.
 *
 * Se cuentan solo las etiquetas del HTML, no las apariciones de la palabra: el
 * JavaScript inlineado también menciona `data-libro` al elegir los nodos. */
for (const atributo of [
  "data-categoria",
  "data-etapas",
  "data-formato",
  "data-autor",
  "data-letra",
]) {
  const n = (catalogoHtml.match(new RegExp(`<li[^>]*\\s${atributo}=`, "g")) || []).length;
  if (n !== 172) {
    fallos.push(`${atributo}: aparece en ${n} tarjetas, debería ser 172`);
  }
}

rmSync(temporal, { recursive: true, force: true });

if (fallos.length === 0) {
  console.log("\nOK - JavaScript y JSON internos correctos.");
} else {
  console.log(`\nFALLOS (${fallos.length}):`);
  for (const f of fallos) console.log("  x " + f);
  process.exitCode = 1;
}
