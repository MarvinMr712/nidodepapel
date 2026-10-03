/**
 * Selector de edad de la portada.
 *
 * Sustituye a `SelectorEdad.tsx`. Lo mismo que antes: un grupo de pestañas y,
 * debajo, una muestra de seis títulos que cambia al pulsar, sin recargar y sin
 * que el inventario entero viaje en el JavaScript.
 *
 * El panel inicial ya está escrito en el HTML, así que sin JavaScript se lee
 * entero. Este script solo lo reemplaza cuando alguien pulsa otra edad.
 */

interface EtapaResumen {
  slug: string;
  nombre: string;
  rango: string;
}

interface LibroMini {
  titulo: string;
  url: string;
}

interface Datos {
  etapas: EtapaResumen[];
  /** Número de títulos por etapa. */
  librosPorEtapa: Record<string, number>;
  /** Los seis títulos que se muestran, por etapa. */
  titulos: Record<string, LibroMini[]>;
  rutas: Record<string, string>;
  vacio: string;
}

export function montarSelectorEdad(): void {
  const raiz = document.querySelector<HTMLElement>("[data-selector-edad]");
  if (!raiz) return;

  const datosEl = raiz.querySelector<HTMLScriptElement>("[data-datos]");
  const lista = raiz.querySelector<HTMLElement>('[role="tablist"]');
  const panel = raiz.querySelector<HTMLElement>("[data-panel]");
  if (!datosEl || !lista || !panel) return;

  let datos: Datos;
  try {
    datos = JSON.parse(datosEl.textContent || "{}") as Datos;
  } catch {
    return; // Datos ilegibles: se deja el panel inicial tal como está.
  }

  const botones = Array.from(
    lista.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );
  if (botones.length === 0) return;

  const conteo = panel.querySelector<HTMLElement>("[data-panel-conteo]");
  const zona = panel.querySelector<HTMLElement>("[data-panel-zona]");
  const enlace = panel.querySelector<HTMLAnchorElement>("[data-panel-enlace]");

  // Copia en una constante sin null: TypeScript no mantiene el estrechamiento
  // dentro de una declaración de función.
  const bloque = panel;

  /* ----------------------------------------------------------- pastilla */

  const pastilla = lista.querySelector<HTMLElement>("[data-pastilla]");

  /**
   * Sitúa la pastilla sobre un botón.
   *
   * offsetLeft y offsetTop son del borde exterior del botón respecto al tablist,
   * que es su ancestro posicionado. Pero la pastilla original iba dentro del
   * botón con `inset-0`, y eso la anclaba a la caja de relleno, que queda un
   * borde por dentro. Por eso se resta el ancho del borde: si no, la pastilla
   * taparía el borde del botón activo y el original sí lo dejaba visible.
   */
  function colocar(p: HTMLElement, boton: HTMLElement): void {
    const b = 1; // `border` de Tailwind: 1px
    p.style.width = `${boton.offsetWidth - b * 2}px`;
    p.style.height = `${boton.offsetHeight - b * 2}px`;
    p.style.transform = `translate(${boton.offsetLeft + b}px, ${boton.offsetTop + b}px)`;
  }

  if (pastilla) {
    // Pasa del botón al contenedor para poder deslizarse entre ellos. Hasta
    // aquí `inset-0` la colocaba sobre el botón activo, que es donde debe estar.
    lista.appendChild(pastilla);
    const activo = botones.find(
      (b) => b.getAttribute("aria-selected") === "true",
    );
    if (activo) colocar(pastilla, activo);
  }

  /* -------------------------------------------------------------- panel */

  const menosMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function pintar(slug: string): void {
    const etapa = datos.etapas.find((e) => e.slug === slug);
    if (!etapa) return;

    const total = datos.librosPorEtapa[slug] ?? 0;
    const libros = datos.titulos[slug] ?? [];

    // Recuento
    if (conteo) {
      conteo.textContent = `${total} ${total === 1 ? "libro" : "libros"} de ${etapa.rango} años`;
    }

    // Lista de títulos o mensaje de vacío
    if (zona) {
      zona.replaceChildren();
      if (libros.length === 0) {
        const vacio = document.createElement("p");
        vacio.className =
          "border border-dashed border-linea rounded-xl py-14 px-5 text-center text-sm text-tinta-suave";
        vacio.textContent = datos.vacio;
        zona.appendChild(vacio);
      } else {
        const ul = document.createElement("ul");
        ul.className = "grid gap-2 sm:grid-cols-2";
        for (const libro of libros) {
          const li = document.createElement("li");
          li.className = "min-w-0";

          const a = document.createElement("a");
          a.href = libro.url;
          a.className =
            "group flex items-center gap-3 rounded-lg border border-linea bg-papel px-4 py-3 hover:border-salvia/60 transition-colors h-full";

          const marca = document.createElement("span");
          marca.setAttribute("aria-hidden", "true");
          marca.className =
            "grid place-items-center w-9 h-9 shrink-0 rounded-md bg-salvia/15 text-salvia-oscuro font-serif";
          marca.textContent = libro.titulo.charAt(0).toUpperCase();

          const texto = document.createElement("span");
          texto.className =
            "text-sm leading-snug group-hover:text-salvia-oscuro transition-colors break-words min-w-0";
          texto.textContent = libro.titulo;

          a.append(marca, texto);
          li.appendChild(a);
          ul.appendChild(li);
        }
        zona.appendChild(ul);
      }
    }

    // Enlace a la página de la etapa
    if (enlace) {
      enlace.href = datos.rutas[slug] ?? "";
      enlace.textContent = `Ver los ${total} títulos de ${etapa.nombre.toLowerCase()} →`;
    }
  }

  function activar(boton: HTMLButtonElement): void {
    const slug = boton.dataset.etapa ?? "";
    if (boton.getAttribute("aria-selected") === "true") return;

    for (const b of botones) {
      const suyo = b === boton;
      b.setAttribute("aria-selected", suyo ? "true" : "false");
      const capa = b.querySelector<HTMLElement>("[data-capa]");
      if (!capa) continue;
      capa.className = suyo
        ? "relative z-10 flex flex-col items-center leading-tight text-papel"
        : "relative z-10 flex flex-col items-center leading-tight text-tinta-suave";
      const sub = capa.querySelector<HTMLElement>("[data-capa-sub]");
      if (sub) {
        sub.className = suyo
          ? "text-[11px] text-papel/80"
          : "text-[11px] text-tinta-suave/80";
      }
    }

    if (pastilla) colocar(pastilla, boton);

    // Salida hacia arriba, cambio de contenido, entrada desde abajo: los dos
    // pasos de 0,3s que hacía AnimatePresence.
    if (menosMovimiento) {
      pintar(slug);
      return;
    }

    bloque.dataset.panel = "saliendo";
    window.setTimeout(() => {
      pintar(slug);
      bloque.dataset.panel = "entrando";
      // Un reflow antes de quitar la clase: sin esto el navegador no registra
      // el estado inicial y la transición no se dispara.
      void bloque.offsetHeight;
      bloque.dataset.panel = "";
    }, 300);
  }

  for (const boton of botones) {
    boton.addEventListener("click", () => activar(boton));
  }
}
