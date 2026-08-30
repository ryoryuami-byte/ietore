# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw
import os

SRC = 'icons2/clean-full.png'
OUT = 'icons2'
os.makedirs(OUT, exist_ok=True)

base = Image.open(SRC).convert('RGB')
S = base.size[0]

def resized(size, resample=Image.LANCZOS):
    return base.resize((size, size), resample)

def rounded(im, radius_frac):
    size = im.size[0]
    im = im.convert('RGBA')
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=255)
    im.putalpha(mask)
    return im

# Standard "any" icons — square PNG, platform applies its own mask.
resized(1024).save(os.path.join(OUT, 'icon-1024.png'))
resized(512).save(os.path.join(OUT, 'icon-512.png'))
resized(192).save(os.path.join(OUT, 'icon-192.png'))

# Maskable icon: the illustration already sits well inside a safe margin
# (checked visually), so the full-bleed square works directly as maskable too.
resized(512).save(os.path.join(OUT, 'icon-512-maskable.png'))

# iOS apple-touch-icon: opaque full-bleed square (iOS applies its own rounding).
resized(180).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))

# Favicons
resized(32).save(os.path.join(OUT, 'favicon-32.png'))
resized(16).save(os.path.join(OUT, 'favicon-16.png'))

print('done', sorted(os.listdir(OUT)))
