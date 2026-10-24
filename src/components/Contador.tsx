import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Cuenta desde cero hasta el valor cuando el bloque entra en pantalla.
 *
 * El HTML inicial llevaSIEMPRE el numero real, no un cero. Sin JS, con el
 * javascript bloqueado o para un buscador que no lo ejecuta, la pagina tiene que
 * seguir diciendo cuantos titulos hay. El conteo arranca recien cuando el bloque
 * entra en pantalla y hay movimiento permitido, que es cuando el usuario lo ve
 * aparecer.
 */
export function Contador({
  valor,
  sufijo = "",
}: {
  valor: number;
  sufijo?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const menosMovimiento = useReducedMotion();
  const [n, setN] = useState(valor);
  const animando = useRef(false);

  useEffect(() => {
    if (!enVista || menosMovimiento) return;
    // El bloque ya se vio antes: se deja el numero final quieto.
    if (animando.current) return;
    animando.current = true;

    const duracion = 1100;
    const inicio = performance.now();
    let frame = 0;

    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // easeOutExpo: arranca rapido y frena suave, se percibe mas pulido.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setN(Math.round(valor * eased));
      if (t < 1) frame = requestAnimationFrame(paso);
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [enVista, valor, menosMovimiento]);

  return <span ref={ref}>{`${n}${sufijo}`}</span>;
}
