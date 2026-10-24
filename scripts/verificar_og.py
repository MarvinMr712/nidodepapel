# -*- coding: utf-8 -*-
"""Rehace el favicon.ico con tamanos utiles y verifica la imagen OG."""
from PIL import Image, ImageDraw, ImageFont
import os, collections

BASE = r"C:\repositorios\casa-de-cuentos"
PUB = os.path.join(BASE, "public")
APP = os.path.join(BASE, "src", "app")

logo = Image.open(os.path.join(PUB, "nido-de-papel.png")).convert("RGBA")

# Los navegadores piden 16/32/48; el resto lo cubren los PNG sueltos.
pequeno = logo.copy()
pequeno.thumbnail((48, 48), Image.LANCZOS)
pequeno.save(os.path.join(APP, "favicon.ico"), "ICO",
             sizes=[(16, 16), (32, 32), (48, 48)])
print("favicon.ico ->", os.path.getsize(os.path.join(APP, "favicon.ico")), "bytes")

# --- verificacion de la imagen OG -------------------------------------
og = Image.open(os.path.join(PUB, "og.png")).convert("RGB")
print("\nog.png:", og.size)
px = og.load()

def Franja(y0, y1, x0=0, x1=None):
    x1 = x1 or og.size[0]
    c = collections.Counter()
    for y in range(y0, y1):
        for x in range(x0, x1):
            c[px[x, y]] += 1
    return c

# fondo: debe seguir siendo mayoritariamente crema
c = Franja(0, 630)
total = sum(c.values())
print(f"  crema dominante en el lienzo: {100*c[(248,243,234)]/total:.1f}%")
print("  5 colores principales:")
for col, n in c.most_common(5):
    print(f"    #{col[0]:02X}{col[1]:02X}{col[2]:02X}  {100*n/total:5.2f}%")

# franja del nombre: debe contener tinta oscura (texto)
c_nombre = Franja(392, 470)
oscuros = sum(n for col, n in c_nombre.items() if max(col) < 110)
print(f"\n  pixeles de texto oscuro en la franja del nombre: {oscuros} "
      f"({'OK' if oscuros > 3000 else 'REVISAR'})")

# franja del descriptor
c_desc = Franja(500, 535)
medios = sum(n for col, n in c_desc.items() if 80 < max(col) < 175)
print(f"  pixeros de texto medio en el descriptor: {medios} "
      f"({'OK' if medios > 1500 else 'REVISAR'})")

# linea de marca
c_lin = Franja(552, 566)
print(f"  pixeles en la linea de marca: {sum(c_lin.values())} "
      f"({'OK' if sum(c_lin.values()) > 1500 else 'REVISAR'})")

# el logo debe estar presente: zona central superior con color de marca
c_logo = Franja(70, 350, 400, 800)
colores = sum(n for col, n in c_logo.items() if max(col) - min(col) > 18)
print(f"  pixeles de color (logo) en el centro superior: {colores} "
      f"({'OK' if colores > 8000 else 'REVISAR'})")