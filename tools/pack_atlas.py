#!/usr/bin/env python3
"""
How the garment image sheet (MKR_ATLAS in assets/products.js) was made.

Each group render was produced on a flat chroma-green backdrop using the store's
own product photos as references. This script keys out the green, splits each
render into its separate pieces, trims them, scales every piece to a common
height and packs them into one transparent WebP sheet. It prints the
[x, y, width, height] map that goes into MKR_ATLAS.items.

    pip install pillow numpy
    python3 tools/pack_atlas.py  group1.png:tee-black,tee-white  group2.png:...  --height 640

Requires: Pillow, NumPy.
"""
import argparse
import json

import numpy as np
from PIL import Image, ImageFilter


def key_green(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    al = 1 - np.clip((d - 38) / 57, 0, 1)
    A = Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.6))
    al = np.asarray(A).astype(np.float32) / 255
    g2 = np.where((al < .995) | (d > 18), np.minimum(g, np.maximum(r, b) + 6), g)  # remove green spill on edges
    return np.stack([r, g2, b], -1), al


def split(al, n):
    cols = (al > .5).sum(0)
    on = cols > 3
    W = len(on)
    segs, i = [], 0
    while i < W:
        if on[i]:
            j = i
            while j < W and on[j:j + 22].any():
                j += 1
            segs.append((i, j))
            i = j
        else:
            i += 1
    segs = [s for s in segs if s[1] - s[0] > 40]
    if len(segs) != n:  # pieces touching: cut at the emptiest columns
        x0, x1 = segs[0][0], segs[-1][1]
        sm = np.convolve(cols, np.ones(9) / 9, 'same')
        cuts = [x0]
        for k in range(1, n):
            e = int(x0 + k * (x1 - x0) / n)
            w = int((x1 - x0) / n * .3)
            cuts.append(e - w + int(np.argmin(sm[e - w:e + w])))
        cuts.append(x1)
        segs = list(zip(cuts[:-1], cuts[1:]))
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('groups', nargs='+', help='render.png:key1,key2,...')
    ap.add_argument('--height', type=int, default=640)
    ap.add_argument('--out', default='atlas.webp')
    args = ap.parse_args()

    items = []
    for g in args.groups:
        path, names = g.split(':')
        names = names.split(',')
        rgb, al = key_green(path)
        for (x0, x1), nm in zip(split(al, len(names)), names):
            sub = al[:, x0:x1]
            rows = np.where((sub > .5).sum(1) > 1)[0]
            cc = np.where((sub > .5).sum(0) > 0)[0]
            y0, y1, xa, xb = rows[0], rows[-1] + 1, x0 + cc[0], x0 + cc[-1] + 1
            rgba = np.dstack([rgb[y0:y1, xa:xb], al[y0:y1, xa:xb] * 255]).clip(0, 255).astype(np.uint8)
            im = Image.fromarray(rgba, 'RGBA')
            s = args.height / im.height
            items.append((nm, im.resize((max(1, round(im.width * s)), args.height), Image.LANCZOS)))

    AW, P, x, y, rowh, pos = 4096, 8, 8, 8, 0, {}
    items.sort(key=lambda t: -t[1].height)
    placed = []
    for nm, im in items:
        if x + im.width + P > AW:
            x, y, rowh = P, y + rowh + P, 0
        placed.append((im, x, y))
        pos[nm] = [x, y, im.width, im.height]
        x += im.width + P
        rowh = max(rowh, im.height)
    sheet = Image.new('RGBA', (AW, y + rowh + P), (0, 0, 0, 0))
    for im, px, py in placed:
        sheet.alpha_composite(im, (px, py))
    sheet.save(args.out, 'WEBP', quality=84, method=6)
    print(json.dumps({'w': AW, 'h': sheet.height, 'items': pos}))


if __name__ == '__main__':
    main()
