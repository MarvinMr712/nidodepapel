import { useMemo } from "react";
import { Filtros, type Opciones } from "@/components/Filtros";
import { LibroCard } from "@/components/LibroCard";
import { useParametrosUrl } from "@/components/useParametrosUrl";
import { filtrarPublico } from "@/lib/catalogo";
import { ruta } from "@/lib/rutas";
import type { Libro } from "@/lib/types";


/**
 * Catalogo que filtra en el navegador.
 *
 * Antes se filtraba en el servidor leyendo `searchParams`, pero eso obliga a
 * render por peticion y bloquea el export estatico que necesita GitHub Pages.
 * Aqui el HTML se genera una vez con todos los libros y el filtro corre en el
 * cliente, de modo que el HTML prerenderizado sigue mostrando el catalogo
 * completo aunque no haya JavaScript.
 *
 * Los libros llegan sin `copias`: el detalle de los ejemplares, incluido el
 * nombre de quien los tiene, no sale del servidor.
 */
export function Catalogo({
  libros,
  opciones,
  totalTitulos,
}: {
  libros: Libro[];
  opciones: Opciones;
  totalTitulos: number;
}) {
  const { params, poner, limpiar } = useParametrosUrl();

  const resultados = useMemo(
    () =>
      filtrarPublico(libros, {
        categoria: params.categoria ?? "",
        etapa: params.etapa ?? "",
        formato: params.formato ?? "",
        autor: params.autor ?? "",
        letra: params.letra ?? "",
        orden: params.orden === "autor" ? "autor" : "titulo",
      }),
    [libros, params],
  );

  return (
    <>
      <p className="text-tinta-suave mb-12 max-w-2xl leading-relaxed">
        Los {totalTitulos} títulos que rotan este mes. Elige lo que necesitas y
        te armamos el kit.
      </p>

      <Filtros
        total={resultados.length}
        opciones={opciones}
        params={params}
        onCambiar={poner}
        onLimpiar={limpiar}
      />

      {resultados.length === 0 ? (
        <div className="border border-dashed border-linea rounded-xl py-20 px-5 text-center">
          <p className="font-serif text-2xl mb-2">
            No hay libros con esa combinación
          </p>
          <p className="text-sm text-tinta-suave">
            Prueba quitando algún filtro. También puedes{" "}
            <a
              href="https://wa.me/51955419565"
              className="subrayado text-salvia-oscuro"
            >
              escribirnos
            </a>{" "}
            y lo buscamos dentro del inventario.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {resultados.map((l) => (
            <li key={l.id}>
              <LibroCard libro={l} />
            </li>
          ))}
        </ul>
      )}

      {/* Enlace de escape para quien llega a una combinacion imposible. */}
      <p className="mt-14 text-sm text-tinta-suave">
        ¿Buscas algo puntual?{" "}
        <a
          href={ruta("/como-funciona")}
          className="subrayado text-salvia-oscuro"
        >
          Mira cómo funciona la rotación
        </a>{" "}
        o escríbenos y lo buscamos.
      </p>
    </>
  );
}