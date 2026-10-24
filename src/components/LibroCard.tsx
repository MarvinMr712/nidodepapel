import { getCategoria, rangoEdad } from "@/lib/catalogo";
import { ruta } from "@/lib/rutas";
import type { Libro } from "@/lib/types";

/**
 * Sin portada de imagen todavia: el inventario migrado no trae fotos.
 * La inicial del titulo hace de ancla visual y evita el Broken image.
 */
function Marca({ titulo }: { titulo: string }) {
  const inicial = titulo.replace(/[¿¡"']/g, "").trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden="true"
      className="portada-zoom w-full h-full grid place-items-center bg-gradient-to-br from-salvia/15 to-azul/10 text-salvia-oscuro font-serif text-5xl"
    >
      {inicial}
    </div>
  );
}

export function LibroCard({ libro }: { libro: Libro }) {
  const categoria = getCategoria(libro.categoria);

  return (
    <a
      href={ruta(`/libros/${libro.slug}`)}
      className="tarjeta group flex h-full flex-col rounded-xl border border-linea bg-papel overflow-hidden hover:border-salvia/60"
    >
      <div className="aspect-[4/5] overflow-hidden">
        <Marca titulo={libro.titulo} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-serif text-base leading-snug transition-colors group-hover:text-salvia-oscuro break-words">
          {libro.titulo}
        </h3>
        <p className="text-xs text-tinta-suave">{libro.autor}</p>

        <p className="mt-1 text-xs text-tinta-suave">{rangoEdad(libro)}</p>

        {categoria && (
          <p className="mt-auto pt-2 text-[11px] text-salvia-oscuro">{categoria.nombre}</p>
        )}
      </div>
    </a>
  );
}
