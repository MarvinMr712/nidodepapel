/**
 * Contadores que suben desde cero al entrar en pantalla.
 *
 * El HTML inicial lleva SIEMPRE el número real, no un cero. Sin JavaScript, con
 * el JavaScript bloqueado o para un buscador que no lo ejecuta, la página tiene
 * que seguir diciendo cuántos títulos hay. El conteo arranca recién cuando el
 * bloque entra en pantalla y hay movimiento permitido, que es cuando alguien lo
 * ve aparecer.
 */
export function observarContadores(): void {
  const elementos = Array.from(
    document.querySelectorAll<HTMLElement>("[data-contador]"),
  );
  if (elementos.length === 0) return;

  const menosMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (menosMovimiento) return;

  const duracion = 1100;

  const contar = (el: HTMLElement) => {
    const valor = Number(el.dataset.contador ?? "0");
    if (!Number.isFinite(valor) || el.dataset.contado) return;
    el.dataset.contado = "1";

    const inicio = performance.now();

    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // easeOutExpo: arranca rápido y frena suave, se percibe más pulido.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = String(Math.round(valor * eased));
      if (t < 1) requestAnimationFrame(paso);
    };

    requestAnimationFrame(paso);
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        contar(entrada.target as HTMLElement);
        observador.unobserve(entrada.target);
      }
    },
    // El -20% es el margen que usaba la librería.
    { rootMargin: "0px 0px -20% 0px" },
  );

  for (const el of elementos) observador.observe(el);
}
