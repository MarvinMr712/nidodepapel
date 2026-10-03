/**
 * Filtros del catálogo.
 *
 * Antes era React: un estado con la URL, un `useMemo` que filtraba el arreglo
 * entero y un re-render de las 172 tarjetas. Aquí no hay estado ni re-render:
 * las 172 tarjetas ya están en el HTML y el script solo oculta las que no
 * corresponden y las reordena moviendo nodos.
 *
 * La comparación usa los mismos atributos `data-*` y la misma collation que
 * `filtrarPublico` en catalogo.ts, así que el resultado es el mismo.
 *
 * Por qué el filtro va en la URL: para que la búsqueda se pueda compartir y el
 * navegador la restaure al volver atrás. Igual que antes, no hay ningún campo de
 * texto: todo se elige de una lista, así nadie puede escribir mal.
 */

const CAMPOS = ["categoria", "etapa", "formato", "autor", "letra"] as const;

/** Las etiquetas que salen en las pastillas, en el mismo orden que los select. */
const ETIQUETAS: Record<string, string> = {
  categoria: "Categoría",
  etapa: "Edad",
  formato: "Formato",
  autor: "Autor",
  letra: "Letra",
};

export function montarCatalogo(): void {
  const raiz = document.querySelector<HTMLElement>("[data-catalogo]");
  if (!raiz) return;

  const selects = Array.from(
    raiz.querySelectorAll<HTMLSelectElement>("[data-filtro]"),
  );
  const rejilla = raiz.querySelector<HTMLElement>("[data-rejilla]");
  const vacio = raiz.querySelector<HTMLElement>("[data-vacio]");
  const totalEl = raiz.querySelector<HTMLElement>("[data-total]");
  const sustantivoEl = raiz.querySelector<HTMLElement>("[data-sustantivo]");
  const activosTexto = raiz.querySelector<HTMLElement>("[data-activos-texto]");
  const pastillas = raiz.querySelector<HTMLElement>("[data-pastillas]");
  if (!rejilla || selects.length === 0) return;

  // Copia en una constante sin null: TypeScript no mantiene el estrechamiento
  // dentro de una declaración de función.
  const contenedor = rejilla;

  const tarjetas = Array.from(
    contenedor.querySelectorAll<HTMLElement>("[data-libro]"),
  );

  /* ------------------------------------------------------------- URL */

  function leer(): Record<string, string> {
    const salida: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((v, k) => {
      salida[k] = v;
    });
    return salida;
  }

  function escribir(params: Record<string, string>): void {
    // pushState no recarga: el filtro se aplica al instante.
    const qs = new URLSearchParams(params).toString();
    window.history.pushState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }

  /* --------------------------------------------------------- filtrado */

  const coincide = (li: HTMLElement, p: Record<string, string>): boolean => {
    if (p.categoria && li.dataset.categoria !== p.categoria) return false;
    if (p.etapa && !(li.dataset.etapas || "").split(" ").includes(p.etapa)) {
      return false;
    }
    if (p.formato && li.dataset.formato !== p.formato) return false;
    if (p.autor && li.dataset.autor !== p.autor) return false;
    if (p.letra && li.dataset.letra !== p.letra) return false;
    return true;
  };

  /** Igual que `colacion` en catalogo.ts: ignora mayúsculas, acentos y signos. */
  const colacion = (a: string, b: string) =>
    a.localeCompare(b, "es", { sensitivity: "base" });

  function ordenar(porAutor: boolean): void {
    const visibles = tarjetas.filter((li) => !li.hidden);
    visibles.sort((a, b) => {
      if (porAutor) {
        return (
          colacion(a.dataset.autorOrden || "", b.dataset.autorOrden || "") ||
          colacion(a.dataset.tituloOrden || "", b.dataset.tituloOrden || "")
        );
      }
      return colacion(a.dataset.tituloOrden || "", b.dataset.tituloOrden || "");
    });
    // appendChild mueve el nodo si ya estaba en el DOM, así que reordenar es
    // solo volver a anexar en el orden correcto.
    for (const li of visibles) contenedor.appendChild(li);
  }

  function textoDe(clave: string, valor: string): string {
    const select = selects.find((s) => s.name === clave);
    const opcion = select?.querySelector<HTMLOptionElement>(
      `option[value="${CSS.escape(valor)}"]`,
    );
    return opcion?.textContent ?? valor;
  }

  function pintarPastillas(p: Record<string, string>): void {
    if (!pastillas) return;
    const activos = CAMPOS.filter((c) => p[c]);
    pastillas.replaceChildren();

    if (activos.length === 0) {
      pastillas.hidden = true;
      if (activosTexto) activosTexto.textContent = "";
      return;
    }

    pastillas.hidden = false;
    if (activosTexto) activosTexto.textContent = " con los filtros elegidos";

    for (const clave of activos) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className =
        "inline-flex items-center gap-1.5 rounded-full border border-linea bg-papel px-3 py-1.5 text-xs text-tinta-suave hover:border-salvia/60 hover:text-salvia-oscuro transition-colors";

      boton.appendChild(
        document.createTextNode(`${ETIQUETAS[clave]}: ${textoDe(clave, p[clave])}`),
      );
      const aspa = document.createElement("span");
      aspa.setAttribute("aria-hidden", "true");
      aspa.textContent = "\u00d7";
      boton.appendChild(aspa);

      boton.addEventListener("click", () => {
        p[clave] = "";
        aplicar(p, { escribir: true });
      });

      pastillas.appendChild(boton);
    }

    const limpiar = document.createElement("button");
    limpiar.type = "button";
    limpiar.className =
      "text-salvia-oscuro hover:text-[#4E5C3B] underline underline-offset-4";
    limpiar.textContent = "Limpiar todo";
    limpiar.addEventListener("click", () => {
      aplicar({}, { escribir: true });
    });
    pastillas.appendChild(limpiar);
  }

  function aplicar(p: Record<string, string>, opciones: { escribir: boolean }): void {
    // Los desplegables reflejan siempre lo que dice la URL.
    for (const select of selects) {
      select.value = p[select.name] ?? "";
    }

    let visibles = 0;
    for (const li of tarjetas) {
      const ok = coincide(li, p);
      li.hidden = !ok;
      if (ok) visibles += 1;
    }

    if (totalEl) totalEl.textContent = String(visibles);
    if (sustantivoEl) sustantivoEl.textContent = visibles === 1 ? "libro" : "libros";
    if (vacio) vacio.classList.toggle("hidden", visibles > 0);

    ordenar(p.orden === "autor");

    pintarPastillas(p);

    if (opciones.escribir) escribir(p);
  }

  /* --------------------------------------------------------- arranque */

  for (const select of selects) {
    select.addEventListener("change", () => {
      const p = leer();
      const clave = select.name;
      if (select.value === "") delete p[clave];
      else p[clave] = select.value;
      aplicar(p, { escribir: true });
    });
  }

  // Volver atrás o adelante debe devolver el resultado anterior.
  window.addEventListener("popstate", () => {
    aplicar(leer(), { escribir: false });
  });

  // El HTML llega con todo el catálogo y los desplegables sin elegir. Se pinta
  // el estado inicial una vez para que el recuento y el orden coincidan con la
  // URL real sin recargar nada.
  aplicar(leer(), { escribir: false });
}
