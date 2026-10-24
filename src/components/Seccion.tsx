export function Seccion({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-3xl sm:text-4xl mb-2">{titulo}</h2>
      {bajada && (
        <p className="text-tinta-suave max-w-2xl mb-10 leading-relaxed">
          {bajada}
        </p>
      )}
      {children}
    </section>
  );
}

export function Boton({
  href,
  children,
  variante = "primario",
}: {
  href: string;
  children: React.ReactNode;
  variante?: "primario" | "secundario";
}) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 rounded-full text-sm transition-colors";
  const estilos =
    variante === "primario"
      ? "bg-salvia-oscuro text-papel hover:bg-[#556339]"
      : "border border-salvia-oscuro/40 text-salvia-oscuro hover:bg-salvia/10";
  return (
    <a href={href} className={`${base} ${estilos}`}>
      {children}
    </a>
  );
}
