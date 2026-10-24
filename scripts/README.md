# Scripts de mantenimiento

Estos scripts se usan en la maquina de trabajo. No hacen falta para publicar el
sitio: el build de Next.js no los invoca.

## `libros-privados.json` no se sube

`src/data/libros-privados.json` tiene el detalle de cada ejemplar, incluido el
nombre de quien lo tiene. Esta en `.gitignore` a proposito.

Lo que si se sube es `src/data/libros.json`, que solo tiene titulo, autor, etapa
y demas datos del catalogo, mas el numero total de ejemplares.

Si clonaste el repositorio en otra maquina y te faltan las copias por ejemplar,
este es el archivo que debespedir a mano:

```bash
cp tu-copia-libros-privados.json src/data/libros-privados.json
```

## Scripts

| Script | Para que sirve |
| --- | --- |
| `migrar_excel.py` | Convierte el Excel original a `libros.json` y `libros-privados.json`. |
| `procesar_logo.py` | Quita el fondo del logo y genera las versiones WebP y PNG. |
| `generar_og.py` | Genera la imagen de compartir y el favicon desde el logo. |
| `verificar_og.py` | Revisa que el favicon y la imagen OG tengan las medidas correctas. |
| `paleta.py` | Muestra la paleta de colores del sitio. |