/**
 * Revisa que los archivos fuente esten sanos.
 *
 * El compilador ya avisa de la sintxis rota, asi que aqui no se vuelven a
 * contar llaves ni parentesis: ese conteo miente, porque dentro de una cadena o
 * de un glob como `**\/*` hay llaves y barras que no abren nada. Solo se revisa
 * lo que el compilador NO ve:
 *
 *   1. Caracteres invisibles. Un espacio de ancho cero o una marca de direccion
 *      dentro de una clase de Tailwind no se ven, pero cambian lo que el
 *      navegador entiende, y ningun aviso sale de ellos.
 *   2. Restos de una edicion automatica a medias.
 *   3. Llaves y comentarios desparejados en el CSS, que es el unico lenguaje de
 *      la lista donde una llave sin cerrar se lleva por delante media hoja de
 *      estilos sin que nada se queje.
 *   4. Saltos de linea mezclados, que hacen que un archivo cambie entero de
 *      formato al siguiente guardado.
 *
 * Solo texto plano: `.astro`, `.ts`, `.mjs`, `.css` y `.json`. Nada de
 * `node_modules` ni de `dist`, ni de los archivos que escribe una herramienta
 * (`package-lock.json`), porque esos no los edita una persona.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const RAIZ = ".";

const EXTENSIONES = new Set([".astro", ".ts", ".mjs", ".css", ".json"]);
const SALTAR_DIR = new Set(["node_modules", "dist", ".git", ".astro", "public"]);
const SALTAR_ARCHIVO = new Set(["package-lock.json"]);

/* Este mismo archivo contiene, en texto plano, las cadenas que busca. */
const ESTE_ARCHIVO = basename(import.meta.filename ?? "");

/*
 * Codigos de los caracteres que no se ven. Van en hexadecimal y no como
 * caracteres literales a proposito: escritos como caracteres, cualquier
 * herramienta que resave el archivo los puede normalizar y la comprobacion
 * acaba marcando media Source.
 */
const INVISIBLES = new Set([
  0x00ad, // guia opcional
  0x200b, // espacio de ancho cero
  0x200c, // marca de joined
  0x200d, // marca de zero width joiner
  0x200e, // marca de izquierda a derecha
  0x200f, // marca de derecha a izquierda
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, // marcas de direccion
  0x2060, // palabra de union
  0x2061, 0x2062, 0x2063, 0x2064, // operadores invisibles
  0xfeff, // marca de orden de bytes
]);

/* Restos de una edicion automatica que se hayan colado en el archivo. */
const RESTOS = [
  "tool_call",
  "tool_use",
  "assistant:",
  "antml:",
  "<invoke",
  "<parameter",
];

/*
 * Letras que no tienen nada que ver con un sitio en espanol. Se cuelan al
 * reescribir un archivo y rompen el texto sin que se note en el diff, asi que
 * se buscan por rango entero y no por lista de caracteres sueltos.
 */
const LETRAS_EXTRANJERAS = [
  [0x0370, 0x03ff], // Griego
  [0x0400, 0x04ff], // Cirilico
  [0x0590, 0x05ff], // Hebreo
  [0x0600, 0x06ff], // Arabe
  [0x3040, 0x309f], // Hiragana
  [0x30a0, 0x30ff], // Katakana
  [0x4e00, 0x9fff], // Chino
  [0xac00, 0xd7af], // Hangul
  [0xff00, 0xffef], // Formas de ancho completo
];

const esExtranjera = (codigo) =>
  LETRAS_EXTRANJERAS.some(([desde, hasta]) => codigo >= desde && codigo <= hasta);

const cuenta = (texto, aguja) => texto.split(aguja).length - 1;

const lineaDe = (texto, indice) => texto.slice(0, indice).split(/\r?\n/).length;

const fallos = [];

const archivos = [];
const caminar = (dir) => {
  for (const nombre of readdirSync(dir)) {
    if (SALTAR_DIR.has(nombre)) continue;
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) caminar(completo);
    else if (EXTENSIONES.has(extname(nombre)) && !SALTAR_ARCHIVO.has(nombre)) {
      archivos.push(completo);
    }
  }
};
caminar(RAIZ);

for (const archivo of archivos) {
  const ruta = relative(RAIZ, archivo);
  const texto = readFileSync(archivo, "utf8");

  /* 1. Caracteres invisibles. */
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    if (INVISIBLES.has(codigo)) {
      fallos.push(
        `${ruta}:${lineaDe(texto, i)}: caracter invisible ` +
          `U+${codigo.toString(16).toUpperCase().padStart(4, "0")}`,
      );
    } else if (esExtranjera(codigo)) {
      fallos.push(
        `${ruta}:${lineaDe(texto, i)}: letra en un alfabeto que no es el del ` +
          `sitio (U+${codigo.toString(16).toUpperCase().padStart(4, "0")})`,
      );
    }
  }

  /* 2. Restos de una edicion automatica. */
  if (basename(archivo) !== ESTE_ARCHIVO) {
    for (const resto of RESTOS) {
      const donde = texto.indexOf(resto);
      if (donde >= 0) {
        fallos.push(
          `${ruta}:${lineaDe(texto, donde)}: resto de una edicion automatica ("${resto}")`,
        );
      }
    }
  }

  /* 3. Llaves y comentarios del CSS. */
  if (extname(archivo) === ".css") {
    for (const [abre, cierra] of [
      ["{", "}"],
      ["/" + "*", "*" + "/"],
    ]) {
      const a = cuenta(texto, abre);
      const b = cuenta(texto, cierra);
      if (a !== b) {
        fallos.push(`${ruta}: ${a} "${abre}" y ${b} "${cierra}"`);
      }
    }
  }

  /* 4. Saltos de linea mezclados. */
  const crlf = cuenta(texto, "\r\n");
  const lf = cuenta(texto, "\n");
  if (crlf > 0 && crlf !== lf) {
    fallos.push(`${ruta}: mezcla ${crlf} lineas CRLF con ${lf - crlf} LF`);
  }

  if (texto.length > 0 && !texto.endsWith("\n")) {
    fallos.push(`${ruta}: no termina en salto de linea`);
  }
}

console.log(`Archivos revisados: ${archivos.length}`);

if (fallos.length === 0) {
  console.log("OK - Ningun archivo fuente esta corrupto.");
} else {
  console.log(`\nFALLOS (${fallos.length}):`);
  for (const f of fallos.slice(0, 40)) console.log("  x " + f);
  if (fallos.length > 40) console.log(`  ... y ${fallos.length - 40} mas`);
  process.exitCode = 1;
}
