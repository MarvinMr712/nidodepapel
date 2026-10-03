/** ¿La persona pidió menos animación en su sistema operativo? */
export function menosMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Quita del DOM los bloques que solo existen como efecto.
 *
 * La cinta de títulos, por ejemplo, se escribe en el HTML para que sin
 * JavaScript no falte contenido, pero si la persona pidió menos movimiento no
 * debe desplazarse. La regla CSS ya desactiva la animación; esto quita el
 * bloque, que es lo que hacía el componente cuando useReducedMotion() era true.
 */
export function quitarSiMenosMovimiento(selector: string): void {
  if (!menosMovimiento()) return;
  for (const el of Array.from(document.querySelectorAll(selector))) {
    el.remove();
  }
}
