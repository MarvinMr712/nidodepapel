# -*- coding: utf-8 -*-
"""Deriva variantes accesibles de la paleta Nido de Papel."""
import colorsys

def lum(rgb):
    ch = [c / 255 for c in rgb]
    ch = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in ch]
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]

def cr(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgb2hex(t):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(c))) for c in t)

def tone(h, factor):
    """Escala la luminosidad HSL conservando el tono."""
    r, g, b = [c / 255 for c in hex2rgb(h)]
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    ll = max(0.0, min(1.0, ll * factor))
    return rgb2hex([c * 255 for c in colorsys.hls_to_rgb(hh, ll, ss)])

def buscar(h, objetivo, contra, mayor=True):
    """Busca el factor de luminosidad que cumple el contraste."""
    mejor = None
    for i in range(100, 1, -1):
        f = i / 100
        c = tone(h, f)
        v = cr(hex2rgb(c), hex2rgb(contra))
        ok = v >= objetivo if mayor else v <= objetivo
        if ok:
            mejor = (c, v, f)
            break
    return mejor

CREMA = "#F8F3EA"
BLANCO = "#FFFFFF"
TINTA = "#2B2A26"
PAL = {"salvia": "#7F9360", "azul": "#78AFC5", "coral": "#EFA39A"}

print("=== estado original de la paleta ===")
for k, v in PAL.items():
    print(f"{k:8} {v}  sobre crema {cr(hex2rgb(v),hex2rgb(CREMA)):4.2f}:1"
          f"   texto blanco encima {cr(hex2rgb(BLANCO),hex2rgb(v)):4.2f}:1")

print("\n=== TEXTO sobre crema (necesita >= 4.5:1) ===")
for k, v in PAL.items():
    c, val, f = buscar(v, 4.5, CREMA, mayor=True)
    print(f"  {k:8} {v} -> {c}  {val:.2f}:1  (L x{f:.2f})")

print("\n=== FILL con texto blanco encima (necesita >= 4.5:1) ===")
for k, v in PAL.items():
    c, val, f = buscar(v, 4.5, BLANCO, mayor=False)
    print(f"  {k:8} {v} -> {c}  {val:.2f}:1  (L x{f:.2f})")

print("\n=== FILL con tinta oscura encima (necesita >= 4.5:1) ===")
for k, v in PAL.items():
    r, g, b = hex2rgb(v)
    print(f"  {k:8} {v} -> tinta {TINTA} da {cr(hex2rgb(TINTA),(r,g,b)):.2f}:1")

print("\n=== tintes de superficie (muy claros, para tarjetas/badges) ===")
for k, v in list(PAL.items()) + [("crema", CREMA)]:
    print(f"  {k:8} {v} -> {tone(v,1.30)}")

print("\n=== bordes ===")
for k, v in PAL.items():
    print(f"  {k:8} {v} -> {tone(v,0.82)}")