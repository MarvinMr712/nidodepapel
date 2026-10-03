/**
 * Saca del CSS construido las reglas de la pastilla y del panel del selector.
 *
 * Estas reglas se escribieron a mano y no las genera Tailwind, así que nada en
 * el build avisaría si se pierden o si un selector queda mal escrito. Este
 * script las imprime para poderlas comparar con el original de un vistazo.
 */

import { readdirSync, readFileSync } from "node:fs";

const archivo = readdirSync("dist/_astro").find((n) => n.endsWith(".css"));
const css = readFileSync(`dist/_astro/${archivo}`, "utf8");

/** Separa el CSS en bloques `selector { declaraciones }`. */
const reglas = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: m[1].trim().replace(/\s+/g, " "),
  cuerpo: m[2].trim().replace(/\s+/g, " "),
}));

const BUSCADAS = [
  "data-pastilla",
  "data-panel",
  "data-capa",
  "role=tablist",
  "role=tab]",
  "data-aparecer",
  "data-escalonado",
  "data-contador",
  "data-libro",
  "prefers-reduced-motion",
];

for (const aguja of BUSCADAS) {
  const encontradas = reglas.filter((r) => r.selector.includes(aguja));
  console.log(`\n=== ${aguja} (${encontradas.length}) ===`);
  for (const r of encontradas.slice(0, 8)) {
    console.log(`  ${r.selector} {`);
    console.log(`    ${r.cuerpo}`);
  }
}
