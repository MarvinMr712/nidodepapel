import data from "@/data/libros.json";
import type { Categoria, Etapa, Libro } from "@/lib/types";

const DESCRIPCIONES_CATEGORIA: Record<string, string> = {
  "emociones-vinculo":
    "Libros para nombrar lo que sienten: rabietas, miedo, alegría, tristezas y el vínculo con quienes más quieren.",
  "habitos-rutinas-valores":
    "Rutinas del día a día y valores que se practican: orden, autocuidado, compartir y esperar con paciencia.",
  conocimiento:
    "Animales, vehículos, ciencias, el espacio y también libros en inglés para mirar el mundo con otros ojos.",
  "diversion-imaginacion":
    "Aventuras, juegos, fantasía y todo lo que hace que un niño quiera escuchar la misma historia otra vez.",
  fe: "Historias del entorno bíblico, de la naturaleza y de los primeros valores del amor y del cuidado.",
};

const CATEGORIAS: Categoria[] = [
  { slug: "emociones-vinculo", nombre: "Emociones y vínculo" },
  { slug: "habitos-rutinas-valores", nombre: "Hábitos, rutinas, valores y límites" },
  { slug: "conocimiento", nombre: "Conocimiento" },
  { slug: "diversion-imaginacion", nombre: "Diversión, imaginación, creatividad" },
  { slug: "fe", nombre: "Fe" },
].map((c) => ({ ...c, descripcion: DESCRIPCIONES_CATEGORIA[c.slug] ?? "" }));

const ETAPAS: Etapa[] = data.etapas as Etapa[];
const LIBROS: Libro[] = data.libros as Libro[];

export const SITE = {
  nombre: "Nido de Papel",
  /** Lema de marca. Se repite en portada, pie y metadatos. */
  lema: "Pequeños lectores, grandes vuelos",
  descripcion:
    "Biblioteca rotativa de cuentos infantiles en Lima. Curaduría por edad, rotación mensual y devolución.",
  /**
   * Dominio base.
   *
   * `import.meta.env.SITE` lo define Astro a partir de la opcion `site` de
   * astro.config.mjs, que lee la variable SITE_URL del entorno.
   *
   * El valor por defecto es un marcador de posicion. Mientras no exista un
   * dominio propio conviene dejarlo asi y cambiarlo al desplegar: sin la
   * variable, el sitemap y los metadatos anunciarian una direccion que no
   * pertenece a nadie, y eso confunde a los buscadores.
   */
  url: (import.meta.env.SITE || "https://TU-DOMINIO.example").replace(/\/+$/, ""),
  /** Número local como se muestra (9 dígitos, Perú). */
  whatsappVisible: "955 419 565",
  /** wa.me exige prefijo de país sin signos: 51 + 9 dígitos. */
  whatsapp: "51955419565",
  /** Correo de contacto. Se ajusta con PUBLIC_CONTACTO_EMAIL. */
  email: import.meta.env.PUBLIC_CONTACTO_EMAIL || "hola@nidodepapel.pe",
} as const;

/** Enlace de WhatsApp con mensaje precargado. */
export function enlaceWhatsApp(mensaje?: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return mensaje
    ? `${base}?text=${encodeURIComponent(mensaje)}`
    : base;
}

export interface Plan {
  slug: string;
  nombre: string;
  libros: number;
  precio: number;
  precioAnterior?: number;
  para: string;
  incluye: string[];
  destacado?: boolean;
}

export const PLANES: Plan[] = [
  {
    slug: "basico",
    nombre: "Kit Básico",
    libros: 4,
    precio: 45,
    precioAnterior: 65,
    para: "La primera rotación y las familias que ya leen con calma.",
    incluye: [
      "4 libros por ciclo",
      "Selección por edad y etapa",
      "Curaduría temática del mes",
      "Entrega y recojo a domicilio",
    ],
  },
  {
    slug: "premium",
    nombre: "Kit Premium",
    libros: 6,
    precio: 60,
    precioAnterior: 89,
    para: "Niños que ya devuelven solos y piden libros por su cuenta.",
    destacado: true,
    incluye: [
      "6 libros por ciclo",
      "Selección por edad y etapa",
      "Títulos exclusivos de la curaduría",
      "Libro interactivo según disponibilidad",
      "Cambio de títulos antes del envío",
    ],
  },
];

/** Distritos con cobertura de entrega y recojo. */
export const DISTRITOS = [
  "San Miguel",
  "Magdalena",
  "Jesús María",
  "Pueblo Libre",
  "Lince",
  "San Isidro",
  "San Borja",
  "Surco",
  "Surquillo",
  "Miraflores",
  "Barranco",
];

export function getCategorias(): Categoria[] {
  return CATEGORIAS;
}

export function getCategoria(slug: string): Categoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function getEtapas(): Etapa[] {
  return ETAPAS;
}

export function getEtapa(slug: string): Etapa | undefined {
  return ETAPAS.find((e) => e.slug === slug);
}

/** "0 a 3" o "7 en adelante", segun tenga o no limite superior. */
export function rangoEtapa(e: Etapa): string {
  return e.max === null ? `${e.min} en adelante` : `${e.min} a ${e.max}`;
}

export function getLibros(): Libro[] {
  return LIBROS;
}

export function getLibro(slug: string): Libro | undefined {
  return LIBROS.find((l) => l.slug === slug);
}

export function getLibrosPorCategoria(slug: string): Libro[] {
  return LIBROS.filter((l) => l.categoria === slug);
}

export function getLibrosPorEtapa(slug: string): Libro[] {
  return LIBROS.filter((l) => l.etapas.includes(slug));
}

/**
 * Total de ejemplares fisicos de la biblioteca.
 *
 * Es un unico numero, sin datos personales, asi que vive en libros.json y se
 * puede leer en cualquier clon del repositorio. El detalle de cada ejemplar
 * (codigo, estado y propietario) esta en libros-privados.json, que no se sube.
 */
export function totalCopias(): number {
  return (data as { totalEjemplares?: number }).totalEjemplares ?? 0;
}

/** "3 - 5 anios" a partir de los dos limites. */
export function rangoEdad(libro: Pick<Libro, "edadMin" | "edadMax">): string {
  if (libro.edadMin === null || libro.edadMax === null) return "Edad por confirmar";
  if (libro.edadMin === libro.edadMax) return `${libro.edadMin} años`;
  return `${libro.edadMin} – ${libro.edadMax} años`;
}

export interface Filtros {
  categoria?: string;
  etapa?: string;
  formato?: string;
  autor?: string;
  letra?: string;
  orden?: "titulo" | "autor";
  interactivo?: boolean;
}

/** Numero de titulos del catalogo. */
export function totalTitulos(): number {
  return LIBROS.length;
}

/**
 * Filtro unico del catalogo. Vive en un solo lugar para que el cliente y el
 * servidor nunca discrepen sobre que libros hay.
 *
 * Todos los criterios salen de una lista cerrada: el visitante elige de un
 * desplegable y nunca escribe, asi no hay errores de tipeo ni resultados vacios
 * por escribir mal un nombre.
 *
 * En el navegador el mismo filtro corre sobre los atributos `data-*` de cada
 * tarjeta ya escritas en el HTML (ver src/scripts/catalogo.ts), en vez de
 * rehacer la lista. El resultado es identico y no obliga a descargar el
 * inventario completo para pintar un desplegable.
 */
export function filtrar(f: Filtros): Libro[] {
  return filtrarPublico(getLibros(), f);
}

/**
 * El mismo filtro, pero sobre libros sin datos de ejemplares.
 *
 * Ambas funciones comparten la comparacion, asi los resultados no dependen de
 * donde se ejecuten.
 */
export function filtrarPublico(entrada: Libro[], f: Filtros): Libro[] {
  const salida = entrada.filter((l) => {
    if (f.categoria && l.categoria !== f.categoria) return false;
    if (f.etapa && !l.etapas.includes(f.etapa)) return false;
    if (f.formato && l.formato !== f.formato) return false;
    if (f.autor && l.autor !== f.autor) return false;
    if (f.interactivo && !l.interactivo) return false;
    if (f.letra && inicialDe(l.titulo) !== f.letra) return false;
    return true;
  });

  // Los simbolos de apertura se quitan para que "¿Quien?" no se ordene por la
  // interrogacion, y la comparacion ignora mayusculas y acentos.
  const colacion = (a: string, b: string) =>
    a.replace(/^[¿¡"']+\s*/, "").localeCompare(b.replace(/^[¿¡"']+\s*/, ""), "es", {
      sensitivity: "base",
    });

  if (f.orden === "autor") {
    return salida.sort(
      (a, b) => colacion(a.autor, b.autor) || colacion(a.titulo, b.titulo),
    );
  }
  return salida.sort((a, b) => colacion(a.titulo, b.titulo));
}

export function formatosDisponibles(): string[] {
  return [...new Set(LIBROS.map((l) => l.formato))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

/** Primera letra visible del titulo, sin contar digitos ni signos. */
export function inicialDe(titulo: string): string {
  const limpia = titulo.replace(/[¿¡"'¿]/g, "").trim();
  for (const ch of limpia) {
    if (/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(ch)) return ch.toUpperCase();
  }
  return "#";
}

/** Autores o editoriales presentes en el inventario, en orden alfabetico. */
export function autoresDisponibles(): string[] {
  return [...new Set(LIBROS.map((l) => l.autor))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

/** Iniciales que tienen al menos un titulo. La primera letra del abecedario. */
export function inicialesDisponibles(): string[] {
  const usadas = new Set(LIBROS.map((l) => inicialDe(l.titulo)));
  const abecedario = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  return abecedario.filter((l) => usadas.has(l));
}
