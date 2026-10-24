export type Opcion = { valor: string; texto: string };
export type Opciones = {
  categoria: Opcion[];
  etapa: Opcion[];
  formato: Opcion[];
  autor: Opcion[];
  letra: Opcion[];
};

const ORDEN: Opcion[] = [
  { valor: "titulo", texto: "Título (A–Z)" },
  { valor: "autor", texto: "Autor (A–Z)" },
];

const CAMPOS: [keyof Opciones, string][] = [
  ["categoria", "Categoría"],
  ["etapa", "Edad"],
  ["formato", "Formato"],
  ["autor", "Autor"],
  ["letra", "Letra"],
];

/**
 * Los filtros viven en la URL (?categoria=...&etapa=...&formato=...&autor=...&letra=...)
 * para que el resultado sea compartible y el navegador lo restaure al navegar
 * atras.
 *
 * No hay ningun campo de texto: todo se elige de una lista. Asi el visitante
 * no puede escribir mal y el catalogo nunca devuelve una lista vacia por un
 * error de tipeo.
 *
 * Las opciones llegan como props desde el servidor. Si se calcularan aqui, el
 * inventario completo de 172 titulos entraria en el JS que descarga el
 * visitante, y con el un simple filtro.
 */
export function Filtros({
  total,
  opciones,
  params,
  onCambiar,
  onLimpiar,
}: {
  total: number;
  opciones: Opciones;
  params: Record<string, string>;
  onCambiar: (clave: string, valor: string) => void;
  onLimpiar: () => void;
}) {
  const valor = (k: string) => params[k] ?? "";

  const cambiar = (clave: string, v: string) => onCambiar(clave, v);

  const limpiar = () => onLimpiar();

  const activos = CAMPOS.filter(([k]) => valor(k));

  return (
    <div className="mb-10">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Selector
          etiqueta="Categoría"
          valor={valor("categoria")}
          onChange={(v) => cambiar("categoria", v)}
          opciones={opciones.categoria}
        />
        <Selector
          etiqueta="Edad"
          vacio="Todas las edades"
          valor={valor("etapa")}
          onChange={(v) => cambiar("etapa", v)}
          opciones={opciones.etapa}
        />
        <Selector
          etiqueta="Formato"
          vacio="Todos los formatos"
          valor={valor("formato")}
          onChange={(v) => cambiar("formato", v)}
          opciones={opciones.formato}
        />
        <Selector
          etiqueta="Autor o editorial"
          vacio="Todos los autores"
          valor={valor("autor")}
          onChange={(v) => cambiar("autor", v)}
          opciones={opciones.autor}
        />
        <Selector
          etiqueta="Letra inicial"
          vacio="Cualquier letra"
          valor={valor("letra")}
          onChange={(v) => cambiar("letra", v)}
          opciones={opciones.letra}
        />
        <Selector
          etiqueta="Ordenar por"
          vacio="Título (A–Z)"
          valor={valor("orden")}
          onChange={(v) => cambiar("orden", v)}
          opciones={ORDEN}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
        <p className="text-tinta-suave">
          <span className="text-tinta font-medium">{total}</span>{" "}
          {total === 1 ? "libro" : "libros"}
          {activos.length > 0 && " con los filtros elegidos"}
        </p>

        {activos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activos.map(([k, etiqueta]) => (
              <button
                key={k}
                onClick={() => cambiar(k, "")}
                className="inline-flex items-center gap-1.5 rounded-full border border-linea bg-papel px-3 py-1.5 text-xs text-tinta-suave hover:border-salvia/60 hover:text-salvia-oscuro transition-colors"
              >
                {etiqueta}: {textoDe(opciones[k], valor(k))}
                <span aria-hidden="true">&times;</span>
              </button>
            ))}
            <button
              onClick={limpiar}
              className="text-salvia-oscuro hover:text-[#4E5C3B] underline underline-offset-4"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Nombre corto del valor activo, para la etiqueta de la pastilla. */
function textoDe(opciones: Opcion[], v: string): string {
  return opciones.find((o) => o.valor === v)?.texto ?? v;
}

function Selector({
  etiqueta,
  vacio = "Todas",
  valor,
  onChange,
  opciones,
}: {
  etiqueta: string;
  vacio?: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: Opcion[];
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs text-tinta-suave mb-1.5">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-papel border border-linea rounded-lg px-2 sm:px-3 py-2.5 text-sm text-tinta focus:border-azul-oscuro focus:outline-none"
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}