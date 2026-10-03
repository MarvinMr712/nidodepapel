/**
 * Aparición al entrar en pantalla.
 *
 * Antes lo hacía `motion/react` con `whileInView`. Aquí el mismo efecto con
 * IntersectionObserver: los estilos iniciales y finales viven en globals.css
 * dentro de `.js`, y este script solo añade la clase que dispara la transición.
 *
 * Por qué una clase y no un estilo inline: así el HTML es idéntico con y sin
 * JavaScript, y las reglas de CSS se pueden revisar de un vistazo.
 */
export function observarApariciones(): void {
  const menosMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const elementos = Array.from(
    document.querySelectorAll<HTMLElement>("[data-aparecer]"),
  );
  if (elementos.length === 0) return;

  // Con menos movimiento se muestra todo de golpe, sin transiciones: es lo
  // mismo que hacía el componente cuando useReducedMotion() devolvía true.
  if (menosMovimiento) {
    for (const el of elementos) el.classList.add("es-visible");
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add("es-visible");
        // once: true. Una vez revelado, deja de observar.
        observador.unobserve(entrada.target);
      }
    },
    // El -12% es el `viewport.margin` que usaba la librería: el bloque empieza a
    // aparecer un poco antes de llegar al borde inferior.
    { rootMargin: "0px 0px -12% 0px" },
  );

  for (const el of elementos) observador.observe(el);
}
