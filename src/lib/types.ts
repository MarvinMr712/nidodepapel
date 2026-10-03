export type EstadoCopia =
  | "disponible"
  | "prestado"
  | "limpieza"
  | "mantenimiento";

/**
 * Un titulo del catalogo. Asi esta en src/data/libros.json, el unico archivo de
 * datos que se sube al repositorio.
 */
export interface Libro {
  id: string;
  slug: string;
  titulo: string;
  autor: string;
  /** Texto libre heredado del Excel. Descriptivo: no se usa como filtro. */
  tema: string;
  categoria: string;
  formato: string;
  interactivo: boolean;
  formatoOriginal: string;
  edadMin: number | null;
  edadMax: number | null;
  etapas: string[];
}

/**
 * Un ejemplar concreto de un titulo.
 *
 * No vive en libros.json: esta en src/data/libros-privados.json, que esta en
 * .gitignore. Contiene el nombre de quien lo tiene, que es un dato personal y
 * por eso nunca sale de tu maquina.
 */
export interface Copia {
  codigo: string;
  propietario: string;
  estado: EstadoCopia;
}

/** Fila tal como esta en libros-privados.json. */
export interface CopiaDeLibro {
  slug: string;
  titulo: string;
  copias: Copia[];
}

export interface Categoria {
  slug: string;
  nombre: string;
  descripcion: string;
}

export interface Etapa {
  slug: string;
  nombre: string;
  min: number;
  max: number | null;
  descripcion: string;
}
