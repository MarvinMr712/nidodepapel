# -*- coding: utf-8 -*-
"""Quita el fondo blanco del logo por flood fill desde los bordes.
Separa fondo (dist 0-9 al blanco) de crema (20-34) usando el valle
del histograma, y suaviza solo el anillo de contorno."""
from PIL import Image, ImageFilter
import os

SRC = r"C:\Users\User\Downloads\NidoDePapel.png"
DST = r"C:\repositorios\casa-de-cuentos\public"
os.makedirs(DST, exist_ok=True)

im = Image.open(SRC).convert("RGB")
W, H = im.size
px = im.load()

def d(x, y):
    r, g, b = px[x, y]
    return ((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2) ** 0.5

TOL = 16.0     # valle: <=16 es fondo, >=20 es diseno
SUAVE = 26.0   # rampa solo dentro del anillo de contorno

# 1. Flood fill desde el borde: unicamente el blanco conectado al exterior.
fon = bytearray(W * H)
pila = []
for x in range(W):
    if d(x, 0) <= TOL: pila.append(x)
    if d(x, H - 1) <= TOL: pila.append((H - 1) * W + x)
for y in range(H):
    if d(0, y) <= TOL: pila.append(y * W)
    if d(W - 1, y) <= TOL: pila.append(y * W + W - 1)

for i in pila:
    if not fon[i]: fon[i] = 1

while pila:
    i = pila.pop()
    y, x = divmod(i, W)
    for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
        if 0 <= nx < W and 0 <= ny < H:
            j = ny * W + nx
            if not fon[j] and d(nx, ny) <= TOL:
                fon[j] = 1
                pila.append(j)

# 2. Anillo de 3px alrededor del fondo (para el anti-alias del contorno).
mascara = Image.frombytes("L", (W, H), bytes(255 if v else 0 for v in fon))
anillo = mascara.filter(ImageFilter.MaxFilter(7))   # ~3 px de dilatacion
a_px = anillo.load()

# 3. Canal alfa.
out = Image.new("RGBA", (W, H))
op = out.load()

n_transp = n_suave = n_opaco = 0
for y in range(H):
    base = y * W
    for x in range(W):
        r, g, b = px[x, y]
        if fon[base + x]:
            op[x, y] = (r, g, b, 0)
            n_transp += 1
        elif a_px[x, y] and d(x, y) < SUAVE:
            a = int(255 * (d(x, y) - TOL) / (SUAVE - TOL))
            a = max(0, min(255, a))
            op[x, y] = (r, g, b, a)
            n_suave += 1
        else:
            op[x, y] = (r, g, b, 255)
            n_opaco += 1

tot = W * H
print(f"transparente {100*n_transp/tot:5.2f}%   suave {100*n_suave/tot:5.2f}%   "
      f"opaco {100*n_opaco/tot:5.2f}%")

bbox = out.getbbox()
out = out.crop(bbox)
print(f"recortado a {out.size[0]}x{out.size[1]} (original {W}x{H})")

for nombre, lado in (
    ("nido-de-papel.png", 512),
    ("nido-de-papel-256.png", 256),
    ("nido-de-papel-128.png", 128),
):
    t = out.copy()
    t.thumbnail((lado, lado), Image.LANCZOS)
    ruta = os.path.join(DST, nombre)
    t.save(ruta, "PNG", optimize=True)
    print(f"  {nombre:26} {t.size[0]}x{t.size[1]}  {os.path.getsize(ruta)/1024:6.1f} KB")

w = out.copy()
w.thumbnail((512, 512), Image.LANCZOS)
w.save(os.path.join(DST, "nido-de-papel.webp"), "WEBP", quality=92)
print(f"  {'nido-de-papel.webp':26} {w.size[0]}x{w.size[1]}  "
      f"{os.path.getsize(os.path.join(DST,'nido-de-papel.webp'))/1024:6.1f} KB")

# 4. Verificacion: la crema interior debe quedar opaca.
full = Image.open(SRC).convert("RGB").crop(out.getbbox())
sp, opv = full.load(), out.load()
W2, H2 = out.size

def es_crema(p):
    mx, mn = max(p), min(p)
    sat = 0 if mx == 0 else (mx - mn) / mx
    return sat < 0.12 and 215 <= mx <= 252

co = cv = cp = 0
for y in range(0, H2, 2):
    for x in range(0, W2, 2):
        if es_crema(sp[x, y]):
            co += 1
            if opv[x, y][3] == 0: cp += 1
            elif opv[x, y][3] == 255: cv += 1
print(f"\ncrema: {co} pixeles -> opaca {cv} ({100*cv/max(co,1):.1f}%)  "
      f"eliminada {cp} ({100*cp/max(co,1):.1f}%)")