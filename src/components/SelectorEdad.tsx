import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ruta } from "@/lib/rutas";

export type EtapaResumen = {
  slug: string;
  nombre: string;
  /** Texto ya armado, porque una etapa puede no tener limite superior. */
  rango: string;
};

export type LibroMini = {
  slug: string;
  titulo: string;
};

/**
 * Selector de edad de la portada. Cambia los titulos mostrados sin recargar,
 * para que un padre vea de inmediato si hay algo para su hijo.
 *
 * Recibe los datos por props desde el servidor a proposito: si llamara a
 * getLibros() desde aqui, el inventario entero (con el nombre del propietario de
 * cada copia) quedaria dentro del JS que descarga el visitante.
 */
export function SelectorEdad({
  etapas,
  librosPorEtapa,
}: {
  etapas: EtapaResumen[];
  librosPorEtapa: Record<string, LibroMini[]>;
}) {
  const [activo, setActivo] = useState(etapas[0]?.slug ?? "");
  const menosMovimiento = useReducedMotion();

  const etapa = etapas.find((e) => e.slug === activo);
  const todos = librosPorEtapa[activo] ?? [];
  const libros = todos.slice(0, 6);

  if (!etapa) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Elige la edad de tu hijo"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {etapas.map((e) => {
          const activoAqui = e.slug === activo;
          return (
            <button
              key={e.slug}
              role="tab"
              aria-selected={activoAqui}
              onClick={() => setActivo(e.slug)}
              className="relative shrink-0 rounded-full border border-linea bg-papel px-4 sm:px-5 py-2.5 text-sm transition-colors hover:border-salvia/60"
            >
              {activoAqui && (
                <motion.span
                  layoutId="pastilla-edad"
                  className="absolute inset-0 rounded-full bg-salvia-oscuro"
                  transition={
                    menosMovimiento
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                />
              )}
              <span
                className={`relative flex flex-col items-center leading-tight ${
                  activoAqui ? "text-papel" : "text-tinta-suave"
                }`}
              >
                <span className="whitespace-nowrap">{e.rango} años</span>
                <span
                  className={`text-[11px] ${
                    activoAqui ? "text-papel/80" : "text-tinta-suave/80"
                  }`}
                >
                  {e.nombre}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activo}
          initial={menosMovimiento ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={menosMovimiento ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <p className="text-sm text-tinta-suave mb-4">
            {todos.length} {todos.length === 1 ? "libro" : "libros"} de{" "}
            {etapa.rango} años
          </p>

          {libros.length === 0 ? (
            <p className="border border-dashed border-linea rounded-xl py-14 px-5 text-center text-sm text-tinta-suave">
              Todavía no hay títulos para esta edad.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {libros.map((l) => (
                <li key={l.slug} className="min-w-0">
                  <a
                    href={ruta(`/libros/${l.slug}`)}
                    className="group flex items-center gap-3 rounded-lg border border-linea bg-papel px-4 py-3 hover:border-salvia/60 transition-colors h-full"
                  >
                    <span
                      aria-hidden="true"
                      className="grid place-items-center w-9 h-9 shrink-0 rounded-md bg-salvia/15 text-salvia-oscuro font-serif"
                    >
                      {l.titulo.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm leading-snug group-hover:text-salvia-oscuro transition-colors break-words min-w-0">
                      {l.titulo}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <a
            href={ruta(`/etapas/${activo}`)}
            className="inline-block mt-6 text-sm text-salvia-oscuro hover:text-[#4E5C3B]"
          >
            Ver los {todos.length} títulos de {etapa.nombre.toLowerCase()} →
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}