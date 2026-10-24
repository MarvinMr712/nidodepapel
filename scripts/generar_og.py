# -*- coding: utf-8 -*-
"""Genera el favicon.ico multi-resolucion y la imagen Open Graph 1200x630."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

BASE = r"C:\repositorios\casa-de-cuentos"
PUB = os.path.join(BASE, "public")
APP = os.path.join(BASE, "src", "app")

CREMA = (248, 243, 234)
TINTA = (43, 42, 38)
SUAVE = (111, 101, 91)
SALVIA = (127, 147, 96)
AZUL = (120, 175, 197)
CORAL = (239, 163, 154)
SERIF = r"C:\Windows\Fonts\georgia.ttf"

logo = Image.open(os.path.join(PUB, "nido-de-papel.png")).convert("RGBA")

# ------------------------------------------------------------------ favicon
# El logo tiene mucho detalle a 16px, asi que se sube de tamano y se deja que
# el reescalado lo simplifique, en vez de muestra-una-pelicula-de-16px.
for tam in (16, 24, 32, 48, 64, 128, 256):
    t = logo.copy()
    t.thumbnail((tam, tam), Image.LANCZOS)
    if tam <= 32:
        # un poco de contraste extra para que se lea en la barra del navegador
        t.putalpha(t.getchannel("A").point(lambda v: 255 if v > 40 else v))
    f = os.path.join(PUB, f"favicon-{tam}.png")
    t.save(f, "PNG", optimize=True)

ico_base = logo.copy()
ico_base.save(
    os.path.join(APP, "favicon.ico"),
    "ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("favicon.ico ->",
      os.path.getsize(os.path.join(APP, "favicon.ico")), "bytes")


# --------------------------------------------------------------- imagen OG
def blob(tam, color, opacidad):
    """Mancha radial suave para el fondo."""
    m = Image.new("L", (tam, tam), 0)
    d = ImageDraw.Draw(m)
    pasos = 60
    for i in range(pasos, 0, -1):
        r = tam / 2 * i / pasos
        v = int(opacidad * (1 - i / pasos) ** 1.6)
        d.ellipse([tam / 2 - r, tam / 2 - r, tam / 2 + r, tam / 2 + r], fill=v)
    m = m.filter(ImageFilter.GaussianBlur(tam / 12))
    capa = Image.new("RGBA", (tam, tam), color + (0,))
    capa.putalpha(m)
    return capa


W, H = 1200, 630
og = Image.new("RGBA", (W, H), CREMA + (255,))

for tam, color, op, pos in [
    (760, SALVIA, 92, (-190, -250)),
    (700, AZUL, 96, (700, -280)),
    (620, CORAL, 88, (430, 380)),
]:
    c = blob(tam, color, op)
    og.alpha_composite(c, pos)

# banda inferior de crema solida para que el texto tenga base limpia
banda = Image.new("RGBA", (W, 150), CREMA + (238,))
og.alpha_composite(banda, (0, H - 150))

# logo centrado
L = 300
lg = logo.copy()
lg.thumbnail((L, L), Image.LANCZOS)
og.alpha_composite(lg, ((W - lg.size[0]) // 2, 62))

# nombre
fuente_nombre = ImageFont.truetype(SERIF, 82)
d = ImageDraw.Draw(og)
nombre = "Nido de Papel"
caja = d.textbbox((0, 0), nombre, font=fuente_nombre)
d.text(((W - (caja[2] - caja[0])) // 2, 392), nombre, font=fuente_nombre, fill=TINTA)

# descriptor
fuente_desc = ImageFont.truetype(SERIF, 30)
desc = "Biblioteca rotativa de cuentos infantiles  ·  Lima, Perú"
caja2 = d.textbbox((0, 0), desc, font=fuente_desc)
d.text(((W - (caja2[2] - caja2[0])) // 2, 500), desc, font=fuente_desc, fill=SUAVE)

# linea de marca bajo el descriptor
linea = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dl = ImageDraw.Draw(linea)
y = 556
for x0, x1, col in [(W // 2 - 150, W // 2 - 10, SALVIA),
                    (W // 2 - 6, W // 2 + 60, AZUL),
                    (W // 2 + 64, W // 2 + 150, CORAL)]:
    dl.rounded_rectangle([x0, y, x1, y + 8], radius=4, fill=col + (255,))
og.alpha_composite(linea)

og.convert("RGB").save(os.path.join(PUB, "og.jpg"), "JPEG", quality=92, optimize=True)
og.save(os.path.join(PUB, "og.png"), "PNG", optimize=True)
for n in ("og.jpg", "og.png"):
    print(f"{n} -> {os.path.getsize(os.path.join(PUB, n))} bytes")