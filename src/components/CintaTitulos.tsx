import { useReducedMotion } from "motion/react";

/**
 * Cinta horizontal de titulos que se desplaza sola.
 * Duplica la lista para que el bucle no tenga costura visible.
 */
export function CintaTitulos({ titulos }: { titulos: string[] }) {
  const menosMovimiento = useReducedMotion();
  const fila = [...titulos, ...titulos];

  if (menosMovimiento || titulos.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-linea bg-papel py-4"
    >
      <div className="cinta-track flex w-max gap-3 will-change-transform">
        {fila.map((t, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-sm text-tinta-suave pr-3"
          >
            {t}
            <span className="text-salvia/70 pl-3">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
