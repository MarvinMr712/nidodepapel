import { useCallback, useEffect, useState } from "react";

export type Parametros = Record<string, string>;

/**
 * Lee los filtros desde la URL sin depender de un router.
 *
 * Parte siempre del estado vacio, que es lo que se escribe en el HTML, y recien
 * despues de hidratar lee la URL. Asi el HTML prerenderizado trae el catalogo
 * completo y el filtrado ocurre en el navegador.
 */
export function useParametrosUrl() {
  const [params, setParams] = useState<Parametros>({});

  // Tras hidratar: leer la URL real.
  useEffect(() => {
    const leer = () => {
      const sp = new URLSearchParams(window.location.search);
      const nuevo: Parametros = {};
      sp.forEach((v, k) => {
        nuevo[k] = v;
      });
      setParams(nuevo);
    };

    leer();
    window.addEventListener("popstate", leer);
    return () => window.removeEventListener("popstate", leer);
  }, []);

  const escribir = useCallback((cambios: Parametros, quitar: string[] = []) => {
    const sp = new URLSearchParams(window.location.search);
    for (const k of quitar) sp.delete(k);
    for (const [k, v] of Object.entries(cambios)) {
      if (v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    // pushState no recarga: el filtro se aplica al instante.
    window.history.pushState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    const nuevo: Parametros = {};
    sp.forEach((v, k) => {
      nuevo[k] = v;
    });
    setParams(nuevo);
  }, []);

  const poner = useCallback(
    (clave: string, valor: string) => escribir({ [clave]: valor }, [clave]),
    [escribir],
  );

  const limpiar = useCallback(() => {
    window.history.pushState({}, "", window.location.pathname);
    setParams({});
  }, []);

  return { params, poner, limpiar };
}